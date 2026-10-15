import { SITE } from '@/lib/site';
export default function robots() {
  return {
    rules: [{ userAgent: '*', allow: '/', disallow: ['/cart', '/checkout', '/my-orders', '/api/'] }],
    sitemap: `${SITE.url}/sitemap.xml`,
    host: SITE.url,
  };
}
