'use server';

export async function createCheckout(lineItems: { variantId: string; quantity: number }[]) {
  // [수정 핵심]: 옛날 checkoutCreate 대신 최신 cartCreate 문법을 사용합니다.
  const query = `
    mutation cartCreate($input: CartInput) {
      cartCreate(input: $input) {
        cart {
          checkoutUrl
        }
        userErrors {
          message
        }
      }
    }
  `;

  // [수정 핵심]: 쇼피파이가 요구하는 최신 데이터 규격(merchandiseId)으로 이름을 맞춰서 보냅니다.
  const variables = {
    input: {
      lines: lineItems.map((item) => ({
        merchandiseId: item.variantId,
        quantity: item.quantity,
      })),
    },
  };

  try {
    const domain = (process.env.SHOPIFY_STORE_DOMAIN || process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN) as string;
    const storefrontAccessToken = (process.env.SHOPIFY_STOREFRONT_ACCESS_TOKEN || process.env.NEXT_PUBLIC_SHOPIFY_STOREFRONT_ACCESS_TOKEN) as string;
    
    if (!domain || !storefrontAccessToken) {
      console.error("환경변수가 설정되지 않았습니다.");
      return null;
    }

    const endpoint = domain.includes('https://') ? domain : `https://${domain}`;

    const response = await fetch(`${endpoint}/api/2024-01/graphql.json`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Storefront-Access-Token': storefrontAccessToken,
      },
      body: JSON.stringify({ query, variables }),
      cache: 'no-store', // 결제창은 매번 새로 만들어야 하므로 캐시 방지
    });

    const body = await response.json();

    if (body.errors) {
      console.error("GraphQL 에러:", body.errors);
      return null;
    }

    // 최신 API 규격에 맞춰 checkoutUrl을 뽑아냅니다.
    const checkoutUrl = body.data?.cartCreate?.cart?.checkoutUrl;
    
    if (checkoutUrl) {
      return checkoutUrl; // 🚀 성공! 쇼피파이 결제창 URL 리턴
    } else {
      console.error("장바구니(결제창) 생성 실패:", body.data?.cartCreate?.userErrors);
      return null;
    }
  } catch (error) {
    console.error("API 통신 에러:", error);
    return null;
  }
}