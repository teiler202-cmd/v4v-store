import 'server-only';

/**
 * 쇼피파이 접속 설정 — 한 곳에서만 관리합니다.
 *
 * 예전에는 파일마다 API 버전이 제각각이었습니다(2024-01, 2024-10).
 * 더 나쁜 건, 그 고정이 사실은 지켜지지 않았다는 점입니다 —
 * 지원이 끝난 버전을 요청하면 쇼피파이는 오류 대신 조용히 다른 버전으로 바꿔 응답합니다.
 * (2024-01 을 요청했을 때 실제 응답 헤더는 x-shopify-api-version: 2025-10 이었습니다)
 * 그래서 "고정했다고 믿었지만 실제로는 떠다니는" 상태였습니다.
 *
 * 지금은 실제로 서빙되던 버전을 그대로 명시했습니다 — 동작은 그대로이고, 이제 정직합니다.
 *
 * 📌 버전을 올릴 때: 이 상수 하나만 바꾸면 전체에 적용됩니다.
 *    올리기 전에 응답 헤더의 x-shopify-api-version 이 요청한 값과 같은지 확인하세요.
 */
export const SHOPIFY_API_VERSION = '2025-10';

/** 쇼피파이가 느릴 때 페이지 전체가 매달리지 않도록 하는 상한 */
export const SHOPIFY_TIMEOUT_MS = 8000;

function requireEnv() {
  const domain =
    process.env.SHOPIFY_STORE_DOMAIN || process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN || '';
  const token =
    process.env.SHOPIFY_STOREFRONT_ACCESS_TOKEN ||
    process.env.NEXT_PUBLIC_SHOPIFY_STOREFRONT_ACCESS_TOKEN ||
    '';
  return { domain, token };
}

export function shopifyEndpoint() {
  const { domain } = requireEnv();
  const base = domain.includes('https://') ? domain : `https://${domain}`;
  return `${base}/api/${SHOPIFY_API_VERSION}/graphql.json`;
}

export function shopifyToken() {
  return requireEnv().token;
}

export function hasShopifyConfig() {
  const { domain, token } = requireEnv();
  return Boolean(domain && token);
}

/**
 * 쇼피파이 GraphQL 호출.
 *
 * 실패를 조용히 삼키지 않고 예외를 던집니다 —
 * 예전에는 통신이 실패해도 빈 배열을 돌려줬는데, 그러면 "상품이 없는 화면"이
 * 정상 결과로 취급되어 캐시에 그대로 저장됐습니다.
 * 쇼피파이가 잠깐 흔들린 것뿐인데 멀쩡하던 상품 페이지가 몇 분간 텅 비게 됩니다.
 */
export async function shopifyFetch<T = any>(
  query: string,
  variables?: Record<string, unknown>,
  init?: { revalidate?: number; noStore?: boolean }
): Promise<T> {
  if (!hasShopifyConfig()) {
    throw new Error('[shopify] 접속 정보가 없습니다 — SHOPIFY_STORE_DOMAIN / SHOPIFY_STOREFRONT_ACCESS_TOKEN 확인');
  }

  const response = await fetch(shopifyEndpoint(), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Storefront-Access-Token': shopifyToken(),
    },
    body: JSON.stringify({ query, variables }),
    signal: AbortSignal.timeout(SHOPIFY_TIMEOUT_MS),
    ...(init?.noStore ? { cache: 'no-store' as const } : { next: { revalidate: init?.revalidate ?? 60 } }),
  });

  if (!response.ok) {
    throw new Error(`[shopify] HTTP ${response.status}`);
  }

  const body = await response.json();

  if (body.errors?.length) {
    // 메시지만 남깁니다 — 응답 본문 전체를 로그에 쏟으면 토큰·개인정보가 섞일 수 있습니다.
    throw new Error(`[shopify] ${body.errors.map((e: any) => e?.message).join(' / ')}`);
  }

  return body.data as T;
}
