'use client';

import { useEffect, useState } from 'react';

type Lang = 'en' | 'ko';

/**
 * 언어 우선순위 토글.
 * 두 언어는 항상 함께 보이고, 어느 쪽을 먼저 크게 볼지만 바뀝니다.
 */
export default function LanguageToggle({ className = '' }: { className?: string }) {
  const [lang, setLang] = useState<Lang>('en');

  useEffect(() => {
    const current = document.documentElement.getAttribute('data-lang');
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLang(current === 'ko' ? 'ko' : 'en');
  }, []);

  const choose = (next: Lang) => {
    setLang(next);
    document.documentElement.setAttribute('data-lang', next);
    try {
      window.localStorage.setItem('v4v:lang', next);
    } catch {
      /* 프라이빗 모드 — 무시 */
    }
  };

  return (
    <div className={`flex items-center gap-2.5 ${className}`} aria-label="Language">
      {(['en', 'ko'] as Lang[]).map((code) => (
        <button
          key={code}
          onClick={() => choose(code)}
          aria-pressed={lang === code}
          className={`font-mono text-[8.5px] uppercase tracking-[0.18em] transition-colors duration-500 ease-silk ${
            lang === code ? 'text-ink' : 'text-ash hover:text-ink'
          }`}
        >
          {code === 'en' ? 'EN' : 'KO'}
        </button>
      ))}
    </div>
  );
}
