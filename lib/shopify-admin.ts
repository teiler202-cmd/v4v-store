import 'server-only';

/**
 * 쇼피파이 Admin API — 마케팅 수신 동의를 기록하는 유일한 통로.
 *
 * 왜 Storefront API 로는 안 되는가:
 *   스토어프론트의 customerCreate 는 비밀번호를 반드시 요구합니다.
 *   뉴스레터만 받고 싶은 사람에게 계정과 비밀번호를 만들게 할 수는 없습니다.
 *   반대로 Admin API 는 이메일만으로 고객을 만들고 동의 상태를 세울 수 있습니다.
 *
 * 이 파일은 '있으면 켜지는' 기능입니다.
 * SHOPIFY_ADMIN_ACCESS_TOKEN 이 없으면 뉴스레터 구독 창구를 아예 띄우지 않습니다 —
 * 눌러도 아무 데도 저장되지 않는 폼을 손님에게 보여 주는 것이 가장 나쁩니다.
 *
 * 토큰 만드는 법:
 *   Shopify 관리자 → 설정 → 앱 및 판매 채널 → 앱 개발 → 앱 만들기
 *   → Admin API 범위에서 write_customers, read_customers 허용 → 토큰 발급
 *
 * ⚠️ 이 토큰은 스토어의 고객 정보 전체를 다룰 수 있습니다.
 *    절대 NEXT_PUBLIC_ 접두사를 붙이지 마세요.
 */

import { SHOPIFY_API_VERSION, SHOPIFY_TIMEOUT_MS } from '@/lib/shopify-config';

function adminEndpoint() {
  const domain =
    process.env.SHOPIFY_STORE_DOMAIN || process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN || '';
  const base = domain.includes('https://') ? domain : `https://${domain}`;
  return `${base}/admin/api/${SHOPIFY_API_VERSION}/graphql.json`;
}

export function hasAdminConfig() {
  const domain =
    process.env.SHOPIFY_STORE_DOMAIN || process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN || '';
  return Boolean(domain && process.env.SHOPIFY_ADMIN_ACCESS_TOKEN);
}

async function adminFetch<T = any>(
  query: string,
  variables?: Record<string, unknown>
): Promise<{ data?: T; errors?: any[] }> {
  if (!hasAdminConfig()) return { errors: [{ message: 'admin-not-configured' }] };

  try {
    const response = await fetch(adminEndpoint(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': process.env.SHOPIFY_ADMIN_ACCESS_TOKEN as string,
      },
      body: JSON.stringify({ query, variables }),
      cache: 'no-store',
      signal: AbortSignal.timeout(SHOPIFY_TIMEOUT_MS),
    });

    if (!response.ok) {
      console.error('[admin] HTTP', response.status);
      return { errors: [{ message: `http-${response.status}` }] };
    }
    return await response.json();
  } catch (error) {
    console.error('[admin] 통신 오류:', error instanceof Error ? error.message : 'unknown');
    return { errors: [{ message: 'network' }] };
  }
}

const FIND_CUSTOMER = `
  query findCustomer($query: String!) {
    customers(first: 1, query: $query) {
      edges { node { id email emailMarketingConsent { marketingState } } }
    }
  }
`;

const CREATE_CUSTOMER = `
  mutation createCustomer($input: CustomerInput!) {
    customerCreate(input: $input) {
      customer { id }
      userErrors { field message }
    }
  }
`;

const CONSENT_UPDATE = `
  mutation consentUpdate($input: CustomerEmailMarketingConsentUpdateInput!) {
    customerEmailMarketingConsentUpdate(input: $input) {
      customer { id }
      userErrors { field message }
    }
  }
`;

/** 이메일 주소로 고객 한 명 찾기 — 없으면 null */
async function findCustomer(email: string) {
  // 주소에 따옴표가 섞여 검색 문법이 깨지지 않도록 감싸 줍니다.
  const safe = email.replace(/["\\]/g, '');
  const { data } = await adminFetch<any>(FIND_CUSTOMER, { query: `email:"${safe}"` });
  return data?.customers?.edges?.[0]?.node ?? null;
}

export type ConsentResult =
  | { ok: true; already?: boolean }
  | { ok: false; reason: 'not-configured' | 'failed' };

/** 마케팅 수신 동의 — 고객이 없으면 만들고, 있으면 상태만 올립니다 */
export async function subscribeToMarketing(email: string): Promise<ConsentResult> {
  if (!hasAdminConfig()) return { ok: false, reason: 'not-configured' };

  const consent = {
    marketingState: 'SUBSCRIBED',
    // 웹 폼에서 직접 체크한 동의라 단일 옵트인입니다.
    marketingOptInLevel: 'SINGLE_OPT_IN',
    consentUpdatedAt: new Date().toISOString(),
  };

  const existing = await findCustomer(email);

  if (!existing) {
    const { data, errors } = await adminFetch<any>(CREATE_CUSTOMER, {
      input: { email, emailMarketingConsent: consent },
    });
    const failed = errors?.length || data?.customerCreate?.userErrors?.length;
    if (failed) {
      console.error('[admin] 구독자 생성 실패');
      return { ok: false, reason: 'failed' };
    }
    return { ok: true };
  }

  if (existing.emailMarketingConsent?.marketingState === 'SUBSCRIBED') {
    return { ok: true, already: true };
  }

  const { data, errors } = await adminFetch<any>(CONSENT_UPDATE, {
    input: { customerId: existing.id, emailMarketingConsent: consent },
  });
  const failed = errors?.length || data?.customerEmailMarketingConsentUpdate?.userErrors?.length;
  if (failed) {
    console.error('[admin] 동의 상태 갱신 실패');
    return { ok: false, reason: 'failed' };
  }
  return { ok: true };
}

/** 수신거부 — 가입된 적 없는 주소여도 성공으로 답합니다(가입 여부를 알려주지 않기 위해) */
export async function unsubscribeFromMarketing(email: string): Promise<ConsentResult> {
  if (!hasAdminConfig()) return { ok: false, reason: 'not-configured' };

  const existing = await findCustomer(email);
  if (!existing) return { ok: true, already: true };

  const { data, errors } = await adminFetch<any>(CONSENT_UPDATE, {
    input: {
      customerId: existing.id,
      emailMarketingConsent: {
        marketingState: 'UNSUBSCRIBED',
        consentUpdatedAt: new Date().toISOString(),
      },
    },
  });
  const failed = errors?.length || data?.customerEmailMarketingConsentUpdate?.userErrors?.length;
  if (failed) {
    console.error('[admin] 수신거부 처리 실패');
    return { ok: false, reason: 'failed' };
  }
  return { ok: true };
}
