/**
 * 메일용 디자인 토큰.
 *
 * 사이트의 globals.css @theme 과 같은 값을 씁니다 — 다만 메일에서는
 * CSS 변수도, 웹폰트도, Tailwind도 쓸 수 없습니다. (Gmail은 <style> 안의
 * 대부분을 지우고, Outlook은 아예 워드 엔진으로 그립니다.)
 * 그래서 같은 값을 '인라인 style 문자열'로 다시 정의해 둡니다.
 *
 * 규칙 세 가지만 지키면 어느 메일 앱에서도 무너지지 않습니다.
 *   1. 레이아웃은 <table role="presentation"> 로만
 *   2. 스타일은 전부 인라인
 *   3. 폰트는 기기에 이미 있는 것만 (IBM Plex 는 내려받지 못합니다)
 */

/** 사이트와 같은 팔레트 */
export const C = {
  paper: '#ffffff',
  ink: '#0b0b0b',
  ash: '#6b6b6b',
  mist: '#f4f4f2',
  line: '#e0e0de',
  lineSoft: '#eeeeec',
} as const;

/**
 * IBM Plex Sans / Inter 는 메일에서 내려받을 수 없습니다.
 * 가장 가깝게 보이는 기기 폰트 순서로 대체합니다.
 * ('Apple SD Gothic Neo' 를 넣어 두어야 한글이 시스템 고딕으로 또렷하게 나옵니다)
 */
export const F = {
  sans:
    "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', Helvetica, " +
    "'Apple SD Gothic Neo', 'Malgun Gothic', Arial, sans-serif",
  mono:
    "ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Consolas, 'Liberation Mono', monospace",
} as const;

/** 본문 폭 — 600px 는 모든 메일 앱이 가로 스크롤 없이 보여 주는 최대치입니다. */
export const WIDTH = 600;

/* ---------------------------------------------------------------
   자주 쓰는 스타일 조각
   사이트의 타이포 규칙을 그대로 옮겼습니다.
   --------------------------------------------------------------- */

/** 모노 대문자 마이크로 라벨 — 사이트 전반의 그 라벨입니다 */
export const microLabel =
  `font-family:${F.mono};font-size:9px;line-height:1.6;letter-spacing:0.18em;` +
  `text-transform:uppercase;color:${C.ash};margin:0;`;

/** 큰 제목 */
export const display =
  `font-family:${F.sans};font-size:25px;line-height:1.25;letter-spacing:-0.03em;` +
  `font-weight:700;color:${C.ink};margin:0;`;

/** 중간 제목 */
export const heading =
  `font-family:${F.sans};font-size:15px;line-height:1.4;letter-spacing:-0.02em;` +
  `font-weight:600;color:${C.ink};margin:0;`;

/** 본문 */
export const body =
  `font-family:${F.sans};font-size:13.5px;line-height:1.75;letter-spacing:-0.01em;` +
  `color:${C.ash};margin:0;`;

/** 본문 중 강조 (잉크색) */
export const bodyInk = body.replace(C.ash, C.ink);

/** 아주 작은 각주 */
export const fine =
  `font-family:${F.sans};font-size:11px;line-height:1.7;color:${C.ash};margin:0;`;

/**
 * HTML 에 값을 끼워 넣기 전 반드시 통과시킵니다.
 *
 * 손님 이름이나 상품명에 < 가 하나만 섞여도 메일 레이아웃이 통째로
 * 깨지고, 최악의 경우 남의 마크업이 우리 메일 안에서 실행됩니다.
 */
export function esc(value: unknown): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * ⚠️ 이스케이프를 건너뛰는 통로.
 *
 * 쇼피파이 Liquid 태그({{ order.name }} 같은)를 그대로 내보낼 때만 씁니다.
 * 손님이 입력한 값에는 절대 쓰지 마세요.
 */
export class Raw {
  constructor(readonly value: string) {}
  toString() {
    return this.value;
  }
}

export const raw = (value: string) => new Raw(value);

/** Raw 는 통과, 나머지는 이스케이프 */
export function out(value: unknown): string {
  return value instanceof Raw ? value.value : esc(value);
}

/** 원화 표기 — 쇼피파이가 주는 문자열 금액을 사람이 읽는 형태로 */
export function money(amount: string | number, currency = 'KRW') {
  const n = typeof amount === 'number' ? amount : Number(amount);
  if (!Number.isFinite(n)) return String(amount);
  if (currency === 'KRW') return `₩${Math.round(n).toLocaleString('ko-KR')}`;
  return `${n.toLocaleString('en-US', { minimumFractionDigits: 2 })} ${currency}`;
}
