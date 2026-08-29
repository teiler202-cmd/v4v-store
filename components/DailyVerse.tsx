import type { DailyVerse as Verse } from '@/lib/verse';

/** 매일 바뀌는 한 줄 — 영문 위, 국문 아래. */
export default function DailyVerse({ verse }: { verse: Verse }) {
  return (
    <div className="mx-auto flex w-[88%] max-w-[900px] flex-col items-center gap-2 border-b border-line-soft py-5 md:gap-2.5 md:py-7">
      <p className="text-center font-mono text-[8px] uppercase leading-[1.85] tracking-[0.1em] text-ash md:text-[9px] md:tracking-[0.16em]">
        {verse.en} <span className="opacity-60">— {verse.enRef}</span>
      </p>

      {verse.ko && (
        <p className="break-keep text-center font-sans text-[9.5px] leading-[1.8] tracking-[-0.01em] text-ash/70 md:text-[10.5px]">
          {verse.ko} <span className="opacity-70">— {verse.koRef}</span>
        </p>
      )}
    </div>
  );
}
