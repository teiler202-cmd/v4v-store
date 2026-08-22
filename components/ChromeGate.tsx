'use client';

import { ReactNode } from 'react';
import { usePathname } from 'next/navigation';

/** 자체 헤더로 완결되는 화면(체크아웃)에서는 공통 헤더·푸터를 비웁니다. */
const BARE_ROUTES = ['/checkout'];

export default function ChromeGate({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  if (BARE_ROUTES.includes(pathname)) return null;
  return <>{children}</>;
}
