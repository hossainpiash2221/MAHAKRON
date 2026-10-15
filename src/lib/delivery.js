/**
 * DELIVERY CHARGES. Change them here, in this one file, then restart / redeploy the site.
 * No Google Sheet is read for this, so checkout stays fast.
 *
 * freeAbove: orders with a subtotal at or above this amount get free delivery. 0 = off.
 */
export const DELIVERY = {
  inside:  { label: 'Inside Dhaka',  charge: 80 },
  outside: { label: 'Outside Dhaka', charge: 130 },
  freeAbove: 0,
};

/** zone: 'inside' | 'outside'. Returns null until an area is chosen. Display only: the server sends its own copy of these rates to Apps Script. */
export function deliveryFor(zone, subtotal) {
  if (zone !== 'inside' && zone !== 'outside') return null;
  if (DELIVERY.freeAbove > 0 && subtotal >= DELIVERY.freeAbove) return 0;
  return DELIVERY[zone].charge;
}
