// 공통 환경변수 및 엔드포인트 설정
const domain = process.env.SHOPIFY_STORE_DOMAIN || process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN;
const token = process.env.SHOPIFY_STOREFRONT_ACCESS_TOKEN || process.env.NEXT_PUBLIC_SHOPIFY_STOREFRONT_ACCESS_TOKEN;
const endpoint = domain?.includes('https://') ? domain : `https://${domain}`;

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
            images(first: 1) {
              edges {
                node {
                  url
                  altText
                }
              }
            }
          }
        }
      }
    }
  `;

  try {
    const response = await fetch(`${endpoint}/api/2024-01/graphql.json`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Storefront-Access-Token': token as string,
      },
      body: JSON.stringify({ query }),
      cache: 'no-store', 
    });

    const body = await response.json();
    
    // [수정 완료]: 메인 화면에서 바로 쓸 수 있게 edge.node 껍데기를 벗겨서 알맹이만 배열로 리턴합니다!
    if (body.data?.products?.edges) {
      return body.data.products.edges.map((edge: any) => edge.node);
    }
    return [];
    
  } catch (error) {
    console.error("getProducts 에러:", error);
    return [];
  }
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

  try {
    const response = await fetch(`${endpoint}/api/2024-01/graphql.json`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Storefront-Access-Token': token as string,
      },
      body: JSON.stringify({ query, variables }),
      cache: 'no-store',
    });

    const body = await response.json();
    return body.data?.product; // 단일 상품은 껍데기가 없으므로 그대로 리턴
  } catch (error) {
    console.error("getProduct 에러:", error);
    return null;
  }
}