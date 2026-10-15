'use client';
import Link from 'next/link';
import { useState } from 'react';
import { useProducts } from './ProductsProvider';

const TILES = [
  { gender: 'Male', file: '/gender-male.jpg', blurb: 'Shop the Male collection' },
  { gender: 'Female', file: '/gender-female.jpg', blurb: 'Shop the Female collection' },
];

function Tile({ gender, file, blurb }) {
  const { products } = useProducts();
  const [broken, setBroken] = useState(false);
  // Your own photo at public/gender-male.jpg or public/gender-female.jpg wins.
  // Without it, the first product photo of that gender is used.
  const fallback = (products.find((p) => p.gender === gender && p.images[0]) || {}).images?.[0] || '';
  const src = broken ? fallback : file;
  return (
    <Link href={`/products?gender=${gender}`} className="group relative block aspect-[3/4] overflow-hidden rounded-xl bg-dark_green sm:aspect-[4/3]">
      {src && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt="" loading="lazy" decoding="async" referrerPolicy="no-referrer" onError={() => setBroken(true)}
          className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105" />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/15 to-transparent" aria-hidden="true" />
      <div className="absolute inset-x-0 bottom-0 p-4 text-white sm:p-6">
        <h3 className="font-display text-3xl font-extrabold tracking-tight sm:text-5xl">{gender}</h3>
        <p className="mt-1 flex items-center gap-2 text-sm font-medium text-white/85 sm:text-base">
          {blurb}
          <span aria-hidden="true" className="transition-transform duration-300 group-hover:translate-x-1">→</span>
        </p>
      </div>
    </Link>
  );
}

export default function GenderTiles() {
  return (
    <section className="mx-auto max-w-6xl px-4 pt-14" aria-labelledby="shop-by">
      <h2 id="shop-by" className="sr-only uppercase">Shop by gender</h2>
      <div className="grid grid-cols-2 gap-3 sm:gap-6">
        {TILES.map((t) => <Tile key={t.gender} {...t} />)}
      </div>
    </section>
  );
}
