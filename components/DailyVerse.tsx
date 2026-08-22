'use client';

import { useEffect, useState } from 'react';

/** 매일 바뀌는 한 줄 — 조용히 나타났다 자리를 지킵니다. */
export default function DailyVerse() {
  const [verse, setVerse] = useState('');

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await fetch('https://beta.ourmanna.com/api/v1/get?format=json&order=daily');
        const data = await res.json();
        if (alive) setVerse(`${data.verse.details.text} — ${data.verse.details.reference}`);
      } catch {
        if (alive) setVerse('I can do all things through him who strengthens me. — Philippians 4:13');
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  return (
    <div className="mx-auto flex min-h-[46px] w-[86%] max-w-[900px] items-center justify-center border-b border-line-soft py-4 md:min-h-[68px] md:py-6">
      <p
        className={`text-center font-mono text-[8px] uppercase leading-[1.9] tracking-[0.14em] text-ash transition-opacity duration-[1400ms] ease-silk md:text-[9px] md:tracking-[0.22em] ${
          verse ? 'opacity-100' : 'opacity-0'
        }`}
      >
        {verse || '—'}
      </p>
    </div>
  );
}
