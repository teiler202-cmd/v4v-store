'use client';

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { motion } from 'framer-motion';
import type { OrbStage } from '@/components/intro/orbStage';
import { ORB, type WorldId } from '@/components/orb/assets';
import { spinAngle } from '@/components/orb/spin';
import { getWorld } from '@/components/orb/world';

const SILK = [0.16, 1, 0.3, 1] as const;
const SILK_CSS = 'cubic-bezier(0.16, 1, 0.3, 1)';

const SLOGAN = ['VISION IN MOTION,', 'PERFORMANCE IN ACTION'];

/**
 * 구체 사진 후보.
 * 휴대폰에는 일부러 작게(256px) 알려 768px(DPR 3)·512px(DPR 2)를 받게 합니다 —
 * 원래 부드러운 사진이라 눈으로는 차이가 없고, 전송량은 1024px의 1/3 이하입니다.
 * 두 세계의 구체를 모두 그려 두고 CSS(html[data-world])가 한쪽만 보여줍니다 —
 * 숨은 쪽은 lazy라 내려받지 않으며, 첫 페인트부터 지금 세계의 구체가 맞게 보입니다.
 */
const srcsetOf = (world: WorldId) =>
  `${ORB[world].image[512]} 512w, ${ORB[world].image[768]} 768w, ${ORB[world].image[1024]} 1024w`;
const ORB_SIZES = '(min-width: 640px) 460px, 256px';

/** 구체가 흐릿하게 떠오르는 시간(초) — 끝나면 캔버스가 넘겨받아 돌기 시작합니다. */
const ENTER_DURATION = 1.8;
/** 다이브를 시작하고 슬로건이 떠오르기 시작하는 시각(초) — 아직 안으로 들어가는 중입니다. */
const SLOGAN_AT = 1.05;
/** 슬로건이 선명해지는 시간(초) */
const SLOGAN_FADE = 0.9;
/** 선명해진 슬로건을 안쪽 빛 속에서 머금고 있는 시간(초) */
const SLOGAN_HOLD = 1.55;
/** 베일이 걷히며 사이트가 드러나는 시간(초) — 구체 안쪽 빛이 사이트의 공기로 풀어집니다. */
const LEAVE_DURATION = 1.3;
/** 이 시간이 지나면 화면을 눌러 슬로건을 건너뛸 수 있습니다(초) — 입장 클릭이 곧바로 건너뛰기로 이어지지 않게 */
const SKIP_AFTER = 1.2;
/** WebGL 없이 구체가 사라지는 시간(초) */
const FALLBACK_OUT = 0.9;

type Phase = 'orb' | 'dive' | 'slogan' | 'leaving';

const NO_OP = () => () => {};

/** 부트스트랩 스크립트가 남긴 표식을 읽습니다 — 이미 본 세션인지 여부. */
function readIntroSeen() {
  return document.documentElement.getAttribute('data-intro') === 'done';
}

/* -----------------------------------------------------------
   INTRO
   1. 구체 로고가 흐릿하게 떠오릅니다. (서버에서 그린 <img> — 그 전엔 HTML에 실린 24px 미리보기)
   2. WebGL 무대가 같은 자리를 넘겨받아, 글자·광택은 그대로 둔 채
      안쪽 대리석만 3D로 천천히 돌립니다.
   3. 구체를 누르면 카메라가 구체 '안으로' 빨려 들어갑니다 —
      유리 껍질이 스쳐 지나가고, 안쪽 결이 화면을 가득 채웁니다.
   4. 들어가는 도중 슬로건이 떠오르고, 베일이 걷히면
      안쪽의 빛이 그대로 사이트의 공기(배경)로 이어집니다.
   ----------------------------------------------------------- */
export default function Intro() {
  // 이미 본 세션이라면 렌더 자체를 건너뜁니다.
  // (CSS가 첫 페인트부터 가려두기 때문에 깜빡임 없이 이어집니다)
  const alreadySeen = useSyncExternalStore(NO_OP, readIntroSeen, () => false);

  const [phase, setPhase] = useState<Phase>('orb');
  const [finished, setFinished] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const midbarImgRef = useRef<HTMLImageElement>(null);
  const edenImgRef = useRef<HTMLImageElement>(null);
  const worldRef = useRef<WorldId>('midbar');
  const lqipRef = useRef<HTMLSpanElement>(null);
  const sloganRef = useRef<HTMLParagraphElement>(null);
  const stageRef = useRef<OrbStage | null>(null);
  const phaseRef = useRef<Phase>('orb');
  const timers = useRef<number[]>([]);
  /** 다이브의 출발 자리 — 클릭 순간의 구체 위치를 기억합니다. */
  const diveFrom = useRef<DOMRectReadOnly | null>(null);
  /** 프레임마다 바뀌는 값들 — 리렌더 없이 rAF 루프가 읽고 씁니다. */
  const clock = useRef({
    readyAt: 0,
    spin: 0,
    lastFrame: 0,
    handedOff: false,
    enteredAt: 0,
    diving: false,
  });

  /** 지금 세계의 구체 <img> — 반대 세계 것은 display:none이라 비어 있습니다. */
  const orbImg = useCallback(
    () => (worldRef.current === 'eden' ? edenImgRef.current : midbarImgRef.current),
    [],
  );

  const go = useCallback((next: Phase) => {
    phaseRef.current = next;
    setPhase(next);
  }, []);

  const later = useCallback((fn: () => void, seconds: number) => {
    timers.current.push(window.setTimeout(fn, seconds * 1000));
  }, []);

  const hidePlaceholder = useCallback(() => {
    if (lqipRef.current) lqipRef.current.style.opacity = '0';
  }, []);

  /**
   * 구체 사진이 도착한 시각을 기록합니다. 등장 애니메이션은 CSS가 이미 시작했으므로(<html data-orb-loaded>),
   * 여기서는 캔버스가 넘겨받을 시점을 계산할 기준만 잡습니다.
   */
  const markImageReady = useCallback(() => {
    if (clock.current.readyAt) return;
    const root = document.documentElement;
    // 부트스트랩 스크립트가 표시하지 못한 경우(드묾)에도 등장 애니메이션이 시작되도록 직접 표시합니다.
    if (!root.dataset.orbLoaded) root.dataset.orbLoaded = String(Math.round(performance.now()));
    clock.current.readyAt = Number(root.dataset.orbLoaded) || performance.now();
  }, []);

  // 하이드레이션 전에 이미 로드가 끝났다면 onLoad가 오지 않습니다.
  useEffect(() => {
    worldRef.current = getWorld();
    const img = orbImg();
    if (img?.complete && img.naturalWidth > 0) markImageReady();
  }, [markImageReady, orbImg]);

  /** WebGL 없이 구체를 흐리며(또는 조용히) 지웁니다 — 등장 도중에 눌러도 지금 모습에서 이어서 사라집니다. */
  const fadeOrbOut = useCallback((reduced: boolean) => {
    const img = orbImg();
    if (!img) return;
    const now = getComputedStyle(img);
    const from = { opacity: now.opacity, filter: now.filter, transform: now.transform };
    img.getAnimations?.().forEach((animation) => animation.cancel());
    Object.assign(img.style, from);
    void img.offsetWidth; // 지금 값에서 출발하도록 한 번 반영합니다.
    img.style.transition = ['opacity', 'filter', 'transform']
      .map((prop) => `${prop} ${FALLBACK_OUT}s ${SILK_CSS}`)
      .join(', ');
    img.style.opacity = '0';
    if (!reduced) {
      img.style.filter = 'blur(12px)';
      img.style.transform = 'scale(1.04)';
    }
  }, [orbImg]);

  useEffect(() => () => timers.current.forEach((id) => window.clearTimeout(id)), []);

  const finish = useCallback(() => {
    document.documentElement.setAttribute('data-intro', 'done');
    setFinished(true);
  }, []);

  /** 베일을 걷고 사이트로 들어갑니다 — 구체 안쪽의 빛이 흐려지며 공기색에 녹아듭니다. */
  const leave = useCallback(() => {
    if (phaseRef.current === 'leaving') return;
    go('leaving');
    // 베일이 걷히는 동안 헤더·푸터가 떠오릅니다.
    document.documentElement.setAttribute('data-intro', 'revealing');
    const canvas = canvasRef.current;
    if (canvas) {
      canvas.style.transition = ['opacity', 'filter']
        .map((prop) => `${prop} ${LEAVE_DURATION}s ${SILK_CSS}`)
        .join(', ');
      canvas.style.opacity = '0';
      canvas.style.filter = 'blur(12px)';
    }
    later(finish, LEAVE_DURATION);
  }, [finish, go, later]);

  /** 슬로건이 선명해지기 시작했습니다 — 잠시 머문 뒤 입장합니다. */
  const showSlogan = useCallback(() => {
    if (phaseRef.current !== 'dive') return;
    const slogan = sloganRef.current;
    if (slogan) {
      slogan.style.transition = `opacity ${SLOGAN_FADE}s ${SILK_CSS}`;
      slogan.style.opacity = '1';
    }
    go('slogan');
    later(leave, SLOGAN_FADE * 0.6 + SLOGAN_HOLD);
  }, [go, later, leave]);

  /** WebGL 없이: 구체가 사라진 자리에 슬로건이 조용히 떠오릅니다. */
  const revealSloganPlainly = useCallback(() => {
    showSlogan();
  }, [showSlogan]);

  /* ---------- WebGL 무대 + 프레임 루프 ---------- */
  useEffect(() => {
    if (alreadySeen) return;
    worldRef.current = getWorld();
    const canvas = canvasRef.current;
    const img = orbImg();
    if (!canvas || !img) return;
    // 움직임을 줄이도록 설정한 방문자에게는 멈춘 로고만 보여줍니다.
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    let disposed = false;
    let raf = 0;
    /** 구체 자리 캐시 — 인트로 중 레이아웃은 고정이라 매 프레임 재지 않습니다(강제 동기 레이아웃 방지). */
    let orbRect: DOMRectReadOnly | null = null;
    const onResize = () => {
      orbRect = null;
    };
    window.addEventListener('resize', onResize);

    const frame = (now: number) => {
      const stage = stageRef.current;
      const c = clock.current;
      if (!stage) return;

      // GPU가 컨텍스트를 거둬 가면: 다이브 중이었다면 슬로건만 조용히 띄우고, 아니면 원래 사진으로 되돌립니다.
      if (stage.isLost()) {
        if (c.diving) {
          canvas.style.opacity = '0';
          revealSloganPlainly();
        } else {
          img.style.opacity = '';
        }
        return;
      }

      raf = requestAnimationFrame(frame);

      if (c.diving) {
        // 탭을 오래 비웠다가 돌아와도 회전이 튀지 않도록 한 프레임 간격을 묶어 둡니다.
        c.spin += Math.min(now - c.lastFrame, 50) / 1000;
        c.lastFrame = now;
        const from = diveFrom.current;
        if (from) stage.drawDive(from, spinAngle(c.spin), (now - c.enteredAt) / 1000);
        return;
      }

      if (!c.readyAt || now - c.readyAt < (ENTER_DURATION + 0.1) * 1000) return;

      if (c.handedOff) c.spin += Math.min(now - c.lastFrame, 50) / 1000;
      c.lastFrame = now;
      if (!orbRect) orbRect = img.getBoundingClientRect();
      stage.drawOrb(orbRect, spinAngle(c.spin));
      if (!c.handedOff) {
        // 회전각 0의 첫 프레임은 원본 사진과 같은 그림입니다 — 같은 프레임에 <img>를 내립니다.
        c.handedOff = true;
        img.style.opacity = '0';
        hidePlaceholder();
      }
    };

    // 무대(WebGL) 코드는 인트로를 볼 때만 불러옵니다.
    import('@/components/intro/orbStage')
      .then(async ({ createOrbStage }) => {
        if (disposed) return;
        const sizePx = img.getBoundingClientRect().width * Math.min(window.devicePixelRatio || 1, 2);
        const stage = await createOrbStage(canvas, { image: img, sizePx, spec: ORB[worldRef.current] });
        if (disposed) {
          stage?.destroy();
          return;
        }
        stageRef.current = stage;
        if (!stage) return;
        raf = requestAnimationFrame(frame);
      })
      .catch(() => {
        /* WebGL을 쓸 수 없으면 <img> 그대로 둡니다 */
      });

    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', onResize);
      stageRef.current?.destroy();
      stageRef.current = null;
    };
  }, [alreadySeen, hidePlaceholder, orbImg, revealSloganPlainly]);

  /* ---------- 입장: 구체 안으로 ---------- */
  const enter = useCallback(() => {
    if (phaseRef.current !== 'orb') return;
    const stage = stageRef.current;
    const img = orbImg();
    const c = clock.current;

    go('dive');
    c.enteredAt = performance.now();
    hidePlaceholder();
    try {
      window.sessionStorage.setItem('v4v:intro', '1');
    } catch {
      /* 프라이빗 모드 등 — 무시 */
    }

    if (stage && img && !stage.isLost()) {
      // 클릭한 순간의 자리에서 곧장 안으로 — 첫 프레임을 클릭과 같은 심박에 그려 공백이 없습니다.
      const from = img.getBoundingClientRect();
      diveFrom.current = from;
      c.diving = true;
      if (!c.handedOff) {
        c.handedOff = true;
        c.lastFrame = c.enteredAt;
      }
      stage.drawDive(from, spinAngle(c.spin), 0);
      img.style.opacity = '0';
      later(showSlogan, SLOGAN_AT);
    } else {
      // WebGL을 쓸 수 없거나 움직임을 줄이도록 설정한 경우 — 흐려지며(또는 조용히) 사라집니다.
      fadeOrbOut(window.matchMedia('(prefers-reduced-motion: reduce)').matches);
      later(revealSloganPlainly, FALLBACK_OUT * 0.6);
    }
  }, [fadeOrbOut, go, hidePlaceholder, later, orbImg, revealSloganPlainly, showSlogan]);

  /** 슬로건이 떠오른 뒤에는 화면 어디를 눌러도 바로 들어갑니다. */
  const skip = useCallback(() => {
    const p = phaseRef.current;
    const elapsed = (performance.now() - clock.current.enteredAt) / 1000;
    if (p === 'slogan' || (p === 'dive' && elapsed > SKIP_AFTER)) leave();
  }, [leave]);

  if (alreadySeen || finished) return null;

  return (
    <div className="v4v-intro">
      <motion.div
        /* 베일도 세계의 공기색 — 에덴에서 눈을 뜨면 흰 종이가 아니라 동산의 새벽빛입니다 */
        className={`fixed inset-0 z-[70] flex items-center justify-center bg-[var(--v4v-veil)] ${
          phase === 'orb' ? '' : 'cursor-pointer'
        }`}
        initial={false}
        animate={{ opacity: phase === 'leaving' ? 0 : 1 }}
        transition={{ duration: LEAVE_DURATION, ease: SILK }}
        style={{ pointerEvents: phase === 'leaving' ? 'none' : 'auto' }}
        onClick={skip}
      >
        <button
          type="button"
          onClick={enter}
          aria-label="Enter VISION FOR VISIONARY"
          className="relative block cursor-pointer rounded-full outline-none transition-transform duration-700 ease-silk hover:scale-[1.015] focus-visible:outline-1 focus-visible:outline-offset-8 focus-visible:outline-ink/25"
        >
          {/* 두 세계의 구체가 같은 자리에 겹쳐 있고, CSS가 지금 세계만 보여줍니다.
              크기는 이 래퍼가 잡습니다 — 어느 세계가 숨어도 무대가 무너지지 않습니다. */}
          <span className="relative block aspect-square h-auto w-[min(72vw,52svh,460px)]">
          {/* 사진이 도착하기 전부터 보이는 흐릿한 윤곽 (HTML에 실린 24px, 자바스크립트 없이 떠오릅니다) */}
          <span ref={lqipRef} aria-hidden className="absolute inset-0">
            <span
              className="v4v-orb-lqip v4v-w-midbar absolute inset-0 rounded-full bg-cover bg-center"
              style={{ backgroundImage: `url("${ORB.midbar.lqip}")` }}
            />
            <span
              className="v4v-orb-lqip v4v-w-eden absolute inset-0 rounded-full bg-cover bg-center"
              style={{ backgroundImage: `url("${ORB.eden.lqip}")` }}
            />
          </span>
          {/* 등장 애니메이션은 CSS(.v4v-orb-img)가 사진 도착 즉시 시작합니다 — 자바스크립트를 기다리지 않습니다. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            ref={midbarImgRef}
            data-orb-img="midbar"
            src={ORB.midbar.image[768]}
            srcSet={srcsetOf('midbar')}
            sizes={ORB_SIZES}
            alt=""
            width={1024}
            height={1024}
            fetchPriority="high"
            draggable={false}
            onLoad={() => getWorld() === 'midbar' && markImageReady()}
            onError={() => getWorld() === 'midbar' && finish()}
            className="v4v-orb-img v4v-w-midbar absolute inset-0 block h-full w-full select-none rounded-full"
          />
          {/* EDEN에서 눈을 뜬 방문자를 위한 구체 — 반대 세계에서는 내려받지 않습니다(lazy + display:none). */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            ref={edenImgRef}
            data-orb-img="eden"
            src={ORB.eden.image[768]}
            srcSet={srcsetOf('eden')}
            sizes={ORB_SIZES}
            alt=""
            width={1024}
            height={1024}
            loading="lazy"
            fetchPriority="high"
            draggable={false}
            onLoad={() => getWorld() === 'eden' && markImageReady()}
            onError={() => getWorld() === 'eden' && finish()}
            className="v4v-orb-img v4v-w-eden absolute inset-0 block h-full w-full select-none rounded-full"
          />
          </span>
        </button>
      </motion.div>

      <canvas
        ref={canvasRef}
        aria-hidden
        className="pointer-events-none fixed inset-0 z-[71] h-full w-full"
      />

      {/* ---------- 브랜드 슬로건 ----------
          다이브가 화면을 가득 채운 안쪽 빛 위로 떠올라야 하므로, 캔버스보다 위(z-72)에 둡니다. */}
      <div
        className={`pointer-events-none fixed inset-0 z-[72] flex items-center justify-center px-6 transition-[opacity,filter] ease-silk ${
          phase === 'leaving' ? 'opacity-0 blur-[8px]' : ''
        }`}
        style={{ transitionDuration: `${LEAVE_DURATION}s` }}
      >
        <p
          ref={sloganRef}
          className="flex max-w-[1150px] flex-wrap items-baseline justify-center gap-x-[0.42em] gap-y-[0.16em] font-sans text-[19px] font-semibold uppercase leading-[1.05] tracking-[-0.03em] text-ink opacity-0 [word-spacing:0.17em] min-[420px]:text-[22px] sm:text-[26px] md:text-[36px] lg:text-[42px]"
        >
          {SLOGAN.map((phrase) => (
            <span key={phrase} className="whitespace-nowrap">
              {phrase}
            </span>
          ))}
        </p>
      </div>
    </div>
  );
}
