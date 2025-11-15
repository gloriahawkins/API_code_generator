#!/usr/bin/env node

import { readFileSync, writeFileSync } from 'fs';
import { OpenAPIParser } from './parser.js';
import { TypeScriptClientGenerator } from './generator.js';
import { ExampleGenerator } from './example-generator.js';

/**
 * CLI tool to generate type-safe TypeScript clients from OpenAPI specs
 */
function main() {
  const args = process.argv.slice(2);
  
  if (args.length < 1) {
    console.error('Usage: npm run generate <openapi-spec.json> [output-file.ts]');
    process.exit(1);
  }

  const inputFile = args[0];
  const outputFile = args[1] || 'generated-client.ts';

  try {
    console.log(`📖 Reading OpenAPI spec: ${inputFile}`);
    const specContent = readFileSync(inputFile, 'utf-8');
    const spec = JSON.parse(specContent);

    console.log('🔍 Parsing OpenAPI specification...');
    const parser = new OpenAPIParser(spec);
    const generator = new TypeScriptClientGenerator(parser);

    console.log('⚡ Generating type-safe TypeScript client...');
    const generatedCode = generator.generate();

    console.log(`💾 Writing generated client to: ${outputFile}`);
    writeFileSync(outputFile, generatedCode, 'utf-8');

    const endpoints = parser.extractEndpoints();
    const className = generator['generateClassName']();
    
    // Generate example file
    const exampleGenerator = new ExampleGenerator(parser, className);
    const exampleCode = exampleGenerator.generate();
    const exampleFile = outputFile.replace('.ts', '-example.ts');
    
    console.log(`📝 Generating example usage file: ${exampleFile}`);
    writeFileSync(exampleFile, exampleCode, 'utf-8');

    console.log(`✅ Successfully generated client with ${endpoints.length} endpoints!`);
    console.log(`\n📦 Generated files:`);
    console.log(`   - ${outputFile}`);
    console.log(`   - ${exampleFile}`);
    console.log('\n🚀 You can now import and use the type-safe client in your code!');
    console.log('\n💡 Features included:');
    console.log('   ✨ Type-safe error handling with discriminated unions');
    console.log('   🔄 Request/response interceptors');
    console.log('   🔐 Built-in authentication support');
    console.log('   🔁 Automatic retry with exponential backoff');
    console.log('   📚 Full JSDoc with examples');
  } catch (error) {
    console.error('❌ Error generating client:', error);
    process.exit(1);
  }
}

main();

