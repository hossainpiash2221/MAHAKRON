
"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef } from "react";
import { useProducts } from "./ProductsProvider";
import Img from "./Img";

export default function CategoryRow() {
  const { products } = useProducts();

  const sliderRef = useRef(null);
  const trackRef = useRef(null);
  const positionRef = useRef(0);
  const pausedRef = useRef(false);
  const draggingRef = useRef(false);
  const startXRef = useRef(0);
  const startPositionRef = useRef(0);
  const movedRef = useRef(false);
  const suppressClickRef = useRef(false);

  const cats = useMemo(() => {
    const map = new Map();

    products.forEach((p) => {
      if (!p.category) return;

      const c = map.get(p.category) || {
        name: p.category,
        count: 0,
        image: "",
      };

      c.count += 1;

      if (
        !c.image &&
        p.images?.[0] &&
        p.status !== "Out of Stock"
      ) {
        c.image = p.images[0];
      }

      map.set(p.category, c);
    });

    return [...map.values()];
  }, [products]);

  const loopCats = useMemo(
    () => Array.from({ length: 12 }, () => cats).flat(),
    [cats]
  );

  const getLoopWidth = () => {
    const track = trackRef.current;
    if (!track || !cats.length) return 0;

    const first = track.children[0];
    const next = track.children[cats.length];

    if (!first || !next) return 0;

    return next.offsetLeft - first.offsetLeft;
  };

  const updatePosition = () => {
    const track = trackRef.current;
    if (!track) return;

    const width = getLoopWidth();

    if (width > 0) {
      positionRef.current =
        ((positionRef.current % width) + width) % width;
    }

    track.style.transform = `translate3d(${-positionRef.current}px, 0, 0)`;
  };

  // Smooth automatic scrolling
  useEffect(() => {
    if (!cats.length) return;

    let frame;
    let lastTime = 0;

    const speed = 30;

    const animate = (time) => {
      if (!lastTime) lastTime = time;

      const delta = Math.min((time - lastTime) / 1000, 0.05);
      lastTime = time;

      if (!pausedRef.current && !draggingRef.current) {
        positionRef.current += speed * delta;
        updatePosition();
      }

      frame = requestAnimationFrame(animate);
    };

    frame = requestAnimationFrame(animate);

    return () => cancelAnimationFrame(frame);
  }, [cats]);

  const handlePointerDown = (e) => {
    if (e.pointerType === "mouse" && e.button !== 0) return;

    draggingRef.current = true;
    movedRef.current = false;
    suppressClickRef.current = false;

    startXRef.current = e.clientX;
    startPositionRef.current = positionRef.current;
  };

  const handlePointerMove = (e) => {
    if (!draggingRef.current) return;

    const delta = e.clientX - startXRef.current;

    if (Math.abs(delta) > 6) {
      movedRef.current = true;
    }

    if (movedRef.current) {
      positionRef.current = startPositionRef.current - delta;
      updatePosition();
    }
  };

  const handlePointerUp = () => {
    if (!draggingRef.current) return;

    draggingRef.current = false;
    suppressClickRef.current = movedRef.current;
  };

  useEffect(() => {
    const stopDrag = () => {
      draggingRef.current = false;
    };

    window.addEventListener("pointerup", stopDrag);
    window.addEventListener("pointercancel", stopDrag);

    return () => {
      window.removeEventListener("pointerup", stopDrag);
      window.removeEventListener("pointercancel", stopDrag);
    };
  }, []);

  if (!cats.length) return null;

  return (
    <section
      className="mx-auto flex w-full flex-col items-center justify-center  py-10  md:py-14"
      aria-labelledby="shop-cat"
    >
      <h2
        id="shop-cat"
        className="font-display text-3xl font-bold uppercase tracking-tight"
      >
        Shop by category
      </h2>

      <div
        ref={sliderRef}
        className="mt-[40px] w-full overflow-hidden cursor-grab active:cursor-grabbing select-none"
        style={{ touchAction: "pan-y" }}
        onMouseEnter={() => {
          pausedRef.current = true;
        }}
        onMouseLeave={() => {
          pausedRef.current = false;
          draggingRef.current = false;
        }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        <ul
          ref={trackRef}
          className="flex w-max gap-5 pb-3 sm:gap-8"
          style={{ willChange: "transform" }}
        >
          {loopCats.map((c, index) => (
            <li
              key={`${c.name}-${index}`}
              className="shrink-0"
            >
              <Link
                href={`/products?category=${encodeURIComponent(c.name)}`}
                draggable={false}
                onClick={(e) => {
                  if (suppressClickRef.current) {
                    e.preventDefault();
                    suppressClickRef.current = false;
                  }
                }}
                className="group flex w-24 flex-col items-center text-center sm:w-32"
              >
                <span className="block h-24 w-24 overflow-hidden rounded-full border-2 border-transparent bg-mist ring-1 ring-ink/10 transition duration-300 group-hover:border-pink group-hover:shadow-lg sm:h-32 sm:w-32">
                  <Img
                    src={c.image}
                    alt=""
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                </span>

                <span className="mt-3 text-sm font-semibold leading-tight group-hover:text-peacock sm:text-base">
                  {c.name}
                </span>

                <span className="text-xs text-ink/55">
                  {c.count} {c.count === 1 ? "item" : "items"}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
