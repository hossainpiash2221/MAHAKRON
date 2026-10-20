
// "use client";

// import Link from "next/link";
// import { useOrders } from "@/components/OrdersProvider";
// import Img from "@/components/Img";
// import { taka } from "@/lib/format";
// import {
//   ArrowLeft,
//   ArrowRight,
//   CalendarDays,
//   Check,
//   CheckCircle2,
//   Clock3,
//   CreditCard,
//   MapPin,
//   Package,
//   PackageCheck,
//   RefreshCw,
//   ShieldCheck,
//   ShoppingBag,
//   Sparkles,
//   Trash2,
//   Truck,
//   XCircle,
// } from "lucide-react";

// const when = (t) =>
//   new Date(t).toLocaleString("en-BD", {
//     dateStyle: "medium",
//     timeStyle: "short",
//   });

// // Order status
// function Status({ o }) {
//   if (o.status === "placed") {
//     return (
//       <div className="flex flex-wrap items-center gap-2">
//         <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-[11px] font-bold text-emerald-700 ring-1 ring-emerald-100">
//           <CheckCircle2 size={14} />
//           Order - টি গ্রহন করা হয়েছে
//         </span>

//         {o.orderId && (
//           <span className="rounded-full bg-dark_green/5 px-3 py-1.5 font-mono text-[11px] font-semibold text-dark_green/70">
//             #{o.orderId}
//           </span>
//         )}
//       </div>
//     );
//   }

//   if (o.status === "failed") {
//     return (
//       <div className="space-y-2">
//         <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-3 py-1.5 text-[11px] font-bold text-red-700 ring-1 ring-red-100">
//           <XCircle size={14} />
//           Action required
//         </span>

//         <p role="alert" className="text-xs leading-5 text-red-600">
//           We couldn't place this order. {o.error}
//         </p>
//       </div>
//     );
//   }

//   return (
//     <div className="flex flex-wrap items-center gap-2">
//       <span className="inline-flex items-center gap-2 rounded-full bg-amber-50 px-3 py-1.5 text-[11px] font-bold text-amber-700 ring-1 ring-amber-100">
//         <span
//           className="h-3 w-3 animate-spin rounded-full border-2 border-amber-600 border-t-transparent"
//           aria-hidden="true"
//         />
//         Processing
//       </span>
//       <span className="text-[11px] text-dark_green/45">
//         Your order ID will appear shortly.
//       </span>
//     </div>
//   );
// }

// // Small statistic card
// function StatCard({ icon: Icon, label, value, accent = false }) {
//   return (
//     <div className="group flex items-center gap-4 rounded-2xl border border-dark_green/5 bg-white p-5 shadow-[0_10px_35px_-20px_rgba(16,53,64,.18)] transition-all duration-[220ms] hover:-translate-y-1 hover:shadow-[0_20px_45px_-20px_rgba(16,53,64,.2)]">
//       <div
//         className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl transition-transform duration-300 group-hover:scale-110 ${
//           accent
//             ? "bg-pink/10 text-pink"
//             : "bg-dark_green/5 text-dark_green"
//         }`}
//       >
//         <Icon size={21} strokeWidth={1.7} />
//       </div>

//       <div>
//         <p className="text-[11px] font-medium text-dark_green/50">
//           {label}
//         </p>
//         <p className="mt-0.5 font-display text-2xl font-bold tracking-tight text-dark_green">
//           {value}
//         </p>
//       </div>
//     </div>
//   );
// }

// // Product inside order
// function OrderProduct({ item }) {
//   return (
//     <li className="group flex items-center gap-4 py-4 first:pt-0 last:pb-0">
//       <div className="h-24 w-20 shrink-0 overflow-hidden rounded-xl bg-[#F2F5F3] sm:h-28 sm:w-24">
//         <Img
//           src={item.image}
//           alt={item.name}
//           className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
//         />
//       </div>

//       <div className="min-w-0 flex-1">
//         <h3 className="line-clamp-2 text-sm font-semibold leading-6 text-dark_green">
//           {item.name}
//         </h3>

//         {(item.color || item.size) && (
//           <p className="mt-1 text-xs text-dark_green/45">
//             {[item.color, item.size].filter(Boolean).join(" / ")}
//           </p>
//         )}

//         <div className="mt-2 inline-flex items-center rounded-lg bg-[#F3F7F5] px-2.5 py-1 text-[11px] font-semibold text-dark_green/70">
//           Qty: {item.qty}
//         </div>
//       </div>

//       <div className="shrink-0 text-right">
//         <p className="text-sm font-bold text-dark_green">
//           {taka(item.price * item.qty)}
//         </p>
//         <p className="mt-1 text-[11px] text-dark_green/40">
//           {taka(item.price)} / pc
//         </p>
//       </div>
//     </li>
//   );
// }

// // Individual order card
// function OrderCard({ order, index, retry, removeOrder }) {
//   const o = order;
//   const finalDelivery = o.serverDelivery ?? o.delivery;
//   const finalTotal = o.serverTotal ?? o.total;

//   return (
//     <li
//       className="group overflow-hidden rounded-[24px] border border-dark_green/5 bg-white shadow-[0_12px_45px_-25px_rgba(16,53,64,.15)] transition-all duration-300 hover:border-dark_green/10 hover:shadow-[0_22px_65px_-30px_rgba(16,53,64,.22)] animate-[orderReveal_.45s_ease-out_both]"
//       style={{ animationDelay: `${Math.min(index, 8) * 70}ms` }}
//     >
//       {/* Card header */}
//       <div className="flex flex-col gap-4 border-b border-dark_green/5 bg-[#FBFCFB] px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-7">
//         <div className="flex items-center gap-3">
//           <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-dark_green text-white">
//             <ShoppingBag size={19} strokeWidth={1.7} />
//           </div>

//           <div>
//             <p className="text-[10px] font-bold uppercase tracking-[0.17em] text-pink">
//               Order details
//             </p>
//             <p className="mt-1 flex items-center gap-1.5 text-xs text-dark_green/55">
//               <CalendarDays size={13} />
//               {when(o.createdAt)}
//             </p>
//           </div>
//         </div>

//         <Status o={o} />
//       </div>

//       <div className="px-5 py-6 sm:px-7">
//         {/* Products */}
//         <div className="mb-5 flex items-center justify-between">
//           <h2 className="font-display text-lg font-semibold text-dark_green">
//             Your Items
//           </h2>

//           <span className="rounded-full bg-dark_green/5 px-3 py-1 text-[11px] font-semibold text-dark_green/60">
//             {o.items.reduce((sum, i) => sum + i.qty, 0)} items
//           </span>
//         </div>

//         <ul className="divide-y divide-dark_green/5">
//           {o.items.map((item, itemIndex) => (
//             <OrderProduct
//               key={`${item.productId}-${item.color || ""}-${item.size || ""}-${itemIndex}`}
//               item={item}
//             />
//           ))}
//         </ul>

//         {/* Delivery and payment information */}
//         <div className="mt-7 grid gap-4 border-t border-dashed border-dark_green/15 pt-6 sm:grid-cols-2">
//           <div className="flex items-start gap-3">
//             <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-dark_green/5 text-dark_green">
//               <MapPin size={17} strokeWidth={1.7} />
//             </div>

//             <div className="min-w-0">
//               <p className="text-[11px] font-semibold uppercase tracking-wider text-dark_green/45">
//                 Delivering to
//               </p>
//               <p className="mt-1 text-sm font-semibold text-dark_green">
//                 {o.customer.name}
//               </p>
//               <p className="mt-1 break-words text-xs leading-5 text-dark_green/55">
//                 {o.customer.address}, {o.customer.city}
//               </p>
//               <p className="mt-1 text-xs text-dark_green/55">
//                 {o.customer.phone}
//               </p>
//             </div>
//           </div>

//           <div className="flex items-start gap-3">
//             <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-pink/10 text-pink">
//               <CreditCard size={17} strokeWidth={1.7} />
//             </div>

//             <div>
//               <p className="text-[11px] font-semibold uppercase tracking-wider text-dark_green/45">
//                 Payment method
//               </p>
//               <p className="mt-1 text-sm font-semibold text-dark_green">
//                 Cash on Delivery
//               </p>
//               <p className="mt-1 text-xs leading-5 text-dark_green/55">
//                 Pay when your order arrives.
//               </p>
//             </div>
//           </div>
//         </div>

//         {/* Pricing */}
//         <div className="mt-7 rounded-2xl bg-[#F4F8F5] p-5">
//           <div className="flex items-center justify-between text-sm">
//             <span className="flex items-center gap-2 text-dark_green/55">
//               <Truck size={16} />
//               Delivery charge
//             </span>
//             <span className="font-semibold text-dark_green">
//               {finalDelivery ? taka(finalDelivery) : "Free"}
//             </span>
//           </div>

//           <div className="my-4 border-t border-dashed border-dark_green/15" />

//           <div className="flex flex-wrap items-end justify-between gap-3">
//             <div>
//               <p className="text-xs font-medium text-dark_green/55">
//                 {o.status === "placed"
//                   ? "Total to pay"
//                   : "Estimated total"}
//               </p>
//               <p className="mt-1 font-display text-2xl font-bold tracking-tight text-dark_green sm:text-3xl">
//                 {taka(finalTotal)}
//               </p>
//             </div>

//             {o.status === "placed" && (
//               <div className="flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-[10px] font-semibold text-emerald-700">
//                 <ShieldCheck size={13} />
//                 Cash on Delivery
//               </div>
//             )}
//           </div>

//           {o.status === "placed" &&
//             o.serverTotal != null &&
//             o.serverTotal !== o.total && (
//               <p className="mt-3 text-[11px] leading-5 text-dark_green/50">
//                 Final total reflects the latest confirmed store prices.
//               </p>
//             )}
//         </div>

//         {/* Failed order actions */}
//         {o.status === "failed" && (
//           <div className="mt-5 flex flex-wrap gap-3">
//             <button
//               type="button"
//               onClick={() => retry(o.rid)}
//               className="group/btn inline-flex items-center justify-center gap-2 rounded-xl bg-pink px-5 py-3 text-xs font-bold text-white transition-all duration-[220ms] hover:-translate-y-0.5 hover:bg-dark_green hover:shadow-lg"
//             >
//               <RefreshCw
//                 size={15}
//                 className="transition-transform duration-500 group-hover/btn:rotate-180"
//               />
//               Try Again
//             </button>

//             <button
//               type="button"
//               onClick={() => removeOrder(o.rid)}
//               className="inline-flex items-center justify-center gap-2 rounded-xl border border-dark_green/15 px-5 py-3 text-xs font-semibold text-dark_green/70 transition-all duration-[220ms] hover:border-red-200 hover:bg-red-50 hover:text-red-600"
//             >
//               <Trash2 size={15} />
//               Remove Order
//             </button>
//           </div>
//         )}
//       </div>
//     </li>
//   );
// }

// export default function MyOrders() {
//   const { orders, ready, retry, removeOrder } = useOrders();

//   if (!ready) {
//     return (
//       <div
//         className="mx-auto max-w-6xl px-4 py-16"
//         aria-busy="true"
//       >
//         <div className="h-48 animate-pulse rounded-3xl bg-dark_green/5" />
//         <div className="mt-8 h-72 animate-pulse rounded-3xl bg-dark_green/5" />
//       </div>
//     );
//   }

//   const totalOrders = orders.length;
//   const confirmedOrders = orders.filter(
//     (o) => o.status === "placed"
//   ).length;
//   const processingOrders = orders.filter(
//     (o) => o.status !== "placed" && o.status !== "failed"
//   ).length;

//   return (
//     <main className="min-h-screen bg-[#F8FAF8] pb-24 text-dark_green">
//       {/* Premium Hero */}
//       <div className="relative overflow-hidden bg-dark_green px-4 py-14 text-white sm:py-20">
//         {/* Decorative elements */}
//         <div className="pointer-events-none absolute -right-20 -top-40 h-96 w-96 rounded-full border border-white/10" />
//         <div className="pointer-events-none absolute -right-8 -top-24 h-72 w-72 rounded-full border border-white/10" />
//         <div className="pointer-events-none absolute bottom-0 left-1/3 h-40 w-40 rounded-full bg-pink/10 blur-3xl" />

//         <div className="relative mx-auto max-w-6xl">
//           <Link
//             href="/products"
//             className="group mb-9 inline-flex items-center gap-2 text-xs font-medium text-white/60 transition hover:text-white"
//           >
//             <ArrowLeft
//               size={15}
//               className="transition-transform duration-[220ms] group-hover:-translate-x-1"
//             />
//             Back to shopping
//           </Link>

//           <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
//             <div>
//               <div className="mb-4 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.25em] text-[#F5A5D2]">
//                 <Sparkles size={14} />
//                 Your shopping journey
//               </div>

//               <h1 className="font-display text-5xl font-semibold tracking-tight sm:text-6xl uppercase">
//                 My Orders<span className="text-[#F5A5D2]">.</span>
//               </h1>

//               <p className="mt-4 max-w-lg text-sm leading-7 text-white/60">
//                 Every great find deserves a beautiful journey.
//                 Keep track of your orders, all in one place.
//               </p>
//             </div>

//             <div className="flex items-center gap-2 text-xs text-white/65">
//               <ShoppingBag size={16} />
//               Your order history
//             </div>
//           </div>
//         </div>
//       </div>

//       <div className="mx-auto max-w-6xl px-4 pt-10 sm:pt-14">
//         {/* Stats */}
//         <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
//           <StatCard
//             icon={ShoppingBag}
//             label="Total Orders"
//             value={totalOrders}
//           />
//           <StatCard
//             icon={CheckCircle2}
//             label="Confirmed"
//             value={confirmedOrders}
//             accent
//           />
//           <StatCard
//             icon={Clock3}
//             label="Processing"
//             value={processingOrders}
//           />
//         </div>

//         {/* Section heading */}
//         <div className="mt-12 flex flex-wrap items-end justify-between gap-4">
//           <div>
//             <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.22em] text-pink">
//               Your collection
//             </p>
//             <h2 className="font-display text-2xl font-semibold tracking-tight text-dark_green sm:text-3xl">
//               Order History
//             </h2>
//             <p className="mt-2 text-xs leading-6 text-dark_green/50">
//               Orders from the last 30 days, saved on this browser.
//             </p>
//           </div>

//           {orders.length > 0 && (
//             <Link
//               href="/products"
//               className="group inline-flex items-center gap-2 rounded-full border border-dark_green/15 bg-white px-5 py-2.5 text-xs font-semibold text-dark_green transition-all duration-[220ms] hover:border-pink hover:bg-pink hover:text-white"
//             >
//               Shop More
//               <ArrowRight
//                 size={15}
//                 className="transition-transform group-hover:translate-x-1"
//               />
//             </Link>
//           )}
//         </div>

//         {/* Empty state */}
//         {!orders.length ? (
//           <div className="mt-8 flex flex-col items-center justify-center rounded-[28px] border border-dark_green/5 bg-white px-6 py-20 text-center shadow-[0_12px_50px_-25px_rgba(16,53,64,.12)]">
//             <div className="relative mb-8">
//               <div className="flex h-28 w-28 items-center justify-center rounded-full bg-dark_green/5 text-dark_green">
//                 <ShoppingBag size={48} strokeWidth={1.2} />
//               </div>

//               <div className="absolute -right-2 -top-2 flex h-10 w-10 items-center justify-center rounded-full bg-pink text-white shadow-lg shadow-pink/20">
//                 <Sparkles size={18} />
//               </div>
//             </div>

//             <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.2em] text-pink">
//               Your journey begins here
//             </p>

//             <h3 className="font-display text-3xl font-semibold text-dark_green">
//               No orders yet
//             </h3>

//             <p className="mt-4 max-w-sm text-sm leading-7 text-dark_green/50">
//               Your next favorite piece is waiting to be discovered.
//               Explore our collection and find something special.
//             </p>

//             <Link
//               href="/products"
//               className="group mt-8 inline-flex items-center gap-3 rounded-full bg-dark_green px-8 py-4 text-sm font-semibold text-white shadow-lg shadow-dark_green/10 transition-all duration-[220ms] hover:-translate-y-0.5 hover:bg-pink hover:shadow-pink/15"
//             >
//               Explore Collection
//               <ArrowRight
//                 size={17}
//                 className="transition-transform group-hover:translate-x-1"
//               />
//             </Link>
//           </div>
//         ) : (
//           <ul className="mt-8 space-y-6">
//             {orders.map((o, index) => (
//               <OrderCard
//                 key={o.rid}
//                 order={o}
//                 index={index}
//                 retry={retry}
//                 removeOrder={removeOrder}
//               />
//             ))}
//           </ul>
//         )}

//         {/* Bottom trust banner */}
//         <div className="mt-12 flex flex-col items-center justify-center gap-3 rounded-2xl border border-dark_green/5 bg-white px-6 py-6 text-center sm:flex-row">
//           <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-pink/10 text-pink">
//             <ShieldCheck size={20} />
//           </div>

//           <div className="sm:text-left">
//             <p className="text-sm font-semibold text-dark_green">
//               Shopping with confidence
//             </p>
//             <p className="mt-1 text-xs text-dark_green/50">
//               Your order information is saved on this device.
//             </p>
//           </div>
//         </div>
//       </div>

//       <style jsx global>{`
//         @keyframes orderReveal {
//           from {
//             opacity: 0;
//             transform: translateY(18px);
//           }
//           to {
//             opacity: 1;
//             transform: translateY(0);
//           }
//         }

//         @media (prefers-reduced-motion: reduce) {
//           *, *::before, *::after {
//             animation-duration: 0.01ms !important;
//             transition-duration: 0.01ms !important;
//           }
//         }
//       `}</style>
//     </main>
//   );
// }



"use client";

import Link from "next/link";
import { useOrders } from "@/components/OrdersProvider";
import Img from "@/components/Img";
import { taka } from "@/lib/format";
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  Clock3,
  CreditCard,
  MapPin,
  MessageCircle,
  Phone,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Truck,
  XCircle,
} from "lucide-react";

// Contact details
const WHATSAPP_NUMBER = "8801628927933";
const CONTACT_PHONE = "+8801628927933";

const when = (t) =>
  new Date(t).toLocaleString("en-BD", {
    dateStyle: "medium",
    timeStyle: "short",
  });

// Order status
function Status({ o }) {
  if (o.status === "placed") {
    return (
      <div className="flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-[11px] font-bold text-emerald-700 ring-1 ring-emerald-100">
          <CheckCircle2 size={14} />
          Order গ্রহণ করা হয়েছে
        </span>

        {o.orderId && (

          <span className="rounded-full bg-dark_green/5 px-3 py-1.5 font-mono text-[14px] font-semibold text-dark_green/70">
            Order ID: #{o.orderId}
          </span>
        )}
      </div>
    );
  }

  if (o.status === "failed") {
    return (
      <div className="w-full max-w-md rounded-xl border border-red-200/80 bg-red-50/80 p-3.5">
        <p className="flex items-center gap-2 text-xs font-bold text-red-700">
          <XCircle size={15} />
          Order is not be confirmed.
        </p>

        <p
          role="alert"
          className="mt-1.5 break-words text-sm leading-6 text-red-700"
        >
          WhatsApp অথবা Call করে সরাসরি আমাদের সঙ্গে যোগাযোগ করে অর্ডারটি কনফার্ম করুন।
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="inline-flex items-center gap-2 rounded-full bg-amber-50 px-3 py-1.5 text-[11px] font-bold text-amber-700 ring-1 ring-amber-100">
        <span
          className="h-3 w-3 animate-spin rounded-full border-2 border-amber-600 border-t-transparent"
          aria-hidden="true"
        />
        Processing
      </span>

      <span className="text-[11px] text-dark_green/45">
        Your order ID will appear shortly.
      </span>
    </div>
  );
}

// Compact statistic card
function StatCard({ icon: Icon, label, value, accent = false }) {
  return (
    <div className="group flex items-center gap-3 rounded-2xl border border-dark_green/[0.06] bg-white p-4 shadow-[0_8px_30px_-20px_rgba(16,53,64,.2)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_14px_35px_-20px_rgba(16,53,64,.25)] sm:p-5">
      <div
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${accent
            ? "bg-pink/10 text-pink"
            : "bg-dark_green/5 text-dark_green"
          }`}
      >
        <Icon size={19} strokeWidth={1.8} />
      </div>

      <div className="min-w-0">
        <p className="text-[11px] font-medium text-dark_green/50">
          {label}
        </p>
        <p className="mt-0.5 font-display text-2xl font-bold tracking-tight text-dark_green">
          {value}
        </p>
      </div>
    </div>
  );
}

// Compact contact block for failed orders
function FailedOrderContact({ order }) {
  const orderId = order.orderId || order.rid || "";
  const message = `Hello ZUNIRAH, I need help with my order ${orderId}.`;

  return (
    <div className="relative overflow-hidden border-b border-red-100 bg-gradient-to-br from-[#FFF7FA] via-white to-[#F1FAF5] px-4 py-4 sm:px-6">
      <div className="pointer-events-none absolute -right-8 -top-12 h-32 w-32 rounded-full bg-pink/[0.06] blur-2xl" />

      <div className="relative flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-pink/10 text-pink">
            <MessageCircle size={20} />
          </div>

          <div className="min-w-0">
            <h3 className="text-sm font-bold text-dark_green">
              Need help with your order?
            </h3>

            <p className="mt-1 text-xs leading-5 text-dark_green/60">
              আমাদের সঙ্গে যোগাযোগ করুন। আমরা আপনাকে সাহায্য করব।
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-2 min-[420px]:flex-row sm:shrink-0">
          <a
            href={`tel:${CONTACT_PHONE}`}
            aria-label="Call ZUNIRAH"
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-dark_green/10 bg-white px-3.5 py-2.5 text-xs font-bold text-dark_green transition-all duration-200 hover:border-dark_green/25 hover:bg-dark_green/[0.03]"
          >
            <Phone size={15} />
            Call Us
          </a>

          <a
            href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
              message
            )}`}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Contact ZUNIRAH on WhatsApp"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#25D366] px-4 py-2.5 text-xs font-bold text-white shadow-sm shadow-[#25D366]/20 transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#1DA851] hover:shadow-md"
          >
            <MessageCircle size={16} />
            WhatsApp Us
            <ArrowRight size={14} />
          </a>
        </div>
      </div>
    </div>
  );
}

// Product row
function OrderProduct({ item }) {
  return (
    <li className="flex items-center gap-3 py-3 first:pt-0 last:pb-0 sm:gap-4">
      <div className="h-[76px] w-[65px] shrink-0 overflow-hidden rounded-xl bg-[#F2F5F3] sm:h-[84px] sm:w-[72px]">
        <Img
          src={item.image}
          alt={item.name}
          className="h-full w-full object-cover transition-transform duration-500 hover:scale-105"
        />
      </div>

      <div className="min-w-0 flex-1">
        <h3 className="line-clamp-2 text-sm font-semibold leading-5 text-dark_green">
          {item.name}
        </h3>

        {(item.color || item.size) && (
          <p className="mt-1 text-xs text-dark_green/50">
            {[item.color, item.size].filter(Boolean).join(" / ")}
          </p>
        )}

        <p className="mt-1.5 text-[11px] font-medium text-dark_green/50">
          Qty: {item.qty}
        </p>
      </div>

      <div className="shrink-0 text-right">
        <p className="text-sm font-bold text-dark_green">
          {taka(item.price * item.qty)}
        </p>
        <p className="mt-1 text-[10px] text-dark_green/40">
          {taka(item.price)} / pc
        </p>
      </div>
    </li>
  );
}

// Individual order card
function OrderCard({ order, index }) {
  const o = order;
  const finalDelivery = o.serverDelivery ?? o.delivery;
  const finalTotal = o.serverTotal ?? o.total;

  return (
    <li
      className="group overflow-hidden rounded-[22px] border border-dark_green/[0.07] bg-white shadow-[0_12px_40px_-25px_rgba(16,53,64,.22)] transition-all duration-300 hover:border-dark_green/10 hover:shadow-[0_18px_48px_-25px_rgba(16,53,64,.28)] animate-[orderReveal_.45s_ease-out_both]"
      style={{
        animationDelay: `${Math.min(index, 8) * 60}ms`,
      }}
    >
      {/* Contact appears first for failed orders */}
      {o.status === "failed" && (
        <FailedOrderContact order={o} />
      )}

      {/* Compact card header */}
      <div className="flex flex-col gap-3 border-b border-dark_green/[0.06] bg-[#FBFCFB] px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-dark_green text-white">
            <ShoppingBag size={18} strokeWidth={1.7} />
          </div>

          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-pink">
              Order details
            </p>

            <p className="mt-1 flex items-center gap-1.5 text-xs text-dark_green/55">
              <CalendarDays size={13} />
              {when(o.createdAt)}
            </p>
          </div>
        </div>

        <Status o={o} />
      </div>

      <div className="px-4 py-4 sm:px-6 sm:py-5">
        {/* Products */}
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-bold text-dark_green">
            Your Items
          </h2>

          <span className="rounded-full bg-dark_green/[0.05] px-3 py-1 text-[10px] font-semibold text-dark_green/60">
            {o.items.reduce((sum, item) => sum + item.qty, 0)} items
          </span>
        </div>

        <ul className="divide-y divide-dark_green/[0.06]">
          {o.items.map((item, itemIndex) => (
            <OrderProduct
              key={`${item.productId}-${item.color || ""}-${item.size || ""}-${itemIndex}`}
              item={item}
            />
          ))}
        </ul>

        {/* Compact delivery details */}
        <div className="mt-4 flex items-start gap-3 rounded-xl bg-[#F7F9F7] p-3.5">
          <MapPin
            size={17}
            className="mt-0.5 shrink-0 text-dark_green/60"
          />

          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-bold uppercase tracking-wider text-dark_green/45">
              Delivering to
            </p>

            <p className="mt-1 text-sm font-semibold text-dark_green">
              {o.customer.name}
            </p>

            <p className="mt-0.5 break-words text-xs leading-5 text-dark_green/55">
              {o.customer.address}, {o.customer.city}
            </p>

            <p className="mt-0.5 text-xs text-dark_green/55">
              {o.customer.phone}
            </p>
          </div>
        </div>

        {/* Compact total section */}
        <div className="mt-4 flex items-center justify-between gap-3 border-t border-dashed border-dark_green/10 pt-4">
          <div>
            <p className="flex items-center gap-1.5 text-[11px] text-dark_green/50">
              <Truck size={14} />
              Delivery: {finalDelivery ? taka(finalDelivery) : "Free"}
            </p>

            {o.status === "placed" && (
              <p className="mt-1 flex items-center gap-1.5 text-[10px] font-medium text-emerald-700">
                <ShieldCheck size={12} />
                Cash on Delivery
              </p>
            )}
          </div>

          <div className="text-right">
            <p className="text-[10px] font-medium text-dark_green/50">
              {o.status === "placed" ? "Total to pay" : "Estimated total"}
            </p>

            <p className="mt-0.5 font-display text-xl font-bold tracking-tight text-dark_green sm:text-2xl">
              {taka(finalTotal)}
            </p>
          </div>
        </div>

        {o.status === "placed" &&
          o.serverTotal != null &&
          o.serverTotal !== o.total && (
            <p className="mt-2 text-[10px] leading-5 text-dark_green/45">
              Total updated according to the latest confirmed store prices.
            </p>
          )}
      </div>
    </li>
  );
}

export default function MyOrders() {
  const { orders, ready } = useOrders();

  if (!ready) {
    return (
      <div
        className="mx-auto max-w-6xl px-4 py-12"
        aria-busy="true"
      >
        <div className="h-36 animate-pulse rounded-3xl bg-dark_green/5" />
        <div className="mt-6 h-56 animate-pulse rounded-3xl bg-dark_green/5" />
      </div>
    );
  }

  const totalOrders = orders.length;

  const confirmedOrders = orders.filter(
    (o) => o.status === "placed"
  ).length;

  const processingOrders = orders.filter(
    (o) => o.status !== "placed" && o.status !== "failed"
  ).length;

  return (
    <main className="min-h-screen bg-[#F7F9F7] pb-16 text-dark_green">
      {/* Premium hero */}
      <section className="relative overflow-hidden bg-dark_green px-4 py-10 text-white sm:py-14">
        <div className="pointer-events-none absolute -right-20 -top-32 h-80 w-80 rounded-full border border-white/[0.08]" />
        <div className="pointer-events-none absolute -right-8 -top-20 h-56 w-56 rounded-full border border-white/[0.08]" />
        <div className="pointer-events-none absolute bottom-0 left-1/3 h-36 w-36 rounded-full bg-pink/10 blur-3xl" />

        <div className="relative mx-auto max-w-6xl">
          <Link
            href="/products"
            className="group mb-7 inline-flex items-center gap-2 text-xs font-medium text-white/60 transition hover:text-white"
          >
            <ArrowLeft
              size={15}
              className="transition-transform duration-200 group-hover:-translate-x-1"
            />
            Back to shopping
          </Link>

          <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
            <div>
              <div className="mb-3 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.23em] text-[#F5A5D2]">
                <Sparkles size={14} />
                Your shopping journey
              </div>

              <h1 className="font-display text-4xl font-semibold uppercase tracking-tight sm:text-5xl">
                My Orders<span className="text-[#F5A5D2]">.</span>
              </h1>

              <p className="mt-3 max-w-md text-sm leading-6 text-white/60">
                Your orders, all in one place. Track your shopping journey with ZUNIRAH.
              </p>
            </div>

            <div className="flex items-center gap-2 text-xs text-white/65">
              <ShoppingBag size={16} />
              Your order history
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-5xl px-4 pt-7 sm:pt-9">
        {/* Statistics */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
          <StatCard
            icon={ShoppingBag}
            label="Total Orders"
            value={totalOrders}
          />

          <StatCard
            icon={CheckCircle2}
            label="Confirmed"
            value={confirmedOrders}
            accent
          />

          <StatCard
            icon={Clock3}
            label="Processing"
            value={processingOrders}
          />
        </div>

        {/* Order history heading */}
        <div className="mt-9 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="mb-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-pink">
              Your collection
            </p>

            <h2 className="font-display text-2xl font-semibold tracking-tight text-dark_green sm:text-3xl">
              Order History
            </h2>

            <p className="mt-1.5 text-xs text-dark_green/50">
              Orders from the last 30 days, saved on this browser.
            </p>
          </div>

          {orders.length > 0 && (
            <Link
              href="/products"
              className="group inline-flex items-center gap-2 rounded-full border border-dark_green/10 bg-white px-4 py-2.5 text-xs font-semibold text-dark_green transition-all duration-200 hover:border-pink hover:bg-pink hover:text-white"
            >
              Shop More
              <ArrowRight
                size={14}
                className="transition-transform group-hover:translate-x-1"
              />
            </Link>
          )}
        </div>

        {/* Empty state */}
        {!orders.length ? (
          <div className="mt-6 flex flex-col items-center justify-center rounded-[24px] border border-dark_green/[0.06] bg-white px-6 py-14 text-center shadow-[0_12px_40px_-25px_rgba(16,53,64,.15)]">
            <div className="relative mb-6">
              <div className="flex h-24 w-24 items-center justify-center rounded-full bg-dark_green/[0.05] text-dark_green">
                <ShoppingBag size={40} strokeWidth={1.2} />
              </div>

              <div className="absolute -right-1 -top-1 flex h-9 w-9 items-center justify-center rounded-full bg-pink text-white shadow-lg shadow-pink/20">
                <Sparkles size={16} />
              </div>
            </div>

            <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.2em] text-pink">
              Your journey begins here
            </p>

            <h3 className="font-display text-2xl font-semibold text-dark_green sm:text-3xl">
              No orders yet
            </h3>

            <p className="mt-3 max-w-sm text-sm leading-6 text-dark_green/50">
              Your next favorite piece is waiting to be discovered.
              Explore our collection and find something special.
            </p>

            <Link
              href="/products"
              className="group mt-6 inline-flex items-center gap-3 rounded-full bg-dark_green px-7 py-3.5 text-sm font-semibold text-white shadow-lg shadow-dark_green/10 transition-all duration-200 hover:-translate-y-0.5 hover:bg-pink"
            >
              Explore Collection
              <ArrowRight
                size={16}
                className="transition-transform group-hover:translate-x-1"
              />
            </Link>
          </div>
        ) : (
          <ul className="mt-5 space-y-4">
            {orders.map((o, index) => (
              <OrderCard
                key={o.rid}
                order={o}
                index={index}
              />
            ))}
          </ul>
        )}

        {/* Compact trust banner */}
        <div className="mt-8 flex items-center justify-center gap-3 rounded-2xl border border-dark_green/[0.06] bg-white px-4 py-4">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-pink/10 text-pink">
            <ShieldCheck size={18} />
          </div>

          <div>
            <p className="text-xs font-semibold text-dark_green">
              Shopping with confidence
            </p>
            <p className="mt-0.5 text-[11px] text-dark_green/50">
              Your order information is saved on this device.
            </p>
          </div>
        </div>
      </div>

      <style jsx global>{`
        @keyframes orderReveal {
          from {
            opacity: 0;
            transform: translateY(12px);
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
    </main>
  );
}
