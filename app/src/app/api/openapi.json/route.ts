/**
 * OpenAPI 3.0 specification for AI search agents and LLM tool plugins.
 */
export const revalidate = 86400

export function GET() {
  const spec = {
    openapi: '3.0.1',
    info: {
      title: 'Sivrce Real Estate API',
      description:
        'Live API for verified real estate search, new developments, and neighborhood market stats.',
      version: 'v1',
    },
    servers: [{ url: 'https://sivrce.ge' }],
    paths: {
      '/api/suggest': {
        get: {
          summary: 'Search locations, projects, developers, and listings',
          operationId: 'searchProperties',
          parameters: [
            {
              name: 'q',
              in: 'query',
              description: 'Search query (e.g. "Vake", "Saburtalo", "Archi", "m2", "2 bedroom")',
              required: true,
              schema: { type: 'string' },
            },
          ],
          responses: {
            '200': {
              description: 'Matching places, projects, and listings',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      results: {
                        type: 'array',
                        items: { type: 'object' },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      '/llms.txt': {
        get: {
          summary: 'Knowledge graph entrypoint for LLMs & Answer Engines',
          operationId: 'getKnowledgeSummary',
          responses: {
            '200': {
              description: 'Plaintext structured summary of the real estate ecosystem',
              content: { 'text/plain': { schema: { type: 'string' } } },
            },
          },
        },
      },
    },
  }

  return new Response(JSON.stringify(spec, null, 2), {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'public, max-age=86400, stale-while-revalidate=604800',
    },
  })
}
