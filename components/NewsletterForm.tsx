'use client';

import { useState, useTransition } from 'react';
import Bilingual from '@/components/Bilingual';
import { subscribeToNewsletter } from '@/app/newsletter/actions';

/**
 * 푸터의 뉴스레터 구독 창구.
 *
 * 밑줄 하나와 화살표만 남긴 형태 — 사이트의 다른 입력들과 같은 규칙입니다.
 * 동의 문구를 함께 두는 건 예의가 아니라 의무입니다(정보통신망법).
 */
export default function NewsletterForm() {
  const [pending, startTransition] = useTransition();
  const [notice, setNotice] = useState<{ ok: boolean; message: string } | null>(null);

  const submit = (formData: FormData) => {
    setNotice(null);
    /**
     * 어느 언어로 보내야 하는지는 지금 이 사람이 보고 있는 화면이 알려 줍니다.
     * (레이아웃의 부트스트랩 스크립트가 첫 페인트 전에 html[data-lang] 을 세워 둡니다)
     */
    formData.set('lang', document.documentElement.getAttribute('data-lang') === 'ko' ? 'ko' : 'en');
    startTransition(async () => {
      const result = await subscribeToNewsletter(formData);
      setNotice(result);
    });
  };

  return (
    <div className="flex w-full max-w-[380px] flex-col gap-3.5">
      <Bilingual
        en="Newsletter"
        ko="새로운 드롭과 아카이브 소식을 가장 먼저"
        className="font-mono text-[8.5px] uppercase tracking-[0.18em] text-ash"
        koClassName="normal-case tracking-[0.02em]"
      />

      <form action={submit} className="flex items-end gap-3 border-b border-line pb-2">
        <input
          type="email"
          name="email"
          required
          autoComplete="email"
          placeholder="your@email.com"
          disabled={pending}
          className="w-full bg-transparent text-[12.5px] tracking-[-0.01em] text-ink outline-none placeholder:text-ash/50 disabled:opacity-40"
        />
        <button
          type="submit"
          disabled={pending}
          aria-label="구독하기"
          className="shrink-0 font-mono text-[8.5px] uppercase tracking-[0.18em] text-ink transition-opacity duration-500 ease-silk hover:opacity-40 disabled:opacity-30"
        >
          {pending ? '···' : 'Subscribe'}
        </button>
      </form>

      {notice && (
        <p
          className={`text-[10.5px] leading-[1.7] tracking-[-0.005em] ${
            notice.ok ? 'text-ash' : 'text-ink'
          }`}
          role="status"
        >
          {notice.message}
        </p>
      )}

      <p className="text-[9.5px] leading-[1.7] text-ash/70">
        구독 시 마케팅 정보 수신에 동의하는 것으로 봅니다. 언제든 메일 하단에서 수신거부하실 수 있습니다.
      </p>
    </div>
  );
}
