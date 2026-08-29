import { notFound } from 'next/navigation';
import { shopifyFetch } from '@/lib/shopify-config';

// 1. 쇼피파이 API를 호출해서 정책 데이터를 가져오는 함수
// URL 경로를 쇼피파이 GraphQL API 키워드로 변환.
//
// 일반 객체 대신 Map을 씁니다 — 객체였을 때는 'constructor'나 'toString' 같은
// 자바스크립트 내장 이름을 주소에 넣으면 검사를 통과해 버려서,
// 엉뚱한 문자열이 GraphQL 질의문에 그대로 끼어 들어갔습니다.
const POLICY_MAP = new Map<string, string>([
  ['terms-of-service', 'termsOfService'],
  ['privacy-policy', 'privacyPolicy'],
  ['refund-policy', 'refundPolicy'],
  ['shipping-policy', 'shippingPolicy'],
]);

async function getShopifyPolicy(type: string) {
  const queryName = POLICY_MAP.get(type);
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

  // 1시간마다 쇼피파이와 동기화합니다.
  const data = await shopifyFetch<any>(query, undefined, { revalidate: 3600 });
  return data?.shop?.[queryName] ?? null;
}

// 2. 화면에 그려주는 메인 컴포넌트
// 🔥 Next.js 15 규칙 적용: params는 Promise 형태이므로 반드시 await로 풀어줘야 합니다!
export default async function PolicyPage(props: { params: Promise<{ type: string }> }) {
  const params = await props.params;
  const type = params.type;

  // 쇼피파이 API는 Contact(고객센터) 정보를 따로 주지 않으므로 직접 예외 처리
  if (type === 'contact') {
    return (
      <div className="mx-auto max-w-3xl px-6 py-24 md:py-36">
        <h1 className="mb-9 font-grotesk text-[23px] font-bold tracking-[-0.03em] text-ink md:text-[28px]">
          Contact Information
        </h1>
        <div className="space-y-4 text-[12.5px] font-light leading-[2] tracking-[0.01em] text-ash md:text-[13.5px]">
          <p>비전포비저너리(V4V)를 찾아주셔서 감사합니다. 상품, 배송, 결제 등과 관련된 문의 사항은 아래의 공식 창구를 통해 연락해 주시면 신속하고 친절하게 안내해 드리겠습니다.</p>
          <br/>
          <p><strong className="font-medium text-ink">상호명:</strong> 비전포비저너리 (V4V)</p>
          <p><strong className="font-medium text-ink">이메일:</strong> cs@v4v.com</p>
          <p><strong className="font-medium text-ink">운영 시간:</strong> 평일 10:00 - 17:00 (점심시간 12:00 - 13:00) / 주말 및 공휴일 휴무</p>
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
    <div className="mx-auto max-w-3xl px-6 py-24 md:py-36">
      <h1 className="mb-10 font-grotesk text-[23px] font-bold tracking-[-0.03em] text-ink md:text-[30px]">
        {policy.title}
      </h1>
      
      {/* 쇼피파이에서 받아온 HTML 텍스트를 V4V 감성에 맞게 렌더링 */}
      <div 
        className="space-y-6 text-[12.5px] font-light leading-[2] tracking-[0.01em] text-ash md:text-[13.5px] [&_a]:text-ink [&_a]:underline [&_a]:underline-offset-4 [&_strong]:font-medium [&_strong]:text-ink [&>h1]:mt-12 [&>h1]:font-grotesk [&>h1]:text-[17px] [&>h1]:font-bold [&>h1]:tracking-[-0.02em] [&>h1]:text-ink [&>h2]:mt-10 [&>h2]:font-grotesk [&>h2]:text-[15px] [&>h2]:font-bold [&>h2]:text-ink [&>p]:mb-4"
        dangerouslySetInnerHTML={{ __html: policy.body }} 
      />
    </div>
  );
}