import 'server-only';

/**
 * 창립 50인 — 첫 티셔츠를 사 준 사람들에게 주는 '보증 수표'.
 *
 * 약속: 이 티셔츠를 산 사람은 앞으로 아무 때나 옷 한 벌을 무료로 가져갈 수 있다.
 *       다음 드롭에 써도 되고, 10년 뒤에 써도 된다.
 *
 * 이 파일은 그 약속을 쇼피파이의 '할인 코드'라는 형태로 옮겨 둔 것입니다.
 *
 * ── 왜 이런 모양인가 ─────────────────────────────────────────
 *
 * 1) 만료일을 아예 넣지 않습니다 (endsAt 생략).
 *    쇼피파이 할인은 endsAt 이 없으면 무기한입니다. 1년짜리를 발급해 두고
 *    "나중에 연장하면 되지"라고 미루면, 연장을 잊은 날 약속이 깨집니다.
 *    약속을 지키는 가장 확실한 방법은 만료일을 처음부터 만들지 않는 것입니다.
 *
 * 2) 코드를 '그 사람'에게 묶습니다 (customerSelection.customers).
 *    누구나 쓸 수 있는 1회용 코드는, 한 명이 스크린샷을 올리는 순간
 *    모르는 사람이 먼저 써 버립니다. 10년을 버텨야 하는 코드라면
 *    유출 가능성은 0%가 아니라 100%에 가깝다고 봐야 합니다.
 *    고객 계정에 묶어 두면 코드가 세상에 퍼져도 주인만 쓸 수 있습니다.
 *
 *    ⚠️ 대신 이 코드는 '로그인한 상태에서만' 통합니다.
 *       비회원 주문으로는 쓸 수 없다는 걸 안내문에 반드시 적어야 합니다.
 *
 * 3) 발급 기록은 쇼피파이 '태그'로 남깁니다 (메타필드가 아니라).
 *    태그는 쇼피파이 관리자 화면의 고객 세그먼트 편집기에서 바로 조건으로
 *    쓸 수 있습니다 — 창립 50인에게만 무료 배송을 걸거나 메일을 보낼 때
 *    클릭 몇 번으로 끝납니다. 메타필드는 그 화면에 나타나지 않습니다.
 *
 * ── 필요한 Admin API 권한 ────────────────────────────────────
 *    read_orders      (누가 샀는지 찾기)
 *    read_customers / write_customers  (태그 달기)
 *    write_discounts  (할인 코드 만들기)
 *    read_products    (대상 상품 찾기 — 선택)
 *
 *    쇼피파이 관리자 → 설정 → 앱 및 판매 채널 → 앱 개발 → 해당 앱
 *    → API 범위 설정에서 위 항목을 켠 뒤 토큰을 다시 발급받아야 합니다.
 *    (범위를 늘려도 기존 토큰에는 소급 적용되지 않습니다)
 */

import { SHOPIFY_API_VERSION, SHOPIFY_TIMEOUT_MS } from '@/lib/shopify-config';

/* ===============================================================
   상수 — 약속의 내용
   =============================================================== */

/** 창립 멤버 정원. 첫 생산 수량과 같습니다. */
export const FOUNDER_LIMIT = 50;

/** 창립 50인 전체에 붙는 태그 — 세그먼트/메일 발송의 기준이 됩니다 */
export const FOUNDER_TAG = 'founding-50';

/** 코드 접두어 — 사람이 눈으로 보고 무엇인지 알 수 있게 */
export const FOUNDER_CODE_PREFIX = 'V4V-FOUNDER';

/**
 * 무료로 가져갈 수 있는 수량. 1벌.
 * (쇼피파이에서는 "수량 1개에 대해 100% 할인"으로 표현됩니다)
 */
export const FOUNDER_FREE_QUANTITY = 1;

/**
 * 무료 대상 범위.
 *
 * 값이 없으면 '전 품목 중 아무거나 한 벌'입니다 — 가장 관대하고,
 * '보증 수표'라는 말에 가장 충실합니다. 다만 훗날 60만 원짜리 아우터를
 * 내놓으면 그것도 무료가 됩니다. 그게 부담스러우면 쇼피파이에서
 * 컬렉션을 하나 만들고(예: founder-credit) 그 핸들을 넣으세요.
 */
export const FOUNDER_COLLECTION_HANDLE = process.env.V4V_FOUNDER_COLLECTION_HANDLE || '';

/** 창립 멤버 번호를 코드로 — 3자리 고정이라 정렬해도 순서가 유지됩니다 */
export function founderCode(number: number) {
  return `${FOUNDER_CODE_PREFIX}-${String(number).padStart(3, '0')}`;
}

/** 몇 번 창립 멤버인지 고객 태그로도 남겨 둡니다 */
export function founderNumberTag(number: number) {
  return `founder-no-${String(number).padStart(3, '0')}`;
}

/* ===============================================================
   Admin API 통신
   =============================================================== */

function adminEndpoint() {
  const domain =
    process.env.SHOPIFY_STORE_DOMAIN || process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN || '';
  const base = domain.includes('https://') ? domain : `https://${domain}`;
  return `${base}/admin/api/${SHOPIFY_API_VERSION}/graphql.json`;
}

export function hasFounderConfig() {
  const domain =
    process.env.SHOPIFY_STORE_DOMAIN || process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN || '';
  return Boolean(domain && process.env.SHOPIFY_ADMIN_ACCESS_TOKEN);
}

/**
 * 발급은 한 번에 수십 건이 오갑니다. 뉴스레터 동의(8초)와 같은 상한을 쓰면
 * 주문 목록을 훑는 도중에 끊깁니다. 여기서만 더 길게 잡습니다.
 */
const FOUNDER_TIMEOUT_MS = Math.max(SHOPIFY_TIMEOUT_MS, 20000);

/** 쇼피파이가 돌려주는 오류의 최소 모양 — 메시지만 쓰고 나머지는 로그로 흘립니다 */
type GraphQLError = { message?: string; code?: string };

/** 뮤테이션이 "형식은 맞는데 내용이 틀렸다"고 알려 줄 때 쓰는 자리 */
type UserError = { field?: string[] | null; code?: string | null; message?: string };

async function adminFetch<T>(
  query: string,
  variables?: Record<string, unknown>
): Promise<{ data?: T; errors?: GraphQLError[] }> {
  if (!hasFounderConfig()) return { errors: [{ message: 'admin-not-configured' }] };

  try {
    const response = await fetch(adminEndpoint(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': process.env.SHOPIFY_ADMIN_ACCESS_TOKEN as string,
      },
      body: JSON.stringify({ query, variables }),
      cache: 'no-store',
      signal: AbortSignal.timeout(FOUNDER_TIMEOUT_MS),
    });

    if (!response.ok) {
      // 401/403 이면 대개 토큰의 API 범위가 모자란 경우입니다.
      console.error('[founder] HTTP', response.status);
      return { errors: [{ message: `http-${response.status}` }] };
    }
    return await response.json();
  } catch (error) {
    console.error('[founder] 통신 오류:', error instanceof Error ? error.message : 'unknown');
    return { errors: [{ message: 'network' }] };
  }
}

/* ===============================================================
   1단계 — 누가 샀는가
   =============================================================== */

const FIND_PRODUCT = `
  query findProduct($query: String!) {
    products(first: 1, query: $query) {
      nodes { id title handle totalInventory }
    }
  }
`;

const ORDERS_PAGE = `
  query founderOrders($cursor: String) {
    orders(first: 50, after: $cursor, sortKey: CREATED_AT, query: "status:any") {
      pageInfo { hasNextPage endCursor }
      nodes {
        id
        name
        createdAt
        displayFinancialStatus
        customer { id email firstName lastName tags }
        lineItems(first: 50) {
          nodes { quantity product { id } }
        }
      }
    }
  }
`;

/** 주문 한 쪽의 응답 모양 — 커서를 되먹이는 반복문이라 형태를 못 박아 둡니다 */
type OrdersPage = {
  orders: {
    pageInfo: { hasNextPage: boolean; endCursor: string | null };
    nodes: {
      id: string;
      name: string;
      createdAt: string;
      displayFinancialStatus: string | null;
      customer: {
        id: string;
        email: string | null;
        firstName: string | null;
        lastName: string | null;
        tags: string[];
      } | null;
      lineItems: { nodes: { quantity: number; product: { id: string } | null }[] };
    }[];
  };
};

export type FounderBuyer = {
  customerId: string;
  email: string;
  name: string;
  orderName: string;
  orderedAt: string;
  quantity: number;
  /** 이미 창립 멤버로 기록된 사람인지 (태그로 판단) */
  alreadyTagged: boolean;
};

export type ProductBrief = { id: string; title: string; handle: string };

/** 상품 핸들(주소에 쓰이는 이름)로 상품 하나 찾기 */
export async function findProductByHandle(handle: string): Promise<ProductBrief | null> {
  const safe = handle.replace(/["\\]/g, '').trim();
  if (!safe) return null;
  const { data } = await adminFetch<{ products: { nodes: ProductBrief[] } }>(FIND_PRODUCT, {
    query: `handle:${safe}`,
  });
  const node = data?.products?.nodes?.[0];
  return node ? { id: node.id, title: node.title, handle: node.handle } : null;
}

/**
 * 그 상품을 실제로 산 사람들.
 *
 * 쇼피파이 주문 검색 문법으로는 "이 상품이 들어간 주문"을 직접 거를 수 없어서,
 * 주문을 훑으면서 품목을 직접 확인합니다. 첫 드롭 50장이면 주문도 50건 안팎이라
 * 몇 초면 끝납니다. (스토어가 커지면 이 방식은 느려집니다 — 그때는
 *  주문 검색 대신 쇼피파이 관리자에서 CSV로 뽑는 편이 낫습니다)
 *
 * 취소·환불된 주문은 제외합니다. 돈을 돌려받은 사람에게 보증 수표까지
 * 줄 이유는 없고, 무엇보다 정원 50자리를 차지하면 안 됩니다.
 */
export async function listBuyers(productId: string): Promise<
  { ok: true; buyers: FounderBuyer[]; scanned: number } | { ok: false; message: string }
> {
  if (!hasFounderConfig()) {
    return { ok: false, message: 'Admin API 토큰이 없습니다. SHOPIFY_ADMIN_ACCESS_TOKEN 을 설정하세요.' };
  }

  /** 한 사람이 두 번 샀어도 보증 수표는 한 장입니다 — 고객 기준으로 모읍니다 */
  const byCustomer = new Map<string, FounderBuyer>();
  let cursor: string | null = null;
  let scanned = 0;
  // 무한 루프 방지 — 50건씩 40쪽이면 주문 2,000건입니다.
  for (let page = 0; page < 40; page += 1) {
    // 커서를 다시 자기 자신에게 먹이는 반복문이라, 응답 타입을 추론에 맡기면
    // 타입스크립트가 순환에 빠집니다. 그래서 여기만 형태를 직접 적어 둡니다.
    const response: { data?: OrdersPage; errors?: GraphQLError[] } =
      await adminFetch<OrdersPage>(ORDERS_PAGE, { cursor });
    if (response.errors?.length) {
      return {
        ok: false,
        message:
          '주문을 불러오지 못했습니다. 토큰에 read_orders 권한이 있는지 확인하세요.',
      };
    }

    const connection = response.data?.orders;
    if (!connection) return { ok: false, message: '주문 응답이 비어 있습니다.' };

    for (const order of connection.nodes ?? []) {
      scanned += 1;

      // 환불·취소된 주문은 세지 않습니다.
      const status = order.displayFinancialStatus;
      if (status === 'REFUNDED' || status === 'VOIDED') continue;

      const quantity = (order.lineItems?.nodes ?? [])
        .filter((line) => line?.product?.id === productId)
        .reduce((sum, line) => sum + (line.quantity ?? 0), 0);
      if (quantity <= 0) continue;

      const customer = order.customer;
      // 고객 레코드가 없는 주문(아주 드문 수동 주문)은 코드를 묶을 대상이 없습니다.
      if (!customer?.id || !customer?.email) continue;

      const existing = byCustomer.get(customer.id);
      if (existing) {
        existing.quantity += quantity;
        // 가장 이른 주문을 그 사람의 '합류 시점'으로 둡니다.
        if (order.createdAt < existing.orderedAt) {
          existing.orderedAt = order.createdAt;
          existing.orderName = order.name;
        }
        continue;
      }

      byCustomer.set(customer.id, {
        customerId: customer.id,
        email: customer.email,
        name: [customer.firstName, customer.lastName].filter(Boolean).join(' ').trim(),
        orderName: order.name,
        orderedAt: order.createdAt,
        quantity,
        alreadyTagged: Array.isArray(customer.tags) && customer.tags.includes(FOUNDER_TAG),
      });
    }

    if (!connection.pageInfo?.hasNextPage) break;
    cursor = connection.pageInfo.endCursor;
  }

  // 먼저 산 사람이 낮은 번호를 받습니다 — 번호가 곧 순서의 기록입니다.
  const buyers = [...byCustomer.values()].sort((a, b) => a.orderedAt.localeCompare(b.orderedAt));
  return { ok: true, buyers, scanned };
}

/* ===============================================================
   2단계 — 보증 수표 발급
   =============================================================== */

const FIND_COLLECTION = `
  query findCollection($query: String!) {
    collections(first: 1, query: $query) { nodes { id handle } }
  }
`;

const DISCOUNT_CREATE = `
  mutation founderCredit($basicCodeDiscount: DiscountCodeBasicInput!) {
    discountCodeBasicCreate(basicCodeDiscount: $basicCodeDiscount) {
      codeDiscountNode { id }
      userErrors { field code message }
    }
  }
`;

const TAGS_ADD = `
  mutation tagCustomer($id: ID!, $tags: [String!]!) {
    tagsAdd(id: $id, tags: $tags) {
      userErrors { field message }
    }
  }
`;

export type IssuedCredit = {
  number: number;
  code: string;
  email: string;
  name: string;
  customerId: string;
  orderName: string;
  orderedAt: string;
  issuedAt: string;
};

export type IssueOutcome =
  | { ok: true; credit: IssuedCredit }
  | { ok: false; email: string; message: string };

let collectionIdCache: string | null | undefined;

/** 무료 대상 컬렉션이 지정돼 있으면 그 id를, 아니면 null(전 품목) */
async function resolveCollectionId(): Promise<string | null> {
  if (!FOUNDER_COLLECTION_HANDLE) return null;
  if (collectionIdCache !== undefined) return collectionIdCache;

  const safe = FOUNDER_COLLECTION_HANDLE.replace(/["\\]/g, '').trim();
  const { data } = await adminFetch<{ collections: { nodes: { id: string }[] } }>(
    FIND_COLLECTION,
    { query: `handle:${safe}` }
  );
  const found: string | null = data?.collections?.nodes?.[0]?.id ?? null;
  collectionIdCache = found;
  if (!found) {
    console.error('[founder] 컬렉션을 찾지 못했습니다:', safe, '— 전 품목 대상으로 발급합니다.');
  }
  return found;
}

/**
 * 한 사람에게 보증 수표 한 장.
 *
 * 이미 있는 코드를 다시 만들면 쇼피파이가 거절합니다(코드 중복).
 * 그 거절은 오류가 아니라 '이미 발급됨'이라는 뜻이므로 그대로 알려 줍니다.
 */
export async function issueCredit(
  buyer: FounderBuyer,
  number: number
): Promise<IssueOutcome> {
  if (!hasFounderConfig()) {
    return { ok: false, email: buyer.email, message: 'Admin API 토큰이 없습니다.' };
  }

  const code = founderCode(number);
  const collectionId = await resolveCollectionId();
  const issuedAt = new Date().toISOString();

  const { data, errors } = await adminFetch<{
    discountCodeBasicCreate: { codeDiscountNode: { id: string } | null; userErrors: UserError[] };
  }>(DISCOUNT_CREATE, {
    basicCodeDiscount: {
      title: `Founding 50 — No.${String(number).padStart(3, '0')} (${buyer.email})`,
      code,
      startsAt: issuedAt,
      // endsAt 없음 = 무기한. 이 한 줄이 '10년 뒤에도'라는 약속입니다.
      usageLimit: 1,
      appliesOncePerCustomer: true,
      // 이 고객 계정으로 로그인했을 때만 통합니다.
      customerSelection: { customers: { add: [buyer.customerId] } },
      customerGets: {
        value: {
          discountOnQuantity: {
            quantity: String(FOUNDER_FREE_QUANTITY),
            effect: { percentage: 1.0 },
          },
        },
        items: collectionId ? { collections: { add: [collectionId] } } : { all: true },
      },
      /**
       * 배송비 할인과는 겹칠 수 있게 열어 둡니다.
       * 창립 50인 세그먼트에 무료 배송을 따로 걸어 두면 두 코드가 함께 먹습니다.
       * 상품·주문 할인과 겹치는 건 막습니다 — 무료 위에 또 할인은 의미가 없고,
       * 계산이 꼬이면 손해는 이쪽입니다.
       */
      combinesWith: { orderDiscounts: false, productDiscounts: false, shippingDiscounts: true },
    },
  });

  if (errors?.length) {
    return {
      ok: false,
      email: buyer.email,
      message: '할인 코드를 만들지 못했습니다. 토큰에 write_discounts 권한이 있는지 확인하세요.',
    };
  }

  const userErrors = data?.discountCodeBasicCreate?.userErrors ?? [];
  if (userErrors.length) {
    const first = userErrors[0];
    const duplicated = first?.code === 'TAKEN' || /already|taken|exists/i.test(first?.message ?? '');
    return {
      ok: false,
      email: buyer.email,
      message: duplicated ? `${code} — 이미 발급된 코드입니다.` : first?.message || '발급 실패',
    };
  }

  // 태그는 실패해도 코드 자체는 이미 살아 있습니다. 발급을 되돌리지 않고 기록만 남깁니다.
  const { data: tagData, errors: tagErrors } = await adminFetch<{
    tagsAdd: { userErrors: UserError[] };
  }>(TAGS_ADD, {
    id: buyer.customerId,
    tags: [FOUNDER_TAG, founderNumberTag(number)],
  });
  if (tagErrors?.length || tagData?.tagsAdd?.userErrors?.length) {
    console.error('[founder] 태그를 달지 못했습니다:', code, '— 코드는 정상 발급됐습니다.');
  }

  return {
    ok: true,
    credit: {
      number,
      code,
      email: buyer.email,
      name: buyer.name,
      customerId: buyer.customerId,
      orderName: buyer.orderName,
      orderedAt: buyer.orderedAt,
      issuedAt,
    },
  };
}

/* ===============================================================
   3단계 — 명부
   =============================================================== */

/**
 * 발급 결과를 CSV로.
 *
 * 이게 이 기능에서 가장 중요한 산출물입니다.
 * 쇼피파이 계정이 10년 뒤에도 살아 있으리라는 보장은 없습니다.
 * 플랫폼을 옮기더라도 이 명부만 있으면 약속은 손으로라도 지킬 수 있습니다.
 * 발급 직후 반드시 내려받아 따로 보관하세요.
 */
export function toCsv(credits: IssuedCredit[]) {
  const escape = (value: string) => `"${String(value ?? '').replace(/"/g, '""')}"`;
  const header = ['no', 'code', 'email', 'name', 'order', 'ordered_at', 'issued_at'];
  const rows = credits.map((c) =>
    [
      String(c.number).padStart(3, '0'),
      c.code,
      c.email,
      c.name,
      c.orderName,
      c.orderedAt,
      c.issuedAt,
    ].map(escape).join(',')
  );
  return [header.join(','), ...rows].join('\n');
}
