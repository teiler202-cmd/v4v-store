/**
 * 모델컷 스펙 — 쇼피파이 관리자에서 이미지 '대체 텍스트(Alt text)'로 지정합니다.
 * 코드를 고치지 않아도 상품을 올릴 때마다 바로 적용됩니다.
 *
 *   model: 안세웅 · 183cm · wears M
 *   model: natalia · 5'9 · wears size s
 *   model: 안세웅 · 183cm · wears M @32     ← 끝의 @숫자는 안내선이 놓일 높이(%)
 *
 * 구분자는 · | / 셋 다 됩니다. 'model:'로 시작하지 않는 이미지는 평범한 상품컷으로 취급합니다.
 */
export type ModelSpec = {
  lines: string[];
  /** 안내선의 세로 위치(프레임 높이의 %) */
  anchor: number;
};

export function parseModelSpec(altText?: string | null): ModelSpec | null {
  if (!altText) return null;

  const matched = altText.trim().match(/^model\s*:\s*(.+)$/i);
  if (!matched) return null;

  let rest = matched[1].trim();
  let anchor = 38;

  const anchorMatch = rest.match(/@(\d{1,2})\s*$/);
  if (anchorMatch) {
    anchor = Math.min(88, Math.max(8, Number(anchorMatch[1])));
    rest = rest.slice(0, anchorMatch.index).trim();
  }

  const lines = rest
    .split(/\s*[·|/]\s*/)
    .map((part) => part.trim())
    .filter(Boolean);

  return lines.length ? { lines, anchor } : null;
}
