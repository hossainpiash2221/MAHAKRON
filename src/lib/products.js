

import { scriptGet } from './apps-script';

export function slugify(s) {
  return String(s || '').toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80);
}

/** Clean URLs from the product name. Collisions (or non-Latin names) fall back to the product ID. */
export function withSlugs(list) {
  const seen = new Set();
  return list.map((p) => {
    let slug = slugify(p.productName) || String(p.id).toLowerCase();
    if (seen.has(slug)) slug = `${slug}-${String(p.id).toLowerCase()}`;
    seen.add(slug);
    return { ...p, colors: p.colors || [], sizes: p.sizes || [], images: p.images || [], slug };
  });
}

// ---- Product list: stale-while-revalidate, kept in server memory --------------------------------
// fresh   (< 2 min)  : answer instantly.
// stale   (< 24 h)   : answer instantly with the last good copy, refresh from Google in the background.
// nothing yet        : only the very first visitor after a server start waits for Google.
// All visitors share ONE Google request at a time, so a traffic spike cannot flood Apps Script.
const FRESH_MS = 120 * 1000, MAX_STALE_MS = 24 * 60 * 60 * 1000;
const store = (globalThis.__zunirahProducts ||= { data: null, at: 0, inflight: null });

function refresh(timeout) {
  if (store.inflight) return store.inflight;
  store.inflight = scriptGet({ action: 'products' }, { timeout })
    .then((d) => { store.data = withSlugs(d); store.at = Date.now(); return store.data; })
    .finally(() => { store.inflight = null; });
  return store.inflight;
}

export async function getProducts() {
  const age = Date.now() - store.at;
  try {
    if (store.data && age < FRESH_MS) return store.data;
    if (store.data && age < MAX_STALE_MS) {
      refresh(25000).catch((e) => console.error('background refresh failed:', e.message));   // nobody waits for this
      return store.data;
    }
    return await refresh(15000);
  } catch (e) {
    console.error('getProducts failed:', e.message);
    return store.data || [];
  }
}

export async function getProductBySlug(slug) {
  return (await getProducts()).find((p) => p.slug === slug) || null;
}