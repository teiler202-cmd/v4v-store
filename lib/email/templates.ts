/**
 * V4V 브랜드 메일 한 벌.
 *
 * 계정 · 주문 · 배송 · 마케팅 — 손님이 브랜드로부터 받게 되는 메일 전부를
 * 같은 디자인 언어로 씁니다. 각 템플릿은 '데이터를 받아 완성된 메일 한 통'을
 * 돌려주는 순수 함수라서, 두 곳에서 똑같이 쓸 수 있습니다.
 *
 *   1) 우리가 직접 보내는 메일 — 실제 값을 넣습니다
 *   2) 쇼피파이 알림 템플릿 — 값 자리에 Liquid 태그를 넣습니다 (lib/email/shopify.ts)
 *
 * 그래서 문구를 한 번 고치면 두 경로에 동시에 반영됩니다.
 *
 * ── 언어 ──────────────────────────────────────────────────────────
 * 모든 템플릿이 lang: 'ko' | 'en' 을 받습니다. 두 언어를 한 통에 섞지 않고
 * 아예 다른 메일을 만듭니다 — 섞어 두면 어느 쪽 독자에게도 절반은 잡음입니다.
 * (영문 대문자 마이크로 라벨은 두 판본 모두에 남습니다. 그건 번역할 글이 아니라
 *  이 브랜드의 조판 요소입니다)
 */

import { BRAND, CONTACT, url } from '@/lib/brand';
import type { EmailKind, Lang } from './layout';
import { renderShell, renderText, t } from './layout';
import {
  LineItem,
  ProductCard,
  bilingual,
  button,
  hero,
  label,
  lineItems,
  note,
  panel,
  paragraph,
  productGrid,
  rows,
  rule,
  spacer,
  subtitle,
  textLink,
  title,
  totals,
} from './blocks';
import { Raw, out } from './theme';

type Text = string | Raw;

export type Email = {
  id: string;
  lang: Lang;
  kind: EmailKind;
  subject: string;
  preheader: string;
  html: string;
  text: string;
};

/** 언어 옵션은 모든 템플릿이 공통으로 받습니다 */
export type WithLang = { lang?: Lang };

/** 껍데기를 씌워 완성 */
function compose(args: {
  id: string;
  lang: Lang;
  kind?: EmailKind;
  subject: string;
  preheader: string;
  content: string;
  unsubscribeUrl?: string;
  unsubscribeText?: string;
  footnote?: string;
}): Email {
  const shell = {
    preheader: args.preheader,
    content: args.content,
    lang: args.lang,
    kind: args.kind ?? ('transactional' as EmailKind),
    unsubscribeUrl: args.unsubscribeUrl,
    unsubscribeText: args.unsubscribeText,
    footnote: args.footnote,
  };
  return {
    id: args.id,
    lang: args.lang,
    kind: shell.kind,
    subject: args.subject,
    preheader: args.preheader,
    html: renderShell(shell),
    text: renderText(shell),
  };
}

/** "세웅 님," / "Hello Seung," */
const greet = (lang: Lang, name?: Text) =>
  paragraph(
    new Raw(
      lang === 'ko'
        ? name
          ? `${out(name)} 님,`
          : '고객님,'
        : name
        ? `Hello ${out(name)},`
        : 'Hello,'
    ),
    { ink: true }
  );

/** 도움이 필요할 때 어디로 연락하면 되는지 — 모든 거래 메일의 마지막 블록 */
const helpBlock = (lang: Lang) =>
  panel(
    subtitle(t(lang, '도움이 필요하신가요', 'Need a hand')) +
      paragraph(
        new Raw(
          t(
            lang,
            `주문·배송·교환에 관한 문의는 <a href="mailto:${CONTACT.cs}" style="color:#0b0b0b;text-decoration:none;border-bottom:1px solid #e0e0de;">${CONTACT.cs}</a> 로 보내 주세요.`,
            `For anything about your order, delivery or exchange, write to <a href="mailto:${CONTACT.cs}" style="color:#0b0b0b;text-decoration:none;border-bottom:1px solid #e0e0de;">${CONTACT.cs}</a>.`
          )
        )
      ) +
      note(t(lang, CONTACT.hoursKo, CONTACT.hours))
  );

/** 발신 전용 안내 */
const noReply = (lang: Lang) =>
  t(
    lang,
    '이 메일은 발신 전용입니다. 문의는 고객센터로 부탁드립니다.',
    'This mailbox is not monitored. Please write to customer service instead.'
  );

/* =================================================================
   1. 계정
   ================================================================= */

/** 가입 환영 — 지금 쇼피파이 기본 템플릿이 보내는 그 메일을 대신합니다 */
export function welcome(data: WithLang & { name?: Text; shopUrl?: Text } = {}): Email {
  const lang = data.lang ?? 'ko';
  const s = (ko: string, en: string) => t(lang, ko, en);

  return compose({
    id: 'welcome',
    lang,
    subject: s(`${BRAND.short} — 환영합니다`, `${BRAND.short} — Welcome`),
    preheader: s(
      '계정이 활성화되었습니다. 다음 주문부터 더 빠르게 결제하실 수 있습니다.',
      'Your account is active. Checkout will be faster from your next order.'
    ),
    content:
      label('Welcome') +
      title(s('비전을 함께 하게 되어 반갑습니다', 'Glad to have you with us')) +
      spacer(24) +
      greet(lang, data.name) +
      paragraph(
        s(
          'V4V 계정이 활성화되었습니다. 이제 배송지를 저장해 두고 다음 주문부터 더 빠르게 결제하실 수 있으며, 주문 내역과 배송 상태를 언제든 확인하실 수 있습니다.',
          'Your V4V account is active. Save an address and checkout will be faster from your next order — your order history and delivery status are always there when you need them.'
        ),
        { top: 12 }
      ) +
      spacer(28) +
      bilingual(
        BRAND.tagline,
        s(
          'V4V의 PRODUCT는 고유한 비전과 본질을 바탕으로 삶을 개척하는 이들을 위해 만들어집니다.',
          'Every V4V product is made for those who carve out a life from their own vision.'
        )
      ) +
      spacer(32) +
      button(data.shopUrl ?? url('/'), 'Enter the Store') +
      spacer(36) +
      rule() +
      spacer(28) +
      rows([
        {
          label: 'My Account',
          value: new Raw(
            textLink(url('/account'), s('주문 내역 · 배송지 관리', 'Orders and addresses'))
          ),
        },
        {
          label: 'Archives',
          value: new Raw(textLink(url('/archives'), s('지난 시즌 아카이브', 'Past seasons'))),
        },
        {
          label: 'Essay',
          value: new Raw(textLink(url('/essay'), s('브랜드 매니페스토', 'The manifesto'))),
        },
      ]) +
      spacer(32) +
      helpBlock(lang),
  });
}

/** 계정 활성화 — 쇼피파이가 '고객 계정 초대'로 보내는 메일 */
export function accountActivation(data: WithLang & { name?: Text; activateUrl: Text }): Email {
  const lang = data.lang ?? 'ko';
  const s = (ko: string, en: string) => t(lang, ko, en);

  return compose({
    id: 'account-activation',
    lang,
    subject: s(`${BRAND.short} — 계정을 활성화해 주세요`, `${BRAND.short} — Activate your account`),
    preheader: s(
      '아래 버튼을 눌러 비밀번호를 설정하면 계정이 활성화됩니다.',
      'Set a password to finish activating your account.'
    ),
    content:
      label('Activate your account') +
      title(s('계정 활성화', 'Activate your account')) +
      spacer(24) +
      greet(lang, data.name) +
      paragraph(
        s(
          '아래 버튼을 눌러 비밀번호를 설정하시면 계정이 활성화됩니다. 링크는 보안을 위해 일정 시간이 지나면 만료됩니다.',
          'Set a password below to activate your account. For security, this link expires after a while.'
        ),
        { top: 12 }
      ) +
      spacer(30) +
      button(data.activateUrl, 'Activate Account') +
      spacer(28) +
      note(
        s(
          '본인이 요청하지 않으셨다면 이 메일은 무시하셔도 안전합니다. 계정은 활성화되지 않습니다.',
          'If you did not request this, you can safely ignore this email — the account stays inactive.'
        )
      ) +
      spacer(32) +
      helpBlock(lang),
  });
}

/** 비밀번호 재설정 */
export function passwordReset(data: WithLang & { name?: Text; resetUrl: Text }): Email {
  const lang = data.lang ?? 'ko';
  const s = (ko: string, en: string) => t(lang, ko, en);

  return compose({
    id: 'password-reset',
    lang,
    subject: s(`${BRAND.short} — 비밀번호 재설정`, `${BRAND.short} — Reset your password`),
    preheader: s(
      '요청하신 비밀번호 재설정 링크를 보내드립니다.',
      'Here is the password reset link you asked for.'
    ),
    content:
      label('Reset your password') +
      title(s('비밀번호 재설정', 'Reset your password')) +
      spacer(24) +
      greet(lang, data.name) +
      paragraph(
        s('아래 버튼을 눌러 새 비밀번호를 설정해 주세요.', 'Choose a new password below.'),
        { top: 12 }
      ) +
      spacer(30) +
      button(data.resetUrl, 'Reset Password') +
      spacer(28) +
      note(
        s(
          '본인이 요청하지 않으셨다면 이 메일을 무시해 주세요. 링크를 사용하지 않으면 기존 비밀번호는 그대로 유지됩니다.',
          'If you did not request this, ignore this email — your current password stays unchanged.'
        )
      ) +
      spacer(32) +
      helpBlock(lang),
  });
}

/* =================================================================
   2. 주문 · 배송
   ================================================================= */

export type OrderData = WithLang & {
  name?: Text;
  orderNumber: Text;
  orderUrl: Text;
  items: LineItem[];
  subtotal?: Text;
  shipping?: Text;
  discount?: Text;
  total: Text;
  shippingAddress?: Text[];
  paymentMethod?: Text;
};

/** 주문 확인 */
export function orderConfirmation(data: OrderData): Email {
  const lang = data.lang ?? 'ko';
  const s = (ko: string, en: string) => t(lang, ko, en);

  const summary = [
    data.subtotal ? { label: 'Subtotal', value: data.subtotal } : null,
    data.discount ? { label: 'Discount', value: data.discount } : null,
    data.shipping ? { label: 'Shipping', value: data.shipping } : null,
    { label: 'Total', value: data.total, strong: true },
  ].filter(Boolean) as Array<{ label: Text; value: Text; strong?: boolean }>;

  return compose({
    id: 'order-confirmation',
    lang,
    subject: new Raw(
      s(
        `${BRAND.short} — 주문이 확인되었습니다 ${out(data.orderNumber)}`,
        `${BRAND.short} — Order confirmed ${out(data.orderNumber)}`
      )
    ).value,
    preheader: s(
      '주문해 주셔서 감사합니다. 준비되는 대로 배송 안내를 보내드리겠습니다.',
      'Thank you for your order. We will write again the moment it ships.'
    ),
    footnote: noReply(lang),
    content:
      label(new Raw(`Order ${out(data.orderNumber)}`)) +
      title(s('주문이 확인되었습니다', 'Your order is confirmed')) +
      spacer(24) +
      greet(lang, data.name) +
      paragraph(
        s(
          '주문해 주셔서 감사합니다. 상품을 정성껏 준비하여 발송되는 즉시 배송 안내를 보내드리겠습니다.',
          'Thank you for your order. We are preparing it now and will write again the moment it ships.'
        ),
        { top: 12 }
      ) +
      spacer(32) +
      label('Items') +
      lineItems(data.items) +
      spacer(26) +
      rule() +
      spacer(22) +
      totals(summary) +
      spacer(32) +
      (data.shippingAddress?.length
        ? panel(
            rows([
              {
                label: 'Ship to',
                value: new Raw(data.shippingAddress.map((line) => out(line)).join('<br />')),
              },
              ...(data.paymentMethod ? [{ label: 'Payment', value: data.paymentMethod }] : []),
            ])
          ) + spacer(28)
        : '') +
      button(data.orderUrl, 'View Order') +
      spacer(36) +
      helpBlock(lang),
  });
}

/** 배송 시작 */
export function shippingConfirmation(
  data: WithLang & {
    name?: Text;
    orderNumber: Text;
    orderUrl: Text;
    carrier?: Text;
    trackingNumber?: Text;
    trackingUrl?: Text;
    items?: LineItem[];
  }
): Email {
  const lang = data.lang ?? 'ko';
  const s = (ko: string, en: string) => t(lang, ko, en);

  const tracking = [
    data.carrier ? { label: 'Carrier', value: data.carrier } : null,
    data.trackingNumber ? { label: 'Tracking No.', value: data.trackingNumber } : null,
  ].filter(Boolean) as Array<{ label: Text; value: Text }>;

  return compose({
    id: 'shipping-confirmation',
    lang,
    subject: new Raw(
      s(
        `${BRAND.short} — 상품이 발송되었습니다 ${out(data.orderNumber)}`,
        `${BRAND.short} — Your order has shipped ${out(data.orderNumber)}`
      )
    ).value,
    preheader: s(
      '주문하신 상품이 배송을 시작했습니다.',
      'Your order has left us and is on its way.'
    ),
    footnote: noReply(lang),
    content:
      label(new Raw(`Order ${out(data.orderNumber)}`)) +
      title(s('배송이 시작되었습니다', 'On its way')) +
      spacer(24) +
      greet(lang, data.name) +
      paragraph(
        s(
          '주문하신 상품이 오늘 발송되었습니다. 아래에서 배송 상황을 확인하실 수 있습니다.',
          'Your order shipped today. You can follow its progress below.'
        ),
        { top: 12 }
      ) +
      spacer(30) +
      (tracking.length ? panel(rows(tracking)) + spacer(26) : '') +
      (data.trackingUrl ? button(data.trackingUrl, 'Track Shipment') + spacer(14) : '') +
      note(
        new Raw(
          s(
            `주문 내역은 ${textLink(data.orderUrl, '여기')}에서 다시 보실 수 있습니다.`,
            `You can review the order ${textLink(data.orderUrl, 'here')}.`
          )
        )
      ) +
      (data.items?.length ? spacer(32) + label('Items') + lineItems(data.items) : '') +
      spacer(36) +
      helpBlock(lang),
  });
}

/** 배송 완료 — 관리 방법 안내를 함께 */
export function orderDelivered(
  data: WithLang & { name?: Text; orderNumber: Text; orderUrl: Text }
): Email {
  const lang = data.lang ?? 'ko';
  const s = (ko: string, en: string) => t(lang, ko, en);

  return compose({
    id: 'order-delivered',
    lang,
    subject: new Raw(
      s(
        `${BRAND.short} — 배송이 완료되었습니다 ${out(data.orderNumber)}`,
        `${BRAND.short} — Delivered ${out(data.orderNumber)}`
      )
    ).value,
    preheader: s(
      '상품을 잘 받으셨는지요. 관리 방법을 함께 안내드립니다.',
      'We hope it arrived well. A short note on how to keep it.'
    ),
    content:
      label(new Raw(`Order ${out(data.orderNumber)}`)) +
      title(s('상품이 도착했습니다', 'It has arrived')) +
      spacer(24) +
      greet(lang, data.name) +
      paragraph(
        s(
          '주문하신 상품이 배송 완료되었습니다. 잘 받으셨는지 확인 부탁드립니다.',
          'Your order has been delivered. We hope everything arrived as it should.'
        ),
        { top: 12 }
      ) +
      spacer(30) +
      panel(
        subtitle(s('오래 입기 위한 안내', 'To keep it well')) +
          paragraph(
            s(
              '30℃ 이하의 물에서 단독 손세탁하고, 건조기 사용은 피해 주세요.',
              'Hand wash separately below 30℃ and keep it out of the dryer.'
            )
          ) +
          paragraph(
            s(
              '직사광선을 피해 그늘에서 평평하게 뉘어 말리면 형태가 오래 유지됩니다.',
              'Dry flat in the shade, away from direct sun, and the shape will hold.'
            ),
            { top: 8 }
          )
      ) +
      spacer(28) +
      paragraph(
        s(
          '혹시 상품에 문제가 있거나 사이즈 교환이 필요하시면, 수령일로부터 7일 이내에 고객센터로 연락 주세요.',
          'If anything is wrong or you need a different size, write to us within 7 days of delivery.'
        )
      ) +
      spacer(30) +
      button(data.orderUrl, 'View Order') +
      spacer(36) +
      helpBlock(lang),
  });
}

/** 환불 안내 */
export function refundNotice(
  data: WithLang & { name?: Text; orderNumber: Text; amount: Text; reason?: Text }
): Email {
  const lang = data.lang ?? 'ko';
  const s = (ko: string, en: string) => t(lang, ko, en);

  return compose({
    id: 'refund-notice',
    lang,
    subject: new Raw(
      s(
        `${BRAND.short} — 환불이 처리되었습니다 ${out(data.orderNumber)}`,
        `${BRAND.short} — Refund processed ${out(data.orderNumber)}`
      )
    ).value,
    preheader: s('요청하신 환불이 정상적으로 처리되었습니다.', 'Your refund has been processed.'),
    content:
      label(new Raw(`Order ${out(data.orderNumber)}`)) +
      title(s('환불이 처리되었습니다', 'Refund processed')) +
      spacer(24) +
      greet(lang, data.name) +
      paragraph(
        s('요청하신 환불이 정상적으로 처리되었습니다.', 'Your refund has been processed.'),
        { top: 12 }
      ) +
      spacer(28) +
      panel(
        rows([
          { label: 'Amount', value: data.amount },
          ...(data.reason ? [{ label: 'Reason', value: data.reason }] : []),
        ])
      ) +
      spacer(22) +
      note(
        s(
          '카드사 사정에 따라 실제 반영까지 영업일 기준 3–7일이 걸릴 수 있습니다.',
          'Depending on your bank, it may take 3–7 business days to appear.'
        )
      ) +
      spacer(32) +
      helpBlock(lang),
  });
}

/* =================================================================
   3. 마케팅
   ================================================================= */

/** 장바구니에 두고 가신 상품 — 매출로 직결되는 메일입니다 */
export function abandonedCheckout(
  data: WithLang & {
    name?: Text;
    checkoutUrl: Text;
    items: LineItem[];
    unsubscribeUrl: Text;
    /** 서명된 수신거부 링크를 쓸 수 없는 경우(쇼피파이 발송)의 대체 문구 */
    unsubscribeText?: string;
  }
): Email {
  const lang = data.lang ?? 'ko';
  const s = (ko: string, en: string) => t(lang, ko, en);

  return compose({
    id: 'abandoned-checkout',
    lang,
    kind: 'marketing',
    unsubscribeUrl: String(data.unsubscribeUrl),
    unsubscribeText: data.unsubscribeText,
    subject: s(
      `${BRAND.short} — 담아두신 상품이 기다리고 있습니다`,
      `${BRAND.short} — Still waiting in your bag`
    ),
    preheader: s(
      '결제를 마치지 못하신 상품이 장바구니에 남아 있습니다.',
      'The pieces you chose are still held for you.'
    ),
    content:
      label('Still in your bag') +
      title(s('두고 가신 것이 있습니다', 'You left something behind')) +
      spacer(24) +
      greet(lang, data.name) +
      paragraph(
        s(
          '장바구니에 담아두신 상품이 아직 남아 있습니다. 수량이 한정된 상품은 예고 없이 품절될 수 있습니다.',
          'What you chose is still in your bag. Quantities are limited, and pieces sell out without notice.'
        ),
        { top: 12 }
      ) +
      spacer(30) +
      lineItems(data.items) +
      spacer(32) +
      button(data.checkoutUrl, 'Complete Checkout') +
      spacer(36) +
      helpBlock(lang),
  });
}

/** 재입고 알림 */
export function backInStock(
  data: WithLang & {
    name?: Text;
    productTitle: Text;
    productUrl: Text;
    image?: Text;
    unsubscribeUrl: Text;
  }
): Email {
  const lang = data.lang ?? 'ko';
  const s = (ko: string, en: string) => t(lang, ko, en);

  return compose({
    id: 'back-in-stock',
    lang,
    kind: 'marketing',
    unsubscribeUrl: String(data.unsubscribeUrl),
    subject: new Raw(
      s(
        `${BRAND.short} — ${out(data.productTitle)} 재입고`,
        `${BRAND.short} — ${out(data.productTitle)} is back`
      )
    ).value,
    preheader: s(
      '기다리시던 상품이 다시 입고되었습니다.',
      'The piece you were waiting for is available again.'
    ),
    content:
      label('Back in stock') +
      title(s('다시 준비되었습니다', 'Available again')) +
      spacer(24) +
      greet(lang, data.name) +
      paragraph(
        s(
          '기다리시던 상품이 다시 입고되었습니다. 수량이 많지 않으니 서둘러 주세요.',
          'The piece you were waiting for is back. There are not many.'
        ),
        { top: 12 }
      ) +
      spacer(30) +
      (data.image ? hero(data.image, data.productTitle, data.productUrl) + spacer(20) : '') +
      subtitle(data.productTitle) +
      spacer(24) +
      button(data.productUrl, 'View Product') +
      spacer(36) +
      helpBlock(lang),
  });
}

/** 뉴스레터 구독 환영 */
export function newsletterWelcome(
  data: WithLang & { unsubscribeUrl: Text; shopUrl?: Text }
): Email {
  const lang = data.lang ?? 'ko';
  const s = (ko: string, en: string) => t(lang, ko, en);

  return compose({
    id: 'newsletter-welcome',
    lang,
    kind: 'marketing',
    unsubscribeUrl: String(data.unsubscribeUrl),
    subject: s(
      `${BRAND.short} — 구독해 주셔서 감사합니다`,
      `${BRAND.short} — Thank you for subscribing`
    ),
    preheader: s(
      '새로운 시즌과 아카이브 소식을 가장 먼저 보내드리겠습니다.',
      'New seasons and archives will reach you first.'
    ),
    content:
      label('Subscribed') +
      title(s('가장 먼저 전해드리겠습니다', 'You will hear it first')) +
      spacer(24) +
      paragraph(
        s(
          '뉴스레터를 구독해 주셔서 감사합니다. 새로운 드롭과 아카이브, 브랜드의 기록을 가장 먼저 보내드리겠습니다.',
          'Thank you for subscribing. New drops, archives and the record of what we make will reach you first.'
        ),
        { ink: true }
      ) +
      spacer(28) +
      bilingual(
        'No noise. Only what matters.',
        s(
          '자주 보내지 않습니다. 전할 것이 있을 때만 보냅니다.',
          'We write only when there is something worth sending.'
        )
      ) +
      spacer(32) +
      button(data.shopUrl ?? url('/'), 'Enter the Store') +
      spacer(36) +
      rule() +
      spacer(26) +
      rows([
        {
          label: 'Essay',
          value: new Raw(textLink(url('/essay'), s('브랜드가 쓰는 글', 'What we write'))),
        },
        {
          label: 'Archives',
          value: new Raw(
            textLink(url('/archives'), s('지난 시즌의 기록', 'The record of past seasons'))
          ),
        },
      ]),
  });
}

/**
 * 범용 캠페인 메일.
 *
 * 시즌 드롭, 룩북 공개, 이벤트 — 마케팅 메일 대부분이 이 하나로 해결됩니다.
 * 상품 그리드는 넣어도 되고 빼도 됩니다.
 */
export function campaign(
  data: WithLang & {
    eyebrow?: Text;
    headline: Text;
    bodyText: Text | Text[];
    heroImage?: Text;
    heroHref?: Text;
    ctaLabel?: Text;
    ctaUrl?: Text;
    products?: ProductCard[];
    subject: string;
    preheader: string;
    unsubscribeUrl: Text;
  }
): Email {
  const lang = data.lang ?? 'ko';

  const paragraphs = (Array.isArray(data.bodyText) ? data.bodyText : [data.bodyText])
    .map((line, i) => paragraph(line, { top: i === 0 ? 0 : 14 }))
    .join('');

  return compose({
    id: 'campaign',
    lang,
    kind: 'marketing',
    unsubscribeUrl: String(data.unsubscribeUrl),
    subject: data.subject,
    preheader: data.preheader,
    content:
      (data.heroImage ? hero(data.heroImage, data.headline, data.heroHref) + spacer(34) : '') +
      (data.eyebrow ? label(data.eyebrow) : '') +
      title(data.headline) +
      spacer(22) +
      paragraphs +
      (data.ctaUrl ? spacer(32) + button(data.ctaUrl, data.ctaLabel ?? 'Discover') : '') +
      (data.products?.length ? spacer(44) + label('Selected') + productGrid(data.products) : ''),
  });
}

/* =================================================================
   4. 고객 응대
   ================================================================= */

/** 문의 접수 확인 — 사람이 답장하기 전에 먼저 나가는 메일 */
export function csAutoReply(
  data: WithLang & { name?: Text; summary?: Text; ticketId?: Text } = {}
): Email {
  const lang = data.lang ?? 'ko';
  const s = (ko: string, en: string) => t(lang, ko, en);

  return compose({
    id: 'cs-auto-reply',
    lang,
    subject: s(
      `${BRAND.short} — 문의가 접수되었습니다`,
      `${BRAND.short} — We received your message`
    ),
    preheader: s(
      '영업일 기준 1일 이내에 답변드리겠습니다.',
      'We will reply within one business day.'
    ),
    content:
      label('We received your message') +
      title(s('문의가 접수되었습니다', 'We have your message')) +
      spacer(24) +
      greet(lang, data.name) +
      paragraph(
        s(
          '보내주신 문의를 확인했습니다. 영업일 기준 1일 이내에 담당자가 답변드리겠습니다.',
          'We have your message and will reply within one business day.'
        ),
        { top: 12 }
      ) +
      spacer(28) +
      (data.summary || data.ticketId
        ? panel(
            rows(
              [
                data.ticketId ? { label: 'Ticket', value: data.ticketId } : null,
                data.summary ? { label: 'Your message', value: data.summary } : null,
              ].filter(Boolean) as Array<{ label: Text; value: Text }>
            )
          ) + spacer(26)
        : '') +
      note(t(lang, CONTACT.hoursKo, CONTACT.hours)) +
      spacer(32) +
      helpBlock(lang),
  });
}
