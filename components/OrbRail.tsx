'use client';

import { useEffect, useRef } from 'react';
import { RAIL_ORB, type WorldId } from '@/components/orb/assets';
import { whenIdle } from '@/components/orb/spin';
import { RAIL_QUERY } from '@/components/orb/world';
import { RailNav } from '@/components/SiteNav';

/** 정지 사진 후보 — 구의 지름은 대략 화면 높이(레일 폭 × 3)이므로 그 폭으로 고르게 합니다. */
const railSrcSet = (world: WorldId) => `${RAIL_ORB[world].image[1024]} 1024w, ${RAIL_ORB[world].image[2048]} 2048w`;

/**
 * 큰 구체가 한 바퀴 도는 시간(초) — 화면 기준 시계 방향.
 * 레일에 보이는 가장자리가 초당 30px 남짓 아래로 흐르는 속도: 멈춰 있지 않되, 메뉴를 읽는 눈을 끌지 않습니다.
 */
const ROLL_PERIOD = 80;

/**
 * 왼쪽 레일 — 데스크톱(lg~)에서 헤더의 메뉴가 옮겨 오는 자리.
 * 화면 높이만 한 구체가 왼쪽 가장자리에 걸려 오른쪽 1/3만 보이고, 화면 기준 시계 방향으로
 * 천천히 돕니다(유리 테와 빛은 제자리, 안쪽 대리석·빛줄기만). 그 위에 메뉴가 세로로 놓입니다.
 * 구체엔 글자가 없습니다 — V4V는 로고 옆 세계 스위치(작은 구체)가 맡고, 큰 구체는 벡터 원본을
 * 고해상도로 구운 그림(assets RAIL_ORB)이라 화면 높이만큼 키워도 선명합니다.
 * 가장자리의 희끗한 테는 세계의 짙은 톤으로 가라앉혀 그림에 구워 두었고, 구 바깥엔 같은 톤의
 * 공기가 은은히 고여(.v4v-rail-halo) 배경과 이어집니다.
 *
 * 크기와 자리는 전부 CSS(--v4v-rail, globals.css)가 정하고, 본문은 그만큼 오른쪽으로 비켜 섭니다.
 * 처음엔 정지 사진이 보이고, 인트로가 끝나 브라우저가 한가해지면 WebGL이 넘겨받습니다.
 * 세계(MIDBAR ⇄ EDEN)가 바뀌면 로고 옆 작은 구체와 함께 녹아듭니다.
 */
export default function OrbRail() {
  const boxRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const midbarRef = useRef<HTMLImageElement>(null);
  const edenRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    // 움직임을 줄이도록 설정한 방문자에게는 돌지 않는 한 장을 그립니다 — 가장자리 톤·바깥 공기는 같고,
    // 그린 뒤엔 루프가 잠들어(세계 전환·창 크기 변화 때만 깨어남) 비용이 없습니다.
    const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let disposed = false;
    let started = false;
    let stop = () => {};
    let cancelIdle = () => {};
    const wide = window.matchMedia(RAIL_QUERY);
    const root = document.documentElement;

    const start = () => {
      if (started || disposed) return;
      started = true;
      import('@/components/orb/orbLoop')
        .then(async ({ runOrb }) => {
          if (disposed) return;
          const cleanup = await runOrb(
            canvas,
            { midbar: midbarRef.current, eden: edenRef.current },
            () => disposed,
            {
              layer: 'rail',
              motion: still ? 'still' : 'roll',
              period: ROLL_PERIOD,
              idleFrameMs: 0, // 큰 구체의 가장자리는 초당 30px을 흐릅니다 — 매 프레임 그려야 매끄럽습니다.
              maxDpr: 1.5, // 트레이스 결이 원래 부드러워 2배 밀도와 눈으로 구분되지 않고, 픽셀은 44% 적습니다.
              box: boxRef.current,
            },
          );
          if (disposed) cleanup();
          else stop = cleanup;
        })
        .catch(() => {
          /* WebGL을 쓸 수 없으면 정지 사진 그대로 둡니다 */
        });
    };

    // 레일이 보이는 넓은 화면에서, 인트로가 끝난 뒤, 브라우저가 한가할 때 시작합니다.
    // (좁은 화면으로 열었다가 창을 넓히면 그때 시작합니다)
    const maybeStart = () => {
      if (started || !wide.matches || root.getAttribute('data-intro') === 'playing') return;
      cancelIdle();
      cancelIdle = whenIdle(start, 2000);
    };
    const observer = new MutationObserver(maybeStart);
    observer.observe(root, { attributes: true, attributeFilter: ['data-intro'] });
    wide.addEventListener('change', maybeStart);
    maybeStart();

    return () => {
      disposed = true;
      observer.disconnect();
      wide.removeEventListener('change', maybeStart);
      cancelIdle();
      stop();
    };
  }, []);

  return (
    <div
      className="v4v-chrome v4v-rail"
      /* 페이지를 옮겨도 레일은 미동 없이 계속 돕니다 — 전환 스냅샷에서 따로 떼어 둡니다(globals.css). */
      style={{ viewTransitionName: 'v4v-rail' }}
    >
      <div aria-hidden className="v4v-rail-orb">
        {/* 구체 상자 — 레일 폭의 세 배. 왼쪽 2/3는 화면 밖에 있습니다. */}
        <div ref={boxRef} className="v4v-rail-box">
          {/* 구 바깥의 짙은 공기 — 정지 사진과 WebGL 모두 이 위에 놓입니다(구 바깥이 투명). */}
          <span className="v4v-rail-halo v4v-w-midbar" />
          <span className="v4v-rail-halo v4v-w-eden" />
          {/* 24px 미리보기 — 불투명(구 바깥은 가장자리 색)이라 구의 원(반지름 0.4951 → 안쪽 0.49%)으로 오립니다.
              (알파를 품은 24px를 키우면 WebKit에서 가장자리가 네모난 블록으로 비쳤습니다) */}
          <span
            className="v4v-w-midbar absolute inset-[0.49%] rounded-full bg-cover bg-center"
            style={{ backgroundImage: `url("${RAIL_ORB.midbar.lqip}")` }}
          />
          <span
            className="v4v-w-eden absolute inset-[0.49%] rounded-full bg-cover bg-center"
            style={{ backgroundImage: `url("${RAIL_ORB.eden.lqip}")` }}
          />
          {/* 레일은 넓은 화면에만 있어 좁은 화면(display:none)에서는 lazy 사진을 내려받지 않습니다.
              숨은 세계의 사진도 마찬가지 — 처음 건너갈 때에야 받습니다.
              구의 지름 ≈ 화면 높이라 sizes는 100vh — 레티나에선 2048, 그 밖엔 1024를 고릅니다. */}
          {(['midbar', 'eden'] as const).map((world) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={world}
              ref={world === 'midbar' ? midbarRef : edenRef}
              src={RAIL_ORB[world].image[1024]}
              srcSet={railSrcSet(world)}
              sizes="100vh"
              alt=""
              width={2048}
              height={2048}
              loading="lazy"
              decoding="async"
              fetchPriority="low"
              draggable={false}
              className={`v4v-w-${world} absolute inset-0 h-full w-full select-none`}
            />
          ))}
        </div>
        {/* 캔버스는 화면에 보이는 띠(레일 폭)만 덮습니다 — 구체의 나머지는 캔버스 밖이라 그리지 않습니다.
            (이 층은 구 바깥 공기를 위해 레일보다 20% 넓지만, 그 띠는 CSS 공기뿐이라 캔버스를 넓히지 않습니다) */}
        <canvas ref={canvasRef} className="absolute inset-y-0 left-0 h-full w-[var(--v4v-rail)] opacity-0" />
      </div>

      <RailNav className="v4v-rail-nav" />
    </div>
  );
}
