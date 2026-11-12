"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import { FaShoppingBag } from "react-icons/fa";
import { toast as showToast } from "react-toastify";
import { useProducts } from "./ProductsProvider";
import { useCart } from "./CartProvider";
import { flyToCart } from "@/lib/ui";

const productId = (p) => String(p.id ?? p._id ?? p.code ?? "");
const productName = (p) => p.productName || p.name || p.title || "Product";
const productImages = (p) => {
  const images = Array.isArray(p.images) ? p.images : [];
  return [images[0] || p.image || "/placeholder.png", images[1] || null];
};

function BentoProductCard({ product, add }) {
  const id = productId(product);
  const name = productName(product);
  const [first, second] = productImages(product);
  const price = Math.max(0, Number(product.price) || 0);
  const href = product.slug ? `/products/${product.slug}` : `/products/${id}`;
  const imageRef = useRef(null);
  const cursorRef = useRef(null);
  const [hovered, setHovered] = useState(false);

  // Use transforms rather than React state for smooth, low-overhead pointer movement.
  const moveCursor = (event) => {
    if (!cursorRef.current || !imageRef.current) return;
    const bounds = imageRef.current.getBoundingClientRect();
    cursorRef.current.style.transform = `translate3d(${event.clientX - bounds.left}px, ${event.clientY - bounds.top}px, 0) translate(-50%, -50%)`;
  };

  const handleAdd = (event) => {
    event.preventDefault();
    event.stopPropagation();
    if (typeof add !== "function") {
      showToast.error("Cart is not ready. Please try again.");
      return;
    }
    if (!id) {
      showToast.error("This product cannot be added to the cart.");
      return;
    }
    const item = {
      productId: id,
      slug: product.slug || "",
      name,
      image: first,
      price,
      color: "",
      size: "",
      qty: 1,
      max: 20,
    };
    try {
      add(item);
      if (imageRef.current && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        flyToCart(imageRef.current);
      }
      showToast.success(`${name} added to your cart`);
    } catch (error) {
      console.error("Unable to add product to cart:", error);
      showToast.error("Could not add this product. Please try again.");
    }
  };

  return (
    <article className="group min-w-0 overflow-hidden rounded-[4px] border border-ink/10 bg-white transition-shadow duration-300 hover:shadow-lg">
      <Link href={href} aria-label={`View ${name}`} className="block">
        <div
          ref={imageRef}
          onPointerEnter={(event) => {
            if (event.pointerType === "mouse") {
              setHovered(true);
              moveCursor(event);
            }
          }}
          onPointerMove={moveCursor}
          onPointerLeave={() => setHovered(false)}
          className="relative aspect-square w-full overflow-hidden bg-mist md:cursor-none"
        >
          <img
            src={first}
            alt={name}
            loading="lazy"
            draggable={false}
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.035]"
          />
          {second && (
            <img
              src={second}
              alt=""
              aria-hidden="true"
              loading="lazy"
              draggable={false}
              className="absolute inset-0 h-full w-full object-cover opacity-0 transition-opacity duration-500 ease-out group-hover:opacity-100"
            />
          )}
          <span
            ref={cursorRef}
            aria-hidden="true"
            className={`pointer-events-none absolute left-0 top-0 z-10 hidden h-20 w-20 items-center justify-center rounded-full border border-white/50 bg-ink/80 text-[10px] font-semibold uppercase tracking-[0.12em] text-white shadow-xl backdrop-blur-sm transition-opacity duration-200 md:flex ${hovered ? "opacity-100" : "opacity-0"}`}
            style={{ transform: "translate3d(-200px,-200px,0)" }}
          >
            View
          </span>
        </div>
      </Link>
      <div className="flex flex-col gap-2 p-3 sm:p-4">
        <Link href={href} className="block min-w-0">
          <h3 className="truncate text-sm font-semibold text-ink transition-colors hover:text-peacock sm:text-base">{name}</h3>
        </Link>
        <p className="text-base font-bold text-dark_green sm:text-lg">৳{price.toLocaleString("en-BD")}</p>
        <button
          type="button"
          onClick={handleAdd}
          className="flex w-full items-center justify-center gap-2 rounded-[4px] bg-pink px-3 py-2.5 text-xs font-semibold text-white transition-colors duration-200 hover:bg-dark_green focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-peacock sm:text-sm"
        >
          <FaShoppingBag size={13} /> Add to Bag
        </button>
      </div>
    </article>
  );
}

/**
 * Square-image bento grid using the existing MAHAKRON providers.
 * Example: <MahakronBentoProducts gender="men" category="all" limit={8} />
 */
export default function MahakronBentoProducts({ gender, category = "all", limit = 8, title }) {
  const { products = [] } = useProducts();
  const { add } = useCart();
  const items = useMemo(() => {
    const g = String(gender || "").trim().toLowerCase();
    const c = String(category || "all").trim().toLowerCase();
    const seen = new Set();
    return products.filter((p) => {
      const id = productId(p);
      if (!id || seen.has(id)) return false;
      if (g && String(p.gender || "").trim().toLowerCase() !== g) return false;
      if (c !== "all" && String(p.category || "").trim().toLowerCase() !== c) return false;
      const status = String(p.status || "").trim().toLowerCase();
      if (status === "out of stock" || status === "out-of-stock") return false;
      seen.add(id);
      return true;
    }).slice(0, Math.max(0, Number(limit) || 8));
  }, [products, gender, category, limit]);

  if (!items.length) return null;

  return (
    <section className="mx-auto w-full max-w-6xl px-4 py-8" aria-label={title || "Featured products"}>
      {title && <h2 className="mb-6 font-display text-2xl font-bold tracking-tight text-ink sm:text-3xl">{title}</h2>}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
        {items.map((p) => <BentoProductCard key={productId(p)} product={p} add={add} />)}
      </div>
    </section>
  );
}
