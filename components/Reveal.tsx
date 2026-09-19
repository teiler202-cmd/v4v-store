'use client';

import { ReactNode } from 'react';
import { useRef } from 'react';
import { motion, useReducedMotion, useScroll, useSpring, type Variants } from 'framer-motion';
import { SILK } from '@/lib/ease';

// SILK의 본적은 lib/ease.ts입니다. 여기서 가져다 쓰던 페이지들을 위해 그대로 다시 내보냅니다.
export { SILK };
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
 * 주의: 지금은 자식이 transition에 delay(기본 0)를 늘 실어 보내 framer가 stagger·delay를 덮어씁니다
 * — 실제로는 한꺼번에 뜹니다. 계단식으로 되살리면 눈에 띄게 달라지니 디자인 결정으로 남겨 둡니다.
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
  /** 기본 0 — filter는 매 프레임 요소를 다시 래스터해, 스태거로 여럿이 겹치면
      스크롤 중 페인트 폭풍이 됩니다(특히 사파리). 꼭 필요한 히어로에만 3~4px로 명시하세요. */
  blur = 0,
  duration = 1.35,
  standalone = false,
  delay = 0,
  amount = 0.2,
  style,
}: ItemProps) {
  const reduced = useReducedMotion();

  // y 대신 transform 문자열로 움직입니다 — framer는 transform 계열 중 'transform' 키만
  // WAAPI(합성 스레드)로 넘기고, y 같은 개별 축 값은 매 프레임 JS로 씁니다. 그러면 사파리에서
  // 스크롤·이미지 디코드로 메인 스레드가 막힐 때 글이 떠오르다 멈칫합니다. 끝나면 transitionEnd로
  // transform을 'none'으로 되돌려 예전(y: 0 → none)처럼 쌓임 맥락·fixed 기준 상자를 남기지 않습니다.
  // 같은 요소에 y와 transform을 함께 주면 서로 덮어쓰니 섞지 마세요.
  //
  // 동작 줄이기(reduced)에도 transform(·filter)을 'none'으로 적어 둡니다. useReducedMotion은
  // 서버에서 null, 클라이언트 첫 렌더에서 true라 SSR은 아래 기본 hidden(translateY·blur)을 style에
  // 박아 보냅니다. React는 수화 때 style 불일치를 고치지 않고 framer도 자기 값에 없는 속성은
  // 건드리지 않아, 글이 어긋난 채 남았습니다. 값으로 두면 마운트 직후 framer가 덮어쓰고,
  // visible의 'none'→'none'은 애니메이션 없이 건너뜁니다. (visible에만 두면 행렬→none 보간이 되니 금지)
  const still = { transform: 'none', ...(blur > 0 ? { filter: 'none' } : {}) };
  const variants: Variants = reduced
    ? {
        hidden: { opacity: 0, ...still },
        visible: { opacity, ...still, transition: { duration: 0.3 } },
      }
    : {
        hidden: {
          opacity: 0,
          transform: `translateY(${y}px)`,
          ...(blur > 0 ? { filter: `blur(${blur}px)` } : {}),
        },
        visible: {
          opacity,
          transform: 'translateY(0px)',
          ...(blur > 0 ? { filter: 'blur(0px)' } : {}),
          transition: { duration, ease: SILK, delay },
          transitionEnd: { transform: 'none' },
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
    ? {
        // RevealItem과 같은 이유로 'none'을 명시 — 없으면 SSR의 translateY(106%)가 남아
        // 동작 줄이기 사용자에게 제목이 마스크 아래 숨은 채 보이지 않습니다.
        hidden: { opacity: 0, transform: 'none' },
        visible: { opacity: 1, transform: 'none', transition: { duration: 0.3 } },
      }
    : {
        // RevealItem과 같은 이유로 transform 문자열 + 끝나면 'none' (퍼센트 단위는 그대로)
        hidden: { transform: 'translateY(106%)', opacity: 0 },
        visible: {
          transform: 'translateY(0%)',
          opacity: 1,
          transition: { duration, ease: SILK, delay },
          transitionEnd: { transform: 'none' },
        },
      };

  // 트리거는 반드시 '마스크 바깥'에 걸어야 합니다.
  // 안쪽 요소는 overflow-hidden에 잘려 있어 IntersectionObserver가 영원히 감지하지 못합니다.
  const outer = standalone
    ? ({ initial: 'hidden', whileInView: 'visible', viewport: { once: true, amount } } as const)
    : {};

  return (
    <motion.span className={`block overflow-hidden ${className ?? ''}`} {...outer}>
      {/* will-change는 두지 않습니다 — framer가 애니메이션 중에만 레이어를 승격하고,
          상시 승격은 제목마다 GPU 텍스처를 영구 점유해 레티나에서 글자가 흐려질 수도 있습니다. */}
      <motion.span
        className={`block ${innerClassName ?? ''}`}
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
      /* 본문 폭만 가로지릅니다 — 데스크톱에서는 왼쪽 레일(--v4v-rail) 옆에서 시작합니다. */
      className="pointer-events-none fixed left-[var(--v4v-rail)] right-0 top-0 z-[60] h-px origin-left bg-ink/25"
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
            /* 단어별 blur·will-change 제거 — 긴 문장이면 수십 레이어 + 리래스터가 쌓입니다.
               마스크 슬라이드업(transform)만으로도 충분히 '생각처럼' 떠오릅니다. */
            className="inline-block"
            variants={{
              hidden: { y: '104%', opacity: 0 },
              visible: { y: '0%', opacity: 1 },
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
      {/* will-change-transform: 스크롤마다 scaleY가 바뀌는데, 승격 안 된 요소의 2D transform 변경을
          웹킷은 레이아웃+본문 리페인트로 처리합니다. 2px 폭 레이어라 비용은 사실상 0.
          reduced 여부로 가르지 않습니다 — SSR과 첫 렌더에서 값이 달라 className 수화 불일치가 납니다. */}
      <motion.span
        style={reduced ? { scaleY: 1 } : { scaleY }}
        className="block h-full w-full origin-top bg-ink/15 will-change-transform"
      />
    </span>
  );
}
