'use client';

import { useState, useTransition } from 'react';
import { confirmUnsubscribe } from '@/app/newsletter/actions';

/** 수신거부 확인 버튼 — 실제 처리는 서버 액션이 합니다 */
export default function UnsubscribePanel({ email, token }: { email: string; token: string }) {
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);

  const submit = (formData: FormData) => {
    startTransition(async () => setResult(await confirmUnsubscribe(formData)));
  };

  if (result?.ok) {
    return (
      <>
        <h1 className="mt-4 font-grotesk text-[21px] font-bold tracking-[-0.03em] text-ink">
          처리되었습니다
        </h1>
        <p className="mt-4 text-[12.5px] font-light leading-[1.9] text-ash">{result.message}</p>
      </>
    );
  }

  return (
    <>
      <h1 className="mt-4 font-grotesk text-[21px] font-bold tracking-[-0.03em] text-ink">
        마케팅 메일 수신을 중단할까요?
      </h1>
      <p className="mt-4 text-[12.5px] font-light leading-[1.9] text-ash">
        <span className="text-ink">{email}</span> 주소로 더 이상 마케팅 메일을 보내지 않습니다.
        주문·배송처럼 거래에 꼭 필요한 안내 메일은 계속 발송됩니다.
      </p>

      <form action={submit} className="mt-9">
        <input type="hidden" name="email" value={email} />
        <input type="hidden" name="token" value={token} />
        <button
          type="submit"
          disabled={pending}
          className="w-full bg-ink py-4 font-mono text-[9.5px] uppercase tracking-[0.28em] text-paper transition-opacity duration-500 ease-silk hover:opacity-80 disabled:opacity-40"
        >
          {pending ? 'Processing' : 'Unsubscribe'}
        </button>
      </form>

      {result && !result.ok && (
        <p className="mt-4 text-[11px] leading-[1.7] text-ink">{result.message}</p>
      )}
    </>
  );
}
