'use client';

import { useState, useTransition } from 'react';
import { sendTest } from '@/app/studio/emails/actions';

/** 스튜디오에서 지금 보고 있는 메일을 내 메일함으로 한 통 보냅니다 */
export default function EmailTestSend({
  templateId,
  lang,
}: {
  templateId: string;
  lang: 'ko' | 'en';
}) {
  const [pending, startTransition] = useTransition();
  const [notice, setNotice] = useState<{ ok: boolean; message: string } | null>(null);

  const submit = (formData: FormData) => {
    setNotice(null);
    startTransition(async () => setNotice(await sendTest(formData)));
  };

  return (
    <form action={submit} className="flex flex-wrap items-center gap-3">
      <input type="hidden" name="id" value={templateId} />
      <input type="hidden" name="lang" value={lang} />
      <input
        type="email"
        name="to"
        required
        placeholder="test@example.com"
        disabled={pending}
        className="w-[220px] border-b border-line bg-transparent pb-1.5 text-[12px] text-ink outline-none placeholder:text-ash/50"
      />
      <button
        type="submit"
        disabled={pending}
        className="border border-line px-4 py-2.5 font-mono text-[8.5px] uppercase tracking-[0.2em] text-ink transition-colors duration-300 hover:border-ink disabled:opacity-40"
      >
        {pending ? 'Sending' : 'Send test'}
      </button>
      {notice && (
        <span className={`text-[11px] ${notice.ok ? 'text-ash' : 'text-ink'}`}>{notice.message}</span>
      )}
    </form>
  );
}
