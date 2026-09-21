'use client';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';

/** The storefront header and footer are hidden inside /admin, which has its own navigation. */
export function StoreChrome({ children }: { children: ReactNode }) {
  return usePathname().startsWith('/admin') ? null : <>{children}</>;
}
