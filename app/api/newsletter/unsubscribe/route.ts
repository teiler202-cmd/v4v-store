import { NextRequest, NextResponse } from 'next/server';
import { unsubscribeFromMarketing } from '@/lib/shopify-admin';
import { verifyUnsubscribe } from '@/lib/email/unsubscribe';
import { url } from '@/lib/brand';

export const dynamic = 'force-dynamic';

/**
 * 원클릭 수신거부.
 *
 * 지메일·애플메일은 메일 상단에 '수신거부' 버튼을 띄우고, 누르면 사람 대신
 * 이 주소로 POST 를 보냅니다 (RFC 8058). 그래서 화면이 아니라 라우트가 받습니다.
 *
 * GET 으로 들어오면 확인 화면으로 보냅니다 —
 * 메일 앱과 보안 장비가 링크를 미리 열어 보는 일이 흔해서,
 * 클릭 한 번 없이 GET 만으로 수신거부가 되면 안 됩니다.
 */
export async function POST(request: NextRequest) {
  const email = (request.nextUrl.searchParams.get('e') || '').trim().toLowerCase();
  const token = request.nextUrl.searchParams.get('t') || '';

  if (!email || !verifyUnsubscribe(email, token)) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const result = await unsubscribeFromMarketing(email);
  return NextResponse.json({ ok: result.ok }, { status: result.ok ? 200 : 500 });
}

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams.toString();
  return NextResponse.redirect(url(`/newsletter/unsubscribe?${params}`));
}
