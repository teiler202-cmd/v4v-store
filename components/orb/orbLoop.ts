/* -----------------------------------------------------------
   구체 로고의 실행부 — 두 자리가 함께 씁니다.
   · 헤더(layer 'photo', spin): 로고 옆 세계 스위치. 인트로의 구체가 그대로 작아져
     세로축으로 돕니다(사진 + 합성 렌더, V4V 글자 포함 — orbGl).
   · 레일(layer 'rail', roll): 화면 왼쪽에 1/3만 걸린 큰 구체. 글자 없는 고해상도 구를
     화면 기준 시계 방향으로 천천히 돌립니다(railGl). 움직임을 줄인 방문자에겐 같은
     모습의 정지 한 장(still)을 그리고 잠듭니다.
   두 세계(MIDBAR ⇄ EDEN)는 같은 각도를 유지한 채 서로에게 녹아듭니다(GPU 크로스페이드).
   컴포넌트(HeaderOrb·OrbRail)가 한가한 시점에 동적으로 불러옵니다.
   ----------------------------------------------------------- */

import { ORB, RAIL_ORB, orbTextures, type WorldId } from '@/components/orb/assets';
import { CONTEXT_ATTRIBUTES, createOrbLayer, restOf, type GL, type OrbLayer } from '@/components/orb/orbGl';
import { createRailLayer } from '@/components/orb/railGl';
import { spinAngle } from '@/components/orb/spin';
import { WORLD_INTENT_EVENT, getWorld, onWorld, railImageSrc } from '@/components/orb/world';

/** 세계가 녹아드는 동안의 프레임 간격 — 평상시보다 촘촘하게 */
const FADE_FRAME_MS = 1000 / 30;
/** 세계가 서로에게 녹아드는 시간 상수(초) — 지수 접근이라 연타해도 항상 매끄럽습니다. */
const FADE_TAU = 0.4;
/** 레일 구체가 정지 사진 위로 떠오르는 시간(ms) — 같은 그림이라 그레인만 스르륵 번집니다. */
const HANDOFF_FADE_MS = 700;

export interface OrbLoopOptions {
  /** 'photo' — 사진 + 합성(헤더, 글자 있음), 'rail' — 글자 없는 고해상도 구(레일) */
  layer: 'photo' | 'rail';
  /** 'spin' — 세로축 회전, 'roll' — 화면 기준 시계 방향 회전, 'still' — 멈춘 한 장(움직임 줄이기) */
  motion: 'spin' | 'roll' | 'still';
  /** 한 바퀴 주기(초) */
  period: number;
  /** 평상시 프레임 간격(ms) — 0이면 매 프레임 */
  idleFrameMs: number;
  /** 캔버스 픽셀 밀도 상한 */
  maxDpr: number;
  /**
   * 구체가 놓인 상자. 없으면 캔버스가 곧 구체입니다.
   * 있으면(레일) 캔버스는 화면에 보이는 띠만 덮고, 두 상자의 위치로 그 안의 구체 자리를 잽니다 —
   * 구체의 대부분은 화면 밖이라 캔버스 밖으로 잘려 나갑니다.
   */
  box?: HTMLElement | null;
}

/** 세계별 겹 — 정지 사진이 이미 와 있으면 그 사진을 그대로 텍스처로 씁니다. */
function createLayer(
  gl: GL,
  kind: OrbLoopOptions['layer'],
  world: WorldId,
  img: HTMLImageElement | null,
  orbPx: number,
  banded: boolean,
  hurry: () => boolean,
) {
  if (kind === 'rail') {
    // 정지 사진(<img>)을 그대로 텍스처로 — 아직 받는 중이면 그 내려받기를 기다립니다(같은 2048 그림을 두 번 받지 않게,
    // 그리고 srcset이 고른 크기 그대로). 숨은 세계의 lazy 사진은 아직 시작도 안 했을 수 있어 지금 받게 합니다.
    if (img) {
      if (img.loading === 'lazy') img.loading = 'eager';
      return createRailLayer(gl, RAIL_ORB[world], img, { banded, hurry });
    }
    return createRailLayer(gl, RAIL_ORB[world], railImageSrc(world));
  }
  const loaded = img && img.complete && img.naturalWidth > 0 ? img : null;
  const spec = ORB[world];
  // 헤더 로고는 화면 폭마다 크기가 달라(모바일 28px·데스크톱 44px 남짓) 넉넉한 쪽 기준으로 받습니다.
  return createOrbLayer(gl, spec, { image: loaded ?? spec.image[256], ...orbTextures(spec, Math.max(orbPx, 160)) });
}

/**
 * 캔버스에 구체를 그리기 시작합니다. 멈추고 정리하는 함수를 돌려줍니다.
 * @param imgs 같은 자리의 세계별 정지 사진 — 로드된 쪽은 텍스처로 재사용합니다.
 */
export async function runOrb(
  canvas: HTMLCanvasElement,
  imgs: Readonly<Record<WorldId, HTMLImageElement | null>>,
  isDisposed: () => boolean,
  opts: OrbLoopOptions,
): Promise<() => void> {
  /* ---- 캔버스 버퍼 크기와, 그 안에서 구체가 놓일 자리 ---- */
  let bufW = 1;
  let bufH = 1;
  let rect: [number, number, number, number] = [0, 0, 1, 1];
  /** 구체(그림 한 변)의 실제 픽셀 수 — 가장자리 안티앨리어싱·그레인 세기·텍스처 선택의 기준 */
  let orbPx = 1;

  /** 크기·자리를 다시 잽니다. 캔버스가 화면에 없으면(display:none) false. */
  const measure = () => {
    const cw = canvas.clientWidth;
    const ch = canvas.clientHeight;
    if (cw <= 0 || ch <= 0) return false;
    const dpr = Math.min(window.devicePixelRatio || 1, opts.maxDpr);
    bufW = Math.max(1, Math.round(cw * dpr));
    bufH = Math.max(1, Math.round(ch * dpr));
    if (canvas.width !== bufW || canvas.height !== bufH) {
      canvas.width = bufW;
      canvas.height = bufH;
    }
    if (opts.box) {
      const c = canvas.getBoundingClientRect();
      const b = opts.box.getBoundingClientRect();
      rect = [(b.left - c.left) / c.width, (b.top - c.top) / c.height, b.width / c.width, b.height / c.height];
      orbPx = b.width * dpr;
    } else {
      rect = [0, 0, 1, 1];
      orbPx = bufW;
    }
    return true;
  };

  let visible = measure();
  const gl = (canvas.getContext('webgl2', CONTEXT_ATTRIBUTES) ??
    canvas.getContext('webgl', CONTEXT_ATTRIBUTES)) as GL | null;
  if (!gl) return () => {};

  const release = () => {
    // 캔버스가 화면에서 완전히 빠진 뒤에만 컨텍스트를 반납합니다.
    // (개발 모드의 이중 마운트에서는 같은 캔버스의 컨텍스트를 다음 실행이 이어 씁니다)
    window.setTimeout(() => {
      if (!canvas.isConnected) gl.getExtension('WEBGL_lose_context')?.loseContext();
    }, 0);
  };

  const layers: Partial<Record<WorldId, OrbLayer | null>> = {};
  const pending: Partial<Record<WorldId, Promise<OrbLayer | null>>> = {};
  /** 이미 건너간 세계 — 그 겹을 띠로 올리는 중이었다면 남은 띠를 서둘러 올립니다(railGl hurry). */
  const hurried = new Set<WorldId>();

  /**
   * @param banded 레일 텍스처를 띠로 나눠 올릴지 — 첫 표시·건너갈 기색(호버)처럼 서두를 것 없는 때는 나눠
   *   프레임을 지키고, 누르는 순간에 처음 만드는 겹은 한 번에 올려 녹아듦이 하늘보다 늦게 시작하지 않게 합니다.
   *   (띠는 4–5프레임이 걸려, 누른 뒤 만들면 레일만 100ms 남짓 늦게 따라왔습니다)
   */
  const ensureLayer = (world: WorldId, banded = true) => {
    if (layers[world] !== undefined) return Promise.resolve(layers[world] ?? null);
    if (!pending[world]) {
      pending[world] = createLayer(gl, opts.layer, world, imgs[world], orbPx, banded, () => hurried.has(world))
        .then((layer) => {
          layers[world] = layer;
          wake(); // 반대 세계의 겹이 준비되면 잠든 루프(정지 모드)도 깨워 녹아듦을 시작합니다.
          return layer;
        })
        .catch(() => {
          layers[world] = null;
          wake();
          return null;
        });
    }
    return pending[world]!;
  };

  const first = getWorld();
  /** 0 = midbar, 1 = eden — 화면에 보이는 섞임 비율 */
  let mix = first === 'eden' ? 1 : 0;
  let target = mix;

  let raf = 0;
  let last = 0;
  let spin = 0;
  let shown = false;
  let resized = false;
  let stopped = false;

  /**
   * 잠든(숨었거나 할 일이 없는) 루프를 깨웁니다.
   * 버퍼 크기는 여기서 바꾸지 않습니다 — 바꾸는 순간 캔버스가 비워지므로, 다시 잰 뒤 같은 frame()에서
   * 곧바로 그려야 빈 캔버스가 한 장도 비치지 않습니다(정지 모드에서 창 크기를 바꿀 때 번쩍였습니다).
   */
  function wake() {
    if (raf || stopped) return;
    if (!visible) {
      visible = canvas.clientWidth > 0 && canvas.clientHeight > 0;
      if (visible) resized = true;
    }
    if (!visible) return;
    last = performance.now();
    raf = requestAnimationFrame(frame);
  }

  const initial = await ensureLayer(first);
  if (!initial || isDisposed()) {
    // 준비되는 사이에 wake()가 걸어 둔 프레임도 거둡니다 — 버린 겹을 그리지 않게.
    stopped = true;
    cancelAnimationFrame(raf);
    raf = 0;
    initial?.dispose();
    release();
    return () => {};
  }

  // 첫 겹을 준비하는 사이에 세계가 바뀌었을 수 있습니다(그땐 아직 듣고 있지 않았음) — 지금 세계로 맞춥니다.
  const now = getWorld();
  if (now !== first) {
    target = now === 'eden' ? 1 : 0;
    void ensureLayer(now);
  }

  const offWorld = onWorld((world) => {
    target = world === 'eden' ? 1 : 0;
    // 반대 세계의 겹은 보통 건너갈 기색(아래 onIntent)에 미리 만들어져 있습니다. 없으면 지금 한 번에 만들고,
    // 기색에 띠로 올리던 중이면 남은 띠를 서둘러 — 준비되는 대로 녹아들기 시작합니다.
    hurried.add(world);
    void ensureLayer(world, false);
    wake();
  });

  // 건너갈 기색(세계 스위치·세계 링크에 마우스/포커스, world.ts warmWorld) — 반대 세계의 겹을 미리 만듭니다.
  // 녹아듦(target·mix)은 건드리지 않습니다: 실제 전환은 여전히 onWorld에서만 시작됩니다.
  const onIntent = (event: Event) => {
    const world = (event as CustomEvent<WorldId>).detail;
    if (world === 'midbar' || world === 'eden') void ensureLayer(world);
  };
  document.documentElement.addEventListener(WORLD_INTENT_EVENT, onIntent);

  // 크기가 바뀌면(브레이크포인트·창 크기) 다음 프레임에 다시 잽니다.
  // 레일처럼 좁은 화면에서 통째로 숨는 캔버스는 루프가 잠들어 있다가, 다시 보이면 여기서 깨어납니다.
  const observer = new ResizeObserver(() => {
    resized = true;
    wake();
  });
  observer.observe(canvas);
  if (opts.box) observer.observe(opts.box);

  const showImages = () => {
    for (const img of [imgs.midbar, imgs.eden]) if (img) img.style.opacity = '';
  };
  const hideImages = () => {
    for (const img of [imgs.midbar, imgs.eden]) if (img) img.style.opacity = '0';
  };
  let fadeTimer = 0;

  /**
   * 레일: WebGL이 넘겨받은 뒤엔 구 바깥 공기(.v4v-rail-halo, CSS)도 캔버스와 같은 섞임을 따릅니다 —
   * 새 세계의 그림이 준비되기 전에 공기만 먼저 바뀌어, 옛 세계의 테가 새 세계 공기 속에 떠 보이지 않게.
   */
  const railBox = opts.layer === 'rail' ? (opts.box ?? null) : null;
  // 섞임은 두 공기의 opacity에 직접 씁니다. 상자에 CSS 변수(--v4v-rail-mix)를 쓰던 때는 그 값이 상자 속
  // 모든 자손(공기·미리보기·사진)으로 상속돼, 녹아드는 2초 남짓 동안 WebKit이 레일 층 전체를 매 프레임 다시 칠했습니다.
  const halos = railBox
    ? [
        railBox.querySelector<HTMLElement>('.v4v-rail-halo.v4v-w-midbar'),
        railBox.querySelector<HTMLElement>('.v4v-rail-halo.v4v-w-eden'),
      ]
    : null;
  let haloMix = -1;
  let haloFading = false;
  const syncHalo = () => {
    if (!railBox || !halos) return;
    // 녹아드는 동안만 공기를 합성 레이어로 올립니다(.v4v-rail-fading → will-change, globals.css) —
    // 늘 올려 두면 GPU 메모리만 차지합니다. 섞임이 목표에 닿는 마지막 걸음도 여기를 지나 클래스가 빠집니다.
    const fading = mix !== target;
    if (fading !== haloFading) {
      haloFading = fading;
      railBox.classList.toggle('v4v-rail-fading', fading);
    }
    if (mix === haloMix) return;
    haloMix = mix;
    if (halos[0]) halos[0].style.opacity = String(1 - mix);
    if (halos[1]) halos[1].style.opacity = String(mix);
  };
  const releaseHalo = () => {
    railBox?.classList.remove('v4v-rail-gl', 'v4v-rail-fading');
    halos?.forEach((halo) => halo?.style.removeProperty('opacity'));
  };

  const stop = () => {
    stopped = true;
    releaseHalo();
    cancelAnimationFrame(raf);
    raf = 0;
    window.clearTimeout(fadeTimer);
    observer.disconnect();
    offWorld();
    document.documentElement.removeEventListener(WORLD_INTENT_EVENT, onIntent);
    canvas.removeEventListener('webglcontextlost', onLost);
  };
  const onLost = (event: Event) => {
    event.preventDefault();
    stop();
    canvas.style.opacity = '0';
    showImages();
  };
  canvas.addEventListener('webglcontextlost', onLost);

  function frame(now: number) {
    if (!visible) {
      raf = 0; // 숨어 있는 동안엔 그리지도, 깨어 있지도 않습니다.
      return;
    }
    raf = requestAnimationFrame(frame);
    const fading = mix !== target || !shown;
    const frameMs = fading ? Math.min(opts.idleFrameMs, FADE_FRAME_MS) : opts.idleFrameMs;
    if (now - last < frameMs - 1) return;
    // 인트로가 화면을 덮고 있는 동안에는 이 구체가 보이지 않으니 그리지 않습니다.
    if (document.documentElement.getAttribute('data-intro') === 'playing') {
      last = now;
      return;
    }
    const dt = Math.min(now - last, 100) / 1000;
    if (shown && opts.motion !== 'still') spin += dt;
    last = now;

    // 세계 섞임은 목표를 지수적으로 따라갑니다 — 어떤 순간에 눌러도 튀지 않습니다.
    if (mix !== target) {
      const ready = layers[target > 0.5 ? 'eden' : 'midbar'];
      if (ready) {
        mix += (target - mix) * (1 - Math.exp(-dt / FADE_TAU));
        if (Math.abs(target - mix) < 0.004) mix = target;
      } else if (ready === null) {
        mix = target; // 그쪽 겹을 만들 수 없으면 그냥 넘어갑니다 (아래에서 있는 겹을 그림)
      }
    }
    // 섞임 블록 밖에서 맞춥니다 — 첫 전환에서 겹이 준비되기 전에 되돌려 누르면 섞임이 움직이지 않은 채
    // 목표와 같아져 위 블록을 건너뛰므로, 여기서 부르지 않으면 .v4v-rail-fading(will-change)이 남습니다.
    // 바뀐 게 없으면 비교 두 번으로 끝납니다.
    if (shown) syncHalo();

    if (resized) {
      resized = false;
      visible = measure();
      if (!visible) return;
    }
    gl!.viewport(0, 0, bufW, bufH);
    gl!.clearColor(0, 0, 0, 0);
    gl!.clear(gl!.COLOR_BUFFER_BIT);

    const angle = opts.motion === 'still' ? 0 : spinAngle(spin, opts.period);
    // 세로축 회전은 경도(theta)로, 시계 방향 회전은 시선축(roll)으로.
    const theta = opts.motion === 'spin' ? angle : 0;
    const motion = opts.motion === 'spin' ? { rest: restOf(angle) } : { roll: angle };

    const midbar = layers.midbar ?? null;
    const eden = layers.eden ?? null;
    const mMid = 1 - mix;
    if (midbar && eden && mix > 0.004 && mMid > 0.004) {
      // 두 세계가 같은 각도로 겹쳐 녹아듭니다.
      midbar.draw(rect, theta, orbPx, { ...motion, alpha: mMid });
      eden.draw(rect, theta, orbPx, { ...motion, alpha: mix, additive: true });
    } else {
      const one = (mix > 0.5 ? eden : midbar) ?? eden ?? midbar;
      one?.draw(rect, theta, orbPx, motion);
    }

    if (!shown) {
      shown = true;
      if (opts.layer === 'rail') {
        // 레일: 정지 사진 위로 캔버스가 스르륵 떠오르고(그레인이 번짐), 다 뜬 뒤 사진을 내립니다.
        canvas.style.transition = `opacity ${HANDOFF_FADE_MS}ms cubic-bezier(0.16, 1, 0.3, 1)`;
        canvas.style.opacity = '1';
        fadeTimer = window.setTimeout(hideImages, HANDOFF_FADE_MS + 50);
        syncHalo();
        railBox?.classList.add('v4v-rail-gl');
      } else {
        // 헤더: 회전각 0의 첫 프레임은 정지 사진과 같은 그림 — 같은 프레임에 바꿔 끼웁니다.
        canvas.style.opacity = '1';
        hideImages();
      }
    }

    // 멈춘 한 장(움직임 줄이기): 녹아듦이 끝나면 잠듭니다 — 세계가 바뀌거나 크기가 바뀌면 깨어납니다.
    if (opts.motion === 'still' && mix === target) {
      cancelAnimationFrame(raf);
      raf = 0;
    }
  }
  // 첫 겹이 준비될 때 wake()가 이미 루프를 걸었을 수 있습니다 — 두 줄로 돌지 않게.
  if (visible && !raf) raf = requestAnimationFrame(frame);

  return () => {
    stop();
    for (const world of ['midbar', 'eden'] as const) layers[world]?.dispose();
    release();
  };
}
