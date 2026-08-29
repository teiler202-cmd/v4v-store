/**
 * 쇼피파이 알림 템플릿 만들기.
 *
 * 지금 손님이 받는 가입 환영 메일은 우리가 보내는 게 아니라 쇼피파이가 보냅니다.
 * (파란 버튼에 "V4V 방문을 환영합니다!" 라고 적힌 그 메일입니다)
 * 그 메일의 생김새는 코드가 아니라 쇼피파이 관리자에 저장된 Liquid 템플릿이
 * 결정하므로, API로는 바꿀 수 없습니다.
 *
 * 그래서 방향을 뒤집었습니다 — 같은 디자인 시스템(lib/email)으로 Liquid 템플릿을
 * '생성'하고, 그것을 관리자에 한 번 붙여 넣습니다. 값이 들어갈 자리에는 실제 값
 * 대신 {{ order.name }} 같은 Liquid 태그를 끼워 넣습니다.
 *
 * 붙여 넣는 곳:
 *   Shopify 관리자 → 설정 → 알림 → (해당 알림) → 이메일 본문 편집
 *
 * ⚠️ Liquid 태그는 이스케이프하면 안 되므로 반드시 raw() 로 감쌉니다.
 *    손님이 입력한 값에는 절대 raw() 를 쓰지 마세요 — 쇼피파이가 이미
 *    안전하게 치환해 줍니다.
 */

import { lineItems, spacer } from './blocks';
import { raw } from './theme';
import type { Lang } from './layout';
import * as T from './templates';

const L = raw; // Liquid 태그를 그대로 내보낸다는 표시

/**
 * 반복되는 줄(주문 상품 등)은 배열이 아니라 Liquid 반복문으로 만들어야 합니다.
 * 템플릿 함수에는 '한 줄짜리 배열'을 주고, 그 결과를 for 문으로 감쌉니다.
 */
function loop(collection: string, item: string, oneRow: string, gap = 18) {
  return (
    `{% for ${item} in ${collection} %}` +
    `{% unless forloop.first %}${spacer(gap)}{% endunless %}` +
    oneRow +
    `{% endfor %}`
  );
}

/**
 * 한 줄짜리 상품 — 실제 반복은 loop() 가 합니다.
 *
 * 금액 변수는 알림 종류마다 다릅니다.
 * 주문 알림은 line.final_line_price, 장바구니 이탈 알림은 line.line_price 입니다.
 * (없는 변수를 쓰면 오류 없이 빈칸으로 나가서, 금액이 사라진 메일이 손님에게 갑니다)
 */
const lineItem = (priceField: string) => ({
  title: L('{{ line.title }}'),
  variant: L("{% if line.variant.title != 'Default Title' %}{{ line.variant.title }}{% endif %}"),
  quantity: L('{{ line.quantity }}'),
  price: L(`{{ ${priceField} | money }}`),
  image: L("{{ line | img_url: 'compact' }}"),
});

const ORDER_LINE = lineItem('line.final_line_price');
const CHECKOUT_LINE = lineItem('line.line_price');

export type ShopifyNotification = {
  id: string;
  lang: Lang;
  /** 쇼피파이 관리자 → 설정 → 알림 에서의 이름 */
  admin: string;
  adminKo: string;
  subject: string;
  liquid: string;
};

/**
 * 하나의 템플릿을 Liquid 로 굳힙니다.
 *
 * 상품 반복이 필요한 메일은 '한 줄'만 렌더한 뒤, 그 조각을 for 문으로 감싼
 * 결과로 치환합니다. 문자열을 잘라 붙이는 셈이지만, 조각이 정확히 한 번만
 * 등장하도록 만들어 두었기 때문에 안전합니다.
 */
function withLoop(html: string, oneRow: string, collection: string, item = 'line') {
  if (!html.includes(oneRow)) {
    throw new Error('[email/shopify] 반복할 상품 줄을 찾지 못했습니다 — 템플릿이 바뀌었는지 확인하세요.');
  }
  return html.replace(oneRow, loop(collection, item, oneRow));
}

/**
 * 언어별로 한 벌씩 만듭니다.
 *
 * 쇼피파이는 스토어에 여러 언어를 추가하면 알림 편집기에도 언어 전환이 생깁니다
 * (설정 → 알림 → 알림 선택 → 상단의 언어 선택). 한국어 자리에는 ko 판본을,
 * 영어 자리에는 en 판본을 붙여 넣으면 손님의 언어에 맞는 메일이 나갑니다.
 * 언어를 하나만 쓰는 스토어라면 원하는 판본 하나만 붙이면 됩니다.
 */
export function buildNotifications(lang: Lang = 'ko'): ShopifyNotification[] {
  /* --- 1. 계정 환영 ------------------------------------------------ */
  const welcome = T.welcome({
    lang,
    name: L('{{ customer.first_name }}'),
    shopUrl: L('{{ shop.url }}'),
  });

  /* --- 2. 계정 활성화 ---------------------------------------------- */
  const activation = T.accountActivation({
    lang,
    name: L('{{ customer.first_name }}'),
    activateUrl: L('{{ customer.account_activation_url }}'),
  });

  /* --- 3. 비밀번호 재설정 ------------------------------------------ */
  const reset = T.passwordReset({
    lang,
    name: L('{{ customer.first_name }}'),
    resetUrl: L('{{ customer.reset_password_url }}'),
  });

  /**
   * 상품 한 줄의 마크업.
   *
   * 템플릿에 '한 줄짜리 배열'을 주면 본문에 이 문자열이 정확히 한 번 나타납니다.
   * 그 자리를 Liquid for 문으로 바꿔치기하면 실제 주문의 모든 상품이 그려집니다.
   * (표식을 심는 대신 같은 함수를 한 번 더 부르는 방식이라, 실제 메일에는
   *  아무 흔적도 남지 않습니다)
   */
  const orderItemMarkup = lineItems([ORDER_LINE]);
  const checkoutItemMarkup = lineItems([CHECKOUT_LINE]);

  /* --- 4. 주문 확인 ------------------------------------------------ */
  const order = T.orderConfirmation({
    lang,
    name: L('{{ customer.first_name }}'),
    orderNumber: L('{{ order.name }}'),
    orderUrl: L('{{ order.order_status_url }}'),
    items: [ORDER_LINE],
    subtotal: L('{{ subtotal_price | money }}'),
    shipping: L('{% if shipping_price > 0 %}{{ shipping_price | money }}{% else %}무료{% endif %}'),
    discount: L('{% if discounts_savings > 0 %}-{{ discounts_savings | money }}{% endif %}'),
    total: L('{{ total_price | money }}'),
    shippingAddress: [L('{{ shipping_address | format_address }}')],
    paymentMethod: L('{% for transaction in transactions %}{{ transaction.gateway_display_name }}{% unless forloop.last %}, {% endunless %}{% endfor %}'),
  });

  /* --- 5. 배송 시작 ------------------------------------------------ */
  const shipping = T.shippingConfirmation({
    lang,
    name: L('{{ customer.first_name }}'),
    orderNumber: L('{{ order.name }}'),
    orderUrl: L('{{ order.order_status_url }}'),
    carrier: L('{% if fulfillment.tracking_company %}{{ fulfillment.tracking_company }}{% else %}—{% endif %}'),
    trackingNumber: L('{% if fulfillment.tracking_number %}{{ fulfillment.tracking_number }}{% else %}—{% endif %}'),
    // 운송장 조회 주소가 없는 배송도 있습니다 — 그럴 땐 주문 상태 화면으로 보냅니다.
    // (빈 href 를 그대로 두면 눌러도 아무 일도 일어나지 않는 버튼이 됩니다)
    trackingUrl: L(
      '{% if fulfillment.tracking_url %}{{ fulfillment.tracking_url }}{% else %}{{ order.order_status_url }}{% endif %}'
    ),
  });

  /* --- 6. 장바구니 이탈 -------------------------------------------- */
  const abandoned = T.abandonedCheckout({
    lang,
    name: L('{{ customer.first_name }}'),
    checkoutUrl: L('{{ url }}'),
    items: [CHECKOUT_LINE],
    // 서명은 우리 서버만 만들 수 있어서, 쇼피파이 발송분은 마이페이지로 안내합니다.
    unsubscribeUrl: '{{ shop.url }}/account',
    unsubscribeText:
      lang === 'ko'
        ? '마케팅 메일 수신 여부는 마이페이지에서 언제든 바꾸실 수 있습니다.'
        : 'You can change your marketing email preferences in your account at any time.',
  });

  /* --- 7. 환불 ------------------------------------------------------ */
  const refund = T.refundNotice({
    lang,
    name: L('{{ customer.first_name }}'),
    orderNumber: L('{{ order.name }}'),
    amount: L('{{ amount | money }}'),
  });

  return [
    {
      id: 'welcome',
      lang,
      admin: 'Customer account welcome',
      adminKo: '고객 계정 확인 / 환영',
      subject: welcome.subject,
      liquid: welcome.html,
    },
    {
      id: 'account-activation',
      lang,
      admin: 'Customer account activation',
      adminKo: '고객 계정 활성화',
      subject: activation.subject,
      liquid: activation.html,
    },
    {
      id: 'password-reset',
      lang,
      admin: 'Customer account password reset',
      adminKo: '고객 계정 비밀번호 재설정',
      subject: reset.subject,
      liquid: reset.html,
    },
    {
      id: 'order-confirmation',
      lang,
      admin: 'Order confirmation',
      adminKo: '주문 확인',
      subject:
        lang === 'ko'
          ? '{{ shop.name }} — 주문이 확인되었습니다 {{ order.name }}'
          : '{{ shop.name }} — Order confirmed {{ order.name }}',
      liquid: withLoop(order.html, orderItemMarkup, 'order.line_items'),
    },
    {
      id: 'shipping-confirmation',
      lang,
      admin: 'Shipping confirmation',
      adminKo: '배송 확인',
      subject:
        lang === 'ko'
          ? '{{ shop.name }} — 상품이 발송되었습니다 {{ order.name }}'
          : '{{ shop.name }} — Your order has shipped {{ order.name }}',
      liquid: shipping.html,
    },
    {
      id: 'abandoned-checkout',
      lang,
      admin: 'Abandoned checkout',
      adminKo: '결제하지 않은 장바구니',
      subject: abandoned.subject,
      liquid: withLoop(abandoned.html, checkoutItemMarkup, 'line_items'),
    },
    {
      id: 'refund-notice',
      lang,
      admin: 'Refund notification',
      adminKo: '환불 알림',
      subject:
        lang === 'ko'
          ? '{{ shop.name }} — 환불이 처리되었습니다 {{ order.name }}'
          : '{{ shop.name }} — Refund processed {{ order.name }}',
      liquid: refund.html,
    },
  ];
}

