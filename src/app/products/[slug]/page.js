import { notFound } from 'next/navigation';
import { SITE } from '@/lib/site';
import { getProducts } from '@/lib/products';
import ProductView from '@/components/ProductView';
import ProductFallback from '@/components/ProductFallback';
import { Suspense } from 'react';
import Loader from '@/components/Loader';
import ProductExplorer from '@/components/ProductExplorer';

export const revalidate = 120;

export async function generateStaticParams() {
  return (await getProducts()).map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const p = (await getProducts()).find((x) => x.slug === slug);
  if (!p) return { title: 'Product' };
  const desc = (p.description || `${p.productName} for ${p.price} BDT. Cash on delivery across Bangladesh.`).replace(/\s+/g, ' ').slice(0, 155);
  return {
    title: p.productName,
    description: desc,
    alternates: { canonical: `/products/${p.slug}` },
    openGraph: { type: 'website', title: p.productName, description: desc, url: `${SITE.url}/products/${p.slug}`, images: p.images.slice(0, 1).map((url) => ({ url })) },
    twitter: { card: 'summary_large_image', title: p.productName, description: desc, images: p.images.slice(0, 1) },
  };
}

export default async function ProductPage({ params }) {
  const { slug } = await params;
  const all = await getProducts();
  const p = all.find((x) => x.slug === slug);
  if (!p) {
    if (all.length === 0) return <ProductFallback slug={slug} />;   // Google was slow/unreachable: do NOT show a false 404
    notFound();
  }
  const url = `${SITE.url}/products/${p.slug}`;
  const ld = [
    {
      '@context': 'https://schema.org', '@type': 'Product', name: p.productName, sku: p.id, category: p.category,
      description: p.description || p.productName, image: p.images, url,
      offers: { '@type': 'Offer', url, priceCurrency: SITE.currency, price: String(p.price), availability: p.status !== 'Out of Stock' ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock', itemCondition: 'https://schema.org/NewCondition' },
    },
    {
      '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: SITE.url },
        { '@type': 'ListItem', position: 2, name: 'Shop', item: `${SITE.url}/products` },
        { '@type': 'ListItem', position: 3, name: p.productName, item: url },
      ],
    },
  ];
  return (
    <>
     
      <ProductView p={p} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld).replace(/</g, '\\u003c') }} />
    </>
  );
}
