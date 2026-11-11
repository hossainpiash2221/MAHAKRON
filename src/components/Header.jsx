
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useCart } from "./CartProvider";
import { useProducts } from "./ProductsProvider";
import { IoIosCart } from "react-icons/io";
import {
  FiMenu,
  FiX,
  FiFacebook,
  FiInstagram,
  FiMail,
  FiSearch,
} from "react-icons/fi";
import { SiTiktok } from "react-icons/si";

export default function Header() {
  const { count, ready } = useCart();
  const { products = [] } = useProducts();

  const [menuOpen, setMenuOpen] = useState(false);
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);
  const searchInputRef = useRef(null);

  // Rotate between MAHAKRON and ZUNIRAH logos every 5 seconds.
  const logos = ["/mahakron.webp", "/zunirah.webp"];
  const [logoIndex, setLogoIndex] = useState(0);

  useEffect(() => {
    // Preload both small logo images to reduce flicker when switching.
    logos.forEach((src) => {
      const image = new Image();
      image.src = src;
    });

    const interval = setInterval(() => {
      setLogoIndex((previous) => (previous === 0 ? 1 : 0));
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const text =
    "Elegance in Every Look, Style in Every Moment — MAHAKRON | ZUNIRAH";

  const trackRef = useRef(null);
  const itemRef = useRef(null);
  const searchRef = useRef(null);
  const [copies, setCopies] = useState(2);

  // Dynamic categories
  const categories = useMemo(() => {
    return [
      ...new Set(
        products.map((product) => product.category?.trim()).filter(Boolean),
      ),
    ];
  }, [products]);

  // Search across product name, code, category, subcategory and description.
  const searchResults = useMemo(() => {
    const query = searchQuery.trim().toLocaleLowerCase();
    if (!query) return [];

    return products.filter((product) => {
      const fields = [
        product.productName, product.name, product.title,
        product.productCode, product.product_code, product.code,
        product.sku, product.SKU, product.id,
        product.category, product.subcategory, product.subCategory,
        product.description, product.productDescription,
        product.shortDescription, product.details,
      ];
      return fields.some((value) =>
        String(value ?? "").toLocaleLowerCase().includes(query)
      );
    }).slice(0, 6);
  }, [products, searchQuery]);

  // Responsive marquee
  useEffect(() => {
    const updateCopies = () => {
      if (!trackRef.current || !itemRef.current) return;

      const containerWidth = trackRef.current.parentElement.offsetWidth;

      const itemWidth = itemRef.current.offsetWidth;

      if (!itemWidth) return;

      setCopies(Math.ceil(containerWidth / itemWidth) + 2);
    };

    updateCopies();

    window.addEventListener("resize", updateCopies);

    return () => {
      window.removeEventListener("resize", updateCopies);
    };
  }, []);

  // Close menus on resize
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setMenuOpen(false);
      }

      setCategoryOpen(false);
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  // Close search on outside click
  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setSearchFocused(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, []);

  const closeMenus = () => {
    setCategoryOpen(false);
    setMenuOpen(false);
  };

  const openSearch = () => {
    setSearchFocused(true);
    setMenuOpen(false);
    setCategoryOpen(false);
    requestAnimationFrame(() => searchInputRef.current?.focus());
  };

  const closeSearch = () => {
    setSearchFocused(false);
    setSearchQuery("");
  };

  // Reusable category links
  const CategoryLinks = ({ mobile = false }) => (
    <>
      <Link
        href="/products"
        onClick={closeMenus}
        className={
          mobile
            ? "block rounded-md px-3 py-2.5 text-sm font-semibold transition-colors hover:bg-[#e9fbff] hover:text-pink"
            : "block px-5 py-3 text-sm font-semibold transition-colors hover:bg-[#e9fbff] hover:text-pink"
        }
      >
        All Products
      </Link>

      {categories.map((category) => (
        <Link
          key={category}
          href={`/products?category=${encodeURIComponent(category)}`}
          onClick={closeMenus}
          className={
            mobile
              ? "block rounded-md px-3 py-2.5 text-sm text-ink/75 transition-colors hover:bg-[#e9fbff] hover:text-pink"
              : "block px-5 py-3 text-sm font-medium transition-colors hover:bg-[#e9fbff] hover:text-pink"
          }
        >
          {category}
        </Link>
      ))}

      {categories.length === 0 && (
        <p className="px-3 py-2.5 text-sm text-ink/50">
          No categories available
        </p>
      )}
    </>
  );

  return (
    <>
      {/* ================= HEADER ================= */}
      <header className="sticky top-0 z-30 w-full border-b border-ink/10 bg-white backdrop-blur">
        {/* ================= MARQUEE ================= */}
        {/* <div className="mt-[2px] w-full overflow-hidden bg-dark_green">
          <div ref={trackRef} className="flex w-max animate-marquee">
            {[...Array(copies * 2)].map((_, index) => (
              <p
                key={index}
                ref={index === 0 ? itemRef : null}
                className="shrink-0 whitespace-nowrap px-6 py-2 text-center text-xs font-medium text-white sm:px-8 sm:text-sm"
              >
                {text}
              </p>
            ))}
          </div>
        </div> */}
        <div className="mt-[2px] w-full overflow-hidden animate-bg-color">
          <div ref={trackRef} className="flex w-max animate-marquee">
            {[...Array(copies * 2)].map((_, index) => (
              <p
                key={index}
                ref={index === 0 ? itemRef : null}
                className="shrink-0 whitespace-nowrap px-6 py-2 text-center text-xs font-medium text-white sm:px-8 sm:text-sm"
              >
                {text}
              </p>
            ))}
          </div>
        </div>

        {/* ================= MAIN HEADER ================= */}
        <div className="relative mx-auto flex h-16 w-full max-w-8xl items-center justify-between px-3 sm:px-4 md:h-[68px] lg:px-6">
          {/* ================= LEFT NAV DESKTOP ================= */}
          <div className={`hidden items-center gap-3 transition-all duration-300 lg:flex lg:gap-5 xl:gap-6 ${searchFocused ? "pointer-events-none opacity-0 -translate-x-3" : "opacity-100 translate-x-0"}`}>
            <Link
              href="/"
              className="relative text-sm font-medium after:absolute after:-bottom-1 after:left-0 after:h-px after:w-0 after:bg-pink after:transition-all after:duration-300 hover:after:w-full"
            >
              HOME
            </Link>

            <Link
              href="/products"
              className="relative text-sm font-medium after:absolute after:-bottom-1 after:left-0 after:h-px after:w-0 after:bg-pink after:transition-all after:duration-300 hover:after:w-full"
            >
              SHOP
            </Link>

            <Link
              href="/my-orders"
              className="relative text-sm font-medium after:absolute after:-bottom-1 after:left-0 after:h-px after:w-0 after:bg-pink after:transition-all after:duration-300 hover:after:w-full"
            >
              MY ORDERS
            </Link>

            {/* DESKTOP CATEGORIES */}
            <div
              className="relative"
              onMouseEnter={() => setCategoryOpen(true)}
              onMouseLeave={() => setCategoryOpen(false)}
            >
              <button
                type="button"
                aria-expanded={categoryOpen}
                onClick={() => setCategoryOpen((previous) => !previous)}
                onKeyDown={(event) => {
                  if (event.key === "Escape") {
                    setCategoryOpen(false);
                  }
                }}
                className="relative flex items-center gap-1 whitespace-nowrap text-sm font-medium transition-colors duration-300 hover:text-pink"
              >
                CATEGORIES
                <span
                  className={`text-[10px] transition-transform duration-200 ${
                    categoryOpen ? "rotate-180" : ""
                  }`}
                >
                  ▼
                </span>
              </button>

              {categoryOpen && (
                <div className="absolute left-0 top-full z-50 w-56 pt-3">
                  <div className="overflow-hidden rounded-lg border border-ink/10 bg-white py-2 shadow-xl">
                    <CategoryLinks />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ================= CENTER LOGO ================= */}
          <Link
            href="/"
            className={`absolute left-3 top-1/2 z-10 -translate-y-1/2 shrink-0 transition-all duration-300 sm:left-4 lg:left-1/2 lg:-translate-x-1/2 ${searchFocused ? "pointer-events-none opacity-0 scale-95" : "opacity-100 scale-100"}`}
            onClick={closeMenus}
          >
            <img
              className="h-[34px] w-auto object-contain sm:h-[38px] md:h-[42px]"
              src={logos[logoIndex]}
              alt={logoIndex === 0 ? "MAHAKRON" : "ZUNIRAH"}
              width={160}
              height={42}
              decoding="async"
            />
          </Link>

          {/* ================= DESKTOP RIGHT ================= */}
          <nav
            aria-label="Main navigation"
            className="relative z-20 hidden items-center gap-4 text-sm font-medium lg:flex xl:gap-6"
          >
            <button
              type="button"
              aria-label="Search products"
              onClick={openSearch}
              className={`flex h-9 w-9 items-center justify-center rounded-full text-dark_green transition-all duration-300 hover:bg-dark_green/10 ${searchFocused ? "pointer-events-none opacity-0" : ""}`}
            >
              <FiSearch size={20} />
            </button>
            <Link
              href="/products?gender=Male"
              className={`relative text-xs font-semibold tracking-wide transition-colors duration-300 hover:text-pink sm:text-sm after:absolute after:-bottom-1 after:left-0 after:h-px after:w-0 after:bg-pink after:transition-all after:duration-300 hover:after:w-full ${searchFocused ? "pointer-events-none opacity-0" : "opacity-100"}`}
            >
              MALE
            </Link>

            <Link
              href="/products?gender=Female"
              className={`relative text-xs font-semibold tracking-wide transition-colors duration-300 hover:text-pink sm:text-sm after:absolute after:-bottom-1 after:left-0 after:h-px after:w-0 after:bg-pink after:transition-all after:duration-300 hover:after:w-full ${searchFocused ? "pointer-events-none opacity-0" : "opacity-100"}`}
            >
              FEMALE
            </Link>

            {/* Desktop Cart */}
            <Link
              id="cart-target"
              href="/cart"
              data-shopping-bag-target
              className="group relative inline-flex items-center gap-2 overflow-hidden rounded-[5px] bg-pink px-3 py-2 text-white transition-all duration-300 hover:shadow-md"
            >
              <span className="absolute bottom-0 left-0 h-3 w-3 scale-0 rounded-full bg-dark_green transition-transform duration-700 ease-[cubic-bezier(0.4,0,0.2,1)] group-hover:scale-[35]" />

              <IoIosCart className="relative z-10 text-[20px]" />

              <span className="relative z-10 whitespace-nowrap">
                SHOPPING BAG
              </span>

              <span className="relative z-10 min-w-5 rounded-full bg-white px-1.5 text-center text-xs font-semibold text-ink">
                {ready ? count : 0}
              </span>
            </Link>
          </nav>

          {/* ================= MOBILE + TABLET RIGHT ================= */}
          <div className="relative z-20 ml-auto flex items-center gap-2 lg:hidden">
            <button type="button" onClick={openSearch} aria-label="Search products" className={`flex h-10 w-10 items-center justify-center rounded-full text-dark_green transition-all duration-300 ${searchFocused ? "pointer-events-none opacity-0 w-0 overflow-hidden" : ""}`}><FiSearch size={21} /></button>
            {/* Mobile Cart */}
            <Link
              id="cart-target-mobile"
              href="/cart"
              aria-label={`Shopping cart, ${ready ? count : 0} items`}
              className="group relative inline-flex items-center gap-1.5 overflow-hidden rounded-[5px] bg-pink px-2.5 py-2 text-white transition-all duration-300 hover:shadow-md"
            >
              <span className="absolute bottom-0 left-0 h-3 w-3 scale-0 rounded-full bg-dark_green transition-transform duration-700 ease-[cubic-bezier(0.4,0,0.2,1)] group-hover:scale-[35]" />

              <IoIosCart className="relative z-10 text-[19px]" />

              <span className="relative z-10 min-w-5 rounded-full bg-white px-1.5 text-center text-xs font-semibold text-ink">
                {ready ? count : 0}
              </span>
            </Link>

            {/* Hamburger */}
            <button
              type="button"
              aria-label={menuOpen ? "Close menu" : "Open menu"}
              aria-expanded={menuOpen}
              onClick={() => {
                setMenuOpen((open) => !open);
                setCategoryOpen(false);
              }}
              className={`flex h-10 w-10 items-center justify-center rounded-[5px] border border-ink/10 transition-all duration-300 hover:bg-pink hover:text-white ${searchFocused ? "pointer-events-none w-0 overflow-hidden border-0 opacity-0" : ""}`}
            >
              {menuOpen ? (
                <FiX className="text-[22px]" />
              ) : (
                <FiMenu className="text-[22px]" />
              )}
            </button>
          </div>
        </div>

        {/* ================= MOBILE + TABLET MENU ================= */}
        {menuOpen && (
          <div className="w-full border-t border-ink/10 bg-white lg:hidden">
            <nav className="mx-auto w-full max-w-7xl px-4 py-3 sm:px-6 md:px-8">
              <Link
                href="/products"
                onClick={closeMenus}
                className="flex items-center border-b border-ink/10 py-3 text-sm font-medium transition-colors duration-300 hover:text-pink"
              >
                SHOP
              </Link>

              <Link
                href="/products?gender=Male"
                onClick={closeMenus}
                className="flex items-center border-b border-ink/10 py-3 text-sm font-medium transition-colors duration-300 hover:text-pink"
              >
                MALE
              </Link>

              <Link
                href="/products?gender=Female"
                onClick={closeMenus}
                className="flex items-center border-b border-ink/10 py-3 text-sm font-medium transition-colors duration-300 hover:text-pink"
              >
                FEMALE
              </Link>

              <Link
                href="/my-orders"
                onClick={closeMenus}
                className="flex items-center border-b border-ink/10 py-3 text-sm font-medium transition-colors duration-300 hover:text-pink"
              >
                MY ORDERS
              </Link>

              {/* MOBILE CATEGORIES */}
              <div className="border-b border-ink/10">
                <button
                  type="button"
                  aria-expanded={categoryOpen}
                  onClick={() => setCategoryOpen((previous) => !previous)}
                  className="flex w-full items-center justify-between py-3 text-sm font-medium transition-colors duration-300 hover:text-pink"
                >
                  CATEGORIES
                  <span
                    className={`text-[10px] transition-transform duration-200 ${
                      categoryOpen ? "rotate-180" : ""
                    }`}
                  >
                    ▼
                  </span>
                </button>

                {categoryOpen && (
                  <div className="pb-2 pl-3">
                    <CategoryLinks mobile />
                  </div>
                )}
              </div>

              {/* SOCIAL */}
              <div className="border-b border-ink/10 py-4">
                <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-ink/60">
                  Follow Us
                </p>

                <div className="flex items-center gap-3 sm:gap-4">
                  <a
                    href="https://www.facebook.com/profile.php?id=61594889956569"
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Facebook"
                    className="flex h-9 w-9 items-center justify-center rounded-full border border-ink/10 transition-all duration-300 hover:bg-pink hover:text-white"
                  >
                    <FiFacebook className="text-[18px]" />
                  </a>

                  <a
                    href="https://www.tiktok.com/@mahakron?lang=en"
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="TikTok"
                    className="flex h-9 w-9 items-center justify-center rounded-full border border-ink/10 transition-all duration-300 hover:bg-pink hover:text-white"
                  >
                    <SiTiktok className="text-[16px]" />
                  </a>

                  <a
                    href="https://www.instagram.com/p/DeZW9VpGBog/?cplk=NDJsMWQ2cmFhajhy"
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Instagram"
                    className="flex h-9 w-9 items-center justify-center rounded-full border border-ink/10 transition-all duration-300 hover:bg-pink hover:text-white"
                  >
                    <FiInstagram className="text-[18px]" />
                  </a>
                </div>
              </div>

              {/* CONTACT */}
              <div className="py-4">
                <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-ink/60">
                  Contact
                </p>

                <a
                  href="mailto:mahakron@gmail.com"
                  className="flex items-center gap-3 text-sm transition-colors duration-300 hover:text-pink"
                >
                  <FiMail className="shrink-0 text-[17px]" />

                  <span className="break-all">mahakron@gmail.com</span>
                </a>
              </div>
            </nav>
          </div>
        )}
      {/* Expanding search stays inside the navbar, leaving the shopping bag visible. */}
      <div
        ref={searchRef}
        className={`pointer-events-none absolute inset-x-0 top-[calc(100%-64px)] z-40 mx-auto h-16 w-full max-w-8xl px-3 transition-all duration-300 sm:px-4 md:top-[calc(100%-68px)] md:h-[68px] lg:px-6 ${searchFocused ? "opacity-100" : "opacity-0"}`}
      >
        <div className="flex h-full items-center pr-[90px] sm:pr-[100px] lg:pr-[190px]">
          <div className={`min-w-0 origin-left transition-all duration-500 ease-[cubic-bezier(.22,1,.36,1)] ${searchFocused ? "pointer-events-auto w-full scale-x-100" : "w-0 scale-x-95"}`}>
            <form
              onSubmit={(event) => {
                event.preventDefault();
                const query = searchQuery.trim();
                if (!query) return;
                closeSearch();
                window.location.href = `/products?search=${encodeURIComponent(query)}`;
              }}
              className="flex h-11 items-center gap-2 rounded-xl border border-[#DCE8E3] bg-white/95 px-3 shadow-[0_3px_16px_rgba(23,61,50,0.045)] transition-[border-color,box-shadow] duration-300 focus-within:border-[#B6CDC2] focus-within:shadow-[0_5px_20px_rgba(23,61,50,0.075)]"
            >
              <FiSearch className="shrink-0 text-lg text-dark_green" />
              <input
                ref={searchInputRef}
                type="search"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                onFocus={() => setSearchFocused(true)}
                onKeyDown={(event) => {
                  if (event.key === "Escape") closeSearch();
                }}
                placeholder="Search name, code, category..."
                aria-label="Search products"
                className="w-full min-w-0 bg-transparent text-sm text-dark_green outline-none placeholder:text-ink/50"
              />
              <button type="button" aria-label="Close search" onClick={closeSearch} className="shrink-0 rounded-full p-1 text-dark_green transition-colors hover:bg-dark_green/10"><FiX size={19} /></button>
            </form>
            {searchFocused && searchQuery.trim() && (
              <div className="absolute left-3 right-[102px] top-[calc(100%-2px)] max-h-[60vh] overflow-y-auto rounded-xl border border-[#E4EDE8] bg-white shadow-[0_12px_30px_rgba(23,61,50,0.09)] sm:left-4 sm:right-[116px] lg:left-6 lg:right-[214px]">
                {searchResults.length ? (
                  <>
                    {searchResults.map((product, index) => (
                      <Link
                        key={product.id || product._id || index}
                        href={product.slug ? `/products/${product.slug}` : `/products?search=${encodeURIComponent(product.productName || product.name || searchQuery)}`}
                        onClick={closeSearch}
                        className="block border-b border-[#EDF2EF] px-4 py-3 text-sm text-dark_green transition-colors last:border-0 hover:bg-dark_green/5"
                      >
                        <span className="block font-medium">{product.productName || product.name || product.title || "Product"}</span>
                        {(product.productCode || product.code || product.sku || product.category || product.subcategory) && (
                          <span className="mt-1 block text-xs text-ink/60">
                            {[product.productCode || product.code || product.sku, product.category, product.subcategory || product.subCategory].filter(Boolean).join(" · ")}
                          </span>
                        )}
                      </Link>
                    ))}
                    <Link href={`/products?search=${encodeURIComponent(searchQuery.trim())}`} onClick={closeSearch} className="block px-4 py-3 text-center text-sm font-semibold text-dark_green hover:bg-dark_green/5">View all results →</Link>
                  </>
                ) : <p className="px-4 py-4 text-sm text-ink/60">No matching products found.</p>}
              </div>
            )}
          </div>
        </div>
      </div>
      </header>


    </>
  );
}
