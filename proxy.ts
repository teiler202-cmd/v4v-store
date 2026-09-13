import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * /ops 는 로그인한 사람만.
 *
 * Next 16 부터 미들웨어의 이름이 Proxy 로 바뀌었습니다 (하는 일은 같습니다).
 *
 * ⚠️ 여기서 하는 것은 '눈치껏 걸러내기'일 뿐입니다.
 *    쿠키가 있는지만 봅니다 — 서명이 맞는지, 그런 사람이 있는지는 확인하지 않습니다.
 *    Proxy 는 모든 요청 앞에서 도는 자리라 데이터베이스를 부르면 사이트 전체가 느려지고,
 *    Edge 에서는 node:crypto 로 서명을 검증할 수도 없습니다.
 *
 *    진짜 확인은 화면(currentMember)과 서버 액션(requireMember)에서 합니다.
 *    위조한 쿠키를 들고 와도 여기서만 통과하고 그다음에 막힙니다.
 */
export function proxy(request: NextRequest) {
  const signedIn = request.cookies.has('v4v_ops');
  const { pathname, search } = request.nextUrl;

  if (pathname === '/ops/login') {
    // 이미 들어와 있으면 로그인 화면을 다시 보여 줄 이유가 없습니다.
    if (signedIn) return NextResponse.redirect(new URL('/ops', request.url));
    return NextResponse.next();
  }

  if (!signedIn) {
    const login = new URL('/ops/login', request.url);
    // 로그인 뒤 원래 보려던 곳으로 돌아갑니다.
    if (pathname !== '/ops') login.searchParams.set('next', pathname + search);
    return NextResponse.redirect(login);
  }

  return NextResponse.next();
}

export const config = {
  // 스토어 쪽은 건드리지 않습니다 — /ops 아래만 봅니다.
  matcher: ['/ops', '/ops/:path*'],
};
