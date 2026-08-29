import 'server-only';
import { cookies } from 'next/headers';

/** 쇼피파이 고객 액세스 토큰을 담아두는 httpOnly 쿠키 이름 */
export const SESSION_COOKIE = 'v4v_customer';

export async function getSessionToken(): Promise<string | null> {
  const store = await cookies();
  return store.get(SESSION_COOKIE)?.value ?? null;
}

export async function setSessionToken(accessToken: string, expiresAt: string) {
  const store = await cookies();
  const expires = new Date(expiresAt);
  store.set(SESSION_COOKIE, accessToken, {
    httpOnly: true, // 자바스크립트가 토큰에 접근할 수 없습니다
    // 배포된 곳에서는 https가 아니면 쿠키를 보내지 않습니다.
    //
    // 개발 중(next dev)에만 예외를 둡니다 — 사파리는 http://localhost 에서
    // Secure 쿠키를 아예 저장하지 않아서, 켜 두면 로컬에서 로그인 테스트가 불가능합니다.
    // (크롬은 localhost를 안전한 곳으로 쳐 주지만 사파리는 그렇지 않습니다)
    secure: process.env.NODE_ENV !== 'development',
    sameSite: 'lax',
    path: '/',
    expires: Number.isNaN(expires.getTime()) ? undefined : expires,
  });
}

export async function clearSessionToken() {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}
