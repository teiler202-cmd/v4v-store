'use client';

import { useCallback, useEffect, useRef, useState, useSyncExternalStore, type CSSProperties } from 'react';
import { createPortal } from 'react-dom';
import { ORB, type WorldId } from '@/components/orb/assets';
import { SPIN_PERIOD, whenIdle } from '@/components/orb/spin';
import { getWorld, onWorld, otherWorld, prefetchWorld, setWorld, warmWorld } from '@/components/orb/world';

const WORLD_NAME: Record<WorldId, string> = { midbar: 'MIDBAR', eden: 'EDEN' };

/**
 * 브랜드 로고 바로 왼쪽의 구체 — 이 사이트의 스위치.
 * 크기는 부모가 정합니다(데스크톱 44px·모바일 28px). 처음엔 정지 사진이 보이고,
 * 인트로가 끝나 브라우저가 한가해지면 WebGL로 넘겨받아 인트로의 구체와 똑같이 천천히 돕니다.
 * 누르면 세계가 바뀝니다: 구체가 반대 세계로 녹아들고, 구체에서 빛이
 * 한 번 번지며, 사이트의 공기(배경)와 왼쪽 레일의 큰 구체가 함께 건너갑니다.
 */
export default function HeaderOrb({ className = '' }: { className?: string }) {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const midbarRef = useRef<HTMLImageElement>(null);
  const edenRef = useRef<HTMLImageElement>(null);

  // 세계는 <html data-world>가 진실 — 부트스트랩이 첫 페인트 전에 새기고, 전환 이벤트를 구독합니다.
  const world = useSyncExternalStore(
    (notify) => onWorld(notify),
    getWorld,
    () => 'midbar' as WorldId,
  );
  /** 빛 스윕 — 전환마다 key를 바꿔 애니메이션을 다시 걸고, 번지는 자리(구체의 중심)를 함께 기억합니다. */
  const [sweep, setSweep] = useState<{ key: number; x: number; y: number } | null>(null);

  const toggle = useCallback(() => {
    setWorld(otherWorld(getWorld()));
  }, []);

  // 건너갈 기색이 보이면 반대 세계 에셋을 받고 구체의 GPU 겹까지 미리 만들어 둡니다(world.ts warmWorld).
  const warm = useCallback(() => warmWorld(otherWorld(getWorld())), []);

  // 빛 스윕은 전환 이벤트에 반응합니다 — 이 구체가 아니라 Shop 메뉴에서 건너가도 번집니다.
  useEffect(
    () =>
      onWorld(() => {
        const r = buttonRef.current?.getBoundingClientRect();
        setSweep((s) => ({
          key: (s?.key ?? 0) + 1,
          x: r ? r.left + r.width / 2 : 0,
          y: r ? r.top + r.height / 2 : 0,
        }));
      }),
    [],
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    // 움직임을 줄이도록 설정한 방문자에게는 정지 사진만 보여줍니다. (전환은 CSS 페이드로 동작합니다)
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    let disposed = false;
    let stop = () => {};
    let cancelIdle = () => {};

    const start = () => {
      import('@/components/orb/orbLoop')
        .then(async ({ runOrb }) => {
          if (disposed) return;
          const cleanup = await runOrb(
            canvas,
            { midbar: midbarRef.current, eden: edenRef.current },
            () => disposed,
            {
              layer: 'photo',
              motion: 'spin',
              period: SPIN_PERIOD,
              // 26초에 한 바퀴라, 이 크기(44px)에선 100ms에 1px 남짓 — 평상시 10fps로 충분합니다.
              idleFrameMs: 100,
              maxDpr: 2,
            },
          );
          if (disposed) cleanup();
          else stop = cleanup;
        })
        .catch(() => {
          /* WebGL을 쓸 수 없으면 정지 사진 그대로 둡니다 */
        });
      // 반대 세계의 가벼운 에셋도 미리 — 첫 전환이 기다림 없이 일어납니다.
      prefetchWorld(otherWorld(getWorld()));
    };

    // 인트로가 끝난 뒤, 브라우저가 한가할 때 시작합니다 — 첫 화면을 그리는 일과 다투지 않습니다.
    const root = document.documentElement;
    const observer = new MutationObserver(() => {
      if (root.getAttribute('data-intro') === 'playing') return;
      observer.disconnect();
      cancelIdle = whenIdle(start, 2000);
    });
    if (root.getAttribute('data-intro') === 'playing') {
      observer.observe(root, { attributes: true, attributeFilter: ['data-intro'] });
    } else {
      cancelIdle = whenIdle(start, 2000);
    }

    return () => {
      disposed = true;
      observer.disconnect();
      cancelIdle();
      stop();
    };
  }, []);

  return (
    <div className={className}>
      <button
        ref={buttonRef}
        type="button"
        onClick={toggle}
        onPointerEnter={warm}
        onFocus={warm}
        aria-label={`세계 전환 — 지금은 ${WORLD_NAME[world]}`}
        title={`${WORLD_NAME[otherWorld(world)]}로 건너가기`}
        /* 누르는 자리는 손가락 크기(44px 이상)로 조금 넓혀 둡니다(::before).
           오른쪽은 로고 링크와의 틈(8·12px)보다 덜 넓혀, 로고를 누른 손이 세계를 바꾸지 않게 합니다. */
        className="group relative block h-full w-full cursor-pointer rounded-full outline-none transition-transform duration-700 ease-silk before:absolute before:-inset-y-2 before:-left-2 before:-right-1 before:content-[''] hover:scale-[1.06] active:scale-[0.95] focus-visible:outline-1 focus-visible:outline-solid focus-visible:outline-offset-4 focus-visible:outline-ink/30"
      >
        <span className="relative block h-full w-full overflow-hidden rounded-full">
          <span
            aria-hidden
            className="v4v-w-midbar absolute inset-0 rounded-full bg-cover bg-center"
            style={{ backgroundImage: `url("${ORB.midbar.lqip}")` }}
          />
          <span
            aria-hidden
            className="v4v-w-eden absolute inset-0 rounded-full bg-cover bg-center"
            style={{ backgroundImage: `url("${ORB.eden.lqip}")` }}
          />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            ref={midbarRef}
            src={ORB.midbar.image[256]}
            alt=""
            width={80}
            height={80}
            decoding="async"
            fetchPriority="low"
            draggable={false}
            className="v4v-w-midbar absolute inset-0 h-full w-full select-none"
          />
          {/* 숨어 있는 세계의 사진은 lazy — 처음 건너갈 때에야 내려받습니다. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            ref={edenRef}
            src={ORB.eden.image[256]}
            alt=""
            width={80}
            height={80}
            loading="lazy"
            decoding="async"
            fetchPriority="low"
            draggable={false}
            className="v4v-w-eden absolute inset-0 h-full w-full select-none"
          />
          <canvas
            ref={canvasRef}
            aria-hidden
            className="pointer-events-none absolute inset-0 h-full w-full opacity-0"
          />
        </span>
      </button>

      {/* 세계의 이름은 화면에 쓰지 않습니다 — 구체와 공기의 색이 곧 이름입니다.
          (보이지 않는 낭독만 남겨, 스크린리더 사용자에게는 어느 세계인지 알립니다) */}
      <span aria-live="polite" className="sr-only">
        {WORLD_NAME[world]}
      </span>

      {/* 구체에서 페이지 전체로 번지는 빛 — 세계가 바뀌는 순간의 숨. */}
      {sweep &&
        createPortal(
          <span
            key={sweep.key}
            aria-hidden
            className="v4v-world-sweep"
            style={{ '--v4v-sweep-x': `${sweep.x}px`, '--v4v-sweep-y': `${sweep.y}px` } as CSSProperties}
          />,
          document.body,
        )}
    </div>
  );
}
