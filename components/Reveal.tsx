'use client';

import { ReactNode } from 'react';
import { useRef } from 'react';
import { motion, useReducedMotion, useScroll, useSpring, type Variants } from 'framer-motion';

export const SILK = [0.16, 1, 0.3, 1] as const;
export const QUINT = [0.22, 1, 0.36, 1] as const;

type RevealProps = {
  children: ReactNode;
  className?: string;
  /** 자식 요소를 순차적으로 흘려보낼 때의 간격(초) */
  stagger?: number;
  delay?: number;
  amount?: number;
  once?: boolean;
  style?: React.CSSProperties;
};

/**
 * 스크롤에 맞춰 자식들을 한 호흡씩 늦춰 띄우는 컨테이너.
 * 개별 자식은 <RevealItem> 또는 <MaskUp>으로 감싸주세요.
 */
export function Reveal({
  children,
  className,
  stagger = 0.12,
  delay = 0,
  amount = 0.18,
  once = true,
  style,
}: RevealProps) {
  const reduced = useReducedMotion();

  return (
    <motion.div
      className={className}
      style={style}
      initial="hidden"
      whileInView="visible"
      viewport={{ once, amount }}
      variants={{
        hidden: {},
        visible: {
          transition: reduced
            ? {}
            : { delayChildren: delay, staggerChildren: stagger },
        },
      }}
    >
      {children}
    </motion.div>
  );
}

type ItemProps = {
  children: ReactNode;
  className?: string;
  /** 최종 불투명도 — 언어별 위계를 만들 때 사용합니다 */
  opacity?: number;
  y?: number;
  blur?: number;
  duration?: number;
  /** 부모 <Reveal> 없이 단독으로 쓸 때 */
  standalone?: boolean;
  delay?: number;
  amount?: number;
  style?: React.CSSProperties;
};

export function RevealItem({
  children,
  className,
  opacity = 1,
  y = 30,
  blur = 7,
  duration = 1.35,
  standalone = false,
  delay = 0,
  amount = 0.2,
  style,
}: ItemProps) {
  const reduced = useReducedMotion();

  const variants: Variants = reduced
    ? {
        hidden: { opacity: 0 },
        visible: { opacity, transition: { duration: 0.3 } },
      }
    : {
        hidden: { opacity: 0, y, filter: `blur(${blur}px)` },
        visible: {
          opacity,
          y: 0,
          filter: 'blur(0px)',
          transition: { duration, ease: SILK, delay },
        },
      };

  const extra = standalone
    ? ({ initial: 'hidden', whileInView: 'visible', viewport: { once: true, amount } } as const)
    : {};

  return (
    <motion.div className={className} style={style} variants={variants} {...extra}>
      {children}
    </motion.div>
  );
}

type MaskProps = {
  children: ReactNode;
  className?: string;
  innerClassName?: string;
  duration?: number;
  standalone?: boolean;
  delay?: number;
  amount?: number;
};

/**
 * 텍스트가 마스크 아래에서 조용히 밀려 올라오는 연출.
 * 큰 제목에 쓰면 가장 고급스럽게 읽힙니다.
 */
export function MaskUp({
  children,
  className,
  innerClassName,
  duration = 1.4,
  standalone = false,
  delay = 0,
  amount = 0.35,
}: MaskProps) {
  const reduced = useReducedMotion();

  const variants: Variants = reduced
    ? { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { duration: 0.3 } } }
    : {
        hidden: { y: '106%', opacity: 0 },
        visible: {
          y: '0%',
          opacity: 1,
          transition: { duration, ease: SILK, delay },
        },
      };

  // 트리거는 반드시 '마스크 바깥'에 걸어야 합니다.
  // 안쪽 요소는 overflow-hidden에 잘려 있어 IntersectionObserver가 영원히 감지하지 못합니다.
  const outer = standalone
    ? ({ initial: 'hidden', whileInView: 'visible', viewport: { once: true, amount } } as const)
    : {};

  return (
    <motion.span className={`block overflow-hidden ${className ?? ''}`} {...outer}>
      <motion.span
        className={`block will-change-transform ${innerClassName ?? ''}`}
        variants={variants}
      >
        {children}
      </motion.span>
    </motion.span>
  );
}

/** 페이지 상단을 가로지르는 1px 진행선 */
export function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const width = useSpring(scrollYProgress, { stiffness: 120, damping: 30, mass: 0.4 });

  return (
    <motion.div
      aria-hidden
      style={{ scaleX: width }}
      className="pointer-events-none fixed left-0 top-0 z-[60] h-px w-full origin-left bg-ink/25"
    />
  );
}

type WordRevealProps = {
  text: string;
  className?: string;
  /** 단어 사이 간격(초) */
  stagger?: number;
  duration?: number;
  standalone?: boolean;
  amount?: number;
};

/**
 * 문장이 한 단어씩 생각처럼 떠오르는 연출.
 * 마스크 뒤에서 밀려 올라오며 흐림이 걷힙니다.
 */
export function WordReveal({
  text,
  className,
  stagger = 0.045,
  duration = 1.1,
  standalone = true,
  amount = 0.4,
}: WordRevealProps) {
  const reduced = useReducedMotion();
  const words = text.split(' ');

  if (reduced) return <span className={className}>{text}</span>;

  return (
    <motion.span
      className={`inline ${className ?? ''}`}
      initial="hidden"
      {...(standalone
        ? { whileInView: 'visible', viewport: { once: true, amount } }
        : {})}
      variants={{ visible: { transition: { staggerChildren: stagger } } }}
    >
      {words.map((word, index) => (
        <span
          key={`${word}-${index}`}
          className="inline-block overflow-hidden align-bottom"
          style={{ paddingBottom: '0.08em' }}
        >
          <motion.span
            className="inline-block will-change-transform"
            variants={{
              hidden: { y: '104%', opacity: 0, filter: 'blur(5px)' },
              visible: { y: '0%', opacity: 1, filter: 'blur(0px)' },
            }}
            transition={{ duration, ease: SILK }}
          >
            {word}
            {index < words.length - 1 ? '\u00A0' : ''}
          </motion.span>
        </span>
      ))}
    </motion.span>
  );
}

/** 스크롤을 따라 아래로 그어지는 사유의 실선 */
export function ThreadLine({ className = '' }: { className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const reduced = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start 85%', 'end 40%'],
  });
  const scaleY = useSpring(scrollYProgress, { stiffness: 90, damping: 28, mass: 0.5 });

  return (
    <span
      ref={ref}
      aria-hidden
      className={`pointer-events-none absolute bottom-0 top-0 w-px overflow-hidden ${className}`}
    >
      <motion.span
        style={reduced ? { scaleY: 1 } : { scaleY }}
        className="block h-full w-full origin-top bg-ink/15"
      />
    </span>
  );
}
