import 'server-only';

/**
 * 수신거부 링크에 붙는 서명.
 *
 * 주소만 담긴 링크(?e=someone@example.com)는 누구나 주소를 바꿔 넣어
 * 남을 대신 수신거부시킬 수 있습니다. 그래서 주소마다 서명을 붙이고,
 * 서명이 맞을 때만 처리합니다.
 *
 * EMAIL_SECRET 이 없으면 마케팅 메일 발송 자체를 막습니다 —
 * 서명 없는 수신거부 링크를 내보내는 것보다 안 보내는 편이 낫습니다.
 */

import { createHmac, timingSafeEqual } from 'node:crypto';
import { url } from '@/lib/brand';

function secret() {
  const value = process.env.EMAIL_SECRET;
  if (!value) throw new Error('[email] EMAIL_SECRET 이 설정되지 않았습니다.');
  return value;
}

export function unsubscribeConfigured() {
  return Boolean(process.env.EMAIL_SECRET);
}

function sign(email: string) {
  return createHmac('sha256', secret()).update(email.trim().toLowerCase()).digest('base64url');
}

export function unsubscribeUrl(email: string) {
  const params = new URLSearchParams({ e: email, t: sign(email) });
  return url(`/newsletter/unsubscribe?${params}`);
}

/**
 * 원클릭 수신거부용 주소.
 *
 * List-Unsubscribe 헤더는 메일 앱이 사람 대신 POST 를 보내는 곳이라
 * 화면이 아니라 라우트 핸들러를 가리켜야 합니다.
 */
export function unsubscribeApiUrl(email: string) {
  const params = new URLSearchParams({ e: email, t: sign(email) });
  return url(`/api/newsletter/unsubscribe?${params}`);
}

export function verifyUnsubscribe(email: string, token: string) {
  try {
    const expected = Buffer.from(sign(email));
    const given = Buffer.from(token);
    return expected.length === given.length && timingSafeEqual(expected, given);
  } catch {
    return false;
  }
}
