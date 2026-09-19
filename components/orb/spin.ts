/** 한 바퀴 도는 데 걸리는 시간(초) — 인트로·헤더 구체의 세로축 회전 */
export const SPIN_PERIOD = 26;
/** 멈춘 상태에서 제 속도에 이르기까지의 시간 상수(초) */
const SPIN_EASE = 1.6;

/** 정지 상태에서 천천히 속도가 붙는 회전각(rad) — θ(t) = ω(t − τ(1 − e^(−t/τ))) */
export function spinAngle(seconds: number, period = SPIN_PERIOD) {
  const omega = (Math.PI * 2) / period;
  return omega * (seconds - SPIN_EASE * (1 - Math.exp(-seconds / SPIN_EASE)));
}

/** 브라우저가 한가할 때 실행합니다 (사파리처럼 requestIdleCallback이 없으면 잠시 뒤에). */
export function whenIdle(fn: () => void, timeout = 1500) {
  if (typeof window.requestIdleCallback === 'function') {
    const id = window.requestIdleCallback(fn, { timeout });
    return () => window.cancelIdleCallback(id);
  }
  const id = window.setTimeout(fn, 300);
  return () => window.clearTimeout(id);
}
