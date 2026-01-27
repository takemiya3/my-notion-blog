export async function GET() {
  const robotsTxt = `User-agent: *
Allow: /
Disallow: /api/

Sitemap: https://www.seifuku-jk.com/sitemap.xml`;

  return new Response(robotsTxt, {
    headers: {
      'Content-Type': 'text/plain',
    },
  });
}