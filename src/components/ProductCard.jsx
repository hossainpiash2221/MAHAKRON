
"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import Img from "./Img";
import { useCart } from "./CartProvider";
import { useOrders } from "./OrdersProvider";
import { taka } from "@/lib/format";
import { flyToCart, startProgress } from "@/lib/ui";
import { toast as showToast } from "react-toastify";

export default function ProductCard({ p, priority = false }) {
  const out = p.status === "Out of Stock";

  const off =
    p.oldPrice > p.price
      ? Math.round((1 - p.price / p.oldPrice) * 100)
      : 0;

  const { add } = useCart();
  const { toast } = useOrders();
  const router = useRouter();
  const imgBox = useRef(null);

  const [color] = useState(
    p.colors.length === 1 ? p.colors[0] : ""
  );

  const [size] = useState(
    p.sizes.length === 1 ? p.sizes[0] : ""
  );

  const [err, setErr] = useState("");

  function build() {
    if (p.colors.length && !color) {
      setErr("Choose a colour");
      return null;
    }

    if (p.sizes.length && !size) {
      setErr("Choose a size");
      return null;
    }

    setErr("");

    return {
      productId: p.id,
      slug: p.slug,
      name: p.productName,
      image: p.images[0] || "",
      price: p.price,
      color,
      size,
      qty: 1,
      max: 20,
    };
  }

  function addToCart() {
    const item = build();
    if (!item) return;

    add(item);
    flyToCart(imgBox.current);
    showToast.success(`${p.productName} added to your cart`);
  }

  function buyNow() {
    const item = build();
    if (!item) return;

    add(item);
    startProgress();
    router.push("/checkout");
  }

  return (
    <li
      className="
        group flex min-w-0 flex-col overflow-hidden
        rounded-md border border-ink/10 bg-white
        shadow-sm transition-all duration-300
        hover:-translate-y-0.5 hover:border-dark_green/20
        hover:shadow-lg
      "
    >
      {/* PRODUCT IMAGE */}
      <Link
        href={`/products/${p.slug}`}
        className="block"
        aria-label={`View ${p.productName}`}
      >
        <div
          ref={imgBox}
          className="
            relative aspect-[4/5] overflow-hidden
            bg-mist
          "
        >
          <Img
            src={p.images[0]}
            alt={p.productName}
            priority={priority}
            className={`
              h-full w-full object-cover
              transition-transform duration-500
              group-hover:scale-[1.04]
              ${out ? "opacity-60 grayscale-[40%]" : ""}
            `}
          />

          {/* DISCOUNT / STOCK BADGE */}
          {out ? (
            <span
              className="
                absolute left-1.5 top-1.5
                rounded-sm bg-dark_green
                px-1.5 py-1 text-[8px]
                font-bold uppercase tracking-wide
                text-white sm:left-2 sm:top-2
                sm:px-2 sm:text-[10px]
              "
            >
              Out of stock
            </span>
          ) : off > 0 ? (
            <span
              className="
                absolute left-1.5 top-1.5
                rounded-sm bg-pink
                px-1.5 py-1 text-[14px]
                font-bold text-white
                sm:left-2 sm:top-2
                sm:px-2 sm:text-[16px]
              "
            >
              -{off}% Discount
            </span>
          ) : null}
        </div>
      </Link>

      {/* COMPACT PRODUCT DETAILS */}
      <div
        className="
          flex flex-1 flex-col
          px-2 pb-2 pt-2
          sm:px-2.5 sm:pb-2.5 sm:pt-2.5
          md:px-3 md:pb-3
        "
      >
        {/* CATEGORY */}
        <p
          className="
            truncate text-[8px] font-bold
            uppercase tracking-[0.12em]
            text-dark_green
            sm:text-[9px] md:text-[10px]
          "
        >
          {p.category}
        </p>

        {/* PRODUCT NAME */}
        <Link
          href={`/products/${p.slug}`}
          className="mt-1 block"
        >
          <h3
            className="
              min-h-[2.5rem] break-words text-xs font-semibold leading-5 text-dark_green transition-colors duration-200 group-hover:text-pink sm:text-sm md:text-base
            "
          >
            {p.productName}
          </h3>
        </Link>

        {/* PRICE */}
        <div
          className="
           flex min-w-0 flex-wrap
            items-baseline gap-x-1.5 gap-y-0
            
          "
        >
          <span
            className="
              text-sm font-bold leading-5
              tracking-tight text-pink
              sm:text-base md:text-3xl
            "
          >
            {taka(p.price)}
          </span>

          {off > 0 && (
            <s
              className="
                text-[10px] font-medium
                text-ink/40 sm:text-xl
              "
            >
              {taka(p.oldPrice)}
            </s>
          )}
        </div>

        {/* ERROR */}
        {err && (
          <p
            role="alert"
            className="mt-1 text-[10px] font-medium text-pink sm:text-xs"
          >
            {err}
          </p>
        )}

        {/* ACTION BUTTONS */}
        <div className="mt-auto grid grid-cols-2 gap-1.5 pt-2 sm:gap-2 sm:pt-3">
          {out ? (
            <button
              type="button"
              disabled
              className="
                col-span-2 rounded
                bg-ink/5 px-1 py-2
                text-[10px] font-semibold
                text-ink/40 sm:py-2.5 sm:text-xs
              "
            >
              Out of stock
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={addToCart}
                className="
                  min-w-0 whitespace-nowrap
                  rounded border border-dark_green
                  bg-white px-1 py-2
                  text-[10px] font-semibold
                  text-dark_green
                  transition-colors duration-200
                  hover:bg-dark_green hover:text-white
                  active:scale-[0.97]
                  sm:px-2 sm:py-2.5 sm:text-xs
                  md:text-sm
                "
              >
                Add to Bag
              </button>

              <button
                type="button"
                onClick={buyNow}
                className="
                  min-w-0 whitespace-nowrap
                  rounded bg-dark_green
                  px-1 py-2 text-[10px]
                  font-semibold text-white
                  transition-colors duration-200
                  hover:bg-pink active:scale-[0.97]
                  sm:px-2 sm:py-2.5 sm:text-xs
                  md:text-sm
                "
              >
                Buy now
              </button>
            </>
          )}
        </div>
      </div>
    </li>
  );
}
