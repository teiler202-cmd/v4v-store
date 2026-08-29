import 'server-only';

/**
 * 쇼피파이 고객(회원) API.
 * 스토어프론트 API의 classic customer accounts 규격을 사용합니다.
 */

import { SHOPIFY_TIMEOUT_MS, shopifyEndpoint, shopifyToken } from '@/lib/shopify-config';

export async function customerFetch<T = any>(
  query: string,
  variables?: Record<string, unknown>
): Promise<{ data?: T; errors?: any[] }> {
  try {
    const response = await fetch(shopifyEndpoint(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Storefront-Access-Token': shopifyToken(),
      },
      body: JSON.stringify({ query, variables }),
      cache: 'no-store',
      // 쇼피파이가 응답하지 않을 때 로그인 화면이 무한정 매달리지 않게 합니다.
      signal: AbortSignal.timeout(SHOPIFY_TIMEOUT_MS),
    });

    if (!response.ok) {
      // 상태 코드만 남깁니다 — 응답 본문에는 토큰이나 개인정보가 섞일 수 있습니다.
      console.error('[customer] HTTP', response.status);
      return { errors: [{ message: '스토어에 연결하지 못했습니다.' }] };
    }

    return await response.json();
  } catch (error) {
    console.error('[customer] 통신 오류:', error instanceof Error ? error.message : 'unknown');
    return { errors: [{ message: '네트워크 오류가 발생했습니다.' }] };
  }
}

/* ---------------------------------------------------------------
   Queries & Mutations
   --------------------------------------------------------------- */

export const ACCESS_TOKEN_CREATE = `
  mutation accessTokenCreate($input: CustomerAccessTokenCreateInput!) {
    customerAccessTokenCreate(input: $input) {
      customerAccessToken { accessToken expiresAt }
      customerUserErrors { code field message }
    }
  }
`;

export const ACCESS_TOKEN_DELETE = `
  mutation accessTokenDelete($customerAccessToken: String!) {
    customerAccessTokenDelete(customerAccessToken: $customerAccessToken) {
      deletedAccessToken
      userErrors { field message }
    }
  }
`;

export const CUSTOMER_CREATE = `
  mutation customerCreate($input: CustomerCreateInput!) {
    customerCreate(input: $input) {
      customer { id email firstName }
      customerUserErrors { code field message }
    }
  }
`;

export const CUSTOMER_RECOVER = `
  mutation customerRecover($email: String!) {
    customerRecover(email: $email) {
      customerUserErrors { code field message }
    }
  }
`;

export const CUSTOMER_UPDATE = `
  mutation customerUpdate($customerAccessToken: String!, $customer: CustomerUpdateInput!) {
    customerUpdate(customerAccessToken: $customerAccessToken, customer: $customer) {
      customer { id firstName lastName email phone acceptsMarketing }
      customerAccessToken { accessToken expiresAt }
      customerUserErrors { code field message }
    }
  }
`;

export const ADDRESS_CREATE = `
  mutation addressCreate($customerAccessToken: String!, $address: MailingAddressInput!) {
    customerAddressCreate(customerAccessToken: $customerAccessToken, address: $address) {
      customerAddress { id }
      customerUserErrors { code field message }
    }
  }
`;

export const ADDRESS_UPDATE = `
  mutation addressUpdate($customerAccessToken: String!, $id: ID!, $address: MailingAddressInput!) {
    customerAddressUpdate(customerAccessToken: $customerAccessToken, id: $id, address: $address) {
      customerAddress { id }
      customerUserErrors { code field message }
    }
  }
`;

export const ADDRESS_DELETE = `
  mutation addressDelete($customerAccessToken: String!, $id: ID!) {
    customerAddressDelete(customerAccessToken: $customerAccessToken, id: $id) {
      deletedCustomerAddressId
      customerUserErrors { code field message }
    }
  }
`;

export const DEFAULT_ADDRESS_UPDATE = `
  mutation defaultAddressUpdate($customerAccessToken: String!, $addressId: ID!) {
    customerDefaultAddressUpdate(customerAccessToken: $customerAccessToken, addressId: $addressId) {
      customer { id }
      customerUserErrors { code field message }
    }
  }
`;

/** 헤더 아이콘·주문 분기용 최소 정보 */
export const CUSTOMER_BRIEF = `
  query customerBrief($customerAccessToken: String!) {
    customer(customerAccessToken: $customerAccessToken) {
      id
      firstName
      lastName
      displayName
      email
    }
  }
`;

/** 마이페이지 전체 정보 */
export const CUSTOMER_FULL = `
  query customerFull($customerAccessToken: String!) {
    customer(customerAccessToken: $customerAccessToken) {
      id
      firstName
      lastName
      displayName
      email
      phone
      acceptsMarketing
      createdAt
      numberOfOrders
      defaultAddress { id }
      addresses(first: 20) {
        edges {
          node {
            id
            firstName
            lastName
            company
            address1
            address2
            city
            province
            zip
            country
            phone
          }
        }
      }
      orders(first: 25, reverse: true) {
        edges {
          node {
            id
            name
            orderNumber
            processedAt
            financialStatus
            fulfillmentStatus
            statusUrl
            currentTotalPrice { amount currencyCode }
            lineItems(first: 25) {
              edges {
                node {
                  title
                  quantity
                  variant {
                    title
                    image { url }
                    price { amount currencyCode }
                  }
                }
              }
            }
          }
        }
      }
    }
  }
`;

/** 쇼피파이 오류 코드를 사람이 읽을 수 있는 한국어로 */
export function humanizeError(error?: { code?: string; message?: string }): string {
  if (!error) return '알 수 없는 오류가 발생했습니다.';
  switch (error.code) {
    case 'UNIDENTIFIED_CUSTOMER':
      return '이메일 또는 비밀번호가 올바르지 않습니다.';
    case 'TAKEN':
      return '이미 가입된 이메일입니다. 로그인해 주세요.';
    case 'TOO_SHORT':
      return '비밀번호는 5자 이상이어야 합니다.';
    case 'INVALID':
      return error.message || '입력한 정보를 다시 확인해 주세요.';
    case 'CUSTOMER_DISABLED':
      return '계정이 아직 활성화되지 않았습니다. 가입 메일의 링크를 확인해 주세요.';
    default:
      return error.message || '요청을 처리하지 못했습니다.';
  }
}
