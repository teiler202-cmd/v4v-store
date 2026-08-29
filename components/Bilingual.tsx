import { ReactNode } from 'react';

/**
 * 영문 · 국문을 함께 보여주는 조판.
 *
 * 두 언어를 모두 DOM에 그려두고, 순서와 농도만 CSS(`html[data-lang]`)로 바꿉니다.
 * 그래서 언어 감지 결과를 기다리며 깜빡이는 일이 없고, 자바스크립트가 꺼져 있어도
 * 두 언어가 모두 읽힙니다.
 */
export default function Bilingual({
  en,
  ko,
  inline = false,
  className = '',
  enClassName = '',
  koClassName = '',
}: {
  en: ReactNode;
  ko: ReactNode;
  /** 한 줄에 나란히 (짧은 라벨용) */
  inline?: boolean;
  className?: string;
  enClassName?: string;
  koClassName?: string;
}) {
  return (
    <span className={`v4v-bi ${inline ? 'v4v-bi-inline' : ''} ${className}`}>
      <span className={`v4v-bi-en ${enClassName}`}>{en}</span>
      <span className={`v4v-bi-ko ${koClassName}`}>{ko}</span>
    </span>
  );
}
