
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useProducts } from "./ProductsProvider";
import { useCart } from "./CartProvider";
import { FaShoppingBag } from "react-icons/fa";
import { flyToCart } from "@/lib/ui";
import { toast as showToast } from "react-toastify";

export default function GenderProductSlider({
  gender,
  category,
  interval = 3000,
}) {
  const { products = [] } = useProducts();
  const { add } = useCart();

  const [active, setActive] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const sliderRef = useRef(null);
  const imageRefs = useRef({});
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);
  const touchMoved = useRef(false);

  // Filter products
  const items = useMemo(() => {
    return products.filter((product) => {
      const productGender = String(product.gender || "").toLowerCase();
      const selectedGender = String(gender || "").toLowerCase();

      const productCategory = String(
        product.category || ""
      ).toLowerCase();

      const selectedCategory = String(
        category || "all"
      ).toLowerCase();

      const status = String(product.status || "").toLowerCase();

      const genderMatch =
        !selectedGender || productGender === selectedGender;

      const categoryMatch =
        !selectedCategory ||
        selectedCategory === "all" ||
        productCategory === selectedCategory;

      const available =
        status !== "out of stock" &&
        status !== "out-of-stock";

      return genderMatch && categoryMatch && available;
    });
  }, [products, gender, category]);

  // Keep active index valid when products change
  useEffect(() => {
    if (active >= items.length) {
      setActive(0);
    }
  }, [active, items.length]);

  // Auto slide
  useEffect(() => {
    if (items.length <= 1 || isPaused) return;

    const timer = setInterval(() => {
      setActive((current) => (current + 1) % items.length);
    }, interval);

    return () => clearInterval(timer);
  }, [items.length, interval, isPaused]);

  const next = () => {
    if (items.length <= 1) return;
    setActive((current) => (current + 1) % items.length);
  };

  const previous = () => {
    if (items.length <= 1) return;
    setActive((current) => (current - 1 + items.length) % items.length);
  };

  // Touch swipe
  const handleTouchStart = (event) => {
    touchStartX.current = event.touches[0].clientX;
    touchStartY.current = event.touches[0].clientY;
    touchMoved.current = false;
  };

  const handleTouchEnd = (event) => {
    const endX = event.changedTouches[0].clientX;
    const endY = event.changedTouches[0].clientY;

    const dx = endX - touchStartX.current;
    const dy = endY - touchStartY.current;

    if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy)) {
      touchMoved.current = true;

      if (dx < 0) {
        next();
      } else {
        previous();
      }
    }
  };

  // Add product to cart and use the same animation as ProductCard
  const handleAddToBag = (product, event) => {
    event.preventDefault();
    event.stopPropagation();

    if (!add) {
      showToast.error("Cart is not ready. Please try again.");
      return;
    }

    const productId = product.id || product._id;

    if (!productId) {
      showToast.error("This product cannot be added to the cart.");
      return;
    }

    const item = {
      productId: String(productId),
      slug: product.slug || "",
      name:
        product.productName ||
        product.name ||
        product.title ||
        "Product",
      image:
        product.images?.[0] ||
        product.image ||
        "",
      price: Math.max(0, Number(product.price) || 0),
      color: "",
      size: "",
      qty: 1,
      max: 20,
    };

    try {
      add(item);

      // Same flying-image animation used by ProductCard.jsx
      const imageElement = imageRefs.current[productId];

      if (imageElement) {
        flyToCart(imageElement);
      }

      showToast.success(`${item.name} added to your cart`);
    } catch (error) {
      console.error("Unable to add product to cart:", error);
      showToast.error("Could not add this product. Please try again.");
    }
  };

  if (!items.length) {
    return null;
  }

  const getPosition = (index) => {
    const total = items.length;
    let offset = index - active;

    if (offset > total / 2) offset -= total;
    if (offset < -total / 2) offset += total;

    return offset;
  };

  return (
    <section
      ref={sliderRef}
      className="relative w-full overflow-hidden py-5 sm:py-7"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Slider stage */}
      <div className="relative mx-auto h-[390px] w-full max-w-6xl sm:h-[440px] md:h-[490px]">
        {items.map((product, index) => {
          const position = getPosition(index);
          const isActive = position === 0;

          // Show the active product and its immediate neighbours
          if (Math.abs(position) > 2) return null;

          const oldPrice = Number(product.oldPrice) || 0;
          const price = Number(product.price) || 0;

          const discount =
            oldPrice > price && oldPrice > 0
              ? Math.round((1 - price / oldPrice) * 100)
              : 0;

          const productId = String(product.id || product._id);
          const image =
            product.images?.[0] ||
            product.image ||
            "/placeholder.png";

          const productName =
            product.productName ||
            product.name ||
            product.title ||
            "Product";

          const href = product.slug
            ? `/products/${product.slug}`
            : `/products/${productId}`;

          const absPosition = Math.abs(position);

          const cardStyle = {
            transform: `translateX(calc(-50% + ${position * 72}%)) scale(${
              isActive ? 1 : absPosition === 1 ? 0.82 : 0.66
            })`,
            opacity: isActive ? 1 : absPosition === 1 ? 0.65 : 0.3,
            zIndex: 10 - absPosition,
            pointerEvents: isActive ? "auto" : "none",
          };

          return (
            <article
              key={productId}
              className="absolute left-1/2 top-0 w-[230px] overflow-hidden rounded-2xl border border-ink/10 bg-white shadow-xl transition-all duration-500 ease-out sm:w-[270px] md:w-[300px]"
              style={cardStyle}
              aria-hidden={!isActive}
            >
              <Link
                href={href}
                tabIndex={isActive ? 0 : -1}
                className="block"
                draggable={false}
              >
                {/* This image wrapper is the animation source */}
                <div
                  ref={(element) => {
                    imageRefs.current[productId] = element;
                  }}
                  className="relative aspect-[4/5] overflow-hidden bg-mist"
                >
                  <img
                    src={image}
                    alt={productName}
                    draggable={false}
                    loading="lazy"
                    className="h-full w-full select-none object-cover"
                  />

                  {discount > 0 && (
                    <span className="absolute left-3 top-3 rounded-md bg-pink px-2.5 py-1 text-xs font-bold text-white shadow">
                      -{discount}%
                    </span>
                  )}

                  {product.status &&
                    String(product.status).toLowerCase() ===
                      "out of stock" && (
                      <span className="absolute inset-0 flex items-center justify-center bg-black/45 text-sm font-bold uppercase tracking-wider text-white">
                        Out of Stock
                      </span>
                    )}
                </div>
              </Link>

              <div className="p-3 sm:p-4">
                <Link
                  href={href}
                  tabIndex={isActive ? 0 : -1}
                  className="block"
                >
                  <h3 className="truncate text-sm font-semibold text-ink sm:text-base">
                    {productName}
                  </h3>
                </Link>

                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <span className="text-base font-bold text-dark_green sm:text-lg">
                    ৳{price.toLocaleString("en-BD")}
                  </span>

                  {oldPrice > price && (
                    <span className="text-xs text-ink/50 line-through sm:text-sm">
                      ৳{oldPrice.toLocaleString("en-BD")}
                    </span>
                  )}
                </div>

                <button
                  type="button"
                  onClick={(event) => handleAddToBag(product, event)}
                  disabled={!isActive}
                  className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg bg-pink px-3 py-2.5 text-xs font-semibold text-white transition-colors duration-300 hover:bg-dark_green disabled:cursor-default disabled:opacity-0 sm:text-sm"
                  tabIndex={isActive ? 0 : -1}
                >
                  <FaShoppingBag size={13} />
                  Add to Bag
                </button>
              </div>
            </article>
          );
        })}
      </div>

      {/* Previous / Next buttons */}
      {items.length > 1 && (
        <>
          <button
            type="button"
            onClick={previous}
            aria-label="Previous product"
            className="absolute left-1 top-1/2 z-20 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-ink/10 bg-white/90 text-xl text-ink shadow-md transition hover:bg-dark_green hover:text-white sm:left-3 sm:h-11 sm:w-11"
          >
            &#8249;
          </button>

          <button
            type="button"
            onClick={next}
            aria-label="Next product"
            className="absolute right-1 top-1/2 z-20 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-ink/10 bg-white/90 text-xl text-ink shadow-md transition hover:bg-dark_green hover:text-white sm:right-3 sm:h-11 sm:w-11"
          >
            &#8250;
          </button>
        </>
      )}

      {/* Slider indicators */}
      {items.length > 1 && (
        <div className="mt-2 flex items-center justify-center gap-2">
          {items.map((product, index) => (
            <button
              key={product.id || product._id || index}
              type="button"
              aria-label={`Show product ${index + 1}`}
              aria-current={active === index ? "true" : undefined}
              onClick={() => setActive(index)}
              className={`h-2 rounded-full transition-all duration-300 ${
                active === index
                  ? "w-6 bg-pink"
                  : "w-2 bg-ink/25 hover:bg-ink/50"
              }`}
            />
          ))}
        </div>
      )}
    </section>
  );
}
