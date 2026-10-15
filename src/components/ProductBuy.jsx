"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useCart } from "./CartProvider";
import { useOrders } from "./OrdersProvider";
import { flyToCart, startProgress } from "@/lib/ui";
import QuantityStepper from "./QuantityStepper";
import { toast as showToast } from "react-toastify";

function Options({ label, values, value, onChange }) {
  if (!values.length) return null;
  return (
    <fieldset className="mt-6">
      <legend className="mb-2 text-sm font-semibold">
        {label}
        {value ? `: ${value}` : ""}
      </legend>
      <div className="flex flex-wrap gap-2">
        {values.map((v) => (
          <button
            type="button"
            key={v}
            aria-pressed={value === v}
            onClick={() => onChange(v)}
            className={`min-w-12 rounded border px-4 py-2 text-sm font-medium ${value === v ? "border-peacock bg-peacock text-white" : "border-ink/25 bg-white hover:border-ink/60"}`}
          >
            {v}
          </button>
        ))}
      </div>
    </fieldset>
  );
}

export default function ProductBuy({ p }) {
  const { add } = useCart();
  const { toast } = useOrders();
  const router = useRouter();
  const [color, setColor] = useState(p.colors.length === 1 ? p.colors[0] : "");
  const [size, setSize] = useState(p.sizes.length === 1 ? p.sizes[0] : "");
  const [qty, setQty] = useState(1);
  const [err, setErr] = useState("");
  const [added, setAdded] = useState(false);
  const max = 20;

  function build() {
    if (p.colors.length && !color) {
      setErr("Choose a colour first.");
      return null;
    }
    if (p.sizes.length && !size) {
      setErr("Choose a size first.");
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
      qty,
      max,
    };
  }

  if (p.status === "Out of Stock")
    return (
      <p className="mt-8 rounded bg-sand p-4 font-medium">
        This product is out of stock right now.
      </p>
    );
  return (
    <div>
      <Options
        label="Colour"
        values={p.colors}
        value={color}
        onChange={setColor}
      />
      <Options label="Size" values={p.sizes} value={size} onChange={setSize} />
      <div className="mt-6">
        <QuantityStepper value={qty} onChange={setQty} max={max} />
      </div>
      {err && (
        <p role="alert" className="mt-3 text-sm font-medium text-madder">
          {err}
        </p>
      )}
      <div className="mt-6 flex flex-wrap gap-3">

        <button
          className="group relative inline-flex items-center overflow-hidden rounded bg-pink px-6 py-3 font-semibold text-dark_Green"
          onClick={() => {
            const i = build();
            if (i) {
              add(i);
              setAdded(true);
              flyToCart(document.querySelector("[data-fly-src]"));
              showToast.success(`${p.productName} added to your cart`);
            }
          }}
        >
          {/* Hover circle */}
          <span
            className="
                        absolute bottom-0 left-0
                        h-3 w-3
                        scale-0 rounded-full
                        bg-dark_green
                        transition-transform duration-700
                        ease-[cubic-bezier(0.4,0,0.2,1)]
                        group-hover:scale-[35] "
          />

          {/* Text */}
          <span className="relative z-10 transition-colors duration-300 text-white group-hover:text-white">
            Add to Shopping Bag
          </span>
        </button>
        <button
          className="rounded border border-pink px-6 py-3 font-semibold hover:bg-dark_green transition-all duration-[220ms]  hover:text-white"
          onClick={() => {
            const i = build();
            if (i) {
              add(i);
              startProgress();
              router.push("/checkout");
            }
          }}
        >
          Buy now
        </button>
      </div>
      {added && (
        <p role="status" className="mt-4 text-sm">
          Added to your cart.{" "}
          <Link href="/cart" className="font-semibold underline">
            View cart
          </Link>
        </p>
      )}
    </div>
  );
}
