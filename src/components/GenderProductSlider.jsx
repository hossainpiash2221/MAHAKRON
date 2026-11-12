"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useProducts } from "./ProductsProvider";
import { useCart } from "./CartProvider";
import { FaShoppingBag } from "react-icons/fa";
import { flyToCart } from "@/lib/ui";
import { toast as showToast } from "react-toastify";

const getId = (product) => String(product.id ?? product._id ?? product.code ?? "");
const getName = (product) => product.productName || product.name || product.title || "Product";
const getImage = (product) => product.images?.[0] || product.image || "/placeholder.png";

export default function GenderProductSlider({ gender, category, interval = 3000 }) {
  const { products = [] } = useProducts();
  const { add } = useCart();
  const [active, setActive] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [reducedMotion, setReducedMotion] = useState(false);
  const sliderRef = useRef(null);
  const imageRefs = useRef({});
  const touchStart = useRef(null);
  const suppressClick = useRef(false);

  const items = useMemo(() => {
    const selectedGender = String(gender || "").trim().toLowerCase();
    const selectedCategory = String(category || "all").trim().toLowerCase();
    const seen = new Set();
    return products.filter((product) => {
      const id = getId(product);
      if (!id || seen.has(id)) return false;
      const productGender = String(product.gender || "").trim().toLowerCase();
      const productCategory = String(product.category || "").trim().toLowerCase();
      const status = String(product.status || "").trim().toLowerCase();
      if (selectedGender && productGender !== selectedGender) return false;
      if (selectedCategory !== "all" && productCategory !== selectedCategory) return false;
      if (["out of stock", "out-of-stock"].includes(status)) return false;
      seen.add(id);
      return true;
    });
  }, [products, gender, category]);

  useEffect(() => {
    setActive((current) => (items.length ? Math.min(current, items.length - 1) : 0));
  }, [items.length]);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(media.matches);
    update();
    media.addEventListener?.("change", update);
    return () => media.removeEventListener?.("change", update);
  }, []);

  useEffect(() => {
    if (!sliderRef.current || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(([entry]) => setIsVisible(entry.isIntersecting), { threshold: 0.1 });
    observer.observe(sliderRef.current);
    return () => observer.disconnect();
  }, []);

  const next = useCallback(() => {
    setActive((current) => (items.length > 1 ? (current + 1) % items.length : current));
  }, [items.length]);
  const previous = useCallback(() => {
    setActive((current) => (items.length > 1 ? (current - 1 + items.length) % items.length : current));
  }, [items.length]);

  useEffect(() => {
    if (items.length <= 1 || isPaused || !isVisible || reducedMotion || interval <= 0) return;
    const timer = window.setInterval(next, interval);
    return () => window.clearInterval(timer);
  }, [items.length, isPaused, isVisible, reducedMotion, interval, next]);

  const onTouchStart = (event) => {
    const touch = event.touches[0];
    touchStart.current = { x: touch.clientX, y: touch.clientY };
  };
  const onTouchEnd = (event) => {
    if (!touchStart.current) return;
    const touch = event.changedTouches[0];
    const dx = touch.clientX - touchStart.current.x;
    const dy = touch.clientY - touchStart.current.y;
    touchStart.current = null;
    if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy)) {
      suppressClick.current = true;
      if (dx < 0) next(); else previous();
      window.setTimeout(() => { suppressClick.current = false; }, 350);
    }
  };

  const handleAddToBag = (product, event) => {
    event.preventDefault();
    event.stopPropagation();
    if (!add) return showToast.error("Cart is not ready. Please try again.");
    const productId = getId(product);
    if (!productId) return showToast.error("This product cannot be added to the cart.");
    const item = {
      productId,
      slug: product.slug || "",
      name: getName(product),
      image: getImage(product),
      price: Math.max(0, Number(product.price) || 0),
      color: "", size: "", qty: 1, max: 20,
    };
    try {
      add(item);
      const source = imageRefs.current[productId];
      if (source && !reducedMotion) flyToCart(source);
      showToast.success(`${item.name} added to your cart`);
    } catch (error) {
      console.error("Unable to add product to cart:", error);
      showToast.error("Could not add this product. Please try again.");
    }
  };

  if (!items.length) return null;

  const getPosition = (index) => {
    let offset = index - active;
    if (offset > items.length / 2) offset -= items.length;
    if (offset < -items.length / 2) offset += items.length;
    return offset;
  };

  return (
    <section
      ref={sliderRef}
      aria-label="Featured products"
      className="relative w-full overflow-hidden py-5 sm:py-7"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onFocusCapture={() => setIsPaused(true)}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setIsPaused(false);
      }}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
      onKeyDown={(event) => {
        if (event.key === "ArrowRight") { event.preventDefault(); next(); }
        if (event.key === "ArrowLeft") { event.preventDefault(); previous(); }
      }}
    >
      <div className="relative mx-auto h-[450px] w-full max-w-6xl sm:h-[500px] md:h-[590px] pt-9 mt-10">
        {items.map((product, index) => {
          const position = getPosition(index);
          if (Math.abs(position) > 2) return null;
          const isActive = position === 0;
          const absPosition = Math.abs(position);
          const productId = getId(product);
          const productName = getName(product);
          const image = getImage(product);
          const price = Math.max(0, Number(product.price) || 0);
          const oldPrice = Math.max(0, Number(product.oldPrice) || 0);
          const discount = oldPrice > price ? Math.round((1 - price / oldPrice) * 100) : 0;
          const href = product.slug ? `/products/${product.slug}` : `/products/${productId}`;
          return (
            <article
              key={productId}
              aria-hidden={!isActive}
              className="absolute left-1/2 top-0 w-[230px] overflow-hidden rounded-[4px] border border-ink/10 bg-white shadow-xl transition-all duration-500 ease-out sm:w-[270px] md:w-[300px]"
              style={{
                transform: `translateX(calc(-50% + ${position * 72}%)) scale(${isActive ? 1 : absPosition === 1 ? 0.82 : 0.66})`,
                opacity: isActive ? 1 : absPosition === 1 ? 0.65 : 0.3,
                zIndex: 10 - absPosition,
                pointerEvents: isActive ? "auto" : "none",
              }}
            >
              <Link href={href} tabIndex={isActive ? 0 : -1} className="block" draggable={false} onClick={(event) => { if (suppressClick.current) event.preventDefault(); }}>
                <div ref={(element) => { if (element) imageRefs.current[productId] = element; else delete imageRefs.current[productId]; }} className="relative aspect-[4/5] overflow-hidden bg-mist">
                  <img src={image} alt={productName} draggable={false} loading={isActive ? "eager" : "lazy"} className="h-full w-full select-none object-cover" />
                  {discount > 0 && <span className="absolute left-3 top-3 rounded-md bg-pink px-2.5 py-1 text-xs font-bold text-white shadow">-{discount}%</span>}
                </div>
              </Link>
              <div className="p-3 sm:p-4">
                <Link href={href} tabIndex={isActive ? 0 : -1} className="block">
                  <h3 className="truncate text-sm font-semibold text-ink sm:text-base">{productName}</h3>
                </Link>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <span className="text-base font-bold text-dark_green sm:text-lg">৳{price.toLocaleString("en-BD")}</span>
                  {oldPrice > price && <span className="text-xs text-ink/50 line-through sm:text-sm">৳{oldPrice.toLocaleString("en-BD")}</span>}
                </div>
                <button type="button" onClick={(event) => handleAddToBag(product, event)} disabled={!isActive} tabIndex={isActive ? 0 : -1} className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg bg-pink px-3 py-2.5 text-xs font-semibold text-white transition-colors duration-300 hover:bg-dark_green hover:text-white disabled:cursor-default disabled:opacity-0 sm:text-sm">
                  <FaShoppingBag size={13} /> Add to Bag
                </button>
              </div>
            </article>
          );
        })}
      </div>
      {items.length > 1 && (
        <>
          <button type="button" onClick={previous} aria-label="Previous product" className="absolute left-1 top-1/2 z-20 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-ink/10 bg-white/90 text-xl text-ink shadow-md transition hover:bg-dark_green hover:text-white sm:left-3 sm:h-11 sm:w-11 md:left-[max(8px,calc(50%-470px))]">‹</button>
          <button type="button" onClick={next} aria-label="Next product" className="absolute right-1 top-1/2 z-20 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-ink/10 bg-white/90 text-xl text-ink shadow-md transition hover:bg-dark_green hover:text-white sm:right-3 sm:h-11 sm:w-11 md:right-[max(8px,calc(50%-470px))]">›</button>
        </>
      )}
      {items.length > 1 && (
        <div className="mt-2 flex items-center justify-center gap-2" aria-label="Choose product slide">
          {items.map((product, index) => (
            <button key={getId(product)} type="button" aria-label={`Show product ${index + 1}`} aria-current={active === index ? "true" : undefined} onClick={() => setActive(index)} className={`h-2 rounded-full transition-all duration-300 ${active === index ? "w-6 bg-pink" : "w-2 bg-ink/25 hover:bg-ink/50"}`} />
          ))}
        </div>
      )}
    </section>
  );
}
