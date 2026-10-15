'use client';
import { useEffect, useState } from 'react';
import { DNA } from 'react-loader-spinner';

/** Shown while products are loading. Rendered after mount so styled-components never causes a hydration mismatch. */
export default function Loader({ label = 'Loading products', height = 80 }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return (
    <div className="flex min-h-[100vh] flex-col items-center justify-center" role="status" aria-live="polite" aria-busy="true">
      <span className="sr-only">{label}</span>
      {mounted && <DNA visible={true} height={height} width={height} ariaLabel="dna-loading" wrapperStyle={{}} wrapperClass="dna-wrapper" />}
    </div>
  );
}
