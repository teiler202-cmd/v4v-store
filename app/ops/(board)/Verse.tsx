'use client';

import { useState } from 'react';
import type { Verse } from '@/lib/ops/verses';

/**
 * 철학 오른쪽 한 구절.
 *
 * 철학은 우리가 정한 기준이고, 이건 그 기준이 어디서 왔는지입니다.
 * 일하다 막혔을 때 눈을 들 자리가 하나 있어야 해서 여기에 둡니다.
 *
 * 열 때마다 다릅니다. 서버가 그릴 때 여러 구절을 함께 건네주기 때문에,
 * '다른 구절'을 눌러도 서버에 다시 묻지 않고 그 자리에서 바뀝니다.
 */
export default function VerseBox({ verses }: { verses: Verse[] }) {
  const [at, setAt] = useState(0);
  if (verses.length === 0) return null;
  const verse = verses[at % verses.length];

  return (
    /**
     * `w-full` 을 쓰지 않습니다.
     *
     * 세로로 쌓일 때(lg 아래)는 stretch 가 알아서 꽉 채웁니다. 옆으로 설 때만
     * 너비를 못 박으면 되고, 그래야 `lg:w-[...]` 가 어떤 이유로든 빠졌을 때도
     * 이 칸이 100% 로 부풀어 옆의 철학을 0 으로 찌그러뜨리지 않습니다.
     * (page.tsx 의 '가로 칸의 약속' 참고)
     */
    <aside className="shrink-0 border-t border-line-soft pt-3 lg:w-[286px] lg:border-l lg:border-t-0 lg:pl-6 lg:pt-0">
      <div className="flex items-baseline justify-between gap-2">
        <p className="font-mono text-[8px] uppercase tracking-[0.22em] text-ash">Verse</p>
        <button
          type="button"
          onClick={() => setAt(at + 1)}
          className="shrink-0 font-mono text-[8.5px] text-ash transition-colors hover:text-ink"
        >
          다른 구절 ↻
        </button>
      </div>

      {/* key 를 바꿔 주면 구절이 바뀔 때마다 한 번 스며들 듯 들어옵니다 */}
      <div key={at} className="v4v-settle">
        <p className="mt-1.5 break-keep font-serif-ko text-[12.5px] leading-[1.8] text-ink">
          {verse.ko}
        </p>
        <p className="mt-1 font-mono text-[8.5px] tracking-[0.06em] text-ash">
          {verse.koRef}
        </p>
        <p className="mt-1.5 line-clamp-2 font-mono text-[8px] leading-[1.7] text-ash/55">
          {verse.en}
        </p>
      </div>
    </aside>
  );
}
