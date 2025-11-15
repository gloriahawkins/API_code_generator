import type { Endpoint } from './types.js';
import { OpenAPIParser } from './parser.js';

/**
 * Generates example usage files showing how to use the generated client
 */
export class ExampleGenerator {
  private parser: OpenAPIParser;
  private className: string;

  constructor(parser: OpenAPIParser, className: string) {
    this.parser = parser;
    this.className = className;
  }

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

  private sanitizeMethodName(name: string): string {
    return name
      .replace(/[^a-zA-Z0-9]/g, '_')
      .replace(/^[0-9]/, '_$&')
      .replace(/([a-z])([A-Z])/g, '$1_$2')
      .toLowerCase();
  }
}


