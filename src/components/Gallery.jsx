'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import Img from './Img';

const Icon = ({ d }) => (
  <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={d} /></svg>
);

function Lightbox({ images, alt, index, setIndex, onClose }) {
  const many = images.length > 1;
  const closeRef = useRef(null);
  const startX = useRef(null), moved = useRef(false);
  const go = useCallback((d) => setIndex((c) => (c + d + images.length) % images.length), [images.length, setIndex]);

  useEffect(() => {
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';                         // page behind must not scroll
    closeRef.current?.focus();
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
      else if (e.key === 'ArrowRight' && many) go(1);
      else if (e.key === 'ArrowLeft' && many) go(-1);
    };
    document.addEventListener('keydown', onKey);
    return () => { document.body.style.overflow = prevOverflow; document.removeEventListener('keydown', onKey); };
  }, [go, many, onClose]);

  const down = (e) => { startX.current = e.clientX; moved.current = false; };
  const up = (e) => {
    if (startX.current == null) return;
    const dx = e.clientX - startX.current; startX.current = null;
    if (Math.abs(dx) > 10) moved.current = true;
    if (many && Math.abs(dx) > 50) go(dx < 0 ? 1 : -1);
  };
  const btn = 'flex h-11 w-11 items-center justify-center rounded-full bg-white/15 text-white backdrop-blur transition hover:bg-white/30 focus-visible:outline-white';

  return (
    <div role="dialog" aria-modal="true" aria-label={`${alt} images`} className="fixed inset-0 z-[70] flex flex-col bg-black/95">
      <div className="flex items-center justify-between p-3 sm:p-4">
        <p className="text-sm font-medium tabular-nums text-white/80" aria-live="polite">{many ? `${index + 1} / ${images.length}` : ''}</p>
        <button ref={closeRef} type="button" onClick={onClose} aria-label="Close full screen image" className={btn}><Icon d="M6 6l12 12M18 6L6 18" /></button>
      </div>

      <div className="relative min-h-0 flex-1 overflow-hidden" style={{ touchAction: 'pan-y' }} onPointerDown={down} onPointerUp={up} onPointerCancel={() => { startX.current = null; }}>
        <div className="flex h-full transition-transform duration-300 ease-out motion-reduce:transition-none" style={{ transform: `translateX(-${index * 100}%)` }}>
          {images.map((src, n) => (
            <div key={src} className="flex h-full w-full shrink-0 items-center justify-center p-2 sm:p-10" onClick={(e) => { if (e.target === e.currentTarget && !moved.current) onClose(); }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt={`${alt} ${n + 1} of ${images.length}`} draggable={false} referrerPolicy="no-referrer" loading={Math.abs(n - index) <= 1 ? 'eager' : 'lazy'} className="max-h-full max-w-full select-none object-contain" />
            </div>
          ))}
        </div>
        {many && (
          <>
            <button type="button" onClick={() => go(-1)} aria-label="Previous image" className={`${btn} absolute left-2 top-1/2 -translate-y-1/2 sm:left-5`}><Icon d="M15 18l-6-6 6-6" /></button>
            <button type="button" onClick={() => go(1)} aria-label="Next image" className={`${btn} absolute right-2 top-1/2 -translate-y-1/2 sm:right-5`}><Icon d="M9 6l6 6-6 6" /></button>
          </>
        )}
      </div>

      {many && (
        <div className="flex justify-center gap-2 p-3 sm:p-4">
          {images.map((src, n) => (
            <button key={src} type="button" onClick={() => setIndex(n)} aria-label={`Show image ${n + 1}`} aria-current={n === index}
              className={`h-16 w-12 overflow-hidden rounded border-2 transition ${n === index ? 'border-white' : 'border-transparent opacity-60 hover:opacity-100'}`}>
              <Img src={src} className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function Gallery({ images, alt }) {
  const [i, setI] = useState(0);
  const [open, setOpen] = useState(false);
  const opener = useRef(null);
  const close = useCallback(() => { setOpen(false); setTimeout(() => opener.current?.focus(), 0); }, []);

  return (
    <div>
      <button ref={opener} type="button" onClick={() => images.length && setOpen(true)} aria-label="View full screen" className="group relative block w-full cursor-zoom-in">
        <div data-fly-src className="aspect-[4/5] overflow-hidden rounded bg-mist">
          <Img src={images[i]} alt={alt} priority className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.02]" />
        </div>
        {images.length > 0 && (
          <span className="pointer-events-none absolute bottom-3 right-3 flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-ink shadow" aria-hidden="true">
            <Icon d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />
          </span>
        )}
      </button>
      {images.length > 1 && (
        <div className="mt-3 flex gap-2">
          {images.map((src, n) => (
            <button key={src} type="button" onClick={() => setI(n)} aria-label={`Show image ${n + 1}`} aria-pressed={n === i}
              className={`h-20 w-16 overflow-hidden rounded border-2 ${n === i ? 'border-peacock' : 'border-transparent'}`}>
              <Img src={src} className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}
      {open && <Lightbox images={images} alt={alt} index={i} setIndex={setI} onClose={close} />}
    </div>
  );
}