
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

export async function POST(request) {
  // Verify Google authentication and admin access
  let session;

  try {
    session = await auth();
  } catch {
    return NextResponse.json(
      {
        success: false,
        error: 'Authentication verification failed',
      },
      { status: 401 }
    );
  }

  if (
    !session?.user?.email ||
    !isAdminEmail(session.user.email)
  ) {
    return NextResponse.json(
      {
        success: false,
        error: 'Unauthorized admin access',
      },
      { status: 401 }
    );
  }

  const url = process.env.APPS_SCRIPT_URL;
  const secret = process.env.APPS_SCRIPT_SECRET;

  if (!url || !secret) {
    return NextResponse.json(
      {
        success: false,
        error: 'Apps Script configuration is missing',
      },
      { status: 500 }
    );
  }

  try {
    const body = await request.json();

    // Validate supported actions
    if (!ALLOWED_ACTIONS.includes(body?.action)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Unsupported action',
        },
        { status: 400 }
      );
    }

    // Validate Steadfast request
    if (body.action === 'courierSend') {
      if (
        typeof body.orderId !== 'string' ||
        !body.orderId.trim()
      ) {
        return NextResponse.json(
          {
            success: false,
            error: 'Valid orderId is required',
          },
          { status: 400 }
        );
      }
    }

    // Prevent oversized payloads
    if (JSON.stringify(body).length > 9_000_000) {
      return NextResponse.json(
        {
          success: false,
          error: 'Payload too large',
        },
        { status: 413 }
      );
    }

    // Forward request to Google Apps Script
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: JSON.stringify({
        ...body,
        secret,
      }),
      redirect: 'follow',
      cache: 'no-store',
    });

    const raw = await response.text();

    let data;

    try {
      data = JSON.parse(raw);
    } catch {
      throw new Error(
        'Apps Script returned non-JSON response. Check deployment URL and permissions.'
      );
    }

    if (!response.ok || !data.success) {
      throw new Error(
        data.error || 'Apps Script request failed'
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Admin API error:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Admin request failed. Please try again.',
      },
      { status: 500 }
    );
  }
}
