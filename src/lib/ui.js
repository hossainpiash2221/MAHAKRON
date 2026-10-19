
 // Small browser-only UI helpers

/** Tell the top progress bar that a navigation is starting. */
export function startProgress() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("route-start"));
  }
}

/** Find the currently visible cart button on desktop, tablet or mobile. */
function getCartTarget() {
  if (typeof document === "undefined") return null;

  const targets = [
    document.getElementById("cart-target-mobile"),
    document.getElementById("cart-target"),
  ];

  return (
    targets.find((el) => {
      if (!el || !el.isConnected) return false;

      const rect = el.getBoundingClientRect();
      const style = window.getComputedStyle(el);

      return (
        rect.width > 0 &&
        rect.height > 0 &&
        style.display !== "none" &&
        style.visibility !== "hidden" &&
        Number(style.opacity) !== 0
      );
    }) || null
  );
}

/** Bounce the cart button when the product arrives. */
function bump(el) {
  if (!el || !el.isConnected) return;

  el.animate(
    [
      { transform: "scale(1)" },
      { transform: "scale(1.18)" },
      { transform: "scale(0.96)" },
      { transform: "scale(1.06)" },
      { transform: "scale(1)" },
    ],
    {
      duration: 450,
      easing: "ease-out",
    }
  );
}

/** Shrink a copy of the product image and fly it to the visible cart. */
export function flyToCart(srcEl) {
  if (typeof window === "undefined") return;

  const target = getCartTarget();

  if (!target) return;

  if (
    !srcEl ||
    !srcEl.isConnected ||
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  ) {
    bump(target);
    return;
  }

  // Get the latest positions for the current viewport.
  const start = srcEl.getBoundingClientRect();
  const end = target.getBoundingClientRect();

  if (
    start.width <= 0 ||
    start.height <= 0 ||
    end.width <= 0 ||
    end.height <= 0
  ) {
    bump(target);
    return;
  }

  // Clone the product image/card visual without moving the original.
  const clone = srcEl.cloneNode(true);

  Object.assign(clone.style, {
    position: "fixed",
    left: `${start.left}px`,
    top: `${start.top}px`,
    width: `${start.width}px`,
    height: `${start.height}px`,
    margin: "0",
    padding: "0",
    zIndex: "99999",
    pointerEvents: "none",
    borderRadius: "12px",
    overflow: "hidden",
    transformOrigin: "center center",
    boxShadow: "0 12px 30px rgba(0,0,0,.22)",
    willChange: "transform, opacity",
    boxSizing: "border-box",
  });

  clone.setAttribute("aria-hidden", "true");

  // Prevent duplicate IDs inside the cloned element.
  clone.querySelectorAll("[id]").forEach((el) => {
    el.removeAttribute("id");
  });

  document.body.appendChild(clone);

  const fromX = start.left + start.width / 2;
  const fromY = start.top + start.height / 2;
  const toX = end.left + end.width / 2;
  const toY = end.top + end.height / 2;

  const dx = toX - fromX;
  const dy = toY - fromY;

  const animation = clone.animate(
    [
      {
        transform: "translate3d(0, 0, 0) scale(1)",
        opacity: 1,
        offset: 0,
      },
      {
        transform: `translate3d(${dx * 0.55}px, ${dy * 0.55}px, 0) scale(0.48)`,
        opacity: 0.9,
        offset: 0.58,
      },
      {
        transform: `translate3d(${dx}px, ${dy}px, 0) scale(0.06)`,
        opacity: 0.15,
        offset: 1,
      },
    ],
    {
      duration: 750,
      easing: "cubic-bezier(0.45, 0, 0.7, 1)",
      fill: "forwards",
    }
  );

  animation.onfinish = () => {
    clone.remove();

    // Recheck which cart is visible before bouncing.
    bump(getCartTarget());
  };

  animation.oncancel = () => {
    clone.remove();
  };
}
