'use server'; // [핵심]: 이 파일 안의 함수는 무조건 서버(백엔드)에서만 실행하라는 엄격한 명령어입니다.

import { getSessionToken } from '@/lib/session';
import { SHOPIFY_TIMEOUT_MS, hasShopifyConfig, shopifyEndpoint, shopifyToken } from '@/lib/shopify-config';

/**
 * 쇼피파이 결제창(Checkout) 생성.
 *
 * ⚠️ 2025년부로 쇼피파이가 Storefront API에서 checkoutCreate 뮤테이션을 완전히 제거했습니다.
 *    (현재 스토어에 질의하면 "Field 'checkoutCreate' doesn't exist on type 'Mutation'" 응답)
 *    그래서 공식 후속 규격인 Cart API(cartCreate)로 장바구니를 만들고,
 *    거기서 돌려주는 checkoutUrl로 결제 페이지를 엽니다.
 */

const CART_CREATE = `
  mutation cartCreate($lines: [CartLineInput!]!, $buyerIdentity: CartBuyerIdentityInput) {
    cartCreate(input: { lines: $lines, buyerIdentity: $buyerIdentity }) {
      cart {
        id
        checkoutUrl
      }
      userErrors {
        code
        field
        message
      }
    }
  }
`;

export type CheckoutResult =
  | { ok: true; url: string; member: boolean }
  | { ok: false; message: string };

/**
 * @param asGuest true면 로그인 상태여도 비회원(게스트)으로 주문합니다.
 */
/** 한 번에 주문할 수 있는 상품 종류 수 */
const MAX_LINES = 50;
/** 한 상품당 최대 수량 */
const MAX_QUANTITY = 20;
/** 쇼피파이 상품 옵션(Variant) 식별자 형식 */
const VARIANT_ID = /^gid:\/\/shopify\/ProductVariant\/\d+$/;

export async function createCheckout(
  lineItems: { variantId: string; quantity: number }[],
  options?: { asGuest?: boolean }
): Promise<CheckoutResult> {
  // 장바구니는 손님 브라우저에 저장되어 있어 얼마든지 고쳐 보낼 수 있습니다.
  // (결제 금액은 쇼피파이가 서버에서 다시 계산하므로 가격 조작은 불가능하지만,
  //  터무니없는 수량이나 수천 줄짜리 요청으로 쇼피파이 호출을 부풀리는 건 막아야 합니다)
  if (!Array.isArray(lineItems) || !lineItems.length) {
    return { ok: false, message: '장바구니가 비어 있습니다.' };
  }
  if (lineItems.length > MAX_LINES) {
    return { ok: false, message: '한 번에 주문할 수 있는 상품 종류를 넘었습니다.' };
  }

  const lines: { merchandiseId: string; quantity: number }[] = [];
  for (const item of lineItems) {
    const quantity = Number(item?.quantity);
    if (!VARIANT_ID.test(String(item?.variantId ?? ''))) {
      return { ok: false, message: '주문할 수 없는 상품이 포함되어 있습니다.' };
    }
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > MAX_QUANTITY) {
      return { ok: false, message: `수량은 1개 이상 ${MAX_QUANTITY}개 이하로 선택해 주세요.` };
    }
    // Cart API는 variantId 대신 merchandiseId를 받습니다.
    lines.push({ merchandiseId: item.variantId, quantity });
  }

  if (!hasShopifyConfig()) {
    console.error('[checkout] 쇼피파이 환경변수가 없습니다. SHOPIFY_STORE_DOMAIN / SHOPIFY_STOREFRONT_ACCESS_TOKEN 를 확인하세요.');
    return { ok: false, message: '스토어 설정을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.' };
  }

  // 회원 주문이면 장바구니에 고객을 붙여둡니다 —
  // 쇼피파이 결제창이 배송지·연락처를 미리 채우고, 주문이 계정 기록에 남습니다.
  const sessionToken = options?.asGuest ? null : await getSessionToken();
  const buyerIdentity = sessionToken ? { customerAccessToken: sessionToken } : undefined;

  try {
    const response = await fetch(shopifyEndpoint(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Storefront-Access-Token': shopifyToken(),
      },
      body: JSON.stringify({ query: CART_CREATE, variables: { lines, buyerIdentity } }),
      cache: 'no-store', // 결제창은 매번 새로 생성해야 함
      signal: AbortSignal.timeout(SHOPIFY_TIMEOUT_MS),
    });

    if (!response.ok) {
      // 상태 코드만 남깁니다 — 응답 본문에는 토큰이나 개인정보가 섞일 수 있습니다.
      console.error('[checkout] HTTP 오류:', response.status);
      return { ok: false, message: '결제 서버에 연결하지 못했습니다. 잠시 후 다시 시도해 주세요.' };
    }

    const body = await response.json();

    if (body.errors?.length) {
      console.error('[checkout] GraphQL 오류:', JSON.stringify(body.errors));
      return { ok: false, message: '결제 정보를 만드는 중 문제가 발생했습니다.' };
    }

    const userErrors = body.data?.cartCreate?.userErrors ?? [];
    if (userErrors.length) {
      console.error('[checkout] 장바구니 오류:', JSON.stringify(userErrors));
      // 품절·수량 초과 등은 쇼피파이가 사람이 읽을 수 있는 메시지를 줍니다.
      return { ok: false, message: userErrors[0]?.message || '주문할 수 없는 상품이 있습니다.' };
    }

    const url = body.data?.cartCreate?.cart?.checkoutUrl;
    if (!url) {
      console.error('[checkout] checkoutUrl이 비어 있습니다:', JSON.stringify(body).slice(0, 500));
      return { ok: false, message: '결제창 주소를 받지 못했습니다.' };
    }

    return { ok: true, url, member: Boolean(sessionToken) };
  } catch (error) {
    console.error('[checkout] 통신 오류:', error);
    return { ok: false, message: '네트워크 오류로 결제창을 열지 못했습니다.' };
  }
}
