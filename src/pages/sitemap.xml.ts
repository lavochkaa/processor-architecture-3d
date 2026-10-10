import type { APIRoute } from 'astro';

export const GET: APIRoute = ({ site }) => {
  const root = site ?? new URL('http://localhost:4321');
  const paths = ['/', '/scenario/', '/glossary/', '/boundaries/', '/sources/'];
  const body = `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${paths.map((path) => `<url><loc>${new URL(path, root).toString()}</loc></url>`).join('')}</urlset>`;
  return new Response(body, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
};
