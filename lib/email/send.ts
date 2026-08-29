import 'server-only';

/**
 * 메일 발송.
 *
 * 발송 업체에 종속되지 않도록 얇은 층을 하나 두었습니다.
 * 지금은 Resend 를 씁니다(HTTP 하나면 되어서 SDK도 필요 없습니다).
 * 나중에 다른 곳으로 옮기더라도 이 파일만 고치면 됩니다.
 *
 * 필요한 환경변수:
 *   RESEND_API_KEY   — 없으면 실제로 보내지 않고 콘솔에만 남깁니다
 *   EMAIL_FROM       — 예: "V4V <no-reply@vision4visionary.com>"
 *   EMAIL_REPLY_TO   — 생략하면 고객센터 주소
 *
 * ⚠️ 이 함수는 예외를 던지지 않습니다.
 *    가입·주문 같은 본류의 흐름이 '메일 서버가 잠깐 느리다'는 이유로
 *    실패하면 안 되기 때문입니다. 실패는 결과값으로 알려 줍니다.
 */

import { BRAND, CONTACT } from '@/lib/brand';
import type { Email } from './templates';

export type SendResult =
  | { ok: true; id?: string }
  | { ok: false; skipped: true; reason: string }
  | { ok: false; skipped?: false; reason: string };

const ENDPOINT = 'https://api.resend.com/emails';

function from() {
  return process.env.EMAIL_FROM || `${BRAND.short} <onboarding@resend.dev>`;
}

export function mailerConfigured() {
  return Boolean(process.env.RESEND_API_KEY);
}

export async function sendEmail(args: {
  to: string | string[];
  email: Email;
  /** 마케팅 메일이면 수신거부 주소 — 헤더에도 넣어 스팸 분류를 피합니다 */
  unsubscribeUrl?: string;
  replyTo?: string;
}): Promise<SendResult> {
  const { to, email } = args;
  const recipients = Array.isArray(to) ? to : [to];

  if (!mailerConfigured()) {
    // 개발 중에는 무엇이 나갔을지만 알려 주고 조용히 넘어갑니다.
    console.info(
      `[email] 발송 건너뜀 (RESEND_API_KEY 없음) — to=${recipients.join(', ')} / ${email.subject}`
    );
    return { ok: false, skipped: true, reason: 'not-configured' };
  }

  /**
   * 마케팅 메일에는 List-Unsubscribe 헤더가 필요합니다.
   * 지메일·네이버는 이 헤더가 있는 메일을 훨씬 관대하게 다룹니다
   * (본문에만 수신거부 링크가 있으면 스팸함으로 갈 확률이 올라갑니다).
   */
  const headers: Record<string, string> = {};
  if (email.kind === 'marketing' && args.unsubscribeUrl) {
    headers['List-Unsubscribe'] = `<${args.unsubscribeUrl}>`;
    headers['List-Unsubscribe-Post'] = 'List-Unsubscribe=One-Click';
  }

  try {
    const response = await fetch(ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: from(),
        to: recipients,
        reply_to: args.replyTo || process.env.EMAIL_REPLY_TO || CONTACT.cs,
        subject: email.subject,
        html: email.html,
        text: email.text,
        ...(Object.keys(headers).length ? { headers } : {}),
      }),
      signal: AbortSignal.timeout(10_000),
    });

    if (!response.ok) {
      // 응답 본문에는 수신자 주소가 섞여 있어 상태 코드만 남깁니다.
      console.error('[email] 발송 실패 HTTP', response.status, email.id);
      return { ok: false, reason: `http-${response.status}` };
    }

    const data = (await response.json()) as { id?: string };
    return { ok: true, id: data?.id };
  } catch (error) {
    console.error('[email] 발송 오류:', error instanceof Error ? error.message : 'unknown');
    return { ok: false, reason: 'network' };
  }
}
