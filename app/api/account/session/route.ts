import { NextResponse } from 'next/server';
import { CUSTOMER_BRIEF, customerFetch } from '@/lib/shopify-customer';
import { clearSessionToken, getSessionToken } from '@/lib/session';

export const dynamic = 'force-dynamic';

const NO_STORE = { 'Cache-Control': 'no-store' };

/**
 * 헤더 아이콘·주문 분기를 위한 가벼운 로그인 상태 조회.
 *
 * 만료된 세션 쿠키를 정리하는 곳이기도 합니다 —
 * 라우트 핸들러는 쿠키 변경이 허용된 몇 안 되는 지점이라,
 * 서버 컴포넌트 렌더 중에는 할 수 없는 청소를 여기서 대신 합니다.
 */
export async function GET() {
  const token = await getSessionToken();
  if (!token) {
    return NextResponse.json({ customer: null }, { headers: NO_STORE });
  }

  const { data, errors } = await customerFetch(CUSTOMER_BRIEF, { customerAccessToken: token });

  // 통신이 실패한 것뿐이라면 세션은 살아 있을 수 있습니다 — 쿠키를 건드리지 않습니다.
  if (errors?.length) {
    return NextResponse.json({ customer: null, transient: true }, { headers: NO_STORE });
  }

  const customer = data?.customer ?? null;

  // 쇼피파이가 "이 토큰의 고객은 없다"고 확답한 경우에만 쿠키를 버립니다.
  if (!customer) await clearSessionToken();

  return NextResponse.json({ customer }, { headers: NO_STORE });
}
