// Shared browser-memory delivery settings: one request per page load.
// No timer, polling, storage persistence, or automatic refresh.
let cachedSettings = null;
let pendingRequest = null;

export function getCachedDeliverySettings() {
  return cachedSettings;
}

export function prefetchDeliverySettings() {
  if (cachedSettings) return Promise.resolve(cachedSettings);
  if (pendingRequest) return pendingRequest;

  pendingRequest = fetch('/api/delivery-settings', { cache: 'no-store' })
    .then(async (response) => {
      const result = await response.json();
      if (!response.ok || !result?.success || !result.data) {
        throw new Error(result?.error || 'Delivery settings unavailable.');
      }
      cachedSettings = result.data;
      return cachedSettings;
    })
    .finally(() => {
      // Clear in-flight state on success AND failure; failed calls can retry.
      pendingRequest = null;
    });
  return pendingRequest;
}
