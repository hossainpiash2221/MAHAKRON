import { Suspense } from 'react';
import ProductExplorer from '@/components/ProductExplorer';
import Loader from '@/components/Loader';

export const metadata = {
  title: 'Shop all products',
  description: 'Browse three-piece, shirts, T-shirts and more. Filter by category, order online, pay on delivery anywhere in Bangladesh.',
  alternates: { canonical: '/products' },
};

export default function ProductsPage() {
  return (
    <div className="mx-auto max-w-8xl px-4 py-12 bg-[url('/bg.webp')] bg-cover bg-center">
      {/* <h1 className="mb-8 font-display text-4xl font-bold tracking-tight uppercase">Shop</h1> */}
      <Suspense fallback={<Loader />}>
        <ProductExplorer />
      </Suspense>
    </div>
  );
}
