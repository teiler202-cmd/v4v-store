import Link from 'next/link';
import { notFound } from 'next/navigation';
import { shopifyFetch } from '@/lib/shopify-config';
import { BRAND, BUSINESS, CONTACT } from '@/lib/brand';

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

/** 제목 한 줄과 그 아래 항목들 */
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="pt-6">
      <h2 className="mb-2 font-grotesk text-[13px] font-bold tracking-[-0.02em] text-ink md:text-[14px]">
        {title}
      </h2>
      <dl className="grid grid-cols-[7.5rem_1fr] gap-x-4 gap-y-1 [&_a]:text-ink [&_a]:underline [&_a]:underline-offset-4">
        {children}
      </dl>
    </section>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <>
      <dt className="font-medium text-ink">{label}</dt>
      <dd>{children}</dd>
    </>
  );
}

// 2. 화면에 그려주는 메인 컴포넌트
// 🔥 Next.js 15 규칙 적용: params는 Promise 형태이므로 반드시 await로 풀어줘야 합니다!
export default async function PolicyPage(props: { params: Promise<{ type: string }> }) {
  const params = await props.params;
  const type = params.type;

  // 쇼피파이 API는 Contact(고객센터) 정보를 따로 주지 않으므로 직접 그립니다.
  //
  // 값은 반드시 lib/brand.ts 에서 가져옵니다 — 예전에는 이 화면에만 cs@v4v.com 이
  // 손으로 적혀 있었고, 그 주소는 존재하지 않는 사서함이었습니다.
  // 손님이 보낸 문의가 아무도 읽지 않는 곳으로 갔다는 뜻입니다.
  if (type === 'contact') {
    return (
      <div className="mx-auto max-w-3xl px-6 py-24 md:py-36">
        <h1 className="mb-9 font-grotesk text-[23px] font-bold tracking-[-0.03em] text-ink md:text-[28px]">
          Contact Information
        </h1>

        <div className="space-y-4 text-[12.5px] font-light leading-[2] tracking-[0.01em] text-ash md:text-[13.5px]">
          <p>
            {BRAND.nameKo}({BRAND.short})를 찾아주셔서 감사합니다. 상품 · 배송 · 결제 · 교환/환불과
            관련된 모든 문의는 아래 공식 창구를 통해 연락해 주시면 신속하고 친절하게 안내해
            드리겠습니다.
          </p>

          <Section title="고객 문의">
            <Row label="이메일">
              <a href={`mailto:${CONTACT.cs}`}>{CONTACT.cs}</a>
            </Row>
            <Row label="고객센터">
              <a href={`tel:${CONTACT.phone.replace(/\s/g, '')}`}>{CONTACT.phoneKo}</a>
            </Row>
            <Row label="운영 시간">{CONTACT.hoursKo}</Row>
            <Row label="제휴 문의">
              <a href={`mailto:${CONTACT.partnership}`}>{CONTACT.partnership}</a>
            </Row>
          </Section>

          {/* 전자상거래법 제10조 — 사업자등록증과 같은 값이어야 합니다 */}
          <Section title="사업자 정보">
            <Row label="상호명">
              {BRAND.nameKo} ({BRAND.name})
            </Row>
            <Row label="대표자명">{BUSINESS.representativeKo}</Row>
            <Row label="사업자등록번호">{BUSINESS.registrationNo}</Row>
            <Row label="통신판매업신고번호">{BUSINESS.mailOrderNoKo}</Row>
            <Row label="사업장 주소">{BUSINESS.addressKo}</Row>
            <Row label="개인정보보호책임자">
              {BUSINESS.representativeKo} ({CONTACT.cs})
            </Row>
            <Row label="호스팅 제공자">{BUSINESS.host}</Row>
          </Section>

          {/* 손님이 결제 전에 알아야 하는 기간 — 상세 조항은 각 정책 페이지로 */}
          <Section title="배송 및 환불 기준">
            <Row label="배송 기간">
              결제 완료 후 영업일 기준 1~3일 이내 출고 · 국내 수령까지 최대 14일 이내 (프리오더 ·
              주문제작 상품은 상품 상세페이지에 별도 표기된 일정을 따릅니다)
            </Row>
            <Row label="청약철회">상품 수령일로부터 7일 이내</Row>
            <Row label="환불 처리">반품 상품 수령 및 확인 후 3영업일 이내</Row>
            <Row label="자세히">
              <Link href="/policies/shipping-policy">배송 정책</Link>
              {' · '}
              <Link href="/policies/refund-policy">교환 · 환불 정책</Link>
              {' · '}
              <Link href="/policies/terms-of-service">이용약관</Link>
              {' · '}
              <Link href="/policies/privacy-policy">개인정보처리방침</Link>
            </Row>
          </Section>
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