import { NextResponse } from 'next/server';
import { scriptGet } from '@/lib/apps-script';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const CACHE_MS = 5 * 60 * 1000;

// In-memory cache per Node.js instance; no timer or background refresh.
const store = globalThis.__mahakronDeliveryCache ||
  (globalThis.__mahakronDeliveryCache = {
    data: null,
    fetchedAt: 0,
    pending: null,
  });

function validateSettings(data) {
  const inside = Number(data?.inside?.charge);
  const outside = Number(data?.outside?.charge);
  const freeAbove = Number(data?.freeAbove);
  if (!data?.inside || !data?.outside ||
      ![inside, outside, freeAbove].every(Number.isFinite) ||
      [inside, outside, freeAbove].some((value) => value < 0)) {
    throw new Error('Invalid delivery settings response.');
  }
  return {
    inside: { label: 'Inside Dhaka', charge: inside },
    outside: { label: 'Outside Dhaka', charge: outside },
    freeAbove,
  };
}

async function loadFreshSettings() {
  if (!store.pending) {
    store.pending = scriptGet({ action: 'deliverySettings' })
      .then(validateSettings)
      .then((data) => {
        store.data = data;
        store.fetchedAt = Date.now();
        return data;
      })
      .finally(() => { store.pending = null; });
  }
  return store.pending;
}

export async function GET() {
  try {
    const fresh = store.data && Date.now() - store.fetchedAt < CACHE_MS;
    // Only refresh on an actual request (e.g., checkout open/reload).
    const data = fresh ? store.data : await loadFreshSettings();
    return NextResponse.json(
      { success: true, data },
      { headers: { 'Cache-Control': 'private, no-store' } }
    );
  } catch (error) {
    console.error('Delivery settings unavailable:', error);
    return NextResponse.json(
      { success: false, error: 'Delivery settings unavailable. Please retry.' },
      { status: 503, headers: { 'Cache-Control': 'no-store' } }
    );
  }
}
