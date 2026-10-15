'use client';
export default function GlobalError({ reset }) {
  return (
    <div className="mx-auto max-w-xl px-4 py-24 text-center">
      <h1 className="font-display text-3xl font-bold">Something went wrong</h1>
      <p className="mt-3 text-ink/70">This page didn’t load properly. Your cart and orders are safe.</p>
      <button onClick={reset} className="mt-8 rounded bg-peacock px-6 py-3 font-semibold text-white hover:bg-dark_green">Try again</button>
    </div>
  );
}


