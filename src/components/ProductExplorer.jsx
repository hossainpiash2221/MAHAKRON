

"use client";

import { Suspense , useEffect, useMemo, useState } from "react";

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
  `rounded-md border px-4 py-2 text-sm font-medium transition-all duration-200 ${
    on
      ? "border-dark_green bg-dark_green text-white shadow-sm"
      : "border-ink/10 bg-white text-ink hover:border-dark_green/40 hover:bg-dark_green/5"
  }`;

function ProductExplorerContent()  {
  const { products, status } = useProducts();

  // URL is the single source of truth
  const sp = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const g = sp.get("gender");
  const gender =
    g === "Male" || g === "Female" ? g : "All";

  const cat = sp.get("category") || "All";
  const subcat = sp.get("subcategory") || "All";

  // Header search query
  const urlSearch = sp.get("search") || "";

  // Existing local search and sort
  const [q, setQ] = useState(urlSearch);
  const [sort, setSort] = useState("new");

  // FAQ-style expansion is independent of the selected product filter.
  const [expandedCategory, setExpandedCategory] = useState(null);

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

  // All subcategories per main category, so arrows are visible even before selection.
  const subcategoriesByCategory = useMemo(() => {
    const groups = new Map();
    products.forEach((p) => {
      if (gender !== "All" && p.gender !== gender) return;
      const category = String(p.category || "").trim();
      const subcategory = String(p.subcategory || "").trim();
      if (!category || !subcategory) return;
      if (!groups.has(category)) groups.set(category, new Set());
      groups.get(category).add(subcategory);
    });
    return groups;
  }, [products, gender]);

  function chooseCategory(category) {
    if (category === "All") {
      setExpandedCategory(null);
      setFilter({ category: "All", subcategory: "All" });
      return;
    }
    const hasChildren = (subcategoriesByCategory.get(category)?.size || 0) > 0;
    if (hasChildren) {
      setExpandedCategory((previous) => previous === category ? null : category);
    } else {
      setExpandedCategory(null);
    }
    // Clicking the selected category again collapses it, without clearing its filter.
    setFilter({ category, subcategory: cat === category ? subcat : "All" });
  }

  function chooseGender(value) {
    setExpandedCategory(null);
    setFilter({ gender: value, category: "All", subcategory: "All" });
  }

  const filterRow = (active) =>
    `flex w-full items-center justify-between gap-3 rounded-md px-3.5 py-3 text-left text-sm transition-all duration-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-dark_green ${
      active
        ? "bg-dark_green font-semibold text-white shadow-sm"
        : "text-ink/80 hover:bg-dark_green/5 hover:text-dark_green"
    }`;

  function categoryList() {
    return cats.map((category) => {
      const subs = [...(subcategoriesByCategory.get(category) || [])];
      const hasChildren = category !== "All" && subs.length > 0;
      const expanded = hasChildren && expandedCategory === category;
      const active = cat === category;
      return (
        <div key={category}>
          <button
            type="button"
            aria-pressed={active}
            aria-expanded={hasChildren ? expanded : undefined}
            onClick={() => chooseCategory(category)}
            className={filterRow(active)}
          >
            <span>{category}</span>
            {hasChildren && (
              <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
                className={`h-4 w-4 shrink-0 transition-transform duration-300 ease-in-out ${expanded ? "rotate-180" : "rotate-0"}`}>
                <path d="m6 9 6 6 6-6" />
              </svg>
            )}
          </button>
          {hasChildren && (
            <div className={`grid transition-[grid-template-rows,opacity] duration-300 ease-in-out ${expanded ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}>
              <div className="min-h-0 overflow-hidden">
                <div className="ml-3 mt-2 mb-2 space-y-1 border-l border-dark_green/25 pl-3"
                  role="group" aria-label={`${category} subcategories`}>
                  {["All", ...subs].map((sub) => {
                    const selected = active && subcat === sub;
                    return (
                      <button key={sub} type="button" aria-pressed={selected}
                        onClick={() => setFilter({ category, subcategory: sub })}
                        className={filterRow(selected)}>
                        <span>{sub === "All" ? `All ${category}` : sub}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      );
    });
  }

  // Filtered and sorted products
  const list = useMemo(() => {
    const s = q.trim().toLowerCase();

    let l = products.filter(
      (p) =>
        (gender === "All" ||
          p.gender === gender) &&
        (cat === "All" ||
          p.category === cat) &&
        (subcat === "All" ||
          p.subcategory === subcat) &&
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
            .includes(s) ||
          String(p.subcategory || "")
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
  }, [products, gender, cat, subcat, q, sort]);

  // Reset View More when filters/search/sort change
  useEffect(() => {
    setVisibleCount(PRODUCTS_PER_PAGE);
  }, [gender, cat, subcat, q, sort]);

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
    <div className="mt-0 w-full max-w-full pb-24 lg:mt-7 lg:pb-0">
      <div className="w-full max-w-full px-0 sm:px-6 md:px-4 lg:px-8">

        {/* ================= HEADING ================= */}
        <div className="hidden lg:block lg:mb-8">
          <h1 className="text-xl font-bold tracking-tight sm:text-4xl">
            EXPLORE OUR COLLECTION
          </h1>

          <p className="mt-2 text-sm text-ink/60">
            Discover products curated for you.
          </p>
        </div>

        {/* Mobile filters are handled by the shared MobileBottomNav category drawer.
            Show products immediately; keep desktop filters unchanged. */}

        {/* ================= DESKTOP LAYOUT ================= */}
        <div className="flex w-full max-w-full flex-col gap-8 lg:flex-row">

          {/* ================= SIDEBAR ================= */}
          <aside className="hidden w-[280px] shrink-0 lg:block xl:w-[300px]">
            <div className="sticky top-[100px] overflow-hidden rounded-lg border border-ink/10 bg-white shadow-sm">

              {/* Premium desktop filters */}
              <div className="border-b border-ink/10 p-5">
                <h3 className="mb-4 text-xs font-semibold uppercase tracking-[0.16em] text-dark_green">Gender</h3>
                <div className="space-y-1">
                  {genders.map((gd) => (
                    <button key={gd} type="button" aria-pressed={gender === gd}
                      onClick={() => chooseGender(gd)} className={filterRow(gender === gd)}>{gd}</button>
                  ))}
                </div>
              </div>
              <div className="border-b border-ink/10 p-5">
                <h3 className="mb-4 text-xs font-semibold uppercase tracking-[0.16em] text-dark_green">Categories</h3>
                <div className="space-y-1">{categoryList()}</div>
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
            <div className="mb-3 flex flex-col gap-4 border-b border-ink/10 pb-3 sm:flex-row sm:items-center sm:justify-between lg:mb-6 lg:pb-5">

              <div>
                <h2 className="text-base font-semibold capitalize lg:text-xl">
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
export default function ProductExplorer() {
  return (
    <Suspense fallback={<Loader />}>
      <ProductExplorerContent />
    </Suspense>
  );
}