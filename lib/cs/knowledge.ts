import 'server-only';

/**
 * 상담 도우미가 아는 것.
 *
 * 두 갈래로 나뉩니다.
 *   1. 잘 바뀌지 않는 브랜드 지식 — 이 파일에 글로 적어 둡니다
 *   2. 늘 바뀌는 스토어 상태 — 쇼피파이에서 그때그때 가져옵니다
 *      (정책 본문, 판매 중인 상품과 가격, 로그인한 손님의 주문)
 *
 * 2번이 중요합니다. 정책을 여기에 베껴 두면 쇼피파이에서 정책을 고친 날부터
 * 도우미는 틀린 답을 하기 시작합니다. 그래서 원본을 그대로 읽어 옵니다.
 */

import { shopifyFetch } from '@/lib/shopify-config';
import { BRAND, CONTACT } from '@/lib/brand';

/** 브랜드·사이트에 대한 고정 지식 */
export const BRAND_KNOWLEDGE = `
# ${BRAND.name} (${BRAND.short} · ${BRAND.nameKo})

## 브랜드
- 슬로건: "${BRAND.tagline}" — V4V의 PRODUCT는 고유한 비전과 본질을 바탕으로 삶을 개척하는 이들을 위해 만들어집니다.
- 상품을 가리킬 때는 '장비'가 아니라 'PRODUCT' 또는 '상품'이라고 씁니다.
- 말투는 조용하고 정확합니다. 과장, 느낌표, 이모지를 쓰지 않습니다.

## 사이트 안내
- / : 전체 상품 (Shop)
- /products/[상품주소] : 상품 상세 — 사이즈 선택, 장바구니 담기
- /archives : 지난 시즌 아카이브
- /essay : 브랜드 매니페스토
- /about : 브랜드 소개
- /contact : 문의 창구
- /account : 마이페이지 — 주문 내역, 배송지 관리, 회원 정보 수정
- /account/login : 로그인 · 회원가입 · 비밀번호 재설정
- /policies/shipping-policy, /policies/refund-policy, /policies/privacy-policy, /policies/terms-of-service

## 주문 흐름
- 상품 상세에서 사이즈를 고르고 장바구니에 담습니다.
- 결제는 쇼피파이 결제창에서 진행됩니다. 카드·Shop Pay 등을 지원합니다.
- 주문이 접수되면 주문 확인 메일이, 발송되면 배송 안내 메일이 나갑니다.
- 주문 내역과 배송 상태는 마이페이지(/account)에서 확인할 수 있습니다.
- 비회원 주문의 배송 조회는 주문 확인 메일의 '주문 보기' 링크를 씁니다.

## 계정
- 회원가입 후 배송지를 저장해 두면 다음 결제가 빨라집니다.
- 비밀번호를 잊었다면 /account/login 의 '비밀번호 재설정'에서 메일을 받습니다.
- 마케팅 메일 수신 여부는 마이페이지에서 언제든 바꿀 수 있습니다.

## 관리 방법 (모든 상품 공통 안내)
- 30℃ 이하의 물에서 단독 손세탁을 권합니다.
- 건조기 사용은 피하고, 직사광선을 피해 그늘에서 평평하게 뉘어 말립니다.
- 표백제와 섬유유연제는 원단의 질감을 무너뜨릴 수 있어 권하지 않습니다.

## 고객센터
- 이메일: ${CONTACT.cs}
- 전화: ${CONTACT.phoneKo}
- 운영 시간: ${CONTACT.hoursKo}
- 제휴·프레스 문의: ${CONTACT.partnership}
`.trim();

/** 쇼피파이가 돌려준 HTML 정책 본문을 읽을 수 있는 글로 */
function stripHtml(html: string, limit = 3500) {
  const text = html
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<\/(p|div|li|h1|h2|h3|tr)>/gi, '\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
  return text.length > limit ? `${text.slice(0, limit)}\n…(이하 생략)` : text;
}

const POLICIES_QUERY = `
  query csPolicies {
    shop {
      shippingPolicy { title body }
      refundPolicy { title body }
      privacyPolicy { title body }
      termsOfService { title body }
    }
  }
`;

/**
 * 스토어의 실제 정책 본문.
 *
 * 1시간마다 다시 읽습니다 — 관리자에서 정책을 고치면 늦어도 한 시간 안에
 * 도우미의 답변도 함께 바뀝니다.
 */
export async function getPolicyContext(): Promise<string> {
  try {
    const data = await shopifyFetch<any>(POLICIES_QUERY, undefined, { revalidate: 3600 });
    const shop = data?.shop ?? {};
    const sections = [
      shop.shippingPolicy,
      shop.refundPolicy,
      shop.privacyPolicy,
      shop.termsOfService,
    ]
      .filter((p) => p?.body)
      .map((p) => `## ${p.title}\n${stripHtml(p.body)}`);

    if (!sections.length) return '';
    return `# 스토어 정책 (쇼피파이 원본)\n\n${sections.join('\n\n')}`;
  } catch (error) {
    // 정책을 못 읽어도 상담은 계속되어야 합니다 — 도우미가 '모른다'고 답하게 둡니다.
    console.error('[cs] 정책을 읽지 못했습니다:', error instanceof Error ? error.message : 'unknown');
    return '';
  }
}

const CATALOG_QUERY = `
  query csCatalog {
    products(first: 20) {
      edges {
        node {
          title
          handle
          availableForSale
          priceRange { minVariantPrice { amount currencyCode } }
          options { name values }
          variants(first: 50) {
            edges { node { title availableForSale } }
          }
        }
      }
    }
  }
`;

/**
 * 지금 팔고 있는 것.
 *
 * 재고와 가격을 지어내지 않도록, 실제 목록을 그대로 넘겨줍니다.
 * (도우미에게 "여기 없는 상품은 없는 것"이라고 일러 둡니다)
 */
export async function getCatalogContext(): Promise<string> {
  try {
    const data = await shopifyFetch<any>(CATALOG_QUERY, undefined, { revalidate: 300 });
    const products = (data?.products?.edges ?? []).map((e: any) => e.node);
    if (!products.length) return '';

    const lines = products.map((p: any) => {
      const price = p.priceRange?.minVariantPrice;
      const amount = price ? Math.round(Number(price.amount)).toLocaleString('ko-KR') : '?';
      const currency = price?.currencyCode === 'KRW' ? '원' : ` ${price?.currencyCode ?? ''}`;
      const sizes = (p.variants?.edges ?? [])
        .map((e: any) => `${e.node.title}${e.node.availableForSale ? '' : '(품절)'}`)
        .join(', ');
      return `- ${p.title} · ${amount}${currency} · /products/${p.handle}${
        p.availableForSale ? '' : ' · 전체 품절'
      }\n  옵션: ${sizes || '단일'}`;
    });

    return `# 현재 판매 중인 상품 (${products.length}종)\n${lines.join('\n')}`;
  } catch (error) {
    console.error('[cs] 상품 목록을 읽지 못했습니다:', error instanceof Error ? error.message : 'unknown');
    return '';
  }
}
