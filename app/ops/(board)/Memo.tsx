'use client';

import { useRef, useState, useTransition } from 'react';
import { saveMemo } from '../actions';

/**
 * 사람 칸 바닥에 붙어 있는 쪽지 한 줄.
 *
 * 예전에는 카드 하나로 따로 떠 있었습니다. 지금은 그 사람의 상태 칸 안에서
 * 맨 아래에 붙습니다 — 위(잡은 일·능력치)는 그 사람이 **지금 무엇을 하는가**이고,
 * 여기는 그 사람이 **상대에게 남기는 말**입니다. 한 사람에 대한 것이 한 칸에 모입니다.
 *
 * 남의 칸은 읽기만 됩니다 — 서버도 자기 칸에만 쓰게 막혀 있지만(actions.ts),
 * 화면에서도 고칠 수 없게 해 두면 실수로 남의 글을 지울 일이 없습니다.
 *
 * 저장은 '칸을 벗어날 때' 한 번입니다. 글자마다 저장하면 요청이 쏟아지고,
 * 저장 버튼을 두면 누르는 걸 잊습니다.
 *
 * ⚠️ textarea 는 defaultValue 입니다(제어하지 않습니다). Live.tsx 가 몇십 초마다
 *    화면을 새로 그리는데, 제어된 값이면 그때마다 쓰던 글이 서버 값으로 덮입니다.
 */
export default function Memo({ body, mine }: { body: string; mine: boolean }) {
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
    <div className="shrink-0 border-t border-line-soft bg-mist/40 px-3.5 py-2">
      <p className="mb-0.5 font-mono text-[8px] uppercase tracking-[0.22em] text-ash">
        쪽지{pending ? ' · 저장 중' : ''}
      </p>

      {mine ? (
        <textarea
          ref={ref}
          defaultValue={body}
          onBlur={flush}
          rows={3}
          placeholder="여기에 적으면 상대가 봅니다"
          className="w-full resize-none bg-transparent text-[11.5px] leading-[1.7] outline-none placeholder:text-ash/60"
        />
      ) : (
        <p className="max-h-[76px] overflow-y-auto whitespace-pre-wrap text-[11.5px] leading-[1.7] text-ash">
          {body || '—'}
        </p>
      )}
    </div>
  );
}
