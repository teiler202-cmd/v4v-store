'use server';

/**
 * 뉴스레터 구독 · 수신거부.
 *
 * 동의 상태는 우리 서버가 아니라 쇼피파이에 기록합니다 —
 * 주문·계정 정보가 이미 그곳에 있고, 캠페인 발송도 결국 그 명단을 봅니다.
 * 우리 쪽에 따로 명단을 두면 두 곳이 어긋나고, 어긋난 명단으로 보낸 메일은
 * 수신거부한 사람에게 도착합니다.
 */

import { rateLimit, tooManyMessage } from '@/lib/rateLimit';
import { subscribeToMarketing, unsubscribeFromMarketing } from '@/lib/shopify-admin';
import { newsletterWelcome } from '@/lib/email/templates';
import { sendEmail } from '@/lib/email/send';
import {
  unsubscribeApiUrl,
  unsubscribeConfigured,
  unsubscribeUrl,
  verifyUnsubscribe,
} from '@/lib/email/unsubscribe';

export type NewsletterResult = { ok: boolean; message: string };

/** 아주 관대한 형식 검사 — 정확한 판정은 어차피 메일이 도착하는지로만 알 수 있습니다 */
function looksLikeEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) && value.length <= 254;
}

export async function subscribeToNewsletter(formData: FormData): Promise<NewsletterResult> {
  const email = String(formData.get('email') || '').trim().toLowerCase();
  // 화면에서 함께 보내 준 언어. 값이 없으면 국문으로 봅니다.
  const lang = formData.get('lang') === 'en' ? 'en' : 'ko';

  if (!looksLikeEmail(email)) {
    return {
      ok: false,
      message: lang === 'ko' ? '메일 주소를 다시 확인해 주세요.' : 'Please check the email address.',
    };
  }

  // 남의 주소를 폼에 밀어 넣어 환영 메일을 퍼붓지 못하게 합니다.
  const limit = await rateLimit('newsletter', { limit: 5, windowMs: 3_600_000, blockMs: 3_600_000 });
  if (!limit.ok) return { ok: false, message: tooManyMessage(limit.retryAfterSec) };

  const consent = await subscribeToMarketing(email);

  if (!consent.ok) {
    if (consent.reason === 'not-configured') {
      console.error('[newsletter] SHOPIFY_ADMIN_ACCESS_TOKEN 이 없어 동의를 기록하지 못했습니다.');
    }
    return {
      ok: false,
      message:
        lang === 'ko'
          ? '지금은 구독 처리를 할 수 없습니다. 잠시 후 다시 시도해 주세요.'
          : 'We cannot process the subscription right now. Please try again shortly.',
    };
  }

  if (consent.already) {
    return {
      ok: true,
      message:
        lang === 'ko'
          ? '이미 구독 중인 주소입니다. 감사합니다.'
          : 'You are already subscribed. Thank you.',
    };
  }

  /**
   * 환영 메일은 부가적인 일입니다 — 실패해도 구독 자체는 이미 성사됐습니다.
   *
   * 다만 수신거부 링크에 서명을 붙일 수 없는 상태(EMAIL_SECRET 없음)라면
   * 보내지 않습니다. 수신거부할 방법이 없는 마케팅 메일은 보내면 안 됩니다.
   */
  if (unsubscribeConfigured()) {
    await sendEmail({
      to: email,
      email: newsletterWelcome({ lang, unsubscribeUrl: unsubscribeUrl(email) }),
      unsubscribeUrl: unsubscribeApiUrl(email),
    });
  } else {
    console.error('[newsletter] EMAIL_SECRET 이 없어 환영 메일을 보내지 않았습니다.');
  }

  return {
    ok: true,
    message:
      lang === 'ko'
        ? '구독이 완료되었습니다. 전할 것이 있을 때만 보내드리겠습니다.'
        : 'You are subscribed. We write only when there is something worth sending.',
  };
}

/** 수신거부 화면의 확인 버튼 */
export async function confirmUnsubscribe(formData: FormData): Promise<NewsletterResult> {
  const email = String(formData.get('email') || '').trim().toLowerCase();
  const token = String(formData.get('token') || '');

  if (!email || !verifyUnsubscribe(email, token)) {
    return { ok: false, message: '링크가 올바르지 않거나 만료되었습니다.' };
  }

  const result = await unsubscribeFromMarketing(email);
  if (!result.ok) {
    return { ok: false, message: '처리에 실패했습니다. 고객센터로 연락 주시면 바로 도와드리겠습니다.' };
  }

  return { ok: true, message: '수신거부가 완료되었습니다. 앞으로 마케팅 메일을 보내지 않습니다.' };
}
