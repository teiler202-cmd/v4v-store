import { notFound } from 'next/navigation';

// 1. 쇼피파이 API를 호출해서 정책 데이터를 가져오는 함수
async function getShopifyPolicy(type: string) {
  // 환경변수 이름이 프로젝트마다 다를 수 있어 두 가지 경우를 모두 대비합니다.
  const domain = process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN || process.env.SHOPIFY_STORE_DOMAIN;
  const storefrontAccessToken = process.env.NEXT_PUBLIC_SHOPIFY_STOREFRONT_ACCESS_TOKEN || process.env.SHOPIFY_STOREFRONT_ACCESS_TOKEN;

  // URL 경로를 쇼피파이 GraphQL API 키워드로 변환
  const policyMap: Record<string, string> = {
    'terms-of-service': 'termsOfService',
    'privacy-policy': 'privacyPolicy',
    'refund-policy': 'refundPolicy',
    'shipping-policy': 'shippingPolicy',
  };

  const queryName = policyMap[type];
  if (!queryName) return null;

  const query = `
    query {
      shop {
        ${queryName} {
          title
          body
        }
      }
    }
  `;

  try {
    const res = await fetch(`https://${domain}/api/2024-01/graphql.json`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Storefront-Access-Token': storefrontAccessToken as string,
      },
      body: JSON.stringify({ query }),
      next: { revalidate: 3600 } // 1시간마다 쇼피파이와 동기화
    });
    
    const json = await res.json();
    return json.data.shop[queryName];
  } catch (error) {
    console.error('정책 데이터를 불러오는데 실패했습니다:', error);
    return null;
  }
}

// 2. 화면에 그려주는 메인 컴포넌트
// 🔥 Next.js 15 규칙 적용: params는 Promise 형태이므로 반드시 await로 풀어줘야 합니다!
export default async function PolicyPage(props: { params: Promise<{ type: string }> }) {
  const params = await props.params;
  const type = params.type;

  // 쇼피파이 API는 Contact(고객센터) 정보를 따로 주지 않으므로 직접 예외 처리
  if (type === 'contact') {
    return (
      <div className="max-w-4xl mx-auto px-6 py-32 md:py-40 text-zinc-300">
        <h1 className="text-3xl font-bold mb-10 text-white">Contact Information</h1>
        <div className="space-y-4 font-light tracking-wide leading-relaxed">
          <p>비전포비저너리(V4V)를 찾아주셔서 감사합니다. 상품, 배송, 결제 등과 관련된 문의 사항은 아래의 공식 창구를 통해 연락해 주시면 신속하고 친절하게 안내해 드리겠습니다.</p>
          <br/>
          <p><strong className="text-white">상호명:</strong> 비전포비저너리 (V4V)</p>
          <p><strong className="text-white">이메일:</strong> cs@v4v.com</p>
          <p><strong className="text-white">운영 시간:</strong> 평일 10:00 - 17:00 (점심시간 12:00 - 13:00) / 주말 및 공휴일 휴무</p>
        </div>
      </div>
    );
  }

  // 이제 정상적으로 type 글자가 넘어가서 데이터를 긁어옵니다.
  const policy = await getShopifyPolicy(type);

  // 주소가 잘못되었거나 데이터가 없으면 404 에러 페이지 띄우기
  if (!policy) {
    notFound();
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-32 md:py-40">
      <h1 className="text-3xl md:text-4xl font-bold mb-12 text-white">{policy.title}</h1>
      
      {/* 쇼피파이에서 받아온 HTML 텍스트를 V4V 감성에 맞게 렌더링 */}
      <div 
        className="text-zinc-400 font-light leading-loose space-y-6 [&>h1]:text-white [&>h1]:text-2xl [&>h1]:font-semibold [&>h1]:mt-10 [&>h2]:text-white [&>h2]:text-xl [&>h2]:mt-8 [&>p]:mb-4"
        dangerouslySetInnerHTML={{ __html: policy.body }} 
      />
    </div>
  );
}