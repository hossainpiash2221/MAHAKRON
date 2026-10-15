
'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useProducts } from './ProductsProvider';
import { useCart } from './CartProvider';
import { FaShoppingBag } from 'react-icons/fa';

export default function GenderProductSlider({
  gender,
  category,
  interval = 3000,
}) {
  const { products = [] } = useProducts();
  const { addItem } = useCart();

  const [active, setActive] = useState(0);
  const [dragging, setDragging] = useState(false);

  const startX = useRef(null);
  const moved = useRef(false);
  const suppressClick = useRef(false);

  // Optional Gender + Category filter
  const items = useMemo(() => {
    return products.filter((p) => {
      const matchesGender =
        !gender ||
        String(p.gender || '').toLowerCase() ===
          String(gender).toLowerCase();

      const matchesCategory =
        !category ||
        String(p.category || '').toLowerCase() ===
          String(category).toLowerCase();

      const isAvailable = p.status !== 'Out of Stock';

      return matchesGender && matchesCategory && isAvailable;
    });
  }, [products, gender, category]);

  // Reset slider when filters change
  useEffect(() => {
    setActive(0);
  }, [gender, category]);

  // Keep active index valid when products change
  useEffect(() => {
    if (items.length > 0 && active >= items.length) {
      setActive(0);
    }
  }, [items.length, active]);

  // Auto sliding (pause while dragging)
  useEffect(() => {
    if (items.length < 2 || dragging) return;

    const timer = setInterval(() => {
      setActive((prev) => (prev + 1) % items.length);
    }, interval);

    return () => clearInterval(timer);
  }, [items.length, interval, dragging]);

  // Next slide
  const nextSlide = () => {
    if (items.length < 2) return;

    setActive((prev) => (prev + 1) % items.length);
  };

  // Previous slide
  const prevSlide = () => {
    if (items.length < 2) return;

    setActive((prev) => (prev - 1 + items.length) % items.length);
  };

  // Works for touch and mouse
  const handlePointerDown = (e) => {
    if (e.target.closest('button, a')) return;

    startX.current = e.clientX;
    moved.current = false;
    suppressClick.current = false;
    setDragging(true);

    e.currentTarget.setPointerCapture?.(e.pointerId);
  };

  const handlePointerMove = (e) => {
    if (startX.current === null) return;

    if (Math.abs(e.clientX - startX.current) > 8) {
      moved.current = true;
    }
  };

  const handlePointerUp = (e) => {
    if (startX.current === null) return;

    const difference = e.clientX - startX.current;

    if (Math.abs(difference) > 45) {
      suppressClick.current = true;

      if (difference < 0) {
        nextSlide();
      } else {
        prevSlide();
      }
    }

    startX.current = null;
    setDragging(false);
  };

  const handlePointerCancel = () => {
    startX.current = null;
    setDragging(false);
  };

  // Calculate product position
  const getPosition = (index) => {
    const total = items.length;
    let diff = (index - active + total) % total;

    if (diff > total / 2) diff -= total;

    return diff;
  };

  // Discount calculation
  const getDiscount = (price, oldPrice) => {
    if (!oldPrice || oldPrice <= price) return 0;

    return Math.round(((oldPrice - price) / oldPrice) * 100);
  };

  // No matching products: do not crash
  if (!items.length) return null;

  return (
    <div
      className="relative mx-auto flex h-[520px] w-full max-w-[850px] mt-4 select-none items-center justify-center overflow-hidden sm:h-[640px] lg:h-[700px]"
      style={{
        touchAction: 'pan-y',
        cursor: dragging ? 'grabbing' : 'grab',
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerCancel}
      onClickCapture={(e) => {
        if (suppressClick.current) {
          e.preventDefault();
          e.stopPropagation();
          suppressClick.current = false;
        }
      }}
    >
      <div
        className="relative flex h-full w-full items-center justify-center"
        style={{ perspective: '1200px' }}
      >
        {items.map((p, index) => {
          const position = getPosition(index);
          const distance = Math.abs(position);
          const visible = distance <= 2;

          const image =
            p.images?.[0] || p.image || '/placeholder.png';

          const price = Number(p.price) || 0;
          const oldPrice = Number(p.oldPrice) || 0;
          const discount = getDiscount(price, oldPrice);

          return (
            <div
              key={p.id || index}
              className="absolute w-[52%] sm:w-[42%] lg:w-[35%]"
              style={{
                transform: `
                  translateX(${position * 58}%)
                  translateZ(${-distance * 110}px)
                  rotateY(${-position * 24}deg)
                  scale(${position === 0 ? 1 : 0.86})
                `,
                opacity: visible
                  ? distance === 0
                    ? 1
                    : 0.65
                  : 0,
                zIndex: 20 - distance,
                pointerEvents: visible ? 'auto' : 'none',
                transition:
                  'transform 850ms cubic-bezier(.22,1,.36,1), opacity 850ms ease',
                transformStyle: 'preserve-3d',
              }}
            >
              <div className="group relative overflow-hidden rounded-[4px] bg-white shadow-xl">

                {/* PRODUCT IMAGE */}
                <Link
                  href={`/products/${p.slug}`}
                  draggable={false}
                  tabIndex={position === 0 ? 0 : -1}
                  className="relative block aspect-[3/4] overflow-hidden"
                >
                  <img
                    src={image}
                    alt={p.productName || 'Product'}
                    className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                    draggable={false}
                  />

                  {/* DISCOUNT BADGE */}
                  {discount > 0 && (
                    <span className="absolute left-2 top-2 rounded-[4px] bg-[#c80077] px-2 py-1 text-[10px] font-bold text-white md:text-lg">
                      -{discount}% Discount
                    </span>
                  )}
                </Link>

                {/* PRODUCT DETAILS */}
                <div className="px-2 pb-3 pt-3 text-center sm:px-4 sm:pb-4">
                  <Link
                    href={`/products/${p.slug}`}
                    className="block truncate py-2 text-xs font-medium text-gray-800 hover:text-[#c80077] sm:text-sm"
                  >
                    {p.productName || 'Product'}
                  </Link>

                  {/* PRICE */}
                  <div className="mt-2 flex flex-wrap items-center justify-center gap-2">
                    <span className="text-sm font-bold text-[#00350c] sm:text-lg">
                      ৳{price.toLocaleString('en-BD')}
                    </span>

                    {discount > 0 && (
                      <span className="text-[11px] text-gray-400 line-through sm:text-sm">
                        ৳{oldPrice.toLocaleString('en-BD')}
                      </span>
                    )}
                  </div>

                  {/* ADD TO BAG */}
                  <button
                    type="button"
                    onClick={() => addItem(p, 1)}
                    disabled={position !== 0}
                    className="mt-3 flex w-full items-center justify-center gap-2 rounded-[4px] bg-[#00350c] px-2 py-2.5 text-[10px] font-semibold uppercase tracking-wide text-white transition-colors duration-300 hover:bg-[#c80077] disabled:cursor-default sm:text-xs"
                  >
                    <FaShoppingBag size={12} />
                    Add to Bag
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* LEFT & RIGHT ARROWS */}
      {items.length > 1 && (
        <>
          {/* LEFT ARROW */}
          <button
            type="button"
            onClick={prevSlide}
            aria-label="Previous product"
            className="absolute left-2 top-1/2 z-30 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-[#00350c] text-white shadow-lg transition-all duration-300 hover:bg-[#c80077] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c80077] focus-visible:ring-offset-2 sm:left-4 sm:h-11 sm:w-11"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="m15 18-6-6 6-6" />
            </svg>
          </button>

          {/* RIGHT ARROW */}
          <button
            type="button"
            onClick={nextSlide}
            aria-label="Next product"
            className="absolute right-2 top-1/2 z-30 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-[#00350c] text-white shadow-lg transition-all duration-300 hover:bg-[#c80077] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c80077] focus-visible:ring-offset-2 sm:right-4 sm:h-11 sm:w-11"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="m9 18 6-6-6-6" />
            </svg>
          </button>
        </>
      )}

      {/* SLIDER DOTS */}
      {items.length > 1 && (
        <div className="absolute bottom-1 left-1/2 z-30 flex -translate-x-1/2 items-center gap-2">
          {items.slice(0, 12).map((_, index) => (
            <button
              key={index}
              type="button"
              onClick={() => setActive(index)}
              aria-label={`Go to slide ${index + 1}`}
              aria-current={active === index ? 'true' : undefined}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                active === index
                  ? 'w-6 bg-[#00350c]'
                  : 'w-1.5 bg-gray-300'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
