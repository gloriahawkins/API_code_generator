/**
 * Public API entry point for the OpenAPI → TypeScript client generator.
 *
 * The CLI (`src/cli.ts`) consumes these same helpers, but exposing them here
 * means any application (CLI, build pipeline, custom scaffolder, etc.) can
 * embed the generator programmatically without reaching into private files.
 */

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { ExampleGenerator } from './example-generator.js';
import { OpenAPIParser } from './parser.js';
import { TypeScriptClientGenerator } from './generator.js';
import type { Endpoint, OpenAPISpec } from './types.js';

/**
 * Load a spec from disk if a string path is provided. Passing a parsed spec
 * object skips disk I/O entirely, which is handy when specs are already in
 * memory (e.g., fetched over HTTP or composed dynamically).
 */
function normalizeSpec(input: OpenAPISpec | string): OpenAPISpec {
  if (typeof input === 'string') {
    const absolutePath = resolve(process.cwd(), input);
    const raw = readFileSync(absolutePath, 'utf-8');
    return JSON.parse(raw) as OpenAPISpec;
  }

  return input;
}

export interface GenerateClientArtifactsOptions {
  /**
   * Emit the usage example alongside the client code. Defaults to true so the
   * runtime ergonomics are always demonstrated unless explicitly disabled.
   */
  includeExample?: boolean;
}

export interface GeneratedClientArtifacts {
  /** Name of the generated client class (e.g., `PetStoreAPIClient`). */
  className: string;
  /** The full TypeScript client source code. */
  client: string;
  /** Optional example file contents (only omitted when includeExample === false). */
  example?: string;
  /** Normalized endpoints that back the generated methods. */
  endpoints: Endpoint[];
  /** Base URL pulled from the OpenAPI `servers` array. */
  baseUrl: string;
}

/**
 * Generate client + example source code from either a parsed spec object or a
 * path to an OpenAPI JSON file. The helper is synchronous to mirror the CLI and
 * to keep usage simple inside build scripts.
 */
export function generateClientArtifacts(
  specInput: OpenAPISpec | string,
  options: GenerateClientArtifactsOptions = {},
): GeneratedClientArtifacts {
  const spec = normalizeSpec(specInput);
  const parser = new OpenAPIParser(spec);
  const generator = new TypeScriptClientGenerator(parser);
  const client = generator.generate();
  const className = generator.generateClassName();
  const endpoints = parser.extractEndpoints();
  const baseUrl = parser.getBaseUrl();

  let example: string | undefined;
  if (options.includeExample !== false) {
    example = new ExampleGenerator(parser, className).generate();
  }

  return {
    className,
    client,
    example,
    endpoints,
    baseUrl,
  };
}

// Re-export the building blocks so other applications can compose their own
// pipelines without importing from deep internal paths.
export { ExampleGenerator } from './example-generator.js';
export { OpenAPIParser } from './parser.js';
export { TypeScriptClientGenerator } from './generator.js';
export * from './types.js';
