"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "./CartProvider";
import { taka } from "@/lib/format";

export default function CartDrawer({ open, onClose }) {
  const { items, count, subtotal, setQty, remove, ready } = useCart();
  const router = useRouter();
  const closeButtonRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    const previouslyFocused = document.activeElement;
    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();
    const onKeyDown = (event) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
      previouslyFocused?.focus?.();
    };
  }, [open, onClose]);

  return (
    <div
      className={`fixed inset-0 z-[9999] transition-[visibility] duration-300 ${open ? "visible" : "invisible pointer-events-none"}`}
      aria-hidden={!open}
    >
      <div
        className={`absolute inset-0 bg-black/50 transition-opacity duration-300 ${open ? "opacity-100" : "opacity-0"}`}
        onClick={onClose}
      />
      <aside
        role="dialog"
        aria-modal={open ? "true" : undefined}
        aria-label="Shopping Bag"
        className={`absolute right-0 top-0 flex h-full w-full max-w-[440px] flex-col bg-white shadow-2xl transition-transform duration-300 ease-out ${open ? "translate-x-0" : "translate-x-full"}`}
      >
        <div className="flex items-center justify-between border-b border-ink/10 px-5 py-5">
          <div>
            <h2 className="font-display text-xl font-bold text-dark_green">Shopping Bag</h2>
            <p className="mt-1 text-xs text-ink/50">{ready ? count : 0} {count === 1 ? "item" : "items"} in your bag</p>
          </div>
          <button ref={closeButtonRef} type="button" onClick={onClose} aria-label="Close shopping bag" className="flex h-10 w-10 items-center justify-center rounded-full border border-ink/10 text-dark_green hover:bg-dark_green hover:text-white">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">
          {!ready ? (
            <p className="text-center text-sm text-ink/50">Loading your bag...</p>
          ) : items.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-center">
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" className="mb-5 text-dark_green/40"><path d="M5 8h14l1 13H4L5 8Z" /><path d="M9 9V6a3 3 0 0 1 6 0v3" /></svg>
              <h3 className="font-display text-lg font-semibold text-dark_green">Your bag is empty</h3>
              <p className="mt-2 text-sm text-ink/50">Discover something you&apos;ll love.</p>
              <button type="button" onClick={onClose} className="mt-6 rounded bg-dark_green px-6 py-3 text-sm font-semibold text-white hover:bg-pink">Continue Shopping</button>
            </div>
          ) : (
            <div className="space-y-5">
              {items.map((item) => (
                <div key={item.key} className="flex gap-4 border-b border-ink/10 pb-5">
                  <div className="h-28 w-24 shrink-0 overflow-hidden rounded bg-mist">
                    {item.image ? <img src={item.image} alt={item.name || "Product"} className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center text-xs text-ink/40">No image</div>}
                  </div>
                  <div className="flex min-w-0 flex-1 flex-col">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="line-clamp-2 text-sm font-semibold leading-5 text-dark_green">{item.name}</h3>
                      <button type="button" onClick={() => remove(item.key)} aria-label={`Remove ${item.name}`} className="shrink-0 text-ink/40 hover:text-pink">
                        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12" /></svg>
                      </button>
                    </div>
                    {(item.color || item.size) && <p className="mt-1 text-xs text-ink/50">{item.color && `Color: ${item.color}`}{item.color && item.size && " · "}{item.size && `Size: ${item.size}`}</p>}
                    <p className="mt-2 text-sm font-bold text-pink">{taka(item.price)}</p>
                    <div className="mt-auto flex items-center justify-between pt-3">
                      <div className="flex items-center overflow-hidden rounded border border-ink/15">
                        <button type="button" onClick={() => setQty(item.key, item.qty - 1)} disabled={item.qty <= 1} aria-label="Decrease quantity" className="flex h-8 w-8 items-center justify-center text-dark_green hover:bg-mist disabled:opacity-30">−</button>
                        <span className="flex h-8 min-w-8 items-center justify-center text-xs font-semibold">{item.qty}</span>
                        <button type="button" onClick={() => setQty(item.key, item.qty + 1)} disabled={item.qty >= (item.max || 99)} aria-label="Increase quantity" className="flex h-8 w-8 items-center justify-center text-dark_green hover:bg-mist disabled:opacity-30">+</button>
                      </div>
                      <span className="text-sm font-bold text-dark_green">{taka(item.price * item.qty)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {ready && items.length > 0 && (
          <div className="border-t border-ink/10 bg-white px-5 pb-6 pt-5">
            <div className="mb-2 flex items-center justify-between"><span className="text-sm font-medium text-ink/70">Subtotal</span><span className="font-display text-xl font-bold text-dark_green">{taka(subtotal)}</span></div>
            <p className="mb-4 text-xs text-ink/50">Delivery charges calculated at checkout.</p>
            <button type="button" onClick={() => { onClose(); router.push("/checkout"); }} className="w-full rounded bg-dark_green px-5 py-3.5 text-sm font-bold uppercase tracking-wide text-white hover:bg-pink">Proceed to Checkout</button>
            <button type="button" onClick={onClose} className="mt-3 w-full py-2 text-sm font-semibold text-dark_green underline underline-offset-4 hover:text-pink">Continue Shopping</button>
          </div>
        )}
      </aside>
    </div>
  );
}
