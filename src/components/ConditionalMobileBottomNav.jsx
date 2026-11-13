
'use client';

import { usePathname } from 'next/navigation';
import MobileBottomNav from '@/components/MobileBottomNav';

export default function ConditionalMobileBottomNav() {
  const pathname = usePathname();

  const isAdmin =
    pathname === '/admin' ||
    pathname?.startsWith('/admin/');

  if (isAdmin) {
    return null;
  }

  return <MobileBottomNav />;
}
