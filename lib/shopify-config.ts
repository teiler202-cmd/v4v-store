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

/**
 * 스토어프론트가 알아듣는 언어.
 *
 * 로케일을 '게시'하는 것만으로는 부족합니다 — 쇼피파이는 언어를 도메인마다 있는
 * '웹 프레즌스'에 매답니다. 실제로 en 을 게시했는데도 스토어프론트가 KO 만 돌려준
 * 적이 있는데, 영어가 사이트가 쓰지 않는 다른 도메인의 웹 프레즌스에 붙어 있었습니다.
 * 언어를 추가할 때는 '설정 → 마켓 → 언어'에서 이 도메인에 붙었는지 확인하세요.
 */
export type StorefrontLanguage = 'KO' | 'EN' | 'JA';

/**
 * 쿼리에 붙일 @inContext 지시자.
 *
 * ⚠️ 위의 API 버전과 똑같은 함정이 여기에도 있습니다 —
 *    게시되지 않은 로케일을 요청하면 쇼피파이는 오류를 내지 않고 조용히
 *    기본 언어로 돌려줍니다. EN 을 요청했을 때 실제 응답은
 *    extensions.context = { country: "KR", language: "KO" } 였습니다.
 *    글자가 한국어로 나올 뿐 화면은 멀쩡해서, 경고가 없으면 아무도 눈치채지 못합니다.
 *    그래서 shopifyFetch 가 '돌아온 언어'를 '요청한 언어'와 대조합니다.
 */
export function inContext(language?: StorefrontLanguage) {
  return language ? ` @inContext(language: ${language})` : '';
}

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
  init?: { revalidate?: number; noStore?: boolean; language?: StorefrontLanguage }
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

  // 요청한 언어와 실제로 서빙된 언어가 다르면, 그 로케일이 게시되지 않았다는 뜻입니다.
  // 조용히 넘어가면 '번역을 붙였는데 왜 안 나오지'로 며칠을 태우게 됩니다.
  const served = body?.extensions?.context?.language;
  if (init?.language && served && served !== init.language) {
    console.warn(
      `[shopify] ${init.language} 로 요청했지만 ${served} 로 응답했습니다 — ` +
        `쇼피파이 관리자 → 설정 → 언어에서 그 로케일이 '게시됨' 상태인지 확인하세요.`
    );
  }

  return body.data as T;
}
