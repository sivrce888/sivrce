/**
 * AI Plugin Manifest for LLMs, autonomous agents & Answer Engines (ChatGPT, Perplexity, Claude, etc.)
 */
export const revalidate = 86400

export function GET() {
  const manifest = {
    schema_version: 'v1',
    name_for_human: 'Sivrce Real Estate',
    name_for_model: 'sivrce_real_estate',
    description_for_human:
      'Search verified apartments, new developments, and neighborhood prices across Georgia and global markets.',
    description_for_model:
      'Plugin and knowledge engine for searching verified real estate properties, new construction projects, livability scores, and market statistics across Georgia and 70+ global markets.',
    auth: {
      type: 'none',
    },
    api: {
      type: 'openapi',
      url: 'https://sivrce.ge/api/openapi.json',
    },
    logo_url: 'https://sivrce.ge/logo/mark.png',
    contact_email: 'info@sivrce.ge',
    legal_info_url: 'https://sivrce.ge/terms',
    privacy_policy_url: 'https://sivrce.ge/privacy',
  }

  return new Response(JSON.stringify(manifest, null, 2), {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'public, max-age=86400, stale-while-revalidate=604800',
    },
  })
}
