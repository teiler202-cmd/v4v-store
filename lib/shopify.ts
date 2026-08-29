import 'server-only';

/**
 * ⚠️ 이 파일은 서버에서만 돌아갑니다.
 *
 * 위의 'server-only' 는 빗장입니다 — 클라이언트 컴포넌트가 실수로 이 파일을
 * 불러오면 빌드가 즉시 실패합니다. 예전에 CartProvider가 이 파일을 불러
 * 쇼피파이 주소와 액세스 토큰이 브라우저 자바스크립트에 그대로 노출된 적이 있어,
 * 같은 사고가 되풀이되지 않도록 막아 둡니다.
 */

import { shopifyFetch } from '@/lib/shopify-config';

/**
 * 1. 전체 상품 목록 가져오기 (메인 화면용)
 */
export async function getProducts() {
  const query = `
    query getProducts {
      products(first: 10) {
        edges {
          node {
            id
            title
            handle
            priceRange {
              minVariantPrice {
                amount
                currencyCode
              }
            }
            images(first: 5) {
              edges {
                node {
                  url
                  altText
                }
              }
            }
            # 장바구니 추천 상품에서도 바로 담을 수 있도록 옵션·Variant ID를 함께 가져옵니다.
            options {
              name
              values
            }
            variants(first: 100) {
              edges {
                node {
                  id
                  title
                  availableForSale
                  selectedOptions {
                    name
                    value
                  }
                }
              }
            }
          }
        }
      }
    }
  `;

  // 60초 간격으로만 쇼피파이를 다시 물어봅니다 — 첫 화면이 즉시 뜨고, 재고/가격은 1분 내로 반영됩니다.
  //
  // 실패하면 예외가 그대로 올라갑니다. 예전처럼 빈 배열을 돌려주면
  // '상품이 없는 화면'이 정상 결과로 캐시되어, 쇼피파이가 잠깐 흔들린 대가로
  // 멀쩡하던 상품 목록이 한동안 사라집니다. (화면은 app/error.tsx 가 받아 줍니다)
  const data = await shopifyFetch<any>(query, undefined, { revalidate: 60 });

  // edge.node 껍데기를 벗겨서 알맹이만 배열로 돌려줍니다.
  return (data?.products?.edges ?? []).map((edge: any) => edge.node);
}

/**
 * 2. 특정 상품 상세 정보 가져오기 (상세 페이지용)
 */
export async function getProduct(handle: string) {
  const query = `
    query getProduct($handle: String!) {
      product(handle: $handle) {
        id
        title
        descriptionHtml
        priceRange {
          minVariantPrice {
            amount
            currencyCode
          }
        }
        images(first: 10) {
          edges {
            node {
              url
              altText
            }
          }
        }
        options {
          name
          values
        }
        # 장바구니 결제 연동을 위해 각 사이즈/옵션별 고유 Variant ID를 가져옵니다.
        variants(first: 250) {
          edges {
            node {
              id
              title
              selectedOptions {
                name
                value
              }
            }
          }
        }
      }
    }
  `;

  const variables = { handle };

  // 통신 실패는 예외로 올라가고, '그런 상품이 없음'만 null 로 돌아옵니다.
  // 이 둘을 구분해야 쇼피파이 장애가 404로 둔갑하지 않습니다.
  const data = await shopifyFetch<any>(query, variables, { revalidate: 60 });
  return data?.product ?? null;
}