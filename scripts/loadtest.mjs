#!/usr/bin/env node
/**
 * Sends N orders to your Apps Script AT THE SAME TIME and reports what happened.
 *
 *   node scripts/loadtest.mjs --yes                 10 orders at once
 *   node scripts/loadtest.mjs --yes --n 20          20 orders at once (max 40)
 *   node scripts/loadtest.mjs --yes --dup           also test: the SAME order sent twice must give ONE order
 *   node scripts/loadtest.mjs --yes --product P005  use a specific product ID (default: first Active product)
 *
 * It reads APPS_SCRIPT_URL and API_SECRET from .env.local. It creates REAL rows in your Orders sheet.
 * Every fake order is named "LOADTEST ..." so you can remove them all with deleteLoadTestOrders() in Apps Script.
 */
import { readFileSync, existsSync } from 'node:fs';
import { randomUUID } from 'node:crypto';

// ---------- args + env ----------
const args = process.argv.slice(2);
const has = (f) => args.includes(f);
const val = (f, d) => { const i = args.indexOf(f); return i >= 0 && args[i + 1] ? args[i + 1] : d; };
for (const file of ['.env.local', '.env']) {
  if (!existsSync(file)) continue;
  for (const line of readFileSync(file, 'utf8').split(/\r?\n/)) {
    const m = /^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/.exec(line);
    if (m && !(m[1] in process.env)) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
}
const URL_ = process.env.APPS_SCRIPT_URL, SECRET = process.env.API_SECRET;
const N = Math.min(Math.max(parseInt(val('--n', '10'), 10) || 10, 1), 40);   // 40 max: the system allows 60 orders/minute
if (!URL_ || !SECRET) { console.error('✗ APPS_SCRIPT_URL / API_SECRET not found in .env.local'); process.exit(1); }
if (!has('--yes')) {
  console.log(`This will create ${N} REAL fake orders (named "LOADTEST ...") in your Orders sheet.\nRun again with --yes to continue.\nAfterwards run deleteLoadTestOrders() in the Apps Script editor to remove them.`);
  process.exit(0);
}

// ---------- helpers ----------
const post = async (body) => {
  const t0 = performance.now();
  try {
    const res = await fetch(URL_, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify({ ...body, secret: SECRET }), redirect: 'follow', signal: AbortSignal.timeout(90000) });
    const j = JSON.parse(await res.text());
    return { ms: performance.now() - t0, ok: !!j.success, data: j.data, error: j.error };
  } catch (e) { return { ms: performance.now() - t0, ok: false, error: e.name === 'TimeoutError' ? 'timeout (90s)' : 'network: ' + e.message }; }
};
const fmt = (ms) => (ms / 1000).toFixed(1) + 's';

// ---------- pick a product ----------
const u = new URL(URL_); u.searchParams.set('action', 'products'); u.searchParams.set('secret', SECRET);
let products;
try { const j = JSON.parse(await (await fetch(u, { redirect: 'follow' })).text()); if (!j.success) throw new Error(j.error); products = j.data; }
catch (e) { console.error('✗ Could not read products: ' + e.message); process.exit(1); }
const want = val('--product', '');
const product = products.find((p) => p.status === 'Active' && (!want || p.id === want));
if (!product) { console.error('✗ No Active product found' + (want ? ' with ID ' + want : '') + '.'); process.exit(1); }
const item = { productId: product.id, quantity: 1, color: product.colors?.[0] || '', size: product.sizes?.[0] || '' };
console.log(`Product: ${product.productName} (${product.id})${item.color ? ' / ' + item.color : ''}${item.size ? ' / ' + item.size : ''}`);

const base = String(Math.floor(Math.random() * 9e4) + 1e4);               // a fresh phone range each run (limit: 5 orders per phone per hour)
const order = (i) => ({
  action: 'placeOrder', requestId: randomUUID(), zone: 'inside', deliveryCharge: 80, freeAbove: 0, website: '',
  customerName: `LOADTEST ${i + 1}`, phone: `017${base}${String(i).padStart(3, '0')}`.slice(0, 11),
  address: 'LOADTEST address, delete me', city: 'Dhaka', email: '', note: 'LOADTEST delete me', items: [item],
});

// ---------- 1) N orders at the same moment ----------
console.log(`\nSending ${N} orders at the same moment...`);
const t0 = performance.now();
const results = await Promise.all(Array.from({ length: N }, (_, i) => post(order(i))));
const wall = performance.now() - t0;

results.forEach((r, i) => console.log(`  #${String(i + 1).padStart(2)}  ${fmt(r.ms).padStart(6)}  ${r.ok ? '✓ ' + r.data.orderId : '✗ ' + r.error}`));
const okRes = results.filter((r) => r.ok), ids = okRes.map((r) => r.data.orderId), times = results.map((r) => r.ms);
const dupIds = ids.filter((x, i) => ids.indexOf(x) !== i);
console.log('\n──────── RESULT ────────');
console.log(`Orders created : ${okRes.length} of ${N}`);
console.log(`Failed         : ${N - okRes.length}${N - okRes.length ? '   (' + [...new Set(results.filter((r) => !r.ok).map((r) => r.error))].join(' | ') + ')' : ''}`);
console.log(`Duplicate IDs  : ${dupIds.length ? '✗ ' + [...new Set(dupIds)].join(', ') : '✓ none'}`);
console.log(`Everything done in ${fmt(wall)}   (fastest ${fmt(Math.min(...times))}, average ${fmt(times.reduce((a, b) => a + b, 0) / N)}, slowest ${fmt(Math.max(...times))})`);

// ---------- 2) same order twice at once ----------
let dupOk = true;
if (has('--dup')) {
  console.log('\nSending the SAME order twice at the same moment (double-click test)...');
  const o = order(900);
  const [a, b] = await Promise.all([post(o), post({ ...o })]);
  const ida = a.ok && a.data.orderId, idb = b.ok && b.data.orderId;
  console.log(`  first : ${a.ok ? '✓ ' + ida : '✗ ' + a.error}${a.data?.duplicate ? ' (marked duplicate)' : ''}`);
  console.log(`  second: ${b.ok ? '✓ ' + idb : '✗ ' + b.error}${b.data?.duplicate ? ' (marked duplicate)' : ''}`);
  dupOk = (!!ida && ida === idb) || (!!ida !== !!idb);     // same order ID, or one rejected as "still processing": both mean ONE order
  console.log(dupOk ? '  ✓ only one order was created' : '  ✗ TWO different orders were created');
}

console.log('\nNow check the Orders sheet, then run deleteLoadTestOrders() in Apps Script to remove the fake orders.');
process.exit(okRes.length === N && !dupIds.length && dupOk ? 0 : 2);
