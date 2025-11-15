#!/usr/bin/env node

import { writeFileSync } from 'fs';
import { generateClientArtifacts } from './index.js';

/**
 * Entry-point for the `npm run generate` command.
 *
 * The CLI is intentionally tiny, but these comments call out *why* each step
 * exists so that a walkthrough feels deliberate:
 * 1. Validate arguments and show a friendly usage hint so CI fails fast.
 * 2. Delegate to the shared programmatic API so the same logic powers both the
 *    CLI and any custom embedding inside other build pipelines.
 * 3. Emit both the main client file and a companion example file so the
 *    generated ergonomics are easy to demo.
 * 4. Summarize what was generated so reviewers know what to inspect next.
 */
function main() {
  // Drop the node + script entries and only keep user-provided arguments.
  const args = process.argv.slice(2);
  
  if (args.length < 1) {
    // We cannot continue without a spec path—exit early with guidance.
    console.error('Usage: npm run generate <openapi-spec.json> [output-file.ts]');
    process.exit(1);
  }

  // Required argument: the OpenAPI JSON file to read from disk.
  const inputFile = args[0];
  // Optional argument: target file name for the generated client.
  const outputFile = args[1] || 'generated-client.ts';

  try {
    console.log(`Reading OpenAPI spec and generating artifacts from: ${inputFile}`);
    const { client, example, endpoints } = generateClientArtifacts(inputFile);

    console.log('Writing generated client to disk...');
    writeFileSync(outputFile, client, 'utf-8');

    // Keep the example file co-located by mirroring the primary file name.
    const exampleFile = outputFile.replace('.ts', '-example.ts');
    if (example) {
      console.log(`Generating example usage file: ${exampleFile}`);
      writeFileSync(exampleFile, example, 'utf-8');
    }

    console.log(`Successfully generated client with ${endpoints.length} endpoints.`);
    console.log(`\nGenerated files:`);
    console.log(`   - ${outputFile}`);
    if (example) {
      console.log(`   - ${exampleFile}`);
    }
    console.log('\nYou can now import and use the type-safe client in your code.');
    console.log('\nFeatures included:');
    console.log('   - Type-safe error handling with discriminated unions');
    console.log('   - Request/response interceptors');
    console.log('   - Built-in authentication support');
    console.log('   - Automatic retry with exponential backoff');
    console.log('   - Full JSDoc with examples');
  } catch (error) {
    console.error('Error generating client:', error);
    process.exit(1);
  }
}

main();

