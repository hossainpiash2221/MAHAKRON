"use client";
import { useEffect } from 'react';
import { prefetchDeliverySettings } from '@/lib/delivery-prefetch';

export default function DeliveryPrefetch() {
  useEffect(() => {
    void prefetchDeliverySettings().catch(() => {});
  }, []);
  return null;
}
