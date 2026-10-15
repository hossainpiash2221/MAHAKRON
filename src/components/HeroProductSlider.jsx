
'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useProducts } from './ProductsProvider';

export default function HeroProductSlider({
  category = 'Three Piece',
  interval = 3000,
}) {
  const { products } = useProducts();
  const [active, setActive] = useState(0);

  const items = useMemo(() => {
    return products.filter(
      (p) =>
        p.category?.toLowerCase() === category.toLowerCase() &&
        p.status !== 'Out of Stock'
    );
  }, [products, category]);

  useEffect(() => {
    setActive(0);
  }, [category]);

  useEffect(() => {
    if (items.length < 2) return;

    const timer = setInterval(() => {
      setActive((prev) => (prev + 1) % items.length);
    }, interval);

    return () => clearInterval(timer);
  }, [items.length, interval]);

  const getPosition = (index) => {
    const total = items.length;
    let diff = (index - active + total) % total;

    if (diff > total / 2) diff -= total;

    return diff;
  };

  if (!items.length) return null;

  return (
    <div className="relative mx-auto flex h-[380px] w-full max-w-[850px] items-center justify-center overflow-hidden sm:h-[480px] lg:h-[560px]">

      <div
        className="relative flex h-full w-full items-center justify-center"
        style={{ perspective: '1200px' }}
      >
        {items.map((p, index) => {
          const position = getPosition(index);
          const distance = Math.abs(position);
          const visible = distance <= 2;

          const image =
            p.images?.[0] ||
            p.image ||
            '/placeholder.png';

          const price = Number(p.price) || 0;

          return (
            <div
              key={p.id || index}
              className="absolute w-[48%] sm:w-[40%] lg:w-[34%]"
              style={{
                transform: `
                  translateX(${position * 58}%)
                  translateZ(${-distance * 110}px)
                  rotateY(${-position * 24}deg)
                  scale(${position === 0 ? 1 : 0.86})
                `,
                opacity: visible ? (distance === 0 ? 1 : 0.65) : 0,
                zIndex: 20 - distance,
                pointerEvents: visible ? 'auto' : 'none',
                transition:
                  'transform 850ms cubic-bezier(.22,1,.36,1), opacity 850ms ease',
                transformStyle: 'preserve-3d',
              }}
            >
              <Link
                href={`/products/${p.slug}`}
                className="group block"
                tabIndex={position === 0 ? 0 : -1}
              >
                <div
                  className={`
                    relative overflow-hidden rounded-[12px]
                    bg-white shadow-xl
                    transition-shadow duration-500
                    ${position === 0 ? 'shadow-2xl' : ''}
                  `}
                >
                  <div className="aspect-[3/4] overflow-hidden">
                    <img
                      src={image}
                      alt={p.productName || 'Product'}
                      className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                      draggable="false"
                    />
                  </div>

                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent px-4 pb-5 pt-12 text-center">
                    <span className="text-lg font-bold text-white sm:text-xl">
                      ৳{price.toLocaleString('en-BD')}
                    </span>
                  </div>
                </div>
              </Link>
            </div>
          );
        })}
      </div>
    </div>
  );
}
