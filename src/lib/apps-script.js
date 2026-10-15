// // SERVER ONLY. The Apps Script URL and secret never reach the browser.
// export class ApiError extends Error {}

// function config() {
//   const url = process.env.APPS_SCRIPT_URL, secret = process.env.API_SECRET;
//   if (!url || !secret) throw new ApiError('Store is not configured.');
//   return { url, secret };
// }

// async function unwrap(res) {
//   const text = await res.text();
//   let json;
//   try { json = JSON.parse(text); } catch { throw new ApiError('Store service returned an unexpected response.'); }
//   if (!json.success) throw new ApiError(String(json.error || 'Request failed').slice(0, 200));
//   return json.data;
// }

// /** Never waits more than 8 seconds for Google. */
// export async function scriptGet(params) {
//   const { url, secret } = config();
//   const u = new URL(url);
//   Object.entries({ ...params, secret }).forEach(([k, v]) => u.searchParams.set(k, v));
//   const res = await fetch(u, { cache: 'no-store', signal: AbortSignal.timeout(8000) });
//   return unwrap(res);
// }

// export async function scriptPost(body) {
//   const { url, secret } = config();
//   // text/plain avoids a CORS preflight, which Apps Script cannot answer
//   const res = await fetch(url, {
//     method: 'POST',
//     headers: { 'Content-Type': 'text/plain;charset=utf-8' },
//     body: JSON.stringify({ ...body, secret }),
//     cache: 'no-store',
//     redirect: 'follow',
//     signal: AbortSignal.timeout(30000),
//   });
//   return unwrap(res);
// }



// SERVER ONLY. The Apps Script URL and secret never reach the browser.
export class ApiError extends Error {}

function config() {
  const url = process.env.APPS_SCRIPT_URL, secret = process.env.API_SECRET;
  if (!url || !secret) throw new ApiError('Store is not configured.');
  return { url, secret };
}

async function unwrap(res) {
  const text = await res.text();
  let json;
  try { json = JSON.parse(text); } catch { throw new ApiError('Store service returned an unexpected response.'); }
  if (!json.success) throw new ApiError(String(json.error || 'Request failed').slice(0, 200));
  return json.data;
}

/** Waits at most `timeout` ms for Google (default 8 s). */
export async function scriptGet(params, { timeout = 8000 } = {}) {
  const { url, secret } = config();
  const u = new URL(url);
  Object.entries({ ...params, secret }).forEach(([k, v]) => u.searchParams.set(k, v));
  const res = await fetch(u, { cache: 'no-store', signal: AbortSignal.timeout(timeout) });
  return unwrap(res);
}

export async function scriptPost(body) {
  const { url, secret } = config();
  // text/plain avoids a CORS preflight, which Apps Script cannot answer
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify({ ...body, secret }),
    cache: 'no-store',
    redirect: 'follow',
    signal: AbortSignal.timeout(30000),
  });
  return unwrap(res);
}