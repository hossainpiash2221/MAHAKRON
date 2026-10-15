import Link from "next/link";
import { taka } from "@/lib/format";
import Gallery from "./Gallery";
import ProductBuy from "./ProductBuy";
import Description from "./Description";
import RelatedProducts from "./RelatedProducts";
import BackButton from "./BackButton";

// Plain component (no hooks), so it works both in the server page and in the client fallback.
export default function ProductView({ p }) {
  const off =
    p.oldPrice > p.price ? Math.round((1 - p.price / p.oldPrice) * 100) : 0;
  return (
    <div className="mx-auto max-w-6xl px-4 py-[70px] min-h-[100vh]  ">
      <div className="mb-5">
        <BackButton />
      </div>
      <nav
        aria-label="Breadcrumb"
        className="mb-6 text-sm text-ink/70 uppercase"
      >
        <Link
          href="/"
          className="p-2 hover:border-b-2 hover:text-pink border-pink "
        >
          Home
        </Link>{" "}
        /{" "}
        <Link
          href="/products"
          className="p-2 hover:border-b-2 hover:text-pink border-pink"
        >
          Shop
        </Link>{" "}
        /{" "}
        <span className="p-2" aria-current="page">
          {p.productName}
        </span>
      </nav>
      <div className="grid gap-10 md:grid-cols-2">
        <Gallery images={p.images} alt={p.productName} />
        <article>
          <p className="text-sm text-ink/60">
            {p.gender} · {p.category}
          </p>
          <h1 className="mt-1 font-display text-4xl font-bold leading-tight tracking-tight">
            {p.productName}
          </h1>
          <p className="mt-4 flex items-baseline gap-3">
            <span className="text-3xl font-bold">{taka(p.price)}</span>
            {off > 0 && (
              <>
                <s className="text-lg text-ink/50">{taka(p.oldPrice)}</s>
                <span className="rounded bg-pink px-2 py-0.5 text-sm font-semibold text-white">
                  {off}% off
                </span>
              </>
            )}
          </p>
          <ProductBuy p={p} />
          {p.description && (
            <section
              className="mt-10 border-t border-ink/10 pt-6"
              aria-labelledby="desc"
            >
              <h2 id="desc" className="font-display text-xl font-bold">
                About this product
              </h2>
              <div className="mt-2 max-w-prose space-y-3 leading-relaxed text-ink/80">
                <Description text={p.description} />
              </div>
            </section>
          )}
        </article>
      </div>
      <RelatedProducts current={p} />
    </div>
  );
}
