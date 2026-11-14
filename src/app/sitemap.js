
import { getProducts } from '@/lib/products';

export const revalidate = 3600;

const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ||
  'https://fashionzempire.vercel.app'
).replace(/\/$/, '');

export default async function sitemap() {
  const products = await getProducts();

  const productUrls = products
    .filter((p) => p.slug)
    .map((p) => ({
      url: `${SITE_URL}/products/${encodeURIComponent(p.slug)}`,
      changeFrequency: 'weekly',
      priority: 0.7,
    }));

  return [
    {
      url: SITE_URL,
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${SITE_URL}/products`,
      changeFrequency: 'daily',
      priority: 0.9,
    },
    ...productUrls,
  ];
}
