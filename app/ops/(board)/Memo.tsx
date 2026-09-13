'use client';

import { useRef, useState, useTransition } from 'react';
import { saveMemo } from '../actions';

/**
 * 팀원별 쪽지 한 칸.
 *
 * 남의 칸은 읽기만 됩니다 — 서버도 자기 칸에만 쓰게 막혀 있지만(actions.ts),
 * 화면에서도 고칠 수 없게 해 두면 실수로 남의 글을 지울 일이 없습니다.
 *
 * 저장은 '칸을 벗어날 때' 한 번입니다. 글자마다 저장하면 요청이 쏟아지고,
 * 저장 버튼을 두면 누르는 걸 잊습니다.
 */
export default function Memo({
  name, body, mine,
}: { name: string; body: string; mine: boolean }) {
  const [saved, setSaved] = useState<string>(body);
  const [pending, start] = useTransition();
  const ref = useRef<HTMLTextAreaElement>(null);

  function flush() {
    const next = ref.current?.value ?? '';
    if (next === saved) return;
    start(async () => {
      const result = await saveMemo(next);
      if (result.ok) setSaved(next);
    });
  }

  return (
    <div className="rounded-[10px] border border-line bg-paper px-3.5 py-3">
      <p className="mb-1 font-mono text-[8px] uppercase tracking-[0.22em] text-ash">
        {name}
        {pending ? ' · 저장 중' : ''}
      </p>
      {mine ? (
        <textarea
          ref={ref}
          defaultValue={body}
          onBlur={flush}
          rows={3}
          placeholder="여기에 적으면 상대가 봅니다"
          className="w-full resize-y bg-transparent text-[12px] leading-[1.75] outline-none placeholder:text-ash/60"
        />
      ) : (
        <p className="whitespace-pre-wrap text-[12px] leading-[1.75] text-ash">
          {body || '—'}
        </p>
      )}
    </div>
  );
}
