'use client';

import { useState } from 'react';
import type { ModelSpec } from '@/lib/modelSpec';

/**
 * 누끼 딴 모델컷.
 * 마우스를 올리면 얇은 안내선이 모델 쪽으로 뻗어 나오고,
 * 그 끝에 모델 스펙과 착용 사이즈가 조용히 적힙니다.
 */
export default function ModelShot({
  src,
  alt,
  spec,
}: {
  src: string;
  alt: string;
  spec: ModelSpec;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      className="relative aspect-[4/5] w-full overflow-hidden bg-paper"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt}
        className="absolute inset-0 h-full w-full object-contain transition-transform duration-[1400ms] ease-silk"
      />

      <div
        className="pointer-events-none absolute left-0 w-[52%] pl-[6%]"
        style={{ top: `${spec.anchor}%` }}
      >
        <span
          className={`block h-px w-full origin-left bg-white/55 mix-blend-difference transition-transform duration-[900ms] ease-silk ${
            hovered ? 'scale-x-100' : 'scale-x-0'
          }`}
        />
        <div
          className={`mt-2.5 flex flex-col gap-1 transition-all duration-[700ms] ease-silk ${
            hovered ? 'translate-y-0 opacity-100 delay-200' : 'translate-y-1 opacity-0'
          }`}
        >
          {spec.lines.map((line) => (
            <span
              key={line}
              className="font-mono text-[9px] lowercase leading-[1.5] tracking-[0.1em] text-white/75 mix-blend-difference md:text-[9.5px]"
            >
              {line}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
