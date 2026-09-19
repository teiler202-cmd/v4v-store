/** 한 바퀴 도는 데 걸리는 시간(초) — 인트로·헤더 구체의 세로축 회전 */
export const SPIN_PERIOD = 26;
/** 멈춘 상태에서 제 속도에 이르기까지의 시간 상수(초) */
const SPIN_EASE = 1.6;

/** 정지 상태에서 천천히 속도가 붙는 회전각(rad) — θ(t) = ω(t − τ(1 − e^(−t/τ))) */
export function spinAngle(seconds: number, period = SPIN_PERIOD) {
  const omega = (Math.PI * 2) / period;
  return omega * (seconds - SPIN_EASE * (1 - Math.exp(-seconds / SPIN_EASE)));
}

/** requestIdleCallback이 없을 때(사파리) 페이지 로드가 끝난 뒤 기다리는 시간(ms) */
const NO_IDLE_DELAY = 1500;
/** load를 기다리는 최대 시간(ms) — 넘으면 load 없이 위 지연을 겁니다 */
const LOAD_CAP_MS = 6000;

/** 브라우저가 한가할 때 실행합니다 (사파리처럼 requestIdleCallback이 없으면 로드가 끝나고 잠시 뒤에). */
export function whenIdle(fn: () => void, timeout = 1500) {
  if (typeof window.requestIdleCallback === 'function') {
    const id = window.requestIdleCallback(fn, { timeout });
    return () => window.cancelIdleCallback(id);
  }
  // 사파리에는 '한가함'을 알려 줄 길이 없습니다. 예전의 300ms는 첫 화면 타일이 떠오르는 도중(1.15초 + 시차)이나
  // 인트로 베일이 걷히는 도중(1.3초)에 WebGL 준비(2048² 업로드)를 끼워 넣어 프레임이 튀었습니다 —
  // 로드가 끝난 뒤 1.5초를 기다려 그 등장들이 끝난 다음에 시작합니다. 그때까진 같은 그림의 정지 사진이 보입니다.
  let id = 0;
  let cap = 0;
  const arm = () => {
    window.clearTimeout(cap);
    window.removeEventListener('load', arm);
    if (!id) id = window.setTimeout(fn, NO_IDLE_DELAY);
  };
  if (document.readyState === 'complete') arm();
  else {
    window.addEventListener('load', arm, { once: true });
    // 멈춘 요청 하나(상품 사진·폰트)가 load를 한없이 붙잡아도 구체는 늦게나마 돕니다.
    cap = window.setTimeout(arm, LOAD_CAP_MS);
  }
  return () => {
    window.removeEventListener('load', arm);
    window.clearTimeout(cap);
    window.clearTimeout(id);
  };
}
