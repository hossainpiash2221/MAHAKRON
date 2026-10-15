'use client';
import Loader from './Loader';
import Link from 'next/link';
import { useProducts } from './ProductsProvider';
import ProductView from './ProductView';

// Used only when the server could not reach Google in time. The browser then loads the list itself.
export default function ProductFallback({ slug }) {
  const { products, status } = useProducts();
  const p = products.find((x) => x.slug === slug);
  if (p) return <ProductView p={p} />;
  if (status === 'loading') return <div className="mx-auto max-w-6xl px-4 py-10"><Loader label="Loading product" /></div>;
  return (
    <div className="mx-auto max-w-xl px-4 py-24 text-center">
      <h1 className="font-display text-3xl font-bold">We couldn’t load this product</h1>
      <p className="mt-3 text-ink/70">Please check your connection and try again.</p>
      <Link href="/products" className="mt-8 inline-block rounded bg-peacock px-6 py-3 font-semibold text-white hover:bg-dark_green">Browse all products</Link>
    </div>
  );
}
