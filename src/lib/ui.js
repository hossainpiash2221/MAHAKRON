// Small browser-only UI helpers

/** Tell the top progress bar that a navigation is starting (for router.push calls). */
export function startProgress() { if (typeof window !== 'undefined') window.dispatchEvent(new Event('route-start')); }

function bump(el) { el.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.22)' }, { transform: 'scale(1)' }], { duration: 320, easing: 'ease-out' }); }

/** Shrinks a copy of the product image and flies it into the header Cart button. */
export function flyToCart(srcEl) {
  const target = document.getElementById('cart-target');
  if (!target) return;
  if (!srcEl || window.matchMedia('(prefers-reduced-motion: reduce)').matches) { bump(target); return; }
  const a = srcEl.getBoundingClientRect(), b = target.getBoundingClientRect();
  const clone = srcEl.cloneNode(true);
  Object.assign(clone.style, { position: 'fixed', left: a.left + 'px', top: a.top + 'px', width: a.width + 'px', height: a.height + 'px', margin: '0', zIndex: '9999', pointerEvents: 'none', borderRadius: '12px', overflow: 'hidden', transformOrigin: 'center', boxShadow: '0 12px 30px rgba(0,0,0,.25)' });
  clone.setAttribute('aria-hidden', 'true');
  document.body.appendChild(clone);
  const dx = b.left + b.width / 2 - (a.left + a.width / 2), dy = b.top + b.height / 2 - (a.top + a.height / 2);
  const anim = clone.animate([
    { transform: 'translate(0,0) scale(1)', opacity: 1 },
    { transform: `translate(${dx * 0.55}px, ${dy * 0.55 - 30}px) scale(.45)`, opacity: 0.95, offset: 0.55 },
    { transform: `translate(${dx}px, ${dy}px) scale(.06)`, opacity: 0.15 },
  ], { duration: 800, easing: 'cubic-bezier(.45,0,.7,.2)' });
  anim.onfinish = () => { clone.remove(); bump(target); };
  anim.oncancel = () => clone.remove();
}
