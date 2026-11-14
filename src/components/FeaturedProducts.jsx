'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useProducts } from './ProductsProvider';
import ProductGrid from './ProductGrid';
import Loader from './Loader';

export default function FeaturedProducts({ gender = 'all' }) {
  const { products, status } = useProducts();
  // Match ProductGrid's responsive column breakpoints for exactly two rows.
  const [itemLimit, setItemLimit] = useState(4);

  useEffect(() => {
    const getLimit = () => {
      const width = window.innerWidth;
      const columns = width >= 1760 ? 6 : width >= 1400 ? 5 : width >= 1040 ? 4 : width >= 768 ? 3 : 2;
      setItemLimit(columns * 2);
    };

    getLimit();
    window.addEventListener('resize', getLimit);
    return () => window.removeEventListener('resize', getLimit);
  }, []);

  const normalizedGender = String(gender || 'all').toLowerCase();
  const selectedGender = normalizedGender === 'male' ? 'Male' : normalizedGender === 'female' ? 'Female' : null;
  const heading = selectedGender ? `${selectedGender.toUpperCase()} COLLECTIONS` : 'ALL COLLECTIONS';
  const viewAllHref = selectedGender ? `/products?gender=${encodeURIComponent(selectedGender)}` : '/products';

  const list = useMemo(() => {
    const matching = products.filter((p) =>
      !selectedGender || String(p.gender || '').toLowerCase() === selectedGender.toLowerCase()
    );
    return [
      ...matching.filter((p) => p.status !== 'Out of Stock'),
      ...matching.filter((p) => p.status === 'Out of Stock'),
    ].slice(0, itemLimit);
  }, [products, selectedGender, itemLimit]);

  return (
    <div className="relative w-full bg-white pb-[60px]">
      {/* Background Image */}
      <div className="absolute inset-0 bg-[url('/bg.webp')] bg-cover bg-center bg-fixed bg-no-repeat opacity-10" />

      <section id="new" className="relative z-10 mx-auto max-w-[1660px] px-4 pt-16 md:pt-16">
        <div className="mb-8 flex items-end justify-between">
          <h2 className="text-md font-display font-bold tracking-tight md:text-3xl">
            {heading}
          </h2>

          <Link
            href={viewAllHref}
            className="text-sm font-medium underline underline-offset-4 transition-all duration-300 md:text-md ease-in-out hover:text-pink lg:text-lg"
          >
            VIEW ALL PRODUCTS
          </Link>
        </div>

        {status === 'loading' ? (
          <Loader />
        ) : list.length ? (
          <ProductGrid products={list} />
        ) : (
          <p className="rounded bg-sand/60 p-6">
            {status === 'error'
              ? 'We couldn’t load products. Refresh the page to try again.'
              : 'New products are coming soon.'}
          </p>
        )}

        <div className="mt-[40px] flex items-center justify-center">
          <Link
            href={viewAllHref}
            className="group relative inline-flex items-center overflow-hidden rounded bg-pink px-6 py-3 font-semibold text-dark_Green"
          >
            <span className="absolute bottom-0 left-0 h-3 w-3 scale-0 rounded-full bg-dark_green transition-transform duration-700 ease-[cubic-bezier(0.4,0,0.2,1)] group-hover:scale-[35]" />
            <span className="relative z-10 text-white transition-colors duration-300 group-hover:text-white">
              VIEW ALL PRODUCTS
            </span>
          </Link>
        </div>
      </section>
    </div>
  );
}
