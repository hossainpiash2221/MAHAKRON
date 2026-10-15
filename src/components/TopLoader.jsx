// "use client";
// import { usePathname, useSearchParams } from "next/navigation";
// import { useCallback, useEffect, useRef, useState } from "react";

// /** Thin bar at the top that runs left to right while the next page loads. */
// export default function TopLoader() {
//   const pathname = usePathname();
//   const searchParams = useSearchParams();
//   const search = searchParams.toString();
//   const [w, setW] = useState(0);
//   const [show, setShow] = useState(false);
//   const tick = useRef(null),
//     safety = useRef(null),
//     first = useRef(true);

//   const done = useCallback(() => {
//     clearInterval(tick.current);
//     clearTimeout(safety.current);
//     setW(100);
//     setTimeout(() => {
//       setShow(false);
//       setW(0);
//     }, 350);
//   }, []);
//   const start = useCallback(() => {
//     clearInterval(tick.current);
//     clearTimeout(safety.current);
//     setShow(true);
//     setW(8);
//     tick.current = setInterval(
//       () => setW((x) => (x < 85 ? x + (90 - x) * 0.08 : x)),
//       200,
//     );
//     safety.current = setTimeout(done, 12000); // never leave the bar hanging
//   }, [done]);

//   useEffect(() => {
//     if (first.current) {
//       first.current = false;
//       return;
//     }

//     done();
//   }, [pathname, search, done]);

//   useEffect(() => {
//     const onClick = (e) => {
//       if (
//         e.defaultPrevented ||
//         e.button !== 0 ||
//         e.metaKey ||
//         e.ctrlKey ||
//         e.shiftKey ||
//         e.altKey
//       )
//         return;
//       const a = e.target.closest && e.target.closest("a");
//       if (
//         !a ||
//         !a.href ||
//         (a.target && a.target !== "_self") ||
//         a.hasAttribute("download")
//       )
//         return;
//       const u = new URL(a.href, location.href);
//       if (
//         u.origin !== location.origin ||
//         (u.pathname === location.pathname && u.search === location.search)
//       )
//         return;
//       start();
//     };
//     document.addEventListener("click", onClick, true);
//     window.addEventListener("route-start", start);
//     return () => {
//       document.removeEventListener("click", onClick, true);
//       window.removeEventListener("route-start", start);
//     };
//   }, [start]);

//   return (
//     <div
//       aria-hidden="true"
//       className="pointer-events-none fixed left-0 top-0 z-[60] h-[3px] w-full"
//     >
//       <div
//         className="h-full bg-pink shadow-[0_0_8px_rgba(15,92,107,.7)] transition-[width,opacity] duration-200 ease-out"
//         style={{ width: w + "%", opacity: show ? 1 : 0 }}
//       />
//     </div>
//   );
// }



"use client";

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";

/** Thin bar at the top that runs left to right while the next page loads. */
function TopLoaderContent() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const search = searchParams.toString();

  const [w, setW] = useState(0);
  const [show, setShow] = useState(false);

  const tick = useRef(null);
  const safety = useRef(null);
  const hideTimer = useRef(null);
  const first = useRef(true);

  const done = useCallback(() => {
    clearInterval(tick.current);
    clearTimeout(safety.current);
    clearTimeout(hideTimer.current);

    setW(100);

    hideTimer.current = setTimeout(() => {
      setShow(false);
      setW(0);
    }, 350);
  }, []);

  const start = useCallback(() => {
    clearInterval(tick.current);
    clearTimeout(safety.current);
    clearTimeout(hideTimer.current);

    setShow(true);
    setW(8);

    tick.current = setInterval(() => {
      setW((x) => (x < 85 ? x + (90 - x) * 0.08 : x));
    }, 200);

    safety.current = setTimeout(done, 12000);
  }, [done]);

  // Finish the progress bar when the URL changes.
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }

    done();
  }, [pathname, search, done]);

  // Start the progress bar when an internal link is clicked.
  useEffect(() => {
    const onClick = (e) => {
      if (
        e.defaultPrevented ||
        e.button !== 0 ||
        e.metaKey ||
        e.ctrlKey ||
        e.shiftKey ||
        e.altKey
      ) {
        return;
      }

      const a = e.target.closest && e.target.closest("a");

      if (
        !a ||
        !a.href ||
        (a.target && a.target !== "_self") ||
        a.hasAttribute("download")
      ) {
        return;
      }

      const u = new URL(a.href, window.location.href);

      if (
        u.origin !== window.location.origin ||
        (u.pathname === window.location.pathname &&
          u.search === window.location.search)
      ) {
        return;
      }

      start();
    };

    document.addEventListener("click", onClick, true);
    window.addEventListener("route-start", start);

    return () => {
      document.removeEventListener("click", onClick, true);
      window.removeEventListener("route-start", start);
    };
  }, [start]);

  // Clean up timers when the component unmounts.
  useEffect(() => {
    return () => {
      clearInterval(tick.current);
      clearTimeout(safety.current);
      clearTimeout(hideTimer.current);
    };
  }, []);

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed left-0 top-0 z-[60] h-[3px] w-full"
    >
      <div
        className="h-full bg-pink shadow-[0_0_8px_rgba(15,92,107,.7)] transition-[width,opacity] duration-200 ease-out"
        style={{
          width: w + "%",
          opacity: show ? 1 : 0,
        }}
      />
    </div>
  );
}

export default function TopLoader() {
  return (
    <Suspense fallback={null}>
      <TopLoaderContent />
    </Suspense>
  );
}
