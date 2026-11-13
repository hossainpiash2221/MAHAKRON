import { NextResponse } from 'next/server';

export function middleware(request) {
  const nonce = btoa(crypto.randomUUID());
  const developmentDirective = process.env.NODE_ENV === 'development' ? " 'unsafe-eval'" : '';
  const csp = `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${developmentDirective}; object-src 'none'; base-uri 'self'; frame-ancestors 'none'`;

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-nonce', nonce);
  requestHeaders.set('Content-Security-Policy', csp);

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set('Content-Security-Policy', csp);
  return response;
}

export const config = {
  matcher: ['/admin/:path*'],
};
