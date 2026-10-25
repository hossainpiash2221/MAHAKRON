import Link from "next/link";
import { taka } from "@/lib/format";
import Gallery from "./Gallery";
import ProductBuy from "./ProductBuy";
import Description from "./Description";
import RelatedProducts from "./RelatedProducts";
import BackButton from "./BackButton";

export default function ProductView({ p }) {
  const off =
    p.oldPrice > p.price
      ? Math.round((1 - p.price / p.oldPrice) * 100)
      : 0;

  const savings =
    p.oldPrice > p.price ? p.oldPrice - p.price : 0;

  return (
    <main className="min-h-screen">

      <div className="mx-auto max-w-6xl px-4 pb-16 pt-[70px] sm:px-6 lg:px-8">

        {/* BACK BUTTON */}
        <div className="mb-5">
          <BackButton />
        </div>

        {/* BREADCRUMB */}
        <nav
          aria-label="Breadcrumb"
          className="mb-7 flex flex-wrap items-center gap-2 text-xs uppercase tracking-wide text-ink/60 sm:text-sm"
        >
          <Link
            href="/"
            className="transition-colors duration-200 hover:text-pink"
          >
            Home
          </Link>

          <span className="text-ink/30">/</span>

          <Link
            href="/products"
            className="transition-colors duration-200 hover:text-pink"
          >
            Shop
          </Link>

          <span className="text-ink/30">/</span>

          <span
            aria-current="page"
            className="max-w-[220px] truncate font-medium text-ink sm:max-w-md"
          >
            {p.productName}
          </span>
        </nav>

        {/* MAIN PRODUCT SECTION */}
        <div className="grid items-start gap-8 md:grid-cols-2 lg:gap-12">

          {/* LEFT - PRODUCT GALLERY */}
          <div className="min-w-0">

            <Gallery
              images={p.images}
              alt={p.productName}
            />

          </div>

          {/* RIGHT - STICKY PRODUCT INFORMATION */}
          <article className="min-w-0 self-start md:sticky md:top-24">

            {/* PRODUCT CATEGORY */}
            <div className="mb-4 flex flex-wrap items-center gap-2">

              <span className="inline-flex items-center rounded-[4px] border border-ink/10 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-ink/70">
                {p.category}
              </span>

              <span className="text-xs text-ink/40">
                /
              </span>

              <span className="text-xs font-medium uppercase tracking-wider text-ink/60">
                {p.gender}
              </span>

            </div>

            {/* PRODUCT NAME */}
            <h1 className="font-display text-3xl font-bold leading-tight tracking-tight text-ink sm:text-4xl">
              {p.productName}
            </h1>

            {/* SHORT DECORATIVE LINE */}
            <div className="mt-5 h-[2px] w-12 bg-pink" />

            {/* PRICE SECTION */}
            <div className="mt-6">

              <div className="flex flex-wrap items-center gap-3">

                <span className="font-display text-3xl font-bold tracking-tight text-ink sm:text-4xl">
                  {taka(p.price)}
                </span>

                {off > 0 && (
                  <s className="text-lg text-ink/40">
                    {taka(p.oldPrice)}
                  </s>
                )}

              </div>

              {/* DISCOUNT INFORMATION */}
              {off > 0 && (
                <div className="mt-3 flex flex-wrap items-center gap-3">

                  <span className="inline-flex items-center rounded-[4px] bg-pink px-3 py-1 text-md font-bold text-white">
                    {off}% Discount
                  </span>

                  <span className="text-md font-medium text-ink/60">
                    You save {taka(savings)}
                  </span>

                </div>
              )}

            </div>

            {/* DIVIDER */}
            <div className="my-7 h-px bg-ink/10" />

            {/* EXISTING PRODUCT BUY COMPONENT */}
            <div>
              <ProductBuy p={p} />
            </div>

            {/* PREMIUM TRUST INFORMATION */}
            <div className="mt-8 border-t border-ink/10 pt-6">

              <div className="grid grid-cols-2 gap-3">

                {/* DELIVERY */}
                <div className="flex items-start gap-3 rounded-[4px] border border-ink/10 p-3">

                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="21"
                    height="21"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="mt-0.5 shrink-0 text-pink"
                    aria-hidden="true"
                  >
                    <path d="M10 17h4V5H2v12h3" />
                    <path d="M14 9h4l4 4v4h-3" />
                    <circle cx="7.5" cy="17.5" r="2.5" />
                    <circle cx="16.5" cy="17.5" r="2.5" />
                  </svg>

                  <div>
                    <p className="text-xs font-semibold text-ink">
                      Fast Delivery
                    </p>

                    <p className="mt-1 text-[11px] leading-relaxed text-ink/50">
                      Across Bangladesh
                    </p>
                  </div>

                </div>

                {/* CASH ON DELIVERY */}
                <div className="flex items-start gap-3 rounded-[4px] border border-ink/10 p-3">

                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="21"
                    height="21"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="mt-0.5 shrink-0 text-pink"
                    aria-hidden="true"
                  >
                    <rect
                      x="2"
                      y="5"
                      width="20"
                      height="14"
                      rx="2"
                    />
                    <circle cx="12" cy="12" r="3" />
                    <path d="M6 12h.01M18 12h.01" />
                  </svg>

                  <div>
                    <p className="text-xs font-semibold text-ink">
                      Easy Payment
                    </p>

                    <p className="mt-1 text-[11px] leading-relaxed text-ink/50">
                      Cash on Delivery
                    </p>
                  </div>

                </div>

              </div>

              {/* STORE MESSAGE */}
              <div className="mt-4 flex items-center justify-center gap-2 text-center">

                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="15"
                  height="15"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="shrink-0 text-pink"
                  aria-hidden="true"
                >
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" />
                  <path d="m9 12 2 2 4-4" />
                </svg>

                <span className="text-[11px] font-medium tracking-wide text-ink/50">
                  Shop with confidence at MAHAKRON
                </span>

              </div>

            </div>

          </article>

        </div>

        {/* PRODUCT DESCRIPTION - FULL WIDTH */}
        {p.description && (
          <section
            className="mt-14 border-t border-ink/10 pt-8 md:mt-20 md:pt-10"
            aria-labelledby="desc"
          >

            {/* DESCRIPTION HEADER */}
            <div className="mb-6 flex items-center gap-4">

              <div className="h-7 w-[3px] rounded-[4px] bg-pink" />

              <h2
                id="desc"
                className="font-display text-xl font-bold tracking-tight text-ink sm:text-2xl"
              >
                Product Description
              </h2>

            </div>

            {/* DESCRIPTION BODY */}
            <div className="rounded-[4px] border border-ink/10 p-5 sm:p-7">

              <div className="max-w-none space-y-3 break-words text-sm leading-8 text-ink/80 sm:text-base">

                <Description text={p.description} />

              </div>

            </div>

          </section>
        )}

        {/* RELATED PRODUCTS */}
        <div className="mt-14 border-t border-ink/10 pt-8 md:mt-20">
          <RelatedProducts current={p} />
        </div>

      </div>

    </main>
  );
}