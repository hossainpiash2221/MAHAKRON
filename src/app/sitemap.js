
import { getProducts } from '@/lib/products';

export const revalidate = 3600;

const SITE_URL = 'https://fashionzempire.vercel.app';

export default async function sitemap() {
  const products = await getProducts();

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
    ...products
      .filter((p) => p.slug)
      .map((p) => ({
        url: `${SITE_URL}/products/${encodeURIComponent(p.slug)}`,
        changeFrequency: 'weekly',
        priority: 0.7,
      })),
  ];
}
