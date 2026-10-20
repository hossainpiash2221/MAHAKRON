
'use client';

import Link from 'next/link';
import { useCart } from '@/components/CartProvider';
import QuantityStepper from '@/components/QuantityStepper';
import Img from '@/components/Img';
import { taka } from '@/lib/format';
import { DELIVERY } from '@/lib/delivery';
import GenderProductSlider from '@/components/GenderProductSlider';

export default function CartPage() {
  const { items, ready, subtotal, setQty, remove } = useCart();

  const formatDelivery = (amount) => taka(amount);

  if (!ready) {
    return (
      <main className="min-h-screen bg-[#faf9f6] px-4 py-16">
        <div className="mx-auto max-w-6xl animate-pulse">
          <div className="mb-10 h-10 w-64 rounded-[4px] bg-gray-200" />
          <div className="h-64 rounded-[4px] bg-gray-200" />
        </div>
      </main>
    );
  }

  if (!items.length) {
    return (
      <main className="flex min-h-[80vh] items-center justify-center bg-[#faf9f6] px-4 py-16">
        <div className="w-full max-w-xl text-center">
          <div className="mx-auto mb-7 flex h-24 w-24 items-center justify-center rounded-[4px] bg-dark_green/[0.06]">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.3"
              className="h-12 w-12 text-dark_green"
              aria-hidden="true"
            >
              <path d="M5 8h14l1 13H4L5 8Z" />
              <path d="M9 9V6a3 3 0 0 1 6 0v3" />
            </svg>
          </div>

          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.3em] text-pink">
            Your next favourite awaits
          </p>

          <h1 className="font-display text-4xl font-bold uppercase tracking-tight text-dark_green sm:text-5xl">
            An empty bag,
            <br />
            a world of style.
          </h1>

          <p className="mx-auto mt-5 max-w-sm text-sm leading-7 text-gray-600">
            Discover your next favourite from ZUNIRAH and make room for
            something beautiful.
          </p>

          <Link
            href="/products"
            className="mt-8 inline-flex min-h-12 items-center justify-center gap-3 rounded-[4px] bg-dark_green px-8 py-3 text-sm font-semibold text-white transition-colors duration-200 hover:bg-pink"
          >
            EXPLORE COLLECTION
            <span aria-hidden="true">→</span>
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[url('/bg.webp')] bg-cover bg-center bg-fixed text-dark_green py-4">
      {/* Editorial header */}
      <section className="border-b border-dark_green/10 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-9 sm:px-6 sm:py-14 lg:px-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              {/* <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.3em] text-pink sm:text-xs">
                ZUNIRAH / YOUR SELECTION
              </p> */}

              <h1 className="font-display text-3xl font-bold uppercase tracking-tight sm:text-5xl lg:text-6xl">
                Shopping Bag<span className="text-pink">.</span>
              </h1>

              <p className="mt-3 text-sm text-gray-500">
                Carefully chosen. Ready for you.
              </p>
            </div>

            <div className="flex h-14 min-w-14 items-center justify-center rounded-[4px] border border-dark_green/15 px-4">
              <span className="text-lg font-bold tabular-nums">
                {String(items.reduce((total, item) => total + item.qty, 0)).padStart(2, '0')}
              </span>
              <span className="ml-2 text-[10px] font-semibold uppercase tracking-wider text-gray-500">
                Items
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Shopping content */}
      <section className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8 ">
        <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_350px] lg:gap-12">

          {/* Products */}
          <div>
            <div className="mb-5 flex items-center justify-between border-b border-dark_green/15 pb-4">
              <h2 className="text-xs font-bold uppercase tracking-[0.2em]">
                Your selection
              </h2>

              <Link
                href="/products"
                className="text-xs font-semibold text-pink transition-colors hover:text-dark_green"
              >
                + Add more
              </Link>
            </div>

            <ul className="divide-y divide-dark_green/10">
              {items.map((i) => (
                <li
                  key={i.key}
                  className="group flex gap-4 py-5 sm:gap-6 sm:py-7"
                >
                  <Link
                    href={`/products/${i.slug}`}
                    className="relative h-32 w-24 shrink-0 overflow-hidden rounded-[4px] bg-[#e9ebe5] sm:h-40 sm:w-32"
                  >
                    <Img
                      src={i.image}
                      alt={i.name}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  </Link>

                  <div className="flex min-w-0 flex-1 flex-col">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <Link
                          href={`/products/${i.slug}`}
                          className="line-clamp-2 text-sm font-semibold leading-6 transition-colors hover:text-pink sm:text-base"
                        >
                          {i.name}
                        </Link>

                        {(i.color || i.size) && (
                          <p className="mt-1.5 text-xs text-gray-500">
                            {[i.color, i.size].filter(Boolean).join(' / ')}
                          </p>
                        )}

                        <p className="mt-2 text-sm font-semibold text-pink">
                          {taka(i.price)}
                          <span className="ml-1 text-[10px] font-normal text-gray-400">
                            / item
                          </span>
                        </p>
                      </div>

                      <p className="shrink-0 text-sm font-bold tabular-nums sm:text-base">
                        {taka(i.price * i.qty)}
                      </p>
                    </div>

                    <div className="mt-auto flex flex-wrap items-center justify-between gap-3 pt-4">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">
                          Qty
                        </span>

                        <QuantityStepper
                          value={i.qty}
                          max={i.max || 99}
                          onChange={(q) => setQty(i.key, q)}
                          label={`Quantity for ${i.name}`}
                        />
                      </div>

                      <button
                        type="button"
                        onClick={() => remove(i.key)}
                        aria-label={`Remove ${i.name} from cart`}
                        className="text-xs text-gray-500 underline decoration-gray-300 underline-offset-4 transition-colors hover:text-pink hover:decoration-pink"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>

            <div className="mt-5 flex items-center gap-3 border-t border-dark_green/10 pt-5 text-xs leading-5 text-gray-500">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                className="h-5 w-5 shrink-0 text-dark_green"
                aria-hidden="true"
              >
                <path d="M12 22s8-4 8-11V5l-8-3-8 3v6c0 7 8 11 8 11Z" />
                <path d="m9 12 2 2 4-4" />
              </svg>
              Your selection stays in your bag when you return to the store.
            </div>
          </div>

          {/* Order summary */}
          <aside className="rounded-[4px] border border-dark_green/10 bg-white p-5 sm:p-7 lg:sticky lg:top-6">
            <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-pink">
              Almost yours
            </p>

            <h2 className="mt-2 font-display text-2xl font-bold uppercase">
              Order Summary
            </h2>

            <div className="my-6 border-t border-dark_green/10" />

            <dl className="space-y-4 text-sm">
              <div className="flex items-center justify-between gap-4">
                <dt className="text-gray-600">
                  Subtotal ({items.reduce((total, item) => total + item.qty, 0)} items)
                </dt>
                <dd className="font-semibold tabular-nums">{taka(subtotal)}</dd>
              </div>

              <div className="flex items-start justify-between gap-4">
                <dt className="text-gray-600">Delivery</dt>
                <dd className="text-right">
                  <span className="block text-xs font-semibold text-dark_green">
                    Calculated at checkout
                  </span>
                  <span className="mt-1 block text-[11px] text-gray-500">
                    Dhaka: {formatDelivery(DELIVERY.inside.charge)}
                  </span>
                  <span className="block text-[11px] text-gray-500">
                    Outside: {formatDelivery(DELIVERY.outside.charge)}
                  </span>
                </dd>
              </div>
            </dl>

            <div className="my-6 border-t border-dashed border-dark_green/20" />

            <div className="flex items-end justify-between gap-3">
              <div>
                <p className="text-xs text-gray-500">Estimated total</p>
                <p className="mt-1 text-[10px] text-gray-400">
                  Delivery excluded
                </p>
              </div>

              <p className="text-2xl font-bold tracking-tight tabular-nums sm:text-3xl">
                {taka(subtotal)}
              </p>
            </div>

            <Link
              href="/checkout"
              className="mt-7 flex min-h-14 w-full items-center justify-center gap-3 rounded-[4px] bg-pink px-5 py-4 text-center text-xs font-bold uppercase tracking-[0.15em] text-white transition-colors duration-200 hover:bg-dark_green focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pink"
            >
              Proceed to Checkout
              <span aria-hidden="true" className="text-base">→</span>
            </Link>

            <Link
              href="/products"
              className="mt-4 flex min-h-11 items-center justify-center rounded-[4px] border border-dark_green/15 px-4 py-3 text-xs font-semibold uppercase tracking-wider transition-colors hover:border-dark_green hover:bg-dark_green/[0.04]"
            >
              Continue Shopping
            </Link>

            <div className="mt-6 flex items-center justify-center gap-2 border-t border-dark_green/10 pt-5 text-[10px] uppercase tracking-wider text-gray-500">
              <span className="text-pink">✦</span>
              Made for your everyday style
              <span className="text-pink">✦</span>
            </div>
          </aside>
        </div>
      </section>
     <div className='py-4'>
       <GenderProductSlider
        className="bg-[url('/leaves.webp')] bg-cover bg-center bg-fixed"
        gender="Female"
      />
     </div>
    </main>
  );
}
