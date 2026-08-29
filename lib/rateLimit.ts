import 'server-only';
import { headers } from 'next/headers';

/**
 * 아주 단순한 시도 횟수 제한.
 *
 * 로그인·가입·비밀번호 재설정은 지금까지 아무 제한이 없었습니다.
 * 브라우저 화면을 거치지 않고 서버 액션에 곧바로 요청을 퍼부으면
 * (1) 비밀번호를 사전으로 계속 찍어 볼 수 있고
 * (2) 남의 이메일로 재설정 메일을 무한정 보낼 수 있습니다.
 *
 * ⚠️ 한계를 분명히 해 둡니다: 이 기록은 서버 메모리에만 있습니다.
 *    서버가 여러 대로 늘어나거나 재배포되면 초기화됩니다.
 *    본격적인 방어가 필요해지면 Vercel WAF나 Upstash 같은
 *    공용 저장소 기반 제한으로 옮기세요. 그래도 지금처럼
 *    "아무 제한 없음"보다는 훨씬 낫습니다.
 */

type Bucket = { hits: number[]; blockedUntil: number };

const buckets = new Map<string, Bucket>();
const MAX_KEYS = 5000; // 메모리가 무한정 불어나지 않게

/** 요청자를 구분할 열쇠 — 프록시가 붙여 주는 원래 IP를 씁니다 */
async function clientKey(scope: string) {
  const h = await headers();
  const forwarded = h.get('x-forwarded-for') ?? '';
  const ip = forwarded.split(',')[0].trim() || h.get('x-real-ip') || 'unknown';
  return `${scope}:${ip}`;
}

function sweep(now: number) {
  if (buckets.size < MAX_KEYS) return;
  for (const [key, bucket] of buckets) {
    if (bucket.blockedUntil < now && bucket.hits.every((t) => now - t > 3_600_000)) {
      buckets.delete(key);
    }
  }
}

export type RateLimitResult = { ok: true } | { ok: false; retryAfterSec: number };

/**
 * @param scope    'signin' 처럼 동작 이름
 * @param limit    허용 횟수
 * @param windowMs 그 횟수를 세는 시간 창
 * @param blockMs  넘었을 때 막아 두는 시간
 */
export async function rateLimit(
  scope: string,
  { limit, windowMs, blockMs }: { limit: number; windowMs: number; blockMs: number }
): Promise<RateLimitResult> {
  const now = Date.now();
  const key = await clientKey(scope);
  sweep(now);

  const bucket = buckets.get(key) ?? { hits: [], blockedUntil: 0 };

  if (bucket.blockedUntil > now) {
    return { ok: false, retryAfterSec: Math.ceil((bucket.blockedUntil - now) / 1000) };
  }

  bucket.hits = bucket.hits.filter((t) => now - t < windowMs);
  bucket.hits.push(now);

  if (bucket.hits.length > limit) {
    bucket.blockedUntil = now + blockMs;
    bucket.hits = [];
    buckets.set(key, bucket);
    return { ok: false, retryAfterSec: Math.ceil(blockMs / 1000) };
  }

  buckets.set(key, bucket);
  return { ok: true };
}

/** 성공했을 때는 기록을 지워 줍니다 — 정상 사용자가 누적으로 막히지 않게 */
export async function clearRateLimit(scope: string) {
  buckets.delete(await clientKey(scope));
}

export function tooManyMessage(retryAfterSec: number) {
  const minutes = Math.ceil(retryAfterSec / 60);
  return `시도가 너무 잦습니다. ${minutes}분 후에 다시 시도해 주세요.`;
}
