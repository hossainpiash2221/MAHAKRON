'use client';

import Link from 'next/link';
import { useProducts } from './ProductsProvider';
import ProductGrid from './ProductGrid';
import Loader from './Loader';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';

export default function FeaturedProducts() {
  const wanted = useSearchParams().get('gender');
  const valid = wanted === 'Male' || wanted === 'Female' ? wanted : null;

  const [gender, setGender] = useState(valid || 'All');
  const [cat, setCat] = useState('All');

  useEffect(() => {
    if (valid) {
      setGender(valid);
      setCat('All');
    }
  }, [valid]);

  const { products, status } = useProducts();

  const out = (p) => p.status === 'Out of Stock';

  const list = [
    ...products.filter((p) => !out(p)),
    ...products.filter(out),
  ].slice(0, 12);

  return (
    <div className="relative w-full bg-white pb-[60px]">
      
      {/* Background Image - 50% opacity */}
      <div
        className="absolute inset-0 bg-[url('/leaves.webp')] bg-cover bg-center bg-fixed bg-no-repeat opacity-10"
      />

      {/* Content */}
      <section
        id="new"
        className="relative z-10 mx-auto max-w-[1660px] px-4 pt-16"
      >
        <div className="mb-8 flex items-end justify-between">
          <h2 className="text-xl font-display md:text-3xl font-bold tracking-tight">
            NEW COLLECTIONS
          </h2>

          <Link
            href="/products"
            className="text-md lg:text-lg font-medium underline underline-offset-4 transition-all duration-300 ease-in-out hover:text-pink"
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
        <div className='flex items-center justify-center mt-[40px]'>
                  <Link
            href="/products"
            className="group relative inline-flex items-center overflow-hidden rounded bg-pink px-6 py-3 font-semibold text-dark_Green"
          >
            {/* Hover circle */}
            <span
              className="
      absolute bottom-0 left-0
      h-3 w-3
      scale-0 rounded-full
      bg-dark_green
      transition-transform duration-700
      ease-[cubic-bezier(0.4,0,0.2,1)]
      group-hover:scale-[35]
    "
            />

            {/* Text */}
            <span className="relative z-10 transition-colors duration-300 text-white group-hover:text-white">
              VIEW ALL PRODUCTS
            </span>
          </Link>
        </div>
      </section>
      
    </div>
  );
}