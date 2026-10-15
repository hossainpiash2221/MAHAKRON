

"use client";

import { useEffect, useMemo, useState } from "react";
import {
  usePathname,
  useRouter,
  useSearchParams,
} from "next/navigation";
import { useProducts } from "./ProductsProvider";
import ProductGrid from "./ProductGrid";
import Loader from "./Loader";

const PRODUCTS_PER_PAGE = 24;

const chip = (on) =>
  `rounded-[4px] border px-4 py-1.5 text-sm font-medium transition-colors ${
    on
      ? "border-dark_green bg-dark_green text-white"
      : "border-ink/20 bg-white hover:border-ink/50"
  }`;

export default function ProductExplorer() {
  const { products, status } = useProducts();

  // URL is the single source of truth
  const sp = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const g = sp.get("gender");
  const gender =
    g === "Male" || g === "Female" ? g : "All";

  const cat = sp.get("category") || "All";

  // Header search query
  const urlSearch = sp.get("search") || "";

  // Existing local search and sort
  const [q, setQ] = useState(urlSearch);
  const [sort, setSort] = useState("new");

  // View More
  const [visibleCount, setVisibleCount] = useState(
    PRODUCTS_PER_PAGE
  );

  // Keep local search synced with header search
  useEffect(() => {
    setQ(urlSearch);
  }, [urlSearch]);

  function setFilter(next) {
    const params = new URLSearchParams(sp.toString());

    Object.entries(next).forEach(([k, v]) =>
      v === "All" ? params.delete(k) : params.set(k, v)
    );

    const qs = params.toString();

    router.replace(
      qs ? `${pathname}?${qs}` : pathname,
      {
        scroll: false,
      }
    );
  }

  // Dynamic genders
  const genders = useMemo(
    () => [
      "All",
      ...new Set(
        products.map((p) => p.gender).filter(Boolean)
      ),
    ],
    [products]
  );

  // Dynamic categories
  const cats = useMemo(
    () => [
      "All",
      ...new Set(
        products
          .filter(
            (p) =>
              gender === "All" ||
              p.gender === gender
          )
          .map((p) => p.category)
          .filter(Boolean)
      ),
    ],
    [products, gender]
  );

  // Filtered and sorted products
  const list = useMemo(() => {
    const s = q.trim().toLowerCase();

    let l = products.filter(
      (p) =>
        (gender === "All" ||
          p.gender === gender) &&
        (cat === "All" ||
          p.category === cat) &&
        (!s ||
          String(
            p.productName ||
              p.name ||
              p.title ||
              ""
          )
            .toLowerCase()
            .includes(s) ||
          String(p.category || "")
            .toLowerCase()
            .includes(s))
    );

    if (sort === "low") {
      l = [...l].sort(
        (a, b) => a.price - b.price
      );
    }

    if (sort === "high") {
      l = [...l].sort(
        (a, b) => b.price - a.price
      );
    }

    return [
      ...l.filter(
        (p) => p.status !== "Out of Stock"
      ),
      ...l.filter(
        (p) => p.status === "Out of Stock"
      ),
    ];
  }, [products, gender, cat, q, sort]);

  // Reset View More when filters/search/sort change
  useEffect(() => {
    setVisibleCount(PRODUCTS_PER_PAGE);
  }, [gender, cat, q, sort]);

  // Only render currently visible products
  const visibleProducts = useMemo(
    () => list.slice(0, visibleCount),
    [list, visibleCount]
  );

  const hasMore = visibleCount < list.length;

  const loadMore = () => {
    setVisibleCount((previous) =>
      Math.min(
        previous + PRODUCTS_PER_PAGE,
        list.length
      )
    );
  };

  if (status === "loading") {
    return <Loader />;
  }

  return (
    <div className="mt-7 w-full max-w-full">
      <div className="w-full max-w-full px-0 sm:px-6 md:px-4 lg:px-8">

        {/* ================= HEADING ================= */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold tracking-tight sm:text-4xl">
            EXPLORE OUR COLLECTION
          </h1>

          <p className="mt-2 text-sm text-ink/60">
            Discover products curated for you.
          </p>
        </div>

        {/* ================= MOBILE FILTER AREA ================= */}
        <div className="mb-8 space-y-4 lg:hidden">

          {/* Gender */}
          <div
            className="flex flex-wrap gap-2"
            role="group"
            aria-label="Filter by gender"
          >
            {genders.map((gd) => (
              <button
                key={gd}
                type="button"
                aria-pressed={gender === gd}
                className={chip(gender === gd)}
                onClick={() =>
                  setFilter({
                    gender: gd,
                    category: "All",
                  })
                }
              >
                {gd}
              </button>
            ))}
          </div>

          {/* Category */}
          <div
            className="flex flex-wrap gap-2"
            role="group"
            aria-label="Filter by category"
          >
            {cats.map((c) => (
              <button
                key={c}
                type="button"
                aria-pressed={cat === c}
                className={chip(cat === c)}
                onClick={() =>
                  setFilter({
                    category: c,
                  })
                }
              >
                {c}
              </button>
            ))}
          </div>

          {/* Search + Sort */}
          <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center">

            <label
              className="sr-only"
              htmlFor="mobile-q"
            >
              Search products
            </label>

            <input
              id="mobile-q"
              type="search"
              value={q}
              onChange={(e) =>
                setQ(e.target.value)
              }
              placeholder="Search products"
              className="w-full min-w-0 rounded-[4px] border border-ink/20 bg-white px-3 py-2.5 outline-none transition-colors focus:border-ink/50"
            />

            <label
              className="sr-only"
              htmlFor="mobile-sort"
            >
              Sort
            </label>

            <select
              id="mobile-sort"
              value={sort}
              onChange={(e) =>
                setSort(e.target.value)
              }
              className="w-full shrink-0 rounded-[4px] border border-ink/20 bg-white px-3 py-2.5 outline-none sm:w-auto"
            >
              <option value="new">
                Newest first
              </option>
              <option value="low">
                Price: low to high
              </option>
              <option value="high">
                Price: high to low
              </option>
            </select>
          </div>
        </div>

        {/* ================= DESKTOP LAYOUT ================= */}
        <div className="flex w-full max-w-full flex-col gap-8 lg:flex-row">

          {/* ================= SIDEBAR ================= */}
          <aside className="hidden w-[280px] shrink-0 lg:block xl:w-[300px]">
            <div className="sticky top-[100px] border border-ink/10 bg-white">

              {/* Gender */}
              <div className="border-b border-ink/10 p-5">
                <h3 className="mb-4 text-base font-semibold">
                  Gender
                </h3>

                <div className="space-y-2">
                  {genders.map((gd) => (
                    <button
                      key={gd}
                      type="button"
                      aria-pressed={gender === gd}
                      onClick={() =>
                        setFilter({
                          gender: gd,
                          category: "All",
                        })
                      }
                      className={`flex w-full items-center justify-between rounded-[4px] px-2 py-2 text-left text-sm transition-colors ${
                        gender === gd
                          ? "bg-dark_green/10 font-medium text-dark_green"
                          : "hover:bg-ink/5"
                      }`}
                    >
                      <span>{gd}</span>

                      <span
                        className={`h-4 w-4 rounded-full border ${
                          gender === gd
                            ? "border-dark_green bg-dark_green"
                            : "border-ink/20"
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              {/* Categories */}
              <div className="border-b border-ink/10 p-5">
                <h3 className="mb-4 text-base font-semibold">
                  Categories
                </h3>

                <div className="space-y-2">
                  {cats.map((c) => (
                    <button
                      key={c}
                      type="button"
                      aria-pressed={cat === c}
                      onClick={() =>
                        setFilter({
                          category: c,
                        })
                      }
                      className={`flex w-full items-center justify-between rounded-[4px] px-2 py-2 text-left text-sm transition-colors ${
                        cat === c
                          ? "bg-dark_green/10 font-medium text-dark_green"
                          : "hover:bg-ink/5"
                      }`}
                    >
                      <span>{c}</span>

                      <span
                        className={`h-4 w-4 rounded-full border ${
                          cat === c
                            ? "border-dark_green bg-dark_green"
                            : "border-ink/20"
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              {/* Search */}
              <div className="p-5">
                <label
                  htmlFor="desktop-q"
                  className="mb-3 block text-base font-semibold"
                >
                  Search
                </label>

                <input
                  id="desktop-q"
                  type="search"
                  value={q}
                  onChange={(e) =>
                    setQ(e.target.value)
                  }
                  placeholder="Search products"
                  className="w-full rounded-[4px] border border-ink/20 bg-white px-3 py-2.5 text-sm outline-none transition-colors focus:border-ink/50"
                />
              </div>
            </div>
          </aside>

          {/* ================= PRODUCTS ================= */}
          <main className="min-w-0 flex-1">

            {/* Product Header */}
            <div className="mb-6 flex flex-col gap-4 border-b border-ink/10 pb-5 sm:flex-row sm:items-center sm:justify-between">

              <div>
                <h2 className="text-xl font-semibold capitalize">
                  {q.trim() || "All Products"}
                </h2>

                <p className="mt-1 text-sm text-ink/60">
                  {list.length} items found

                  {q.trim() && (
                    <>
                      {" "}
                      for "{q.trim()}"
                    </>
                  )}
                </p>
              </div>

              {/* Desktop Sort */}
              <div className="hidden items-center gap-3 sm:flex">

                <label
                  htmlFor="desktop-sort"
                  className="whitespace-nowrap text-sm text-ink/60"
                >
                  Sort By
                </label>

                <select
                  id="desktop-sort"
                  value={sort}
                  onChange={(e) =>
                    setSort(e.target.value)
                  }
                  className="min-w-[180px] rounded-[4px] border border-ink/20 bg-white px-3 py-2.5 text-sm outline-none transition-colors focus:border-ink/50"
                >
                  <option value="new">
                    Newest first
                  </option>
                  <option value="low">
                    Price: low to high
                  </option>
                  <option value="high">
                    Price: high to low
                  </option>
                </select>
              </div>
            </div>

            {/* ================= PRODUCT GRID ================= */}
            {list.length ? (
              <>
                <ProductGrid
                  products={visibleProducts}
                />

                {/* ================= VIEW MORE ================= */}
                {hasMore && (
                  <div className="mt-10 flex flex-col items-center gap-4 pb-8">

                    <p className="text-sm text-ink/60">
                      Showing {visibleProducts.length} of{" "}
                      {list.length} products
                    </p>

                    {/* Progress Bar */}
                    <div className="h-[4px] w-48 overflow-hidden rounded-full bg-ink/10">
                      <div
                        className="h-full rounded-full bg-dark_green transition-all duration-500"
                        style={{
                          width: `${
                            (visibleProducts.length /
                              list.length) *
                            100
                          }%`,
                        }}
                      />
                    </div>

                    {/* View More Button */}
                    <button
                      type="button"
                      onClick={loadMore}
                      className="group relative overflow-hidden rounded-[5px] border border-dark_green bg-dark_green px-10 py-3 text-sm font-semibold tracking-wide text-white transition-all duration-300 hover:bg-white hover:text-dark_green hover:shadow-lg"
                    >
                      VIEW MORE

                      <span className="ml-2 inline-block transition-transform duration-300 group-hover:translate-y-1">
                        ↓
                      </span>
                    </button>
                  </div>
                )}

                {/* All Products Displayed */}
                {!hasMore &&
                  list.length > PRODUCTS_PER_PAGE && (
                    <p className="mt-10 pb-8 text-center text-sm text-ink/50">
                      You've viewed all {list.length} products.
                    </p>
                  )}
              </>
            ) : (
              <p className="rounded bg-sand/60 p-6">
                {status === "error"
                  ? "We couldn’t load products. Refresh the page to try again."
                  : "No products match. Try clearing a filter."}
              </p>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
