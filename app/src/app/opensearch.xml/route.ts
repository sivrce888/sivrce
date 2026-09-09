/** OpenSearch description — lets browsers/assistants offer sivrce as a search engine. */
export const revalidate = 86400

export function GET() {
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<OpenSearchDescription xmlns="http://a9.com/-/spec/opensearch/1.1/">
  <ShortName>sivrce</ShortName>
  <Description>უძრავი ქონება საქართველოში — ბინები, სახლები, აგარაკები</Description>
  <Url type="text/html" template="https://sivrce.ge/search?q={searchTerms}"/>
  <Image height="32" width="32" type="image/png">https://sivrce.ge/icons/favicon-32.png</Image>
  <InputEncoding>UTF-8</InputEncoding>
</OpenSearchDescription>`
  return new Response(xml, {
    headers: {
      'Content-Type': 'application/opensearchdescription+xml; charset=utf-8',
      'Cache-Control': 'public, max-age=86400, stale-while-revalidate=604800',
    },
  })
}
