
"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  ChevronRight,
  CreditCard,
  LockKeyhole,
  MapPin,
  Minus,
  PackageCheck,
  Plus,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Trash2,
  Truck,
  X,
} from "lucide-react";

import { useCart } from "@/components/CartProvider";
import { useOrders } from "@/components/OrdersProvider";
import Img from "@/components/Img";
import { startProgress } from "@/lib/ui";
import { taka, PHONE_RE, cleanPhone } from "@/lib/format";
import { DELIVERY, deliveryFor } from "@/lib/delivery";
import FeaturedProducts from "@/components/FeaturedProducts";

const GREEN = "#00350c";
const PINK = "#c80077";

const fieldStyle =
  "w-full rounded-[4px] border border-[#00350c]/15 bg-white px-4 py-3.5 text-sm text-[#00350c] outline-none transition-colors duration-200 placeholder:text-[#00350c]/35 hover:border-[#00350c]/40 focus:border-[#c80077] focus:ring-2 focus:ring-[#c80077]/10";

function validate(f) {
  const e = {};

  if (!f.zone) e.zone = "Please select a delivery area.";
  if (f.name.trim().length < 2) e.name = "Enter your full name.";

  if (!PHONE_RE.test(cleanPhone(f.phone))) {
    e.phone = "Enter a valid 11-digit mobile number.";
  }

  if (f.address.trim().length < 5) {
    e.address = "Enter your complete address.";
  }

  if (!f.city.trim()) e.city = "Enter your city or area.";

  if (f.email.trim() && !/^\S+@\S+\.\S+$/.test(f.email.trim())) {
    e.email = "Enter a valid email address.";
  }

  return e;
}

function Field({ id, label, error, hint, children, optional }) {
  return (
    <div className="min-w-0">
      <label
        htmlFor={id}
        className="mb-2 flex items-center justify-between gap-3 text-[13px] font-semibold text-[#00350c]"
      >
        {label}

        {optional && (
          <span className="text-[10px] font-medium uppercase tracking-wider text-[#00350c]/40">
            Optional
          </span>
        )}
      </label>

      {children}

      {hint && !error && (
        <p className="mt-2 text-xs leading-5 text-[#00350c]/50">{hint}</p>
      )}

      {error && (
        <p role="alert" className="mt-2 text-xs font-medium text-[#c80077]">
          {error}
        </p>
      )}
    </div>
  );
}

function SectionHeading({ number, title, subtitle, icon: Icon }) {
  return (
    <div className="mb-7 flex items-start gap-4">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[4px] bg-[#00350c] text-white">
        <Icon size={19} strokeWidth={1.6} />
      </div>

      <div className="min-w-0">
        <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.22em] text-[#c80077]">
          STEP {number}
        </p>

        <h2 className="font-display text-xl font-bold tracking-tight text-[#00350c] sm:text-2xl">
          {title}
        </h2>

        <p className="mt-1 text-xs leading-5 text-[#00350c]/50">{subtitle}</p>
      </div>
    </div>
  );
}

function ConfirmModal({ form, total, onConfirm, onCancel }) {
  const buttonRef = useRef(null);

  useEffect(() => {
    buttonRef.current?.focus();

    const handleKey = (e) => {
      if (e.key === "Escape") onCancel();
    };

    document.addEventListener("keydown", handleKey);

    return () => document.removeEventListener("keydown", handleKey);
  }, [onCancel]);

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center bg-[#00350c]/75 p-3 backdrop-blur-sm animate-[fadeIn_.25s_ease-out] sm:items-center"
      onClick={onCancel}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
        onClick={(e) => e.stopPropagation()}
        className="relative max-h-[92dvh] w-full max-w-md overflow-y-auto rounded-[4px] border border-white/20 bg-white p-6 shadow-2xl animate-[slideUp_.3s_ease-out] sm:p-8"
      >
        <button
          type="button"
          onClick={onCancel}
          aria-label="Close confirmation"
          className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-[4px] text-[#00350c]/60 transition-colors hover:bg-[#00350c]/5 hover:text-[#c80077]"
        >
          <X size={19} />
        </button>

        <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-[4px] bg-[#c80077]/10 text-[#c80077]">
          <PackageCheck size={28} strokeWidth={1.5} />
        </div>

        <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.25em] text-[#c80077]">
          ZUNIRAH / FINAL STEP
        </p>

        <h2
          id="confirm-title"
          className="font-display text-3xl font-bold tracking-tight text-[#00350c]"
        >
          Confirm your order<span className="text-[#c80077]">.</span>
        </h2>

        <p className="mt-3 text-sm leading-6 text-[#00350c]/60">
          Please review your delivery information before placing your order.
          Payment is due when your package arrives.
        </p>

        <div className="mt-6 space-y-4 border-y border-[#00350c]/10 py-5 text-sm">
          <div className="flex items-start justify-between gap-4">
            <span className="shrink-0 text-[#00350c]/50">Customer</span>
            <span className="text-right font-semibold text-[#00350c]">
              {form.name}
            </span>
          </div>

          <div className="flex items-start justify-between gap-4">
            <span className="shrink-0 text-[#00350c]/50">Phone</span>
            <span className="text-right font-semibold text-[#00350c]">
              {form.phone}
            </span>
          </div>

          <div className="flex items-start justify-between gap-4">
            <span className="shrink-0 text-[#00350c]/50">Delivery area</span>
            <span className="text-right font-semibold text-[#00350c]">
              {form.zone === "inside"
                ? DELIVERY.inside.label
                : DELIVERY.outside.label}
            </span>
          </div>

          <div className="flex items-start justify-between gap-4">
            <span className="shrink-0 text-[#00350c]/50">Address</span>
            <span className="max-w-[65%] text-right font-semibold leading-5 text-[#00350c]">
              {form.address}, {form.city}
            </span>
          </div>

          <div className="flex items-center justify-between gap-4 border-t border-[#00350c]/10 pt-4">
            <div>
              <p className="font-semibold text-[#00350c]">Cash on delivery</p>
              <p className="mt-1 text-[10px] text-[#00350c]/45">
                Total payable
              </p>
            </div>

            <span className="text-xl font-bold tabular-nums text-[#c80077]">
              {taka(total)}
            </span>
          </div>
        </div>

        <button
          type="button"
          ref={buttonRef}
          onClick={onConfirm}
          className="group mt-6 flex min-h-12 w-full items-center justify-center gap-3 rounded-[4px] bg-[#c80077] px-5 py-4 text-sm font-bold text-white transition-colors duration-200 hover:bg-[#00350c] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#c80077]"
        >
          Confirm & Place Order
          <ArrowRight
            size={18}
            className="transition-transform group-hover:translate-x-1"
          />
        </button>

        <button
          type="button"
          onClick={onCancel}
          className="mt-4 w-full py-2 text-center text-xs font-semibold text-[#00350c]/55 transition-colors hover:text-[#c80077]"
        >
          Go back and edit
        </button>
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  const cart = useCart();
  const { items, ready, subtotal, clear } = cart;
  const { place } = useOrders();
  const router = useRouter();

  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    address: "",
    city: "",
    note: "",
    zone: "",
  });

  const [errors, setErrors] = useState({});
  const [open, setOpen] = useState(false);
  const [going, setGoing] = useState(false);

  const lock = useRef(false);

  const set = (key) => (e) => {
    setForm((prev) => ({ ...prev, [key]: e.target.value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const changeQuantity = (item, quantity) => {
    if (quantity < 1) return;
    if (item.max && quantity > item.max) return;

    cart.setQty(item.key, quantity);
  };

  const removeItem = (item) => {
    cart.remove(item.key);
  };

  const delivery = deliveryFor(form.zone, subtotal);
  const total = subtotal + (delivery || 0);

  const itemCount = items.reduce((sum, item) => sum + item.qty, 0);

  function review(e) {
    e.preventDefault();

    if (!items.length) return;

    const errs = validate(form);
    setErrors(errs);

    if (Object.keys(errs).length) {
      document.getElementById(`f-${Object.keys(errs)[0]}`)?.focus();
      return;
    }

    setOpen(true);
  }

  function confirm() {
    if (lock.current || !items.length) return;

    lock.current = true;

    try {
      place(
        { ...form, phone: cleanPhone(form.phone) },
        items,
        { subtotal, delivery: delivery || 0, total }
      );

      clear();
      setOpen(false);
      setGoing(true);
      startProgress();
      router.push("/my-orders");

      setTimeout(() => {
        if (window.location.pathname === "/checkout") {
          window.location.assign("/my-orders");
        }
      }, 2500);
    } catch (error) {
      lock.current = false;
      console.error("Order placement failed:", error);
    }
  }

  if (going) {
    return (
      <main
        role="status"
        className="flex min-h-[100vh] flex-col items-center justify-center bg-[#faf9f6] px-4 text-center"
      >
        <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-[4px] bg-[#c80077]/10 text-[#c80077]">
          <CheckCircle2 size={42} strokeWidth={1.5} />
        </div>

        <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.25em] text-[#c80077]">
          ZUNIRAH / THANK YOU
        </p>

        <h1 className="font-display text-4xl font-bold text-[#00350c] sm:text-5xl">
          Order is processing. অনুগ্রহ করে আপনার Order Id এর জন্য অপেক্ষা করুন<span className="text-[#c80077]">.</span>
        </h1>

        <p className="mt-4 text-sm text-[#00350c]/55">
          Taking you to your orders...
        </p>
      </main>
    );
  }

  if (!ready) {
    return (
      <main className="min-h-screen bg-[#faf9f6] px-4 py-12" aria-busy="true">
        <div className="mx-auto max-w-6xl animate-pulse">
          <div className="mb-8 h-40 rounded-[4px] bg-[#00350c]/10" />
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="h-96 rounded-[4px] bg-[#00350c]/5" />
            <div className="h-96 rounded-[4px] bg-[#00350c]/5" />
          </div>
        </div>
      </main>
    );
  }

  if (!items.length) {
    return (
      <main className="flex min-h-[75vh] items-center justify-center bg-[#faf9f6] px-4 py-16 text-center">
        <div className="max-w-md">
          <div className="mx-auto mb-7 flex h-20 w-20 items-center justify-center rounded-[4px] bg-[#00350c]/[0.06] text-[#00350c]">
            <ShoppingBag size={38} strokeWidth={1.4} />
          </div>

          <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.25em] text-[#c80077]">
            YOUR NEXT FAVOURITE AWAITS
          </p>

          <h1 className="font-display text-4xl font-bold uppercase tracking-tight text-[#00350c] sm:text-5xl">
            Your bag is empty<span className="text-[#c80077]">.</span>
          </h1>

          <p className="mt-4 text-sm leading-7 text-[#00350c]/55">
            Beautiful things are waiting to be discovered. Find something
            that feels like you.
          </p>

          <Link
            href="/products"
            className="group mt-8 inline-flex min-h-12 items-center justify-center gap-3 rounded-[4px] bg-[#00350c] px-7 py-4 text-xs font-bold uppercase tracking-[0.15em] text-white transition-colors duration-200 hover:bg-[#c80077]"
          >
            Explore Collection
            <ArrowRight
              size={17}
              className="transition-transform group-hover:translate-x-1"
            />
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[url('/bg.jpg')] bg-cover bg-center bg-fixed pb-10 text-[#00350c] sm:pb-20">
      {/* Editorial header */}
      <header className="bg-[url('/bg-leaff.webp')] bg-cover bg-center bg-fixed relative overflow-hidden  bg-back px-4 pt-[80px] pb-10 text-white sm:py-14 lg:py-16">
        
        <div className="pointer-events-none absolute -right-20 -top-32 h-80 w-80 rounded-full border border-white/10" />
        <div className="pointer-events-none absolute -right-5 -top-20 h-60 w-60 rounded-full border border-white/10" />
        <div className="pointer-events-none absolute bottom-0 left-1/3 h-40 w-40 rounded-full bg-[#c80077]/15 blur-3xl" />

        <div className="relative mx-auto max-w-6xl ">
          <Link
            href="/products"
            className="group mb-8 inline-flex items-center gap-2 text-xs font-medium text-white/65 transition-colors hover:text-white"
          >
            <ArrowLeft
              size={15}
              className="transition-transform group-hover:-translate-x-1"
            />
            Continue shopping
          </Link>

          <div className="flex flex-col justify-between gap-7 md:flex-row md:items-end">
            <div className="hidden md:block">
              

              <h1 className="font-display text-2xl font-bold tracking-tight sm:text-5xl lg:text-4xl">
                Your style, your choice.  <br></br>
                Just a few details to complete your
                order<span className="text-pink">.</span>
              </h1>

            
            </div>

            <div className="flex flex-wrap items-center gap-2 text-[10px] font-semibold uppercase tracking-wider sm:gap-3 sm:text-xs">
              <span className="flex items-center gap-2 text-white/65">
                <span className="flex h-7 w-7 items-center justify-center rounded-[4px] bg-[#c80077] text-white">
                  <Check size={14} />
                </span>
                Bag
              </span>

              <ChevronRight size={14} className="text-white/30" />

              <span className="flex items-center gap-2 text-white">
                <span className="flex h-7 w-7 items-center justify-center rounded-[4px] border border-white/30">
                  02
                </span>
                Checkout
              </span>

              <ChevronRight size={14} className="text-white/30" />

              <span className="text-white/40">Confirmation</span>
            </div>
          </div>
        </div>
      </header>

     <div className="py-[30px]  lg:py-[50px]">
       <div className=" mx-auto max-w-6xl px-4 pt-4 sm:px-6 sm:pt-12 lg:px-8">
        <form
          onSubmit={review}
          noValidate
          className="grid items-start gap-7 lg:grid-cols-[minmax(0,1fr)_370px] lg:gap-10"
        >
          {/* Customer details */}
          <div className="min-w-0 space-y-6">
            <section className="rounded-[4px] border border-[#00350c]/10 bg-white p-5 sm:p-8">
              <SectionHeading
                number="01"
                title="Delivery Details"
                subtitle="আপনার ঠিকানা দিন"
                icon={MapPin}
              />

              <fieldset className="mb-7">
                <legend className="mb-3 text-[13px] font-semibold">
                  Select delivery area
                </legend>

                <div className="grid gap-3 sm:grid-cols-2">
                  {[
                    ["inside", DELIVERY.inside.label, DELIVERY.inside.charge],
                    ["outside", DELIVERY.outside.label, DELIVERY.outside.charge],
                  ].map(([value, label, fee], index) => {
                    const selected = form.zone === value;

                    return (
                      <label
                        key={value}
                        className={`group flex cursor-pointer items-center justify-between gap-3 rounded-[4px] border p-4 transition-colors duration-200 ${
                          selected
                            ? "border-[#c80077] bg-[#c80077]/[0.035]"
                            : "border-[#00350c]/15 hover:border-[#00350c]/40"
                        }`}
                      >
                        <input
                          id={index === 0 ? "f-zone" : undefined}
                          type="radio"
                          name="zone"
                          value={value}
                          checked={selected}
                          onChange={set("zone")}
                          className="sr-only"
                        />

                        <div>
                          <Truck
                            size={21}
                            strokeWidth={1.6}
                            className={`mb-3 ${
                              selected ? "text-[#c80077]" : "text-[#00350c]/50"
                            }`}
                          />

                          <p className="text-sm font-semibold">{label}</p>

                          <p className="mt-1 text-xs text-[#00350c]/55">
                            {taka(fee)} delivery
                          </p>
                        </div>

                        <span
                          className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-[4px] border ${
                            selected
                              ? "border-[#c80077] bg-[#c80077] text-white"
                              : "border-[#00350c]/20 text-transparent"
                          }`}
                        >
                          <Check size={13} />
                        </span>
                      </label>
                    );
                  })}
                </div>

                {errors.zone && (
                  <p role="alert" className="mt-2 text-xs font-medium text-[#c80077]">
                    {errors.zone}
                  </p>
                )}
              </fieldset>

              <div className="grid gap-5 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <Field id="f-name" label="Full Name" error={errors.name}>
                    <input
                      id="f-name"
                      name="name"
                      autoComplete="name"
                      required
                      className={fieldStyle}
                      placeholder="Enter your full name"
                      value={form.name}
                      onChange={set("name")}
                    />
                  </Field>
                </div>

                <Field
                  id="f-phone"
                  label="Mobile Number"
                  error={errors.phone}
                  hint="We'll contact you on this number."
                >
                  <input
                    id="f-phone"
                    name="phone"
                    type="tel"
                    inputMode="numeric"
                    autoComplete="tel"
                    required
                    className={fieldStyle}
                    placeholder="01712345678"
                    value={form.phone}
                    onChange={set("phone")}
                  />
                </Field>

                <Field id="f-city" label="City / Area" error={errors.city}>
                  <input
                    id="f-city"
                    name="city"
                    autoComplete="address-level2"
                    required
                    className={fieldStyle}
                    placeholder="e.g. Mirpur, Dhaka"
                    value={form.city}
                    onChange={set("city")}
                  />
                </Field>

                <div className="sm:col-span-2">
                  <Field
                    id="f-address"
                    label="Complete Address"
                    error={errors.address}
                  >
                    <input
                      id="f-address"
                      name="address"
                      autoComplete="street-address"
                      required
                      className={fieldStyle}
                      placeholder="House number, road, street, landmark"
                      value={form.address}
                      onChange={set("address")}
                    />
                  </Field>
                </div>

                <div className="sm:col-span-2 hidden md:block">
                  <Field
                    id="f-email"
                    label="Email Address"
                    error={errors.email}
                    optional
                  >
                    <input
                      id="f-email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      className={fieldStyle}
                      placeholder="you@example.com"
                      value={form.email}
                      onChange={set("email")}
                    />
                  </Field>
                </div>

                <div className="sm:col-span-2 hidden md:block ">
                  <Field id="f-note" label="Order Note" optional>
                    <textarea
                      id="f-note"
                      name="note"
                      rows={3}
                      maxLength={300}
                      className={`${fieldStyle} resize-y`}
                      placeholder="Special instructions for delivery..."
                      value={form.note}
                      onChange={set("note")}
                    />
                  </Field>
                </div>
              </div>
            </section>

            {/* Payment method */}
            <section className="rounded-[4px] border border-[#00350c]/10 bg-white p-5 sm:p-8">
              <SectionHeading
                number="02"
                title="Payment Method"
                subtitle="Simple, secure and convenient."
                icon={CreditCard}
              />

              <div className="flex items-center gap-4 border border-[#c80077] bg-[#c80077]/[0.025] p-4 sm:p-5">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[4px] bg-[#00350c] text-white">
                  <Truck size={22} strokeWidth={1.6} />
                </div>

                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold">Cash on Delivery</p>
                  <p className="mt-1 text-xs leading-5 text-[#00350c]/55">
                    Pay when your package arrives at your doorstep.
                  </p>
                </div>

                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-[4px] bg-[#c80077] text-white">
                  <Check size={14} />
                </span>
              </div>

              <div className="mt-5 flex items-center gap-2 text-xs leading-5 text-[#00350c]/50">
                <ShieldCheck size={16} className="shrink-0 text-[#00350c]" />
                Your order details are handled securely.
              </div>
            </section>
          </div>

          {/* Order summary */}
          <aside aria-label="Order summary" className="min-w-0 lg:sticky lg:top-6">
            <div className="overflow-hidden rounded-[4px] border border-[#00350c]/10 bg-white">
              <div className="relative overflow-hidden bg-[#00350c] px-5 py-6 text-white sm:px-6">
                <div className="pointer-events-none absolute -right-10 -top-16 h-40 w-40 rounded-full border border-white/10" />

                <div className="relative flex items-center justify-between gap-3">
                  <div>
                    <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.22em] text-[#f3a1cf]">
                      ZUNIRAH / YOUR SELECTION
                    </p>

                    <h2 className="font-display text-2xl font-bold">
                      Order Summary
                    </h2>
                  </div>

                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[4px] bg-white/10">
                    <ShoppingBag size={21} strokeWidth={1.6} />
                  </div>
                </div>

                <p className="relative mt-3 text-xs text-white/60">
                  {itemCount} {itemCount === 1 ? "item" : "items"} in your bag
                </p>
              </div>

              <div className="p-5 sm:p-6">
                <ul className="max-h-[390px] space-y-5 overflow-y-auto pr-1">
                  {items.map((item) => (
                    <li
                      key={item.key}
                      className="flex gap-3 border-b border-[#00350c]/10 pb-5 last:border-0 last:pb-0"
                    >
                      <Link
                        href={`/products/${item.slug}`}
                        className="h-24 w-20 shrink-0 overflow-hidden rounded-[4px] bg-[#f1f3ee]"
                      >
                        <Img
                          src={item.image}
                          alt={item.name}
                          className="h-full w-full object-cover transition-transform duration-300 hover:scale-105"
                        />
                      </Link>

                      <div className="flex min-w-0 flex-1 flex-col">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <Link
                              href={`/products/${item.slug}`}
                              className="line-clamp-2 text-[13px] font-semibold leading-5 transition-colors hover:text-[#c80077]"
                            >
                              {item.name}
                            </Link>

                            {(item.color || item.size) && (
                              <p className="mt-1 text-[10px] leading-4 text-[#00350c]/50">
                                {[item.color, item.size]
                                  .filter(Boolean)
                                  .join(" / ")}
                              </p>
                            )}

                            <p className="mt-1 text-xs font-semibold text-[#c80077]">
                              {taka(item.price)} each
                            </p>
                          </div>

                          <button
                            type="button"
                            onClick={() => removeItem(item)}
                            aria-label={`Remove ${item.name}`}
                            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[4px] text-[#00350c]/40 transition-colors hover:bg-[#c80077]/10 hover:text-[#c80077]"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>

                        <div className="mt-auto flex items-end justify-between gap-2 pt-3">
                          <div className="inline-flex h-8 items-center overflow-hidden rounded-[4px] border border-[#00350c]/15">
                            <button
                              type="button"
                              disabled={item.qty <= 1}
                              onClick={() =>
                                changeQuantity(item, item.qty - 1)
                              }
                              aria-label={`Decrease ${item.name} quantity`}
                              className="flex h-full w-8 items-center justify-center transition-colors hover:bg-[#00350c]/5 disabled:cursor-not-allowed disabled:opacity-30"
                            >
                              <Minus size={12} />
                            </button>

                            <span className="min-w-7 text-center text-xs font-bold tabular-nums">
                              {item.qty}
                            </span>

                            <button
                              type="button"
                              disabled={Boolean(item.max && item.qty >= item.max)}
                              onClick={() =>
                                changeQuantity(item, item.qty + 1)
                              }
                              aria-label={`Increase ${item.name} quantity`}
                              className="flex h-full w-8 items-center justify-center transition-colors hover:bg-[#00350c]/5 disabled:cursor-not-allowed disabled:opacity-30"
                            >
                              <Plus size={12} />
                            </button>
                          </div>

                          <span className="whitespace-nowrap text-xs font-bold tabular-nums text-[#00350c]">
                            {taka(item.price * item.qty)}
                          </span>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>

                <div className="mt-6 space-y-4 border-t border-dashed border-[#00350c]/15 pt-5 text-sm">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-[#00350c]/60">Subtotal</span>
                    <span className="font-semibold tabular-nums">
                      {taka(subtotal)}
                    </span>
                  </div>

                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-[#00350c]/60">Delivery fee</p>

                      {form.zone && (
                        <p className="mt-1 text-[10px] text-[#00350c]/40">
                          {form.zone === "inside"
                            ? DELIVERY.inside.label
                            : DELIVERY.outside.label}
                        </p>
                      )}
                    </div>

                    <span className="text-right font-semibold tabular-nums">
                      {!form.zone
                        ? "Select area"
                        : delivery
                          ? taka(delivery)
                          : "Free"}
                    </span>
                  </div>
                </div>

                <div className="mt-6 border-t border-[#00350c]/10 pt-5">
                  <div className="flex items-end justify-between gap-3">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#00350c]/50">
                        Total amount
                      </p>

                      <p className="mt-2 font-display text-3xl font-bold tracking-tight text-[#00350c]">
                        {taka(total)}
                      </p>
                    </div>

                    <span className="mb-1 rounded-[4px] bg-[#00350c]/5 px-3 py-2 text-[10px] font-bold tracking-wider text-[#00350c]">
                      BDT
                    </span>
                  </div>

                  {!form.zone && (
                    <p className="mt-3 text-[11px] leading-5 text-[#c80077]">
                      Select your delivery area to calculate the delivery fee.
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  className="group mt-6 flex min-h-12 w-full items-center justify-center gap-3 rounded-[4px] bg-[#c80077] px-5 py-4 text-xs font-bold uppercase tracking-[0.12em] text-white transition-colors duration-200 hover:bg-[#00350c] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#c80077]"
                >
                  Place Your Order

                  <ArrowRight
                    size={17}
                    className="transition-transform duration-200 group-hover:translate-x-1"
                  />
                </button>

                <Link
                  href="/cart"
                  className="mt-3 flex min-h-11 w-full items-center justify-center gap-2 rounded-[4px] border border-[#00350c]/15 px-4 py-3 text-xs font-semibold text-[#00350c] transition-colors hover:border-[#00350c] hover:bg-[#00350c]/[0.035]"
                >
                  <ArrowLeft size={14} />
                  Edit Shopping Bag
                </Link>

                <div className="mt-5 flex items-center justify-center gap-2 border-t border-[#00350c]/10 pt-5 text-[10px] uppercase tracking-wider text-[#00350c]/50">
                  <LockKeyhole size={13} className="text-[#c80077]" />
                  Secure checkout experience
                </div>
              </div>
            </div>

            <div className="mt-4 flex items-center gap-3 border border-[#00350c]/10 bg-white p-4 text-xs leading-5 text-[#00350c]/60">
              <Truck size={19} className="shrink-0 text-[#c80077]" />
              Carefully packed. Delivered with care.
            </div>
          </aside>
        </form>
      </div>
     </div>

      {open && (
        <ConfirmModal
          form={form}
          total={total}
          onConfirm={confirm}
          onCancel={() => setOpen(false)}
        />
      )}

      <style jsx global>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(16px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @media (prefers-reduced-motion: reduce) {
          *,
          *::before,
          *::after {
            animation-duration: 0.01ms !important;
            transition-duration: 0.01ms !important;
          }
        }
      `}</style>

       <FeaturedProducts />
    </main>
  );
}
