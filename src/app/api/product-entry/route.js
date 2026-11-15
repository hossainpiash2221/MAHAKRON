
import { NextResponse } from 'next/server';
import { auth, isAdminEmail } from '@/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const ALLOWED_ACTIONS = [
  'productInit',
  'productSave',
  'productImage',
  'adminDashboard',
  'courierSend',
];

function errorResponse(message, status = 500, code = 'ADMIN_ERROR') {
  return NextResponse.json(
    {
      success: false,
      error: message,
      code,
    },
    { status }
  );
}

export async function POST(request) {
  // 1. Verify admin authentication
  let session;

  try {
    session = await auth();
  } catch (error) {
    console.error('[Admin API] Authentication error:', error);

    return errorResponse(
      'Authentication verification failed.',
      401,
      'AUTH_FAILED'
    );
  }

  if (
    !session?.user?.email ||
    !isAdminEmail(session.user.email)
  ) {
    return errorResponse(
      'Unauthorized admin access.',
      401,
      'UNAUTHORIZED'
    );
  }

  // 2. Verify Apps Script configuration
  const url = process.env.APPS_SCRIPT_URL;
  const secret = process.env.APPS_SCRIPT_SECRET;

  if (!url || !secret) {
    console.error('[Admin API] Missing Apps Script configuration');

    return errorResponse(
      'Apps Script configuration is missing.',
      500,
      'CONFIG_MISSING'
    );
  }

  // 3. Read and validate request
  let body;

  try {
    body = await request.json();
  } catch {
    return errorResponse(
      'Invalid JSON request.',
      400,
      'INVALID_JSON'
    );
  }

  if (
    !body ||
    typeof body !== 'object' ||
    Array.isArray(body) ||
    !ALLOWED_ACTIONS.includes(body.action)
  ) {
    return errorResponse(
      'Unsupported action.',
      400,
      'INVALID_ACTION'
    );
  }

  const action = body.action;

  if (action === 'courierSend') {
    if (
      typeof body.orderId !== 'string' ||
      !body.orderId.trim()
    ) {
      return errorResponse(
        'Valid orderId is required.',
        400,
        'INVALID_ORDER_ID'
      );
    }
  }

  if (action === 'productSave') {
    if (
      !body.product ||
      typeof body.product !== 'object' ||
      Array.isArray(body.product) ||
      !String(body.product.id || '').trim()
    ) {
      return errorResponse(
        'Valid product ID is required.',
        400,
        'INVALID_PRODUCT'
      );
    }
  }

  const payload = JSON.stringify({
    ...body,
    secret,
  });

  if (payload.length > 9_000_000) {
    return errorResponse(
      'Payload too large.',
      413,
      'PAYLOAD_TOO_LARGE'
    );
  }

  // 4. Forward request to Google Apps Script
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: payload,
      redirect: 'follow',
      cache: 'no-store',
      signal: AbortSignal.timeout(55000),
    });

    const raw = await response.text();

    let data;

    try {
      data = JSON.parse(raw);
    } catch {
      console.error(
        '[Admin API] Non-JSON response:',
        {
          action,
          status: response.status,
          contentType: response.headers.get('content-type'),
        }
      );

      return errorResponse(
        'Google Apps Script returned an invalid response. Check its deployment and permissions.',
        502,
        'INVALID_SCRIPT_RESPONSE'
      );
    }

    if (!response.ok || !data?.success) {
      const scriptError =
        typeof data?.error === 'string'
          ? data.error
          : 'Google Apps Script request failed.';

      console.error('[Admin API] Apps Script error:', {
        action,
        status: response.status,
        error: scriptError,
      });

      return errorResponse(
        scriptError,
        response.ok ? 422 : 502,
        'APPS_SCRIPT_ERROR'
      );
    }

    return NextResponse.json(data);

  } catch (error) {
    console.error('[Admin API] Request failed:', {
      action,
      name: error?.name,
      message: error?.message,
    });

    if (
      error?.name === 'TimeoutError' ||
      error?.name === 'AbortError'
    ) {
      return errorResponse(
        'Google Apps Script request timed out. Check whether the product was saved before retrying.',
        504,
        'SCRIPT_TIMEOUT'
      );
    }

    return errorResponse(
      'Unable to connect to Google Apps Script. Check Vercel server logs.',
      502,
      'SCRIPT_CONNECTION_ERROR'
    );
  }
}
