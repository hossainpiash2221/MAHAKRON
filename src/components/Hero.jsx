'use client';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';


/** Put your clip at public/hero.mp4 (short, muted, under ~3 MB). Without it the woven-stripe background shows. */
export default function Hero() {
  const ref = useRef(null);
  const [video, setVideo] = useState(true);
  useEffect(() => { if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) ref.current?.pause(); }, []);


  useEffect(() => {
    if (ref.current) {
      ref.current.playbackRate = 0.70;
    }
  }, []);

  return (
    <section className="relative isolate overflow-hidden  text-white bg-dark_green">
      {video && (
        <video
          ref={ref}
          className="absolute inset-0 -z-20 h-full w-full object-cover object-top opacity-100"
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          aria-hidden="true"
        >
          <source
            src="/hero2.mp4"
            type="video/mp4"
            onError={() => setVideo(false)}
          />
        </video>
      )}
      <div className="hero-weave absolute inset-0 -z-10" aria-hidden="true" />
      <div className="absolute inset-0 -z-10 bg-gradient-to-r from-dark_green/1 via-dark_green/1 to-transparent" aria-hidden="true" />
      <div className="mx-auto flex min-h-[78svh] max-w-7xl flex-col justify-center px-4 py-20">
        <h1 className="font-display text-5xl font-extrabold leading-[1.02] tracking-tight sm:text-7xl">
          <span className="rise block">Elegance</span>
          <span className="rise text-[#c80077] block" style={{ animationDelay: '.12s' }}>your way.</span>
          {/* <span className="rise block" style={{ animationDelay: '.24s' }}>at your door.</span> */}
        </h1>
        <p className="rise mt-6 max-w-md text-lg text-white/85" style={{ animationDelay: '.4s' }}>
          Choose your Product, order in a minute, and pay in cash when it arrives. Finally feel the quality.
        </p>
        <div className="rise mt-8 flex flex-wrap gap-3" style={{ animationDelay: '.52s' }}>
          {/* <Link href="/products" className="rounded bg-white px-6 py-3 font-semibold text-peacock-dark hover:bg-sand">Shop now</Link> */}
          <Link
            href="/products"
            className="group relative inline-flex items-center overflow-hidden rounded bg-pink px-6 py-3 font-semibold text-dark_Green"
          >
            {/* Hover circle */}
            <span
              className="
      absolute bottom-0 left-0
      h-3 w-3
      scale-0 rounded-full
      bg-dark_green
      transition-transform duration-700
      ease-[cubic-bezier(0.4,0,0.2,1)]
      group-hover:scale-[35]
    "
            />

            {/* Text */}
            <span className="relative z-10 transition-colors duration-300 group-hover:text-white">
              Shop now
            </span>
          </Link>
          <a href="#new" className="rounded border border-white/60 px-6 py-3 font-semibold hover:bg-white/10 bg-">Explore New Collection</a>
        </div>
      </div>
    </section>
  );
}
