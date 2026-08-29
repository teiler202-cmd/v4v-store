/**
 * 메일을 이루는 조각들.
 *
 * 사이트 화면의 규칙을 그대로 옮겨 왔습니다 —
 * 모노 대문자 마이크로 라벨, 자간을 좁힌 굵은 제목, 회색 본문,
 * 각진 잉크색 버튼, 머리카락처럼 얇은 구분선.
 *
 * 모든 함수는 HTML '문자열'을 돌려줍니다. React가 아닙니다 —
 * 메일 클라이언트가 읽는 건 완성된 HTML 뿐이라서, 여기서 전부 만들어 냅니다.
 */

import { C, F, body, bodyInk, display, esc, fine, heading, microLabel, money, out, Raw } from './theme';
import { url } from '@/lib/brand';

type Text = string | Raw;

/** 한 칸 비우기 */
export const spacer = (height = 24) =>
  `<tr><td style="height:${height}px;line-height:${height}px;font-size:0;">&nbsp;</td></tr>`;

/** 머리카락 굵기의 구분선 */
export const rule = (color = C.lineSoft) =>
  `<tr><td style="padding:0;"><div style="height:1px;line-height:1px;font-size:0;background:${color};">&nbsp;</div></td></tr>`;

/** 모노 대문자 마이크로 라벨 */
export const label = (text: Text) =>
  `<tr><td style="padding:0 0 10px;"><p style="${microLabel}">${out(text)}</p></td></tr>`;

/** 큰 제목 */
export const title = (text: Text) =>
  `<tr><td style="padding:0;"><h1 style="${display}">${out(text)}</h1></td></tr>`;

/** 중간 제목 */
export const subtitle = (text: Text) =>
  `<tr><td style="padding:0 0 8px;"><h2 style="${heading}">${out(text)}</h2></td></tr>`;

/** 본문 한 문단 */
export const paragraph = (text: Text, opts: { ink?: boolean; top?: number } = {}) =>
  `<tr><td style="padding:${opts.top ?? 0}px 0 0;"><p style="${opts.ink ? bodyInk : body}">${out(text)}</p></td></tr>`;

/**
 * 국문·영문을 함께 두는 조판.
 *
 * 사이트는 CSS로 순서와 농도를 바꾸지만(html[data-lang]), 메일에서는
 * 그 CSS가 살아남지 못합니다. 그래서 사이트의 다른 규칙을 빌려 왔습니다 —
 * 영문은 모노 대문자 마이크로 라벨로, 국문은 본문으로. 두 언어 모두 읽히고,
 * 어느 메일 앱에서도 무너지지 않습니다.
 */
export const bilingual = (en: Text, ko: Text) =>
  `<tr><td style="padding:0;">` +
  `<p style="${microLabel}">${out(en)}</p>` +
  `<p style="${body}padding-top:7px;">${out(ko)}</p>` +
  `</td></tr>`;

/** 각진 잉크색 버튼 — 사이트의 '장바구니에 담기' 버튼과 같은 형태입니다 */
export const button = (href: Text, text: Text) =>
  `<tr><td style="padding:0;">` +
  `<table role="presentation" border="0" cellpadding="0" cellspacing="0"><tr>` +
  `<td bgcolor="${C.ink}" style="background:${C.ink};">` +
  `<a href="${out(href)}" style="display:inline-block;padding:17px 34px;font-family:${F.mono};` +
  `font-size:9.5px;letter-spacing:0.28em;text-transform:uppercase;color:${C.paper};` +
  `text-decoration:none;">${out(text)}</a>` +
  `</td></tr></table></td></tr>`;

/** 밑줄만 있는 조용한 링크 */
export const textLink = (href: Text, text: Text) =>
  `<a href="${out(href)}" style="color:${C.ink};text-decoration:none;border-bottom:1px solid ${C.line};">${out(text)}</a>`;

/** 옅은 회색 패널 — 주문 요약·안내처럼 '묶어 두고 싶은' 내용에 씁니다 */
export const panel = (inner: string, opts: { pad?: number } = {}) =>
  `<tr><td style="padding:0;">` +
  `<table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0" bgcolor="${C.mist}" style="background:${C.mist};">` +
  `<tr><td style="padding:${opts.pad ?? 24}px;">` +
  `<table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0">${inner}</table>` +
  `</td></tr></table></td></tr>`;

/** 라벨 / 값 두 줄짜리 표 — 주문번호, 결제수단, 배송지 등 */
export const rows = (items: Array<{ label: Text; value: Text }>) =>
  items
    .map(
      ({ label: l, value }, i) =>
        `<tr><td style="padding:${i === 0 ? 0 : 12}px 0 0;">` +
        `<table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0"><tr>` +
        `<td width="38%" valign="top" style="padding:0;"><p style="${microLabel}">${out(l)}</p></td>` +
        `<td valign="top" style="padding:0;"><p style="${bodyInk}font-size:13px;">${out(value)}</p></td>` +
        `</tr></table></td></tr>`
    )
    .join('');

export type LineItem = {
  title: Text;
  variant?: Text;
  quantity: Text | number;
  price?: Text;
  image?: Text;
};

/** 주문 상품 목록 */
export const lineItems = (items: LineItem[]) =>
  items
    .map((item, i) => {
      const image = item.image
        ? `<td width="72" valign="top" style="padding:0 16px 0 0;">` +
          `<img src="${out(item.image)}" width="72" alt="" style="display:block;width:72px;height:auto;border:0;background:${C.mist};" />` +
          `</td>`
        : '';
      return (
        `<tr><td style="padding:${i === 0 ? 0 : 18}px 0 0;">` +
        `<table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0"><tr>` +
        image +
        `<td valign="top" style="padding:0;">` +
        `<p style="${bodyInk}font-size:13px;font-weight:600;">${out(item.title)}</p>` +
        (item.variant ? `<p style="${microLabel}padding-top:5px;">${out(item.variant)}</p>` : '') +
        `<p style="${fine}padding-top:5px;">QTY ${out(item.quantity)}</p>` +
        `</td>` +
        (item.price
          ? `<td width="90" valign="top" align="right" style="padding:0;"><p style="${bodyInk}font-size:13px;">${out(item.price)}</p></td>`
          : '') +
        `</tr></table></td></tr>`
      );
    })
    .join('');

/** 합계 줄 — 마지막 줄만 굵게 */
export const totals = (items: Array<{ label: Text; value: Text; strong?: boolean }>) =>
  items
    .map(
      ({ label: l, value, strong }, i) =>
        `<tr><td style="padding:${i === 0 ? 0 : 9}px 0 0;">` +
        `<table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0"><tr>` +
        `<td style="padding:0;"><p style="${strong ? bodyInk : body}font-size:${strong ? 14 : 12.5}px;${strong ? 'font-weight:600;' : ''}">${out(l)}</p></td>` +
        `<td align="right" style="padding:0;"><p style="${strong ? bodyInk : body}font-size:${strong ? 14 : 12.5}px;${strong ? 'font-weight:600;' : ''}">${out(value)}</p></td>` +
        `</tr></table></td></tr>`
    )
    .join('');

export type ProductCard = {
  title: Text;
  price?: Text;
  image?: Text;
  href: Text;
  caption?: Text;
};

/**
 * 마케팅 메일용 상품 그리드 (2열).
 *
 * Outlook 은 flex/grid 를 모르고 float 도 제멋대로 해석해서,
 * 두 칸짜리 표를 두 줄로 반복하는 고전적인 방법을 씁니다.
 */
export const productGrid = (products: ProductCard[]) => {
  const cell = (p?: ProductCard) => {
    if (!p) return `<td width="48%" style="padding:0;">&nbsp;</td>`;
    return (
      `<td width="48%" valign="top" style="padding:0;">` +
      `<a href="${out(p.href)}" style="text-decoration:none;color:${C.ink};">` +
      (p.image
        ? `<img src="${out(p.image)}" width="264" alt="${out(p.title)}" style="display:block;width:100%;max-width:264px;height:auto;border:0;background:${C.mist};" />`
        : '') +
      `<p style="${bodyInk}font-size:13px;font-weight:600;padding-top:12px;">${out(p.title)}</p>` +
      (p.caption ? `<p style="${microLabel}padding-top:6px;">${out(p.caption)}</p>` : '') +
      (p.price ? `<p style="${body}font-size:12.5px;padding-top:5px;">${out(p.price)}</p>` : '') +
      `</a></td>`
    );
  };

  const pairs: string[] = [];
  for (let i = 0; i < products.length; i += 2) {
    pairs.push(
      `<tr><td style="padding:${i === 0 ? 0 : 28}px 0 0;">` +
        `<table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0"><tr>` +
        cell(products[i]) +
        `<td width="4%" style="padding:0;">&nbsp;</td>` +
        cell(products[i + 1]) +
        `</tr></table></td></tr>`
    );
  }
  return pairs.join('');
};

/** 작은 각주 한 줄 */
export const note = (text: Text) =>
  `<tr><td style="padding:0;"><p style="${fine}">${out(text)}</p></td></tr>`;

/** 이미지 한 장을 폭 가득 (히어로) */
export const hero = (src: Text, alt: Text = '', href?: Text) => {
  const img = `<img src="${out(src)}" width="600" alt="${out(alt)}" style="display:block;width:100%;max-width:600px;height:auto;border:0;background:${C.mist};" />`;
  return `<tr><td style="padding:0;">${href ? `<a href="${out(href)}">${img}</a>` : img}</td></tr>`;
};

/** 텍스트 본문(플레인 파트)용 — HTML 을 걷어내고 읽을 수 있게 만듭니다 */
export function toPlainText(html: string) {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<a[^>]+href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi, '$2 ($1)')
    .replace(/<\/(p|tr|div|h1|h2|table)>/gi, '\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .split('\n')
    .map((line) => line.trim())
    .filter((line, i, all) => line || all[i - 1])
    .join('\n')
    .trim();
}

export { esc, money, url };
