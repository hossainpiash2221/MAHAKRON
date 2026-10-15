



// import { NextResponse } from 'next/server';

// export const runtime = 'nodejs';

// export async function POST(request) {
//   try {
//     const { order } = await request.json();

//     if (
//       !order ||
//       order.status !== 'failed' ||
//       !order.customer ||
//       !Array.isArray(order.items)
//     ) {
//       return NextResponse.json(
//         { error: 'Invalid order data' },
//         { status: 400 }
//       );
//     }

//     const token = process.env.TELEGRAM_BOT_TOKEN;
//     const chatId = process.env.TELEGRAM_CHAT_ID;

//     if (!token || !chatId) {
//       return NextResponse.json(
//         { error: 'Telegram is not configured' },
//         { status: 500 }
//       );
//     }

//     const customer = order.customer;

//     // Product details
//     const products = order.items
//       .map((item, index) => {
//         const name = String(item.name || 'Product');
//         const qty = Number(item.qty) || 0;

//         return `${index + 1}. ${name} x ${qty}`;
//       })
//       .join('\n');

//     const message = [
//       '⚠️ ZUNIRAH — ORDER FAILED',
//       '',
//       '👤 CUSTOMER INFORMATION',
//       `Name: ${customer.name || 'N/A'}`,
//       `Phone: ${customer.phone || 'N/A'}`,
//       `Address: ${customer.address || 'N/A'}`,
//       `City: ${customer.city || 'N/A'}`,
//       '',
//       '🛍️ ORDER INFORMATION',
//       `Order ID: ${order.orderId || order.rid || 'N/A'}`,
//       `Products:\n${products || 'No products'}`,
//       `Total: ${Number(order.serverTotal ?? order.total) || 0} BDT`,
//       `Error: ${String(order.error || 'Order failed').slice(0, 500)}`,
//       `Time: ${
//         order.createdAt
//           ? new Date(order.createdAt).toLocaleString('en-GB', {
//               timeZone: 'Asia/Dhaka',
//             })
//           : 'N/A'
//       }`,
//     ].join('\n');

//     // 1. Send order information
//     const textResponse = await fetch(
//       `https://api.telegram.org/bot${token}/sendMessage`,
//       {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({
//           chat_id: chatId,
//           text: message,
//         }),
//         cache: 'no-store',
//       }
//     );

//     const textResult = await textResponse.json();

//     if (!textResponse.ok || !textResult.ok) {
//       console.error('Telegram message failed:', textResult.description);

//       return NextResponse.json(
//         { error: 'Telegram message failed' },
//         { status: 502 }
//       );
//     }

//     // 2. Send Cloudinary product photos
//     for (const [index, item] of order.items.entries()) {
//       const imageUrl = String(item.image || '').trim();

//       if (!imageUrl || !imageUrl.startsWith('https://')) {
//         continue;
//       }

//       try {
//         const photoResponse = await fetch(
//           `https://api.telegram.org/bot${token}/sendPhoto`,
//           {
//             method: 'POST',
//             headers: { 'Content-Type': 'application/json' },
//             body: JSON.stringify({
//               chat_id: chatId,
//               photo: imageUrl,
//               caption: [
//                 `🛍️ Product ${index + 1}`,
//                 `Name: ${item.name || 'Product'}`,
//                 `Quantity: ${Number(item.qty) || 0}`,
//                 `Color: ${item.color || 'N/A'}`,
//                 `Size: ${item.size || 'N/A'}`,
//                 `Order ID: ${order.orderId || order.rid || 'N/A'}`,
//               ].join('\n'),
//             }),
//             cache: 'no-store',
//           }
//         );

//         const photoResult = await photoResponse.json();

//         if (!photoResponse.ok || !photoResult.ok) {
//           console.error(
//             'Telegram photo failed:',
//             photoResult.description
//           );
//         }
//       } catch (error) {
//         console.error('Telegram photo error:', error);
//       }
//     }

//     return NextResponse.json({ success: true });
//   } catch (error) {
//     console.error('Telegram notification error:', error);

//     return NextResponse.json(
//       { error: 'Unable to send notification' },
//       { status: 500 }
//     );
//   }
// }


import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

const TELEGRAM_API = 'https://api.telegram.org';

async function telegramRequest(token, method, payload) {
  const response = await fetch(
    `${TELEGRAM_API}/bot${token}/${method}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      cache: 'no-store',
    }
  );

  const result = await response.json();

  if (!response.ok || !result.ok) {
    throw new Error(result.description || `${method} failed`);
  }

  return result;
}

function clean(value, max = 150) {
  return String(value ?? 'N/A').slice(0, max);
}

function getImageUrl(item) {
  const raw = String(item.image || '').trim();

  try {
    const url = new URL(raw);

    if (
      url.protocol !== 'https:' ||
      url.hostname !== 'res.cloudinary.com'
    ) {
      return null;
    }

    return url.href;
  } catch {
    return null;
  }
}

export async function POST(request) {
  try {
    const { order } = await request.json();

    if (
      !order ||
      order.status !== 'failed' ||
      !order.customer ||
      !Array.isArray(order.items) ||
      order.items.length === 0
    ) {
      return NextResponse.json(
        { error: 'Invalid order data' },
        { status: 400 }
      );
    }

    const token = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;

    if (!token || !chatId) {
      return NextResponse.json(
        { error: 'Telegram is not configured' },
        { status: 500 }
      );
    }

    const customer = order.customer;
    const orderId = order.orderId || order.rid || 'N/A';

    // Product information, including Google Sheet Product ID
    const products = order.items
      .map((item, index) => {
        return [
          `${index + 1}. ${clean(item.name, 80)}`,
          `🆔 Product ID: ${clean(item.productId, 60)}`,
          `📦 Quantity: ${Number(item.qty) || 0}`,
          `🎨 Color: ${clean(item.color, 40)}`,
          `📏 Size: ${clean(item.size, 40)}`,
        ].join('\n');
      })
      .join('\n\n');

    const date = order.createdAt
      ? new Date(order.createdAt).toLocaleString('en-GB', {
          timeZone: 'Asia/Dhaka',
        })
      : 'N/A';

    const message = [
      '⚠️ ZUNIRAH — ORDER FAILED',
      '',
      '👤 CUSTOMER INFORMATION',
      `Name: ${clean(customer.name)}`,
      `Phone: ${clean(customer.phone)}`,
      `Address: ${clean(customer.address, 200)}`,
      `City: ${clean(customer.city)}`,
      '',
      '🛍️ ORDER INFORMATION',
      `Order ID: ${clean(orderId)}`,
      '',
      'Products:',
      products,
      '',
      `Total: ${Number(order.serverTotal ?? order.total) || 0} BDT`,
      `Error: ${clean(order.error || 'Order failed', 300)}`,
      `Time: ${date}`,
    ].join('\n');

    // Telegram photo captions support up to 1024 characters.
    // Leave space for a truncation notice if necessary.
    const caption =
      message.length > 1024
        ? message.slice(0, 985) + '\n...(details truncated)'
        : message;

    // Collect valid Cloudinary product images.
    const images = order.items
      .map(getImageUrl)
      .filter(Boolean);

    // Remove duplicate images.
    const uniqueImages = [...new Set(images)];

    // CASE 1: No image - send one text message.
    if (uniqueImages.length === 0) {
      await telegramRequest(token, 'sendMessage', {
        chat_id: chatId,
        text: message.slice(0, 4096),
      });

      return NextResponse.json({
        success: true,
        type: 'text',
      });
    }

    // CASE 2: One image - one photo message with full caption.
    if (uniqueImages.length === 1) {
      await telegramRequest(token, 'sendPhoto', {
        chat_id: chatId,
        photo: uniqueImages[0],
        caption,
      });

      return NextResponse.json({
        success: true,
        type: 'single-photo',
      });
    }

    // CASE 3: Multiple images - send one Telegram album.
    // Telegram allows 2 to 10 images per media group.
    // The first photo contains the order information.
    if (uniqueImages.length <= 10) {
      const media = uniqueImages.map((url, index) => ({
        type: 'photo',
        media: url,
        ...(index === 0 ? { caption } : {}),
      }));

      await telegramRequest(token, 'sendMediaGroup', {
        chat_id: chatId,
        media,
      });

      return NextResponse.json({
        success: true,
        type: 'album',
        imageCount: uniqueImages.length,
      });
    }

    // More than 10 images require multiple albums.
    for (let start = 0; start < uniqueImages.length; start += 10) {
      const batch = uniqueImages.slice(start, start + 10);

      const media = batch.map((url, index) => ({
        type: 'photo',
        media: url,
        ...(start === 0 && index === 0 ? { caption } : {}),
      }));

      await telegramRequest(token, 'sendMediaGroup', {
        chat_id: chatId,
        media,
      });
    }

    return NextResponse.json({
      success: true,
      type: 'multiple-albums',
      imageCount: uniqueImages.length,
    });
  } catch (error) {
    console.error('Telegram order notification error:', error.message);

    return NextResponse.json(
      { error: 'Failed to send Telegram notification' },
      { status: 502 }
    );
  }
}
