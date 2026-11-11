'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useProducts } from './ProductsProvider';

function Icon({ name, className = '' }) {
  const paths = {
    home: <><path d="m3 10 9-7 9 7"/><path d="M5 9v12h14V9M9 21v-7h6v7"/></>,
    categories: <><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></>,
    products: <><path d="M4 8h16l-1 13H5L4 8Z"/><path d="M9 9V6a3 3 0 0 1 6 0v3"/></>,
    contact: <><path d="M22 16.5v3a2 2 0 0 1-2.2 2A19 19 0 0 1 2.5 4.2 2 2 0 0 1 4.5 2h3a2 2 0 0 1 2 1.7l.5 3a2 2 0 0 1-.6 1.8L7.5 10a15 15 0 0 0 6.5 6.5l1.5-1.9a2 2 0 0 1 1.8-.6l3 .5a2 2 0 0 1 1.7 2Z"/></>,
  };
  return <svg className={className} width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>;
}

export default function MobileBottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const sp = useSearchParams();
  const { products } = useProducts();
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState(null);
  const [gender, setGender] = useState('All');
  const activeCategory = pathname === '/products' ? (sp.get('category') || 'All') : 'All';
  const activeSub = pathname === '/products' ? (sp.get('subcategory') || 'All') : 'All';

  const groups = useMemo(() => {
    const map = new Map();
    products.forEach((p) => {
      if (gender !== 'All' && p.gender !== gender) return;
      const c = String(p.category || '').trim();
      const s = String(p.subcategory || '').trim();
      if (!c) return;
      if (!map.has(c)) map.set(c, new Set());
      if (s) map.get(c).add(s);
    });
    return map;
  }, [products, gender]);

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false); };
    window.addEventListener('keydown', onKey);
    return () => { document.body.style.overflow = previous; window.removeEventListener('keydown', onKey); };
  }, [open]);

  function choose(category = 'All', subcategory = 'All') {
    const params = new URLSearchParams();
    if (gender !== 'All') params.set('gender', gender);
    if (category !== 'All') params.set('category', category);
    if (subcategory !== 'All') params.set('subcategory', subcategory);
    const query = params.toString();
    setOpen(false);
    router.push(`/products${query ? `?${query}` : ''}`);
  }

  const navItem = 'flex min-w-0 flex-1 flex-col items-center justify-center gap-1 py-2 text-[10px] font-medium transition-colors';
  const active = 'text-white bg-white/15 rounded-xl';
  const idle = 'text-white/70 hover:text-white hover:bg-white/10 rounded-xl';

  return <>
    {open && <div className="fixed inset-0 z-[90] bg-black/45 lg:hidden" onClick={() => setOpen(false)} aria-hidden="true" />}
    <section role="dialog" aria-modal="true" aria-label="Browse categories" aria-hidden={!open}
      className={`fixed inset-x-0 bottom-0 z-[100] max-h-[83dvh] overflow-hidden rounded-t-2xl bg-white shadow-2xl transition-transform duration-300 ease-out lg:hidden ${open ? 'translate-y-0' : 'pointer-events-none translate-y-full'}`}>
      <div className="mx-auto mt-3 h-1 w-11 rounded-full bg-ink/15" />
      <div className="flex items-center justify-between border-b border-ink/10 px-5 py-4">
        <div><h2 className="font-display text-xl font-bold text-dark_green">Shop by Category</h2><p className="text-xs text-ink/55">Find your perfect collection</p></div>
        <button type="button" aria-label="Close categories" onClick={() => setOpen(false)} className="rounded-full border border-ink/10 px-3 py-1.5 text-lg text-ink">×</button>
      </div>
      <div className="max-h-[calc(83dvh-110px)] space-y-3 overflow-y-auto px-4 pb-8 pt-4">
        <div className="flex gap-2">
          {['All', 'Female', 'Male'].map(g => <button key={g} type="button" onClick={() => {setGender(g);setExpanded(null);}} className={`rounded-full border px-4 py-2 text-xs font-semibold ${gender === g ? 'border-dark_green bg-dark_green text-white' : 'border-ink/15 text-ink'}`}>{g}</button>)}
        </div>
        <button type="button" onClick={() => choose()} className={`w-full rounded-lg px-4 py-3 text-left text-sm font-semibold ${activeCategory === 'All' ? 'bg-dark_green text-white' : 'bg-ink/5 text-ink'}`}>All Products</button>
        {[...groups].map(([category, subs]) => {
          const hasSubs = subs.size > 0;
          const isExpanded = expanded === category;
          return <div key={category} className="overflow-hidden rounded-lg border border-ink/10">
            <div className="flex items-stretch">
              <button type="button" onClick={() => { if (hasSubs) setExpanded(isExpanded ? null : category); else choose(category); }} aria-expanded={hasSubs ? isExpanded : undefined}
                className={`flex flex-1 items-center justify-between px-4 py-3.5 text-left text-sm font-medium ${activeCategory === category ? 'bg-dark_green text-white' : 'text-ink hover:bg-dark_green/5'}`}>
                <span>{category}</span>{hasSubs && <svg className={`h-4 w-4 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m6 9 6 6 6-6"/></svg>}
              </button>
            </div>
            {hasSubs && <div className={`grid transition-[grid-template-rows] duration-300 ${isExpanded ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}><div className="min-h-0 overflow-hidden"><div className="space-y-1 border-t border-ink/10 bg-ink/[0.02] p-2 pl-5">
              {['All', ...subs].map(s => <button key={s} type="button" onClick={() => choose(category, s)} className={`block w-full rounded-md px-3 py-2.5 text-left text-sm ${activeCategory === category && activeSub === s ? 'bg-dark_green text-white' : 'text-ink/75 hover:bg-dark_green/10'}`}>{s === 'All' ? `All ${category}` : s}</button>)}
            </div></div></div>}
          </div>;
        })}
      </div>
    </section>
    <nav aria-label="Mobile navigation" className="fixed inset-x-0 bottom-0 z-[80] border-t border-white/10 bg-dark_green pb-[env(safe-area-inset-bottom)] shadow-[0_-8px_28px_rgba(0,0,0,0.22)] lg:hidden">
      <div className="mx-auto flex h-[62px] max-w-xl items-stretch gap-1 px-2 py-1">
        <Link href="/" className={`${navItem} ${pathname === '/' ? active : idle}`}><Icon name="home"/>Home</Link>
        <button type="button" onClick={() => setOpen(true)} className={`${navItem} ${open ? active : idle}`} aria-expanded={open}><Icon name="categories"/>Categories</button>
        <Link href="/products" className={`${navItem} ${pathname === '/products' ? active : idle}`}><Icon name="products"/>Products</Link>
        <Link href="/contact" className={`${navItem} ${pathname === '/contact' ? active : idle}`}><Icon name="contact"/>Contact</Link>
      </div>
    </nav>
  </>;
}
