'use server';

/**
 * 스튜디오에서 나에게 시험 발송.
 *
 * 브라우저 미리보기가 통과해도 실제 메일 앱에서는 다르게 보입니다 —
 * 특히 아웃룩과 네이버메일은 표를 자기 방식대로 다시 그립니다.
 * 그래서 문구를 확정하기 전에 진짜 메일함으로 한 번 보내 봐야 합니다.
 *
 * ⚠️ 개발 중에만 동작합니다.
 */

import { findSample } from '@/lib/email/samples';
import { mailerConfigured, sendEmail } from '@/lib/email/send';

export async function sendTest(formData: FormData): Promise<{ ok: boolean; message: string }> {
  if (process.env.NODE_ENV === 'production') {
    return { ok: false, message: '배포 환경에서는 사용할 수 없습니다.' };
  }

  const to = String(formData.get('to') || '').trim();
  const id = String(formData.get('id') || '');
  const lang = formData.get('lang') === 'en' ? 'en' : 'ko';

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) {
    return { ok: false, message: '받을 주소를 확인해 주세요.' };
  }

  if (!mailerConfigured()) {
    return { ok: false, message: 'RESEND_API_KEY 가 없어 발송할 수 없습니다.' };
  }

  const sample = findSample(id);
  if (!sample) return { ok: false, message: '템플릿을 찾지 못했습니다.' };

  const email = sample.build(lang);
  const result = await sendEmail({ to, email });

  return result.ok
    ? { ok: true, message: `${to} 로 보냈습니다.` }
    : { ok: false, message: '발송에 실패했습니다. 서버 로그를 확인해 주세요.' };
}
