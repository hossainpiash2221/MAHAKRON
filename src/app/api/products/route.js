// import { NextResponse } from 'next/server';
// import { getProducts } from '@/lib/products';

// export const revalidate = 120;

// export async function GET() {
//   const data = await getProducts();
//   return NextResponse.json({ success: true, data }, {
//     headers: { 'Cache-Control': 'public, s-maxage=120, stale-while-revalidate=600' },
//   });
// }


import { NextResponse } from 'next/server';
import { getProducts } from '@/lib/products';

export const dynamic = 'force-dynamic';

export async function GET() {
  const data = await getProducts();
  return NextResponse.json({ success: true, data }, {
    // browsers/CDN may reuse a good answer, but an empty one (Google failed) is never cached
    headers: { 'Cache-Control': data.length ? 'public, s-maxage=120, stale-while-revalidate=600' : 'no-store' },
  });
}