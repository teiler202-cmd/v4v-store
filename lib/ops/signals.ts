/**
 * 계산되는 값 — 사람이 채우지 않는 것들.
 *
 * 노션에서는 이게 전부 수식·롤업이었고, API 로는 `formulaResult://` 라는
 * 쓸모없는 문자열만 돌아왔습니다. 그래서 에이전트는 브리핑을 만들 때마다
 * 원본 값으로 처음부터 다시 계산해야 했습니다 — 화면과 에이전트가 서로 다른
 * 계산을 할 위험이 늘 있었습니다.
 *
 * 이제 계산은 이 파일 하나입니다. 화면도 에이전트도 같은 함수를 부릅니다.
 *
 * ⚠️ 날짜는 전부 'YYYY-MM-DD' 문자열로 다룹니다. Date 객체로 바꾸면
 *    KST 자정이 UTC 로 넘어가며 하루씩 밀립니다 (마감일이 당겨져 보입니다).
 *    문자열 비교는 사전순이 곧 날짜순이라 안전합니다.
 */

/** 한국 시간 기준 오늘. 서버가 어디서 돌든 같은 날짜를 봅니다. */
export function todayKST(): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Seoul',
    year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(new Date());
}

/** from 에서 to 까지 며칠인가. 음수면 to 가 과거입니다. */
export function daysBetween(from: string, to: string): number {
  const a = Date.UTC(+from.slice(0, 4), +from.slice(5, 7) - 1, +from.slice(8, 10));
  const b = Date.UTC(+to.slice(0, 4), +to.slice(5, 7) - 1, +to.slice(8, 10));
  return Math.round((b - a) / 86_400_000);
}

/** 오늘로부터 며칠 뒤인 날짜 (브리핑의 '이번 주' 범위에 씁니다) */
export function plusDays(date: string, days: number): string {
  const d = new Date(Date.UTC(+date.slice(0, 4), +date.slice(5, 7) - 1, +date.slice(8, 10)));
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

export type Signal = '✅' | '🔴' | '🟠' | '🟢' | '⚪';

/**
 * 할 일 신호 — 마감일 대비.
 * 지남 🔴 / 이틀 안 🟠 / 여유 ⚪ / 완료 ✅
 *
 * 마감일이 없으면 ⚪ 입니다. 없는 마감일을 급한 것으로 치면
 * 진짜 급한 것이 묻힙니다.
 */
export function taskSignal(status: string, due: string | null, today = todayKST()): Signal {
  if (status === '완료') return '✅';
  if (!due) return '⚪';
  const left = daysBetween(today, due);
  if (left < 0) return '🔴';
  if (left <= 2) return '🟠';
  return '⚪';
}

/** 목표 신호 — 기한 대비. 지남 🔴 / 이레 안 🟠 / 여유 ⚪ / 완료 ✅ */
export function goalSignal(status: string, due: string | null, today = todayKST()): Signal {
  if (status === '완료') return '✅';
  if (!due) return '⚪';
  const left = daysBetween(today, due);
  if (left < 0) return '🔴';
  if (left <= 7) return '🟠';
  return '⚪';
}

/** 목표 진행률 — 연결된 할 일 중 완료 비율. 할 일이 없으면 null (0%가 아닙니다) */
export function progress(doneCount: number, totalCount: number): number | null {
  if (totalCount === 0) return null;
  return Math.round((doneCount / totalCount) * 100);
}

/* ── 돈 ─────────────────────────────────────────────────────────────────── */

/**
 * 마진 임계값. 근거는 Finance 문서에 있습니다.
 * 바꾸려면 여기와 그 문서를 함께 고칩니다 — 한쪽만 고치면 숫자의 뜻이 사라집니다.
 */
export const MARGIN_GOOD = 60;
export const MARGIN_OK = 50;

/** 마진율(%) — 판매가 대비. 둘 중 하나라도 없으면 계산하지 않습니다. */
export function marginRate(price: number | null, cost: number | null): number | null {
  if (!price || cost === null || cost === undefined) return null;
  return Math.round(((price - cost) / price) * 100);
}

export function marginVerdict(rate: number | null): Signal | null {
  if (rate === null) return null;
  if (rate >= MARGIN_GOOD) return '🟢';
  if (rate >= MARGIN_OK) return '🟠';
  return '🔴';
}

/* ── 거래처 ─────────────────────────────────────────────────────────────── */

export const CONTACT_COLD = 21;  // 🔴 이만큼 지나면 끊긴 것으로 봅니다
export const CONTACT_WARM = 14;  // 🟠 연락할 때가 됐습니다

/** 컨택 경과 — 최근 컨택에서 며칠 지났는가. 기록이 없으면 null */
export function contactAge(last: string | null, today = todayKST()): number | null {
  if (!last) return null;
  return daysBetween(last, today);
}

export function contactSignal(last: string | null, today = todayKST()): Signal {
  const age = contactAge(last, today);
  if (age === null) return '⚪';
  if (age >= CONTACT_COLD) return '🔴';
  if (age >= CONTACT_WARM) return '🟠';
  return '🟢';
}

/* ── 품질 ───────────────────────────────────────────────────────────────── */

/** 불량률(%) — 검수 수량이 0이면 나눌 수 없으니 null */
export function defectRate(checked: number | null, defect: number | null): number | null {
  if (!checked || defect === null || defect === undefined) return null;
  return Math.round((defect / checked) * 1000) / 10;
}

/* ── 보기 좋게 ──────────────────────────────────────────────────────────── */

/** 12000 → "₩12,000" */
export function won(amount: number | null | undefined): string {
  if (amount === null || amount === undefined) return '—';
  return '₩' + amount.toLocaleString('ko-KR');
}

/** '2026-09-16' → "9월 16일" · 올해가 아니면 "2027년 3월 31일" */
export function humanDate(date: string | null | undefined, today = todayKST()): string {
  if (!date) return '—';
  const [y, m, d] = [date.slice(0, 4), +date.slice(5, 7), +date.slice(8, 10)];
  return y === today.slice(0, 4) ? `${m}월 ${d}일` : `${y}년 ${m}월 ${d}일`;
}

/** 마감까지 남은 말 — "3일 지남", "오늘", "내일", "5일 뒤" */
export function dueWord(due: string | null | undefined, today = todayKST()): string {
  if (!due) return '';
  const left = daysBetween(today, due);
  if (left < 0) return `${-left}일 지남`;
  if (left === 0) return '오늘';
  if (left === 1) return '내일';
  return `${left}일 뒤`;
}

/* ── 흐름 ───────────────────────────────────────────────────────────────── */

/**
 * 층과 층 사이를 흐르는 값.
 *
 * 보드의 네 층(비전·월·주·일)은 전부 **같은 한 가지 규칙**으로 진행률을 냅니다 —
 * 그 아래에 달린 할 일 중 끝난 비율입니다. 층마다 다른 계산을 쓰면
 * "이 60%가 무슨 60%인지"를 매번 다시 물어야 합니다.
 *
 * 할 일이 하나도 없으면 0%가 아니라 null 입니다. 시작도 안 한 것과
 * 해 놓고 아무것도 못 끝낸 것은 다른 상태입니다.
 */
export type Flow = { pct: number | null; done: number; total: number };

export function flow(done: number, total: number): Flow {
  return { pct: progress(done, total), done, total };
}

export function sumFlow(parts: Flow[]): Flow {
  let done = 0;
  let total = 0;
  for (const part of parts) {
    done += part.done;
    total += part.total;
  }
  return flow(done, total);
}

/**
 * 파이프의 세기 — 0에서 1까지.
 *
 * 화면에서 선의 굵기·밝기·흐름 속도가 전부 이 하나를 따릅니다.
 * 0%일 때도 완전히 0은 아닙니다 (0.06) — 연결이 끊긴 것과
 * 연결은 됐는데 아직 아무것도 안 흐르는 것은 다르게 보여야 합니다.
 */
export function flowStrength(pct: number | null): number {
  if (pct === null) return 0;
  return 0.06 + (pct / 100) * 0.94;
}

/* ── 이번 주 · 이번 달 ──────────────────────────────────────────────────── */

/** 월요일에 시작하는 주. 'YYYY-MM-DD' 두 개를 돌려줍니다. */
export function weekRange(today = todayKST()): { start: string; end: string } {
  const date = new Date(Date.UTC(+today.slice(0, 4), +today.slice(5, 7) - 1, +today.slice(8, 10)));
  // getUTCDay(): 일요일이 0. 월요일을 주의 첫날로 봅니다.
  const shift = (date.getUTCDay() + 6) % 7;
  const start = plusDays(today, -shift);
  return { start, end: plusDays(start, 6) };
}

export function monthRange(today = todayKST()): { start: string; end: string } {
  const start = today.slice(0, 8) + '01';
  const next = new Date(Date.UTC(+today.slice(0, 4), +today.slice(5, 7), 1));
  const end = plusDays(next.toISOString().slice(0, 10), -1);
  return { start, end };
}

export function inRange(date: string | null | undefined, range: { start: string; end: string }): boolean {
  if (!date) return false;
  return date >= range.start && date <= range.end;
}

/** '2026-09-13' → "9월" — 월 단위 목표 카드에 붙는 말 */
export function monthWord(date: string | null | undefined, today = todayKST()): string | null {
  if (!date) return null;
  const month = +date.slice(5, 7);
  return date.slice(0, 4) === today.slice(0, 4) ? `${month}월` : `${date.slice(0, 4)}년 ${month}월`;
}
