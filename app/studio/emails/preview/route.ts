import { NextRequest } from 'next/server';
import { notFound } from 'next/navigation';
import { findSample } from '@/lib/email/samples';
import { buildNotifications } from '@/lib/email/shopify';
import { SITE_URL } from '@/lib/brand';

/**
 * 미리보기 iframe 이 읽는 원본 HTML.
 *
 * ⚠️ 개발 중에만 열립니다. 배포된 곳에서는 존재하지 않는 주소가 됩니다 —
 *    메일 본문에는 주문번호·주소 같은 개인정보가 들어가므로,
 *    누구나 열어 볼 수 있는 창구를 만들어 두면 안 됩니다.
 */
export async function GET(request: NextRequest) {
  if (process.env.NODE_ENV === 'production') notFound();

  const id = request.nextUrl.searchParams.get('t') || 'welcome';
  const mode = request.nextUrl.searchParams.get('mode') || 'html';
  const lang = request.nextUrl.searchParams.get('lang') === 'en' ? 'en' : 'ko';

  if (mode === 'liquid') {
    const notification = buildNotifications(lang).find((n) => n.id === id);
    if (!notification) notFound();
    return new Response(notification.liquid, {
      headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' },
    });
  }

  const sample = findSample(id);
  if (!sample) notFound();

  const email = sample.build(lang);

  /**
   * ?local=1 — 메일을 브라우저 창 가득 띄워 볼 때 씁니다.
   *
   * 메일 본문의 이미지는 배포 주소(https://vision4visionary.com/...)를 가리키는 게
   * 맞지만, 로컬에서 그대로 열면 CSP(img-src 'self')가 막아 로고조차 뜨지 않습니다.
   * 그래서 미리보기에서만 같은 경로의 로컬 파일을 보게 바꿉니다.
   * 실제로 발송되는 메일은 이 변환을 거치지 않습니다.
   */
  const local = request.nextUrl.searchParams.get('local') === '1';
  const html = local ? email.html.split(SITE_URL).join('') : email.html;
  const payload = mode === 'text' ? email.text : html;

  return new Response(payload, {
    headers: {
      'Content-Type': mode === 'text' ? 'text/plain; charset=utf-8' : 'text/html; charset=utf-8',
      'Cache-Control': 'no-store',
    },
  });
}
