'use client';

import { ReactNode } from 'react';
import { usePathname } from 'next/navigation';

/** 자체 헤더로 완결되는 화면(체크아웃)에서는 공통 헤더·푸터를 비웁니다. */
const BARE_ROUTES = ['/checkout'];

/** 손님이 아니라 우리가 쓰는 화면들 — 스토어의 껍데기를 입히지 않습니다. */
const BARE_PREFIXES = ['/ops', '/studio'];

export default function ChromeGate({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  if (BARE_ROUTES.includes(pathname)) return null;
  if (BARE_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(prefix + '/'))) {
    return null;
  }
  return <>{children}</>;
}
