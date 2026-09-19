/* -----------------------------------------------------------
   인트로 무대 — 화면 전체를 덮는 WebGL 캔버스
   구체는 공용 렌더러(components/orb/orbGl)로 그리고,
   클릭하면 카메라가 구체 '안으로' 날아 들어갑니다:
   유리 껍질이 옆을 스쳐 지나가고, 안쪽 결이 화면을 가득 채웁니다.
   그 위로 슬로건이 떠오르고, 베일이 걷히면 안쪽의 빛이
   그대로 사이트의 공기(배경)로 풀어집니다.

   이 파일은 인트로를 볼 때만 불러옵니다(동적 import) — 이미 본 방문자는 받지 않습니다.
   ----------------------------------------------------------- */

import { orbTextures, type OrbSpec } from '@/components/orb/assets';
import { CONTEXT_ATTRIBUTES, createOrbLayer, nextFrame, restOf, type GL } from '@/components/orb/orbGl';

/** 구체 안으로 들어가는 시간(초) */
export const DIVE_DURATION = 2.6;

/** 캔버스 해상도 상한 — 큰 모니터에서 GPU 메모리를 과하게 쓰지 않게 합니다. */
const MAX_CANVAS_PIXELS = 8_300_000;

export interface OrbStage {
  /** rect(CSS px, getBoundingClientRect 기준) 자리에 theta(rad)만큼 돈 구체를 그립니다. */
  drawOrb(rect: DOMRectReadOnly, theta: number): void;
  /** 클릭한 자리(from)에서 시작해 t초 지난 다이브 프레임을 그립니다. */
  drawDive(from: DOMRectReadOnly, theta: number, t: number): void;
  isLost(): boolean;
  destroy(): void;
}

/** 천천히 빨려 들기 시작해, 한가운데서 가장 빠르고, 안쪽에 부드럽게 내려앉는 곡선 */
function easeInOutQuint(x: number) {
  return x < 0.5 ? 16 * x * x * x * x * x : 1 - Math.pow(-2 * x + 2, 5) / 2;
}

/**
 * @param image  이미 화면에 떠 있는 구체 <img> — 같은 파일을 다시 받지 않고 텍스처로 씁니다.
 * @param sizePx 구체가 그려질 실제 픽셀 크기 — 이에 맞는 크기의 텍스처를 고릅니다.
 * @param spec   지금 세계의 구체 스펙 — 기하·조명·글자 합성 방식이 세계마다 다릅니다.
 */
export async function createOrbStage(
  canvas: HTMLCanvasElement,
  { image, sizePx, spec }: { image: HTMLImageElement; sizePx: number; spec: OrbSpec },
): Promise<OrbStage | null> {
  const gl = (canvas.getContext('webgl2', CONTEXT_ATTRIBUTES) ??
    canvas.getContext('webgl', CONTEXT_ATTRIBUTES)) as GL | null;
  if (!gl) return null;

  let lost = false;
  const onLost = (event: Event) => {
    event.preventDefault();
    lost = true;
  };
  canvas.addEventListener('webglcontextlost', onLost);

  // 다이브는 코어 원이 화면을 가득 채울 만큼 커집니다 — 텍스처는 처음부터 큰 것을 씁니다.
  const orb = await createOrbLayer(gl, spec, {
    image,
    ...orbTextures(spec, Math.max(sizePx, 1024)),
  }).catch(() => null);
  if (!orb || lost) {
    orb?.dispose();
    canvas.removeEventListener('webglcontextlost', onLost);
    return null;
  }

  /** 캔버스 버퍼를 화면 크기·기기 배율에 맞추고, CSS px → 버퍼 px 배율을 돌려줍니다. */
  const syncSize = () => {
    const cssW = canvas.clientWidth || window.innerWidth;
    const cssH = canvas.clientHeight || window.innerHeight;
    let dpr = Math.min(window.devicePixelRatio || 1, 2);
    if (cssW * cssH * dpr * dpr > MAX_CANVAS_PIXELS) {
      dpr = Math.sqrt(MAX_CANVAS_PIXELS / (cssW * cssH));
    }
    const w = Math.max(1, Math.round(cssW * dpr));
    const h = Math.max(1, Math.round(cssH * dpr));
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
    }
    return { cssW, cssH, sx: w / cssW, sy: h / cssH };
  };

  const clear = () => {
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
  };

  const drawOrb = (rect: DOMRectReadOnly, theta: number) => {
    if (lost) return;
    const { cssW, cssH, sx } = syncSize();
    clear();
    orb.draw(
      [rect.left / cssW, rect.top / cssH, rect.width / cssW, rect.height / cssH],
      theta,
      rect.width * sx,
    );
  };

  const drawDive = (from: DOMRectReadOnly, theta: number, t: number) => {
    if (lost) return;
    const { cssW, cssH, sx } = syncSize();
    clear();

    const e = easeInOutQuint(Math.min(Math.max(t / DIVE_DURATION, 0), 1));

    // 끝 배율: 안쪽 코어 원이 화면 대각선을 넉넉히 덮는 순간 — '안에 들어와 있는' 화면이 됩니다.
    const diag = Math.hypot(cssW, cssH);
    const S = Math.max(3, (diag * 1.12) / (from.width * 2 * spec.coreR));
    // 로그 공간 보간 — 카메라가 일정한 호흡으로 다가가는 것처럼 느껴집니다.
    const s = Math.exp(Math.log(S) * e);

    // 코어의 중심을 붙잡고 커집니다. 처음엔 구체가 있던 자리, 끝에는 화면 한가운데.
    const fx = from.left + spec.coreC[0] * from.width;
    const fy = from.top + spec.coreC[1] * from.height;
    const cx = fx + (cssW / 2 - fx) * e;
    const cy = fy + (cssH / 2 - fy) * e;

    const w = from.width * s;
    const h = from.height * s;
    const left = cx - spec.coreC[0] * w;
    const top = cy - spec.coreC[1] * h;

    // 글자는 줌이 눈에 띄기 전에 걷어야 '구체 밖에 남는' 느낌이 됩니다 — 0.45s, 앞쪽부터
    // 빠르게(easeOut). 0.9s 선형은 에덴의 큰 곱셈(필터) 글자가 확대 초반을 함께 타고
    // 커져 보였습니다(0.45s 시점 줌 배율 ≈ 1.02 — 체감 0).
    const inkT = Math.min(t / 0.45, 1);

    orb.draw([left / cssW, top / cssH, w / cssW, h / cssH], theta, w * sx, {
      // 출발이 원본 사진 상태였어도(회전 전 클릭) 첫 반 박자 만에 합성 렌더로 녹아듭니다.
      rest: restOf(theta) * (1 - Math.min(t / 0.3, 1)),
      // 안으로 들어갈수록 조명이 차오르고,
      inside: e,
      inkFade: inkT * (2 - inkT),
      // 글자는 출발 자리(from)에 못 박습니다 — 확대는 유리만, 글자는 제자리에서 걷힙니다.
      inkRect: [from.left / cssW, from.top / cssH, from.width / cssW, from.height / cssH],
    });
  };

  // 첫 사용 순간에 GPU가 파이프라인을 만드느라 화면이 멈추지 않도록,
  // 실제와 같은 조건으로 미리 한 번 그려 두고 지웁니다.
  drawOrb(new DOMRect(0, 0, 1, 1), 0);
  clear();
  await nextFrame();

  const destroy = () => {
    canvas.removeEventListener('webglcontextlost', onLost);
    if (!lost) orb.dispose();
    // 캔버스가 화면에서 완전히 빠진 뒤에만 컨텍스트를 반납합니다.
    // (개발 모드는 컴포넌트를 두 번 마운트하는데, 같은 캔버스의 컨텍스트를 다음 무대가 이어 씁니다)
    window.setTimeout(() => {
      if (!canvas.isConnected) gl.getExtension('WEBGL_lose_context')?.loseContext();
    }, 0);
  };

  return { drawOrb, drawDive, isLost: () => lost, destroy };
}
