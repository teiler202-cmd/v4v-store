/**
 * 모든 V4V 메일이 입는 껍데기.
 *
 * 머리 — 본문 — 발(정책 링크 · 수신거부 · 사업자 정보)
 * 이 순서가 브랜드 메일의 뼈대입니다. 본문만 갈아 끼우면 환영 메일도,
 * 배송 안내도, 캠페인도 모두 같은 얼굴을 갖습니다.
 *
 * 마케팅 메일에는 수신거부 링크가 반드시 필요합니다 —
 * 정보통신망법상 의무이고, 없으면 메일 서비스들이 스팸으로 분류합니다.
 * 그래서 kind:'marketing' 인데 수신거부 주소가 없으면 아래에서 막습니다.
 */

import { BRAND, BUSINESS, CONTACT, POLICY_LINKS, SOCIAL, url } from '@/lib/brand';
import { C, F, WIDTH, esc, fine, microLabel } from './theme';
import { toPlainText } from './blocks';

export type EmailKind = 'transactional' | 'marketing';
export type Lang = 'ko' | 'en';

/** 언어에 따라 둘 중 하나를 고릅니다 */
export const t = (lang: Lang, ko: string, en: string) => (lang === 'ko' ? ko : en);

export type EmailShell = {
  /** 메일 앱 미리보기 줄에 뜨는 한 문장 */
  preheader: string;
  /** <tr>...</tr> 로 이어 붙인 본문 */
  content: string;
  lang?: Lang;
  kind?: EmailKind;
  /** 마케팅 메일 필수 */
  unsubscribeUrl?: string;
  /**
   * 수신거부 안내 문구를 바꿔야 할 때.
   *
   * 쇼피파이가 보내는 마케팅 메일(장바구니 리마인드)에는 서명된 수신거부 링크를
   * 심을 수 없습니다 — 서명은 우리 서버만 만들 수 있기 때문입니다.
   * 그래서 그 메일에서는 '마이페이지에서 수신설정을 바꾸는' 경로를 안내합니다.
   */
  unsubscribeText?: string;
  /** 하단에 붙이는 추가 안내 (주문 메일의 '이 메일은 발신 전용입니다' 같은) */
  footnote?: string;
};

const LOGO = url('/v4v-logo-horizontal.png');

/**
 * 머리 — 로고 한 장과 태그라인.
 * 이미지를 막아 두고 보는 사람이 많아서, alt 텍스트만 남아도
 * 브랜드 이름이 읽히도록 alt 를 정식 명칭으로 씁니다.
 */
function header() {
  return (
    `<tr><td align="center" style="padding:44px 32px 0;">` +
    `<a href="${url('/')}" style="text-decoration:none;">` +
    `<img src="${LOGO}" width="132" alt="${BRAND.name}" style="display:block;width:132px;height:auto;border:0;" />` +
    `</a>` +
    `<p style="${microLabel}padding-top:14px;">${esc(BRAND.tagline)}</p>` +
    `</td></tr>`
  );
}

/**
 * 발.
 *
 * 순서가 중요합니다 — 손님에게 쓸모 있는 것(정책·소셜·수신거부)을 위에 두고,
 * 법으로 적어야 하는 사업자 정보는 가장 아래에, 가장 작게 둡니다.
 * 작게 두되 읽을 수는 있어야 해서 9.5px / 행간 1.8 아래로는 내리지 않았습니다.
 */
function footer({ kind, lang = 'ko', unsubscribeUrl, unsubscribeText, footnote }: EmailShell) {
  const policies = POLICY_LINKS.map(
    (p) =>
      `<a href="${url(p.path)}" style="color:${C.ash};text-decoration:none;">${esc(
        lang === 'ko' ? p.labelKo : p.label
      )}</a>`
  ).join(`<span style="color:${C.line};"> · </span>`);

  const socials = SOCIAL.map(
    (s) => `<a href="${s.href}" style="color:${C.ash};text-decoration:none;">${esc(s.label)}</a>`
  ).join(`<span style="color:${C.line};"> · </span>`);

  const notice =
    kind === 'marketing' && unsubscribeUrl && unsubscribeText
      ? `${esc(unsubscribeText)} <a href="${esc(unsubscribeUrl)}" style="color:${C.ash};text-decoration:underline;">${t(
          lang,
          '수신설정 변경',
          'Manage preferences'
        )}</a>`
      : kind === 'marketing' && unsubscribeUrl
      ? t(
          lang,
          `이 메일은 마케팅 정보 수신에 동의하신 분께 발송되었습니다. <a href="${esc(
            unsubscribeUrl
          )}" style="color:${C.ash};text-decoration:underline;">수신거부</a> · <a href="${url(
            '/account'
          )}" style="color:${C.ash};text-decoration:underline;">수신설정 변경</a>`,
          `You are receiving this because you opted in to marketing emails. <a href="${esc(
            unsubscribeUrl
          )}" style="color:${C.ash};text-decoration:underline;">Unsubscribe</a> · <a href="${url(
            '/account'
          )}" style="color:${C.ash};text-decoration:underline;">Manage preferences</a>`
        )
      : // 거래 메일에 이미 다른 안내(footnote)가 붙어 있으면 이 문장은 생략합니다.
      // 둘 다 "이 메일은…"으로 시작해서 나란히 놓이면 같은 말을 두 번 하는 것처럼 읽힙니다.
      footnote
      ? ''
      : t(
          lang,
          '이 메일은 고객님의 주문·계정 처리를 위해 발송된 안내 메일입니다.',
          'This message was sent to you as part of your order or account activity.'
        );

  /**
   * 법정 표기 — 두 줄로 압축했습니다.
   * 예전에는 다섯 줄이 본문만큼의 자리를 차지했습니다.
   */
  const legalLines =
    lang === 'ko'
      ? [
          `${BRAND.nameKo} (${BRAND.short}) · 대표 ${BUSINESS.representativeKo} · 사업자등록번호 ${BUSINESS.registrationNo} · 통신판매업신고 ${BUSINESS.mailOrderNoKo}`,
          `${BUSINESS.addressKo} · 개인정보보호책임자 ${BUSINESS.representativeKo} · 호스팅 ${BUSINESS.host}`,
          `고객센터 ${CONTACT.phoneKo} · ${CONTACT.cs} · ${CONTACT.hoursKo}`,
        ]
      : [
          `${BRAND.name} (${BRAND.short}) · Representative ${BUSINESS.representative} · Business Reg. ${BUSINESS.registrationNo} · Mail-order Licence ${BUSINESS.mailOrderNo}`,
          `${BUSINESS.address} · Privacy Officer ${BUSINESS.representative} · Hosting ${BUSINESS.host}`,
          `Customer Service ${CONTACT.phone} · ${CONTACT.cs} · ${CONTACT.hours}`,
        ];

  const legal = legalLines
    .map(
      (line) =>
        `<p style="font-family:${F.sans};font-size:9.5px;line-height:1.8;color:#8a8a8a;margin:0;">${esc(
          line
        )}</p>`
    )
    .join('');

  return (
    `<tr><td style="padding:0 32px;"><div style="height:1px;line-height:1px;font-size:0;background:${C.lineSoft};">&nbsp;</div></td></tr>` +
    `<tr><td class="v4v-pad" style="padding:26px 32px 0;">` +
    // 1. 쓸모 있는 것
    `<p style="${microLabel}font-size:8.5px;line-height:2;">${policies}</p>` +
    `<p style="${microLabel}font-size:8.5px;line-height:2;padding-top:6px;">${socials}</p>` +
    (footnote ? `<p style="${fine}font-size:10.5px;padding-top:16px;">${esc(footnote)}</p>` : '') +
    (notice ? `<p style="${fine}font-size:10.5px;padding-top:${footnote ? 8 : 16}px;">${notice}</p>` : '') +
    // 2. 서명
    `<table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0" style="margin-top:22px;"><tr>` +
    `<td style="padding:0;"><p style="${microLabel}font-size:8.5px;">© ${new Date().getFullYear()} ${esc(
      BRAND.short
    )}</p></td>` +
    `<td align="right" style="padding:0;"><p style="${microLabel}font-size:8.5px;">${esc(
      BRAND.tagline
    )}</p></td>` +
    `</tr></table>` +
    `</td></tr>` +
    // 3. 가장 아래, 가장 작게 — 법정 표기
    `<tr><td style="padding:20px 32px 0;"><div style="height:1px;line-height:1px;font-size:0;background:${C.lineSoft};">&nbsp;</div></td></tr>` +
    `<tr><td class="v4v-pad" style="padding:14px 32px 46px;">${legal}</td></tr>`
  );
}

/**
 * 완성된 메일 한 통.
 *
 * ⚠️ 다크 모드: 메일 앱들이 흰 배경을 제멋대로 검게 뒤집으면서
 *    검은 글씨는 그대로 두는 일이 있습니다(= 검은 배경에 검은 글씨).
 *    meta color-scheme 로 "우리는 라이트 전용"이라고 알려 주고,
 *    모든 배경/글자색을 인라인으로 못 박아 사고를 줄입니다.
 */
export function renderShell(shell: EmailShell): string {
  if (shell.kind === 'marketing' && !shell.unsubscribeUrl) {
    throw new Error('[email] 마케팅 메일에는 수신거부 주소가 반드시 필요합니다.');
  }

  const lang = shell.lang ?? 'ko';

  return `<!doctype html>
<html lang="${lang}">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<meta name="x-apple-disable-message-reformatting" />
<meta name="color-scheme" content="light" />
<meta name="supported-color-schemes" content="light" />
<title>${esc(BRAND.name)}</title>
<style>
  /* 메일 앱 대부분이 <style> 를 지우거나 무시합니다 — 여기 있는 건 '있으면 좋은' 보정뿐입니다. */
  body { margin:0; padding:0; width:100% !important; background:${C.paper}; }
  img { -ms-interpolation-mode:bicubic; }
  a { color:${C.ink}; }
  @media only screen and (max-width:620px) {
    .v4v-pad { padding-left:22px !important; padding-right:22px !important; }
  }
</style>
</head>
<body style="margin:0;padding:0;background:${C.paper};">
<div style="display:none;font-size:0;line-height:0;max-height:0;max-width:0;opacity:0;overflow:hidden;mso-hide:all;">${esc(
    shell.preheader
  )}</div>
<table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0" bgcolor="${C.paper}" style="background:${C.paper};">
<tr><td align="center" style="padding:0;">
<table role="presentation" width="${WIDTH}" border="0" cellpadding="0" cellspacing="0" style="width:${WIDTH}px;max-width:${WIDTH}px;font-family:${F.sans};">
${header()}
<tr><td class="v4v-pad" style="padding:40px 32px 44px;">
<table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0">
${shell.content}
</table>
</td></tr>
${footer({ ...shell, lang })}
</table>
</td></tr>
</table>
</body>
</html>`;
}

/** HTML 과 함께 보낼 플레인 텍스트 파트 */
export function renderText(shell: EmailShell) {
  const lang = shell.lang ?? 'ko';
  const plain = toPlainText(shell.content);

  return [
    BRAND.name,
    BRAND.tagline,
    '',
    plain,
    '',
    '—',
    lang === 'ko' ? `${BRAND.nameKo} (${BRAND.short})` : `${BRAND.name} (${BRAND.short})`,
    lang === 'ko'
      ? `고객센터 ${CONTACT.phoneKo} · ${CONTACT.cs}`
      : `Customer Service ${CONTACT.phone} · ${CONTACT.cs}`,
    lang === 'ko' ? CONTACT.hoursKo : CONTACT.hours,
    url('/'),
    shell.kind === 'marketing' && shell.unsubscribeUrl
      ? t(lang, `수신거부: ${shell.unsubscribeUrl}`, `Unsubscribe: ${shell.unsubscribeUrl}`)
      : '',
  ]
    .filter(Boolean)
    .join('\n');
}
