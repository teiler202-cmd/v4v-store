/* -----------------------------------------------------------
   세계 상태 — MIDBAR(광야) ⇄ EDEN(동산)
   <html data-world>가 유일한 진실이고, 첫 페인트 전에 부트스트랩 스크립트가
   localStorage에서 읽어 새깁니다(app/layout.tsx). CSS는 이 속성만 봅니다.
   ----------------------------------------------------------- */

import { ORB, RAIL_ORB, type WorldId } from '@/components/orb/assets';

export type { WorldId };

const STORAGE_KEY = 'v4v:world';
export const WORLD_EVENT = 'v4v:world';

/** 큰 구체 레일이 나타나는 화면 — globals.css의 --v4v-rail 미디어쿼리와 같은 값이어야 합니다. */
export const RAIL_QUERY = '(min-width: 64rem)';

export function getWorld(): WorldId {
  return document.documentElement.getAttribute('data-world') === 'eden' ? 'eden' : 'midbar';
}

export function otherWorld(world: WorldId): WorldId {
  return world === 'eden' ? 'midbar' : 'eden';
}

/**
 * 세계를 바꿉니다 — 속성·저장·이벤트를 한 번에.
 * 첫 전환 때 `v4v-worlds-live` 클래스를 먼저 붙입니다: 숨은 세계의 레이어가
 * display:none에서 깨어나 한 프레임 자리를 잡은 뒤 크로스페이드가 시작됩니다.
 */
export function setWorld(next: WorldId) {
  const root = document.documentElement;
  const wake = !root.classList.contains('v4v-worlds-live');
  root.classList.add('v4v-worlds-live');
  const flip = () => {
    root.setAttribute('data-world', next);
    root.dispatchEvent(new CustomEvent<WorldId>(WORLD_EVENT, { detail: next }));
  };
  if (wake) requestAnimationFrame(() => requestAnimationFrame(flip));
  else flip();
  try {
    window.localStorage.setItem(STORAGE_KEY, next);
  } catch {
    /* 프라이빗 모드 등 — 이번 세션만 기억됩니다 */
  }
}

export function onWorld(fn: (world: WorldId) => void) {
  const handler = (event: Event) => fn((event as CustomEvent<WorldId>).detail);
  document.documentElement.addEventListener(WORLD_EVENT, handler);
  return () => document.documentElement.removeEventListener(WORLD_EVENT, handler);
}

function prefetch(sources: readonly (string | undefined)[]) {
  for (const src of sources) {
    if (!src) continue;
    const img = new Image();
    img.decoding = 'async';
    img.fetchPriority = 'low';
    img.src = src;
  }
}

/**
 * 반대 세계의 가벼운 에셋(헤더 구체의 정지 사진)을 미리 받아 두면 첫 전환이 즉시 일어납니다.
 * 하늘 그림(assets SKY, /world/*.webp)은 더 받지 않습니다 — 배경은 오로라 셰이더 캔버스가 그리고,
 * 그 그림을 쓰는 곳이 이제 없어 받기만 하고 버려졌습니다.
 */
export function prefetchWorld(world: WorldId) {
  prefetch([ORB[world].image[256]]);
}

/**
 * 레일 그림의 크기 — 정지 사진(<img srcset sizes="100vh">)이 고르는 것과 같은 기준이어야
 * 사진과 WebGL 텍스처가 한 파일을 나눠 씁니다(둘이 갈리면 같은 그림을 두 번 받습니다).
 * 레티나 데스크톱은 늘 2048, 일반 밀도 화면은 높이가 1024px 이하면 1024.
 */
export function railImageSrc(world: WorldId) {
  const need = window.innerHeight * (window.devicePixelRatio || 1);
  return need > 1024 ? RAIL_ORB[world].image[2048] : RAIL_ORB[world].image[1024];
}

const railPrefetched = new Set<WorldId>();

/**
 * 레일의 큰 구체가 쓸 반대 세계의 그림(100–280KB)을 미리 받습니다.
 * 방문자 대부분은 세계를 건너가지 않으므로 늘 받지는 않고, 건너갈 기색(세계 스위치에
 * 마우스를 올림)이 보일 때만 받습니다 — 누르는 순간엔 이미 캐시에 있어 녹아듦이 곧장 시작됩니다.
 */
export function prefetchRail(world: WorldId) {
  if (railPrefetched.has(world) || !window.matchMedia(RAIL_QUERY).matches) return;
  railPrefetched.add(world);
  prefetch([railImageSrc(world)]);
}

/** 건너갈 기색 — 구체 루프(orbLoop)가 듣고 반대 세계의 GPU 겹을 미리 만듭니다. */
export const WORLD_INTENT_EVENT = 'v4v:world-intent';

/**
 * 세계를 건너갈 기색(세계 스위치·Shop 메뉴의 세계 링크에 마우스/포커스)이 보이면
 * 그림을 받아 두는 데서 그치지 않고, 레일·헤더 구체가 반대 세계의 겹(디코드·텍스처·셰이더)까지
 * 미리 만들게 합니다. 누르는 순간엔 이미 준비돼 있어 녹아듦이 하늘과 같은 박자에 시작합니다.
 * (레일의 2048² 텍스처는 여기서 띠로 나눠 올리므로 머뭇거리는 사이의 몇 프레임에 흩어집니다)
 */
export function warmWorld(world: WorldId) {
  prefetchRail(world);
  document.documentElement.dispatchEvent(new CustomEvent<WorldId>(WORLD_INTENT_EVENT, { detail: world }));
}
