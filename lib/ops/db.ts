import 'server-only';
import postgres from 'postgres';

/**
 * 운영 보드의 데이터베이스 연결.
 *
 * ── 왜 브라우저가 아니라 서버에서만 붙는가 ──────────────────────────────
 *
 * next.config.ts 의 CSP 는 `connect-src 'self'` 입니다. 브라우저가 말을 걸 수
 * 있는 곳은 우리 서버뿐입니다. supabase-js 를 화면에서 쓰면 그 순간
 * `*.supabase.co` 로 나가는 요청이 전부 막힙니다.
 *
 * CSP 를 넓히는 대신 반대로 갔습니다 — 읽기는 서버 컴포넌트에서, 쓰기는
 * 서버 액션에서만 합니다. 그래서 이 파일은 'server-only' 입니다.
 * 덕분에 데이터베이스 비밀번호가 브라우저 번들에 실릴 길 자체가 없습니다.
 *
 * ── 왜 커넥션 풀러(6543)인가 ────────────────────────────────────────────
 *
 * 배포하면 요청마다 새 서버 인스턴스가 뜹니다. 그때마다 Postgres 에 직접
 * 접속하면(5432) 접속 수가 금방 한도에 닿습니다. Supabase 의 트랜잭션 풀러는
 * 그 앞에 서서 접속을 재사용합니다.
 *
 * 대신 트랜잭션 모드에서는 prepared statement 를 쓸 수 없습니다 —
 * `prepare: false` 가 그래서 필요합니다. 이걸 빠뜨리면 배포 후에야
 * "prepared statement already exists" 로 터집니다.
 */

/** 연결 문자열이 없으면 운영 보드 전체가 꺼진 것으로 칩니다 (스토어는 영향 없음) */
export function hasOpsConfig() {
  return Boolean(process.env.OPS_DATABASE_URL);
}

declare global {
  var __opsSql: ReturnType<typeof postgres> | undefined;
}

function create() {
  const url = process.env.OPS_DATABASE_URL;
  if (!url) throw new Error('OPS_DATABASE_URL 이 없습니다. .env.local 을 확인하세요.');

  return postgres(url, {
    // 위 설명 참고 — 트랜잭션 풀러에서는 필수입니다.
    prepare: false,

    /**
     * 한 서버 인스턴스가 쥐는 접속 수.
     *
     * ⚠️ 이 숫자는 위아래 양쪽으로 보드를 멈춰 세운 적이 있습니다.
     *
     *    3 일 때: 보드 한 장이 목표·할 일·비전·메모·설정·브리핑을 한꺼번에 읽는데,
     *    그 동시 요청이 접속 수를 넘기면 postgres.js 의 대기열이 풀리지 않았습니다.
     *
     *    10 일 때: 이번에는 반대쪽이 막혔습니다. Supabase 의 트랜잭션 풀러는 접속을
     *    프로젝트 전체가 나눠 쓰는 자리라, 우리가 열 개를 쥐면 풀러의 몫이 바닥납니다.
     *    그러면 다음 질의는 오류도 없이 멈춰 섭니다 — 개발 중 새로고침을 몇 번 하면
     *    보드 전체가 응답하지 않았습니다.
     *
     *    답은 두 가지를 함께 하는 것이었습니다.
     *      1) 한 화면이 접속을 적게 잡습니다 — 첫 화면은 왕복 한 번입니다
     *         (queries.ts 의 cascadeBoard), 나머지도 동시에 묻지 않고 차례로 묻습니다.
     *      2) 그러고도 이 숫자는 넉넉하게 둡니다. 5 로 줄였더니 동시 요청 다섯 개에서
     *         다시 멈췄습니다 — 모자란 쪽의 증상이 훨씬 고약합니다 (오류 없이 영영 멈춤).
     */
    max: 10,
    // 놀고 있는 접속은 20초 뒤 놓아 줍니다.
    idle_timeout: 20,

    /**
     * 새 접속마다 돌던 '타입 목록 받아오기'를 끕니다.
     *
     * postgres.js 는 접속을 열 때마다 pg_type 을 한 번 읽습니다. 접속 하나면
     * 눈에 띄지 않지만, 화면 여럿이 동시에 열리면서 새 접속이 한꺼번에 만들어지면
     * 그 준비 질의들이 서로를 기다리다 대기열이 풀리지 않았습니다.
     * (증상: 오류 없이 영영 멈춤 — 아래 max 주석의 그 멈춤입니다)
     *
     * 우리가 쓰는 타입은 전부 기본형이고, date 만 아래에서 직접 정해 줍니다.
     */
    fetch_types: false,
    // 10초 안에 답이 없으면 포기합니다 — 화면이 영원히 도는 것보다 낫습니다.
    connect_timeout: 10,

    /**
     * 어떤 질의도 15초를 넘기지 못하게 데이터베이스 쪽에서 끊습니다.
     *
     * 위의 멈춤이 무서웠던 건 느려서가 아니라 **조용해서**였습니다 —
     * 화면은 영영 돌고 로그에는 아무것도 안 남습니다. 이제는 15초에 오류가 나고,
     * 오류는 화면과 로그에 보입니다. 고칠 수 있는 문제가 됩니다.
     */
    connection: { statement_timeout: 15_000 },
    types: {
      // date 컬럼을 Date 객체로 바꾸면 시간대 때문에 하루씩 밀립니다.
      // (KST 자정에 UTC 로 바꾸면 전날이 됩니다 — 마감일이 하루 당겨져 보입니다)
      // 'YYYY-MM-DD' 문자열 그대로 받아서 쓰는 편이 안전합니다.
      date: {
        to: 1082,
        from: [1082],
        serialize: (v: string) => v,
        parse: (v: string) => v,
      },
    },
  });
}

/**
 * 개발 중에는 파일을 고칠 때마다 모듈이 새로 평가됩니다.
 * 그때마다 새 풀을 만들면 접속이 쌓여 Supabase 가 거절하기 시작합니다.
 * globalThis 에 붙여 두면 리로드를 건너 살아남습니다.
 */
function client(): ReturnType<typeof postgres> {
  return (globalThis.__opsSql ??= create());
}

/**
 * ⚠️ 접속은 '처음 쓸 때' 만듭니다. 모듈을 읽는 순간 만들면 안 됩니다.
 *
 *    hasOpsConfig() 하나를 가져다 쓰려고 이 파일을 import 하는 화면
 *    (예: 로그인 화면)도 함께 터집니다. 실제로 `next build` 가
 *    "Failed to collect page data for /ops/login" 으로 멈췄습니다 —
 *    빌드 기계에는 OPS_DATABASE_URL 이 없으니까요.
 *
 *    그래서 Proxy 로 감쌌습니다. sql`...` 로 실제 질의를 보내는 순간에만
 *    풀이 만들어지고, 그 전까지는 아무 일도 일어나지 않습니다.
 */
/**
 * 어떤 질의도 이 시간을 넘기면 포기합니다.
 *
 * ⚠️ statement_timeout(위)만으로는 부족합니다. 그건 **데이터베이스가 질의를 시작한 뒤**에
 *    세는 시간입니다. 접속을 못 얻어 대기열에 서 있는 동안에는 아무도 시간을 세지 않아서,
 *    화면이 영영 멈춰 있을 수 있습니다 — 오류도, 로그도 없이.
 *
 *    실제로 그랬습니다. 개발 중에 보드를 여러 장 동시에 열면 몇 장은 응답하지 않았고,
 *    그다음부터는 모든 요청이 멈췄습니다. 렌더링이 도중에 버려지면서 그 질의가 쥔 접속이
 *    돌아오지 않은 것입니다(버려진 promise 는 아무도 기다리지 않으니 풀리지도 않습니다).
 *
 *    그래서 여기서 시계를 겁니다. 시간이 지나면 질의를 취소하고 — 취소는 접속을
 *    풀어 줍니다 — 오류를 던집니다. 멈춘 화면이 오류 화면으로 바뀝니다.
 *    고칠 수 없는 침묵보다 고칠 수 있는 오류가 낫습니다.
 */
const QUERY_TIMEOUT_MS = 12_000;

/** sql`...` 인가, sql('테이블') 같은 도우미 호출인가 */
function isTaggedTemplate(args: unknown[]): boolean {
  const first = args[0] as { raw?: unknown } | undefined;
  return Array.isArray(first) && Array.isArray((first as { raw?: unknown }).raw);
}

type Cancellable = PromiseLike<unknown> & { cancel?: () => void };

/**
 * 시간을 넘긴 질의가 나오면 풀을 통째로 버립니다.
 *
 * 취소(query.cancel)만으로는 못 살립니다 — 취소 요청은 **새 접속**을 열어서 보내는데,
 * 풀이 막혀 있을 때는 그 접속도 열리지 않습니다. 그래서 막힌 풀은 고치지 않고 버립니다.
 * 다음 질의가 새 풀을 만들고, 버린 풀은 뒤에서 조용히 닫힙니다.
 *
 * 몰려든 질의가 한꺼번에 시간을 넘겨도 풀은 한 번만 버립니다 —
 * 방금 만든 새 풀을 그 뒤의 오류들이 다시 버리면 영원히 제자리입니다.
 */
let discardedAt = 0;

function discardPool() {
  const now = Date.now();
  if (now - discardedAt < 3_000) return;
  discardedAt = now;

  const dead = globalThis.__opsSql;
  globalThis.__opsSql = undefined;
  console.error('[ops] 질의가 멈춰 풀을 새로 만듭니다.');
  dead?.end({ timeout: 0 }).catch(() => {});
}

function guard(query: Cancellable): Promise<unknown> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const bell = new Promise<never>((_, reject) => {
    timer = setTimeout(() => {
      try { query.cancel?.(); } catch { /* 이미 끝난 질의였을 뿐입니다 */ }
      discardPool();
      reject(new Error(`질의가 ${QUERY_TIMEOUT_MS / 1000}초를 넘겨 취소했습니다.`));
    }, QUERY_TIMEOUT_MS);
  });

  return Promise.race([query, bell]).finally(() => clearTimeout(timer));
}

export const sql = new Proxy(function noop() {} as unknown as ReturnType<typeof postgres>, {
  apply(_target, _thisArg, args: unknown[]) {
    const result = (client() as unknown as (...a: unknown[]) => unknown)(...args);
    // sql('테이블')·sql(객체) 는 SQL 조각을 그 자리에서 돌려줍니다 — 기다릴 것이 없습니다.
    return isTaggedTemplate(args) ? guard(result as Cancellable) : result;
  },
  get(_target, prop: string | symbol) {
    const c = client() as unknown as Record<string | symbol, unknown>;
    const value = c[prop];
    return typeof value === 'function' ? value.bind(c) : value;
  },
});
