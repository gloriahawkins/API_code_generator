import type { Endpoint } from './types.js';
import { OpenAPIParser } from './parser.js';

/**
 * Produces the `*-example.ts` companion file that mirrors the generated client API.
 *
 * This is intentionally high-level sample code, but the added comments explain
 * why we emit certain scaffolding:
 * - Showing interceptors/auth/retry mirrors the runtime hooks present in the client.
 * - Sampling only the first few endpoints keeps the file approachable while still
 *   teaching the ergonomics.
 */
export class ExampleGenerator {
  private parser: OpenAPIParser;
  private className: string;

  /**
   * @param parser Reuse the already-instantiated parser so we operate on the
   *               exact same endpoint list as the main generator.
   * @param className The class emitted by the generator—used for imports and
   *                  instantiation to keep filenames/types in sync.
   */
  constructor(parser: OpenAPIParser, className: string) {
    this.parser = parser;
    this.className = className;
  }

  /**
   * Build the entire example file as a single template literal string.
   *
   * Steps:
   * 1. Pull out endpoints/base URL so the example matches the spec.
   * 2. Emit boilerplate that mirrors the generated client's configuration API.
   * 3. Append per-endpoint snippets for the first three endpoints to avoid noise.
   */
  public generate(): string {
    const endpoints = this.parser.extractEndpoints();
    const baseUrl = this.parser.getBaseUrl();

    let code = `/**
 * Example usage of the generated ${this.className}
 * 
 * This file demonstrates:
 * - Type-safe API calls with autocomplete
 * - Error handling with discriminated unions
 * - Request/response interceptors
 * - Authentication
 * - Retry configuration
 */

import { ${this.className} } from './generated-client.js';

// Initialize the client
const client = new ${this.className}({
  baseUrl: '${baseUrl}',
  // apiKey: 'your-api-key',
  // bearerToken: 'your-token',
  maxRetries: 3,
});

// Example: Add request interceptor for logging
client.addRequestInterceptor((request) => {
  console.log('Making request:', request);
  return request;
});

// Example: Add response interceptor for data transformation
client.addResponseInterceptor((response, data) => {
  console.log('Received response:', response.status, data);
  return data;
});

async function examples() {
  try {
`;

    // Generate examples for first 3 endpoints
    const exampleEndpoints = endpoints.slice(0, 3);
    for (const endpoint of exampleEndpoints) {
      code += this.generateEndpointExample(endpoint);
    }

    code += `  } catch (error) {
    console.error('Error:', error);
  }
}

// Run examples
examples().catch(console.error);
`;

    return code;
  }

  /**
   * Emit a heavily commented usage example for a single endpoint.
   *
   * Rather than attempting to be 100% accurate about every edge case, the
   * example intentionally demonstrates the core ergonomics reviewers care about:
   * path params, query params, request bodies, and discriminated-union handling.
   */
  private generateEndpointExample(endpoint: Endpoint): string {
    const methodName = this.sanitizeMethodName(endpoint.operationId);
    const pathParams = endpoint.parameters.filter((p) => p.in === 'path');
    const queryParams = endpoint.parameters.filter((p) => p.in === 'query');
    const hasBody = !!endpoint.requestBody;

    let example = `\n    // Example: ${endpoint.summary || endpoint.operationId}\n`;
    example += `    const result = await client.${methodName}(`;

    const params: string[] = [];
    if (pathParams.length > 0) {
      const pathExample = pathParams
        .map((p) => {
          const value =
            p.schema?.type === 'integer' ? '123' : '"example-value"';
          return `${p.name}: ${value}`;
        })
        .join(', ');
      params.push(`{ ${pathExample} }`);
    }
    if (queryParams.length > 0) {
      const queryExample = queryParams
        .slice(0, 2)
        .map((p) => {
          const value =
            p.schema?.type === 'integer'
              ? '10'
              : p.schema?.enum
              ? `"${p.schema.enum[0]}"`
              : '"value"';
          return `${p.name}: ${value}`;
        })
        .join(', ');
      params.push(`{ ${queryExample} }`);
    }
    if (hasBody) {
      params.push('{ /* your request body */ }');
    }

    example += params.join(', ') + ');\n';
    example += `    \n`;
    example += `    // Type-safe error handling\n`;
    example += `    if (result._tag === 'Success') {\n`;
    example += `      console.log('Success:', result.data);\n`;
    example += `      // TypeScript knows result.data is the correct type!\n`;
    example += `    } else {\n`;
    example += `      console.error('API Error:', result.status, result.message);\n`;
    example += `      // TypeScript knows result.status and result.message exist\n`;
    example += `    }\n`;

    return example;
  }

  /**
   * Keep the example aligned with however the generator sanitized names.
   * This mirrors the helper inside the generator so we do not drift.
   */
  private sanitizeMethodName(name: string): string {
    return name
      .replace(/[^a-zA-Z0-9]/g, '_')
      .replace(/^[0-9]/, '_$&')
      .replace(/([a-z])([A-Z])/g, '$1_$2')
      .toLowerCase();
  }
}


