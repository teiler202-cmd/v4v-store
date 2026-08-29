/**
 * 브랜드의 '사실'을 한 곳에 모아 둔 파일.
 *
 * 같은 정보가 푸터·정책 페이지·이메일·AI 상담원 네 곳에 흩어져 있으면
 * 반드시 어긋납니다. 실제로 고객센터 주소가 화면마다 달랐습니다
 * (푸터는 전화번호만, 정책 페이지는 cs@v4v.com, 연락처 페이지는
 *  cs@vision4visionary.com). 손님이 보낸 메일이 아무도 읽지 않는
 * 주소로 갈 수 있다는 뜻입니다.
 *
 * 이제 이 파일이 원본입니다. 서버·클라이언트 양쪽에서 쓰이므로
 * 'server-only'를 붙이지 않습니다 — 비밀은 아무것도 없습니다.
 */

export const SITE_URL = 'https://vision4visionary.com';

export const BRAND = {
  name: 'VISION FOR VISIONARY',
  short: 'V4V',
  nameKo: '비전포비저너리',
  tagline: 'Vision in Motion, Performance in Action',
  taglineKo: '비전은 움직임으로, 본질은 행동으로',
} as const;

/** 고객이 실제로 연락할 수 있는 창구 */
export const CONTACT = {
  cs: 'cs@vision4visionary.com',
  partnership: 'partnership@vision4visionary.com',
  phone: '+82 10 5634 8804',
  phoneKo: '010-5634-8804',
  hours: 'Mon–Fri 10:00–17:00 KST (lunch 12:00–13:00)',
  hoursKo: '평일 10:00 — 17:00 (점심시간 12:00 — 13:00) · 주말/공휴일 휴무',
} as const;

/** 전자상거래법상 표기 의무가 있는 항목들 — 푸터와 메일 하단이 같은 값을 씁니다. */
export const BUSINESS = {
  representative: 'Ahn Seung',
  representativeKo: '안세웅',
  registrationNo: '501-07-57403',
  mailOrderNo: 'pending',
  mailOrderNoKo: '발급 대기 중',
  address: '10, Geumhwa-ro 11beon-gil, Giheung-gu, Yongin-si, Gyeonggi-do, Korea',
  addressKo: '경기도 용인시 기흥구 금화로 11번길 10, 303동 8층',
  host: 'Shopify Inc.',
} as const;

export const SOCIAL = [
  { label: 'Instagram', href: 'https://www.instagram.com/vision4visionary/' },
  { label: 'YouTube', href: 'https://youtube.com/@vision4visionary' },
] as const;

export const POLICY_LINKS = [
  { label: 'Terms of Service', labelKo: '이용약관', path: '/policies/terms-of-service' },
  { label: 'Privacy Policy', labelKo: '개인정보처리방침', path: '/policies/privacy-policy' },
  { label: 'Refund Policy', labelKo: '교환·환불', path: '/policies/refund-policy' },
  { label: 'Shipping Policy', labelKo: '배송 안내', path: '/policies/shipping-policy' },
  { label: 'Contact', labelKo: '문의', path: '/policies/contact' },
] as const;

/** 상대 경로를 메일에 넣을 수 있는 절대 주소로 */
export function url(path = '/') {
  if (/^https?:\/\//i.test(path)) return path;
  return `${SITE_URL}${path.startsWith('/') ? path : `/${path}`}`;
}
