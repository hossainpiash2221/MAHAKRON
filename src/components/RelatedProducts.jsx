'use client';
import { useCallback, useEffect, useMemo, useRef } from 'react';
import { useProducts } from './ProductsProvider';
import ProductCard from './ProductCard';

const Arrow = ({ d }) => (
  <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={d} /></svg>
);
const arrowBtn = 'absolute top-[38%] z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white text-ink shadow-lg ring-1 ring-ink/10 transition hover:bg-ink hover:text-white active:scale-95';

/**
 * Same-category products as an auto-playing, endless carousel.
 * - Endless: the list is rendered 3 times and we silently jump by one full set once scrolling stops.
 * - Drag: touch uses native swipe, mouse uses click-and-drag.
 * - Auto-play pauses on hover, focus, touch and drag, and is off for "reduce motion".
 */
export default function RelatedProducts({ current }) {
  const { products } = useProducts();
  const items = useMemo(() => {
    const rel = products.filter((p) => p.category === current.category && p.id !== current.id && p.slug !== current.slug);
    rel.sort((a, b) =>
      (Number(b.gender === current.gender) - Number(a.gender === current.gender)) ||        // same gender first
      (Number(a.status === 'Out of Stock') - Number(b.status === 'Out of Stock')));         // Out of stock last
    return rel.slice(0, 12);
  }, [products, current]);

  const loop = items.length >= 3;
  const list = loop ? [...items, ...items, ...items] : items;

  const ref = useRef(null);
  const paused = useRef(false);
  const idle = useRef(null);
  const drag = useRef({ down: false, x: 0, left: 0, moved: false });

  const stepWidth = () => { const c = ref.current && ref.current.children; return c && c.length > 1 ? c[1].offsetLeft - c[0].offsetLeft : 300; };
  const by = useCallback((dir) => { const el = ref.current; if (el) el.scrollBy({ left: dir * stepWidth(), behavior: 'smooth' }); }, []);

  // start in the middle copy so there is room to move both ways
  useEffect(() => {
    if (!loop) return;
    const id = requestAnimationFrame(() => { const el = ref.current; if (el) el.scrollLeft = el.scrollWidth / 3; });
    return () => cancelAnimationFrame(id);
  }, [loop, items.length]);

  // auto-change
  useEffect(() => {
    if (!loop || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const t = setInterval(() => { if (!paused.current && !document.hidden && !drag.current.down) by(1); }, 3500);
    return () => clearInterval(t);
  }, [loop, by]);

  // endless: when scrolling has stopped, jump one full set (identical content, so the jump is invisible)
  const onScroll = () => {
    if (!loop) return;
    clearTimeout(idle.current);
    idle.current = setTimeout(() => {
      const el = ref.current; if (!el || drag.current.down) return;
      const w = el.scrollWidth / 3;
      if (el.scrollLeft < w * 0.5) el.scrollLeft += w; else if (el.scrollLeft > w * 1.5) el.scrollLeft -= w;
    }, 150);
  };

  function snapNearest() {
    const el = ref.current; if (!el) return;
    const kids = Array.from(el.children), base = kids[0].offsetLeft;
    const target = kids.map((k) => k.offsetLeft - base).reduce((best, x) => (Math.abs(x - el.scrollLeft) < Math.abs(best - el.scrollLeft) ? x : best), 0);
    el.scrollTo({ left: target, behavior: 'smooth' });
  }

  function onMouseDown(e) {
    if (e.button !== 0) return;
    const el = ref.current; if (!el) return;
    drag.current = { down: true, x: e.clientX, left: el.scrollLeft, moved: false };
    el.style.scrollSnapType = 'none'; el.style.cursor = 'grabbing';
    const move = (ev) => {
      const dx = ev.clientX - drag.current.x;
      if (Math.abs(dx) > 5) drag.current.moved = true;
      el.scrollLeft = drag.current.left - dx;
    };
    const up = () => {
      window.removeEventListener('mousemove', move); window.removeEventListener('mouseup', up);
      const moved = drag.current.moved;
      drag.current.down = false; el.style.scrollSnapType = ''; el.style.cursor = '';
      if (moved) {
        const stop = (ev) => { ev.preventDefault(); ev.stopPropagation(); };     // a drag must not count as a click on a card
        window.addEventListener('click', stop, { capture: true, once: true });
        setTimeout(() => window.removeEventListener('click', stop, { capture: true }), 60);
        snapNearest();
      }
    };
    window.addEventListener('mousemove', move); window.addEventListener('mouseup', up);
  }

  if (!items.length) return null;
  return (
    <section className="mt-16 border-t border-ink/10 pt-10" aria-labelledby="related-h" aria-roledescription="carousel"
      onMouseEnter={() => { paused.current = true; }} onMouseLeave={() => { paused.current = false; }}
      onFocus={() => { paused.current = true; }} onBlur={() => { paused.current = false; }}
      onTouchStart={() => { paused.current = true; }} onTouchEnd={() => { setTimeout(() => { paused.current = false; }, 4000); }}>
      <h2 id="related-h" className="font-display text-3xl font-bold tracking-tight">More in {current.category}</h2>
      <p className="mt-1 text-sm text-ink/60">You may also like these.</p>

      <div className="relative mt-6">
        {loop && <button type="button" aria-label="Previous products" onClick={() => by(-1)} className={`${arrowBtn} -left-2 sm:-left-5`}><Arrow d="M15 18l-6-6 6-6" /></button>}
        <div ref={ref} onScroll={onScroll} onMouseDown={loop ? onMouseDown : undefined} onDragStart={(e) => e.preventDefault()}
          className={`-mx-2 flex snap-x snap-mandatory overflow-x-auto overscroll-x-contain pb-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden ${loop ? 'cursor-grab' : ''}`}>
          {list.map((p, n) => (
            <div key={`${p.id}-${n}`} className="w-[72%] shrink-0 snap-start px-2 sm:w-[44%] md:w-1/3 lg:w-1/4">
              <ul className="h-full"><ProductCard p={p} /></ul>
            </div>
          ))}
        </div>
        {loop && <button type="button" aria-label="Next products" onClick={() => by(1)} className={`${arrowBtn} -right-2 sm:-right-5`}><Arrow d="M9 6l6 6-6 6" /></button>}
      </div>
    </section>
  );
}