import { url } from '@/lib/brand';
import type { Lang } from './layout';
import type { Email } from './templates';
import * as T from './templates';
import { money } from './theme';

/**
 * 미리보기용 예시 데이터.
 *
 * 실제 값과 비슷한 길이의 문장·상품명을 넣어 둡니다 —
 * "테스트"처럼 짧은 글자로만 확인하면, 진짜 메일에서 줄이 넘칠 때
 * 어디가 무너지는지 알 수 없습니다.
 *
 * 언어를 받는 이유도 같습니다. 한글은 같은 뜻을 더 짧게 담고 영문은 더 길게
 * 늘어져서, 한쪽만 보고 판단하면 다른 쪽에서 제목이 두 줄로 접힙니다.
 */

/**
 * 미리보기에서 실제로 보이는 이미지를 씁니다.
 * (없는 주소를 넣어 두면 회색 상자만 뜨고, 이미지가 들어갔을 때의 균형을 볼 수 없습니다)
 */
const IMG = url('/archives/szn1-poster.jpg');

const items = (lang: Lang) => [
  {
    title: 'SZN1 Slub Tee — Off White',
    variant: lang === 'ko' ? '사이즈 2 (M)' : 'SIZE 2 (M)',
    quantity: 1,
    price: money(89000),
    image: IMG,
  },
  {
    title: 'Utility Cap — Ink',
    variant: 'ONE SIZE',
    quantity: 2,
    price: money(78000),
    image: IMG,
  },
];

const UNSUB = url('/newsletter/unsubscribe?e=preview%40example.com&t=preview');

const NAME = (lang: Lang) => (lang === 'ko' ? '세웅' : 'Seung');

export type SampleEntry = {
  id: string;
  label: string;
  labelEn: string;
  group: '계정' | '주문 · 배송' | '마케팅' | '응대';
  /** 쇼피파이가 보내는 메일인지 (관리자에 Liquid 를 붙여 넣어야 하는 것) */
  shopify?: boolean;
  build: (lang: Lang) => Email;
};

export const SAMPLES: SampleEntry[] = [
  {
    id: 'welcome',
    label: '가입 환영',
    labelEn: 'Welcome',
    group: '계정',
    shopify: true,
    build: (lang) => T.welcome({ lang, name: NAME(lang) }),
  },
  {
    id: 'account-activation',
    label: '계정 활성화',
    labelEn: 'Account activation',
    group: '계정',
    shopify: true,
    build: (lang) =>
      T.accountActivation({ lang, name: NAME(lang), activateUrl: url('/account/login') }),
  },
  {
    id: 'password-reset',
    label: '비밀번호 재설정',
    labelEn: 'Password reset',
    group: '계정',
    shopify: true,
    build: (lang) =>
      T.passwordReset({ lang, name: NAME(lang), resetUrl: url('/account/login') }),
  },
  {
    id: 'order-confirmation',
    label: '주문 확인',
    labelEn: 'Order confirmation',
    group: '주문 · 배송',
    shopify: true,
    build: (lang) =>
      T.orderConfirmation({
        lang,
        name: NAME(lang),
        orderNumber: '#1042',
        orderUrl: url('/account'),
        items: items(lang),
        subtotal: money(245000),
        shipping: lang === 'ko' ? '무료' : 'Free',
        total: money(245000),
        shippingAddress:
          lang === 'ko'
            ? ['안세웅', '경기도 용인시 기흥구 금화로 11번길 10', '303동 8층 · 16909', '대한민국']
            : [
                'Seung Ahn',
                '10, Geumhwa-ro 11beon-gil, Giheung-gu',
                'Yongin-si, Gyeonggi-do 16909',
                'South Korea',
              ],
        paymentMethod: 'Shop Pay',
      }),
  },
  {
    id: 'shipping-confirmation',
    label: '배송 시작',
    labelEn: 'Shipping confirmation',
    group: '주문 · 배송',
    shopify: true,
    build: (lang) =>
      T.shippingConfirmation({
        lang,
        name: NAME(lang),
        orderNumber: '#1042',
        orderUrl: url('/account'),
        carrier: lang === 'ko' ? 'CJ대한통운' : 'CJ Logistics',
        trackingNumber: '620381947265',
        trackingUrl: 'https://trace.cjlogistics.com/',
        items: items(lang),
      }),
  },
  {
    id: 'order-delivered',
    label: '배송 완료',
    labelEn: 'Delivered',
    group: '주문 · 배송',
    build: (lang) =>
      T.orderDelivered({ lang, name: NAME(lang), orderNumber: '#1042', orderUrl: url('/account') }),
  },
  {
    id: 'refund-notice',
    label: '환불 안내',
    labelEn: 'Refund notice',
    group: '주문 · 배송',
    shopify: true,
    build: (lang) =>
      T.refundNotice({
        lang,
        name: NAME(lang),
        orderNumber: '#1042',
        amount: money(89000),
        reason: lang === 'ko' ? '단순 변심' : 'Change of mind',
      }),
  },
  {
    id: 'abandoned-checkout',
    label: '장바구니 리마인드',
    labelEn: 'Abandoned checkout',
    group: '마케팅',
    shopify: true,
    build: (lang) =>
      T.abandonedCheckout({
        lang,
        name: NAME(lang),
        checkoutUrl: url('/checkout'),
        items: items(lang),
        unsubscribeUrl: UNSUB,
      }),
  },
  {
    id: 'newsletter-welcome',
    label: '뉴스레터 환영',
    labelEn: 'Newsletter welcome',
    group: '마케팅',
    build: (lang) => T.newsletterWelcome({ lang, unsubscribeUrl: UNSUB }),
  },
  {
    id: 'back-in-stock',
    label: '재입고 알림',
    labelEn: 'Back in stock',
    group: '마케팅',
    build: (lang) =>
      T.backInStock({
        lang,
        name: NAME(lang),
        productTitle: 'SZN1 Slub Tee — Off White',
        productUrl: url('/products/szn1-slub-tee'),
        image: IMG,
        unsubscribeUrl: UNSUB,
      }),
  },
  {
    id: 'campaign',
    label: '시즌 캠페인',
    labelEn: 'Season campaign',
    group: '마케팅',
    build: (lang) =>
      T.campaign({
        lang,
        subject: 'V4V — SZN1 : Vision in Motion',
        preheader:
          lang === 'ko'
            ? '첫 번째 시즌이 공개되었습니다.'
            : 'The first season is open.',
        eyebrow: 'Season One',
        headline: 'Vision in Motion',
        bodyText:
          lang === 'ko'
            ? [
                '첫 번째 시즌을 공개합니다. 움직임을 방해하지 않는 실루엣과, 오래 입을수록 몸에 맞아 가는 원단으로 만들었습니다.',
                '수량이 많지 않습니다. 준비된 만큼만 만들고, 다시 만들지 않습니다.',
              ]
            : [
                'The first season is open. Silhouettes that do not interrupt movement, in fabric that settles into the body the longer it is worn.',
                'There are not many. We make what we prepared, and we do not make it again.',
              ],
        heroImage: url('/archives/szn1-poster.jpg'),
        heroHref: url('/'),
        ctaLabel: 'View the Season',
        ctaUrl: url('/'),
        products: [
          {
            title: 'SZN1 Slub Tee',
            caption: 'Off White',
            price: money(89000),
            image: IMG,
            href: url('/'),
          },
          {
            title: 'Utility Cap',
            caption: 'Ink',
            price: money(39000),
            image: IMG,
            href: url('/'),
          },
        ],
        unsubscribeUrl: UNSUB,
      }),
  },
  {
    id: 'cs-auto-reply',
    label: '문의 접수 확인',
    labelEn: 'Enquiry received',
    group: '응대',
    build: (lang) =>
      T.csAutoReply({
        lang,
        name: NAME(lang),
        ticketId: 'CS-2408-0031',
        summary:
          lang === 'ko'
            ? '주문한 사이즈를 2에서 3으로 교환하고 싶습니다.'
            : 'I would like to exchange size 2 for size 3.',
      }),
  },
];

export const findSample = (id: string) => SAMPLES.find((s) => s.id === id);
