'use client';

import { useState } from 'react';

/** 긴 코드를 한 번에 복사하기 위한 작은 버튼 */
export default function CopyBlock({ code, label = 'Copy' }: { code: string; label?: string }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  };

  return (
    <button
      type="button"
      onClick={copy}
      className="bg-ink px-4 py-2.5 font-mono text-[8.5px] uppercase tracking-[0.2em] text-paper transition-opacity duration-500 ease-silk hover:opacity-80"
    >
      {copied ? 'Copied' : label}
    </button>
  );
}
