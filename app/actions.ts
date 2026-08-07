'use server'; // [핵심]: 이 파일 안의 함수는 무조건 서버(백엔드)에서만 실행하라는 엄격한 명령어입니다.

export async function createCheckout(lineItems: { variantId: string; quantity: number }[]) {
  const query = `
    mutation checkoutCreate($input: CheckoutCreateInput!) {
      checkoutCreate(input: $input) {
        checkout {
          id
          webUrl
        }
        checkoutUserErrors {
          message
        }
      }
    }
  `;

  const variables = {
    input: {
      lineItems,
    },
  };

  try {
    // 이제 서버에서 실행되므로 process.env를 정상적으로 읽어올 수 있습니다.
    const domain = process.env.SHOPIFY_STORE_DOMAIN as string;
    const storefrontAccessToken = process.env.SHOPIFY_STOREFRONT_ACCESS_TOKEN as string;
    
    if (!domain || !storefrontAccessToken) {
      console.error("환경변수가 설정되지 않았습니다. .env.local 파일을 확인하세요.");
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
      cache: 'no-store', // 결제창은 매번 새로 생성해야 함
    });

    const body = await response.json();

    if (body.errors) {
      console.error("GraphQL 에러:", body.errors);
      return null;
    }

    const checkout = body.data?.checkoutCreate?.checkout;
    if (checkout) {
      return checkout.webUrl; // 성공 시 결제창 URL 반환
    } else {
      console.error("결제창 생성 실패:", body.data?.checkoutCreate?.checkoutUserErrors);
      return null;
    }
  } catch (error) {
    console.error("API 통신 에러:", error);
    return null;
  }
}