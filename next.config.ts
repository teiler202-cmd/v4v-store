import type { NextConfig } from "next";

/**
 * 보안 응답 헤더.
 *
 * 예전에는 이 사이트가 보안 헤더를 하나도 보내지 않았습니다.
 * 아래 값들은 렌더링 방식을 전혀 바꾸지 않으므로(정적 페이지는 계속 정적입니다)
 * 속도를 깎지 않고 방어선만 세웁니다.
 */

/**
 * 콘텐츠 보안 정책(CSP) — "이 페이지가 어디서 온 자원만 쓸 수 있는가"의 목록입니다.
 *
 * script-src 에 'unsafe-inline' 이 남아 있는 건 타협입니다:
 * 이걸 없애려면 요청마다 nonce를 발급해야 하는데(Next 문서의 proxy.ts 방식),
 * 그러면 모든 페이지가 '요청마다 새로 그리는' 동적 렌더링으로 바뀌어
 * 지금 정적으로 빠르게 나가는 상품·소개 페이지가 전부 느려집니다.
 * 대신 외부 도메인 스크립트는 전부 차단되므로, 흔한 공격 경로는 막힙니다.
 */
/**
 * ⚠️ 개발 모드에서는 'unsafe-eval' 이 반드시 필요합니다.
 *    React가 개발 중에만 eval()로 오류 스택을 복원하는데,
 *    이게 막히면 콘솔이 오류로 가득 차고 화면이 제대로 뜨지 않습니다.
 *    (실제로 이 설정을 빠뜨려 개발 서버가 깨졌던 적이 있습니다)
 *    프로덕션에서는 React도 Next도 eval을 쓰지 않으므로 붙이지 않습니다.
 */
const isDev = process.env.NODE_ENV === 'development';

/**
 * 실제로 배포된 환경인지 (Vercel 등).
 * 로컬에서 `npm run start` 로 프로덕션 빌드를 열어 보는 경우와 구분합니다 —
 * 그때도 https 전용 지시어를 켜면 사파리에서 스타일이 통째로 날아갑니다.
 */
const isDeployed = Boolean(process.env.VERCEL || process.env.VERCEL_ENV);

const CSP = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ''}`,
  "style-src 'self' 'unsafe-inline'",
  // 상품 이미지(쇼피파이 CDN)와 아카이브 갤러리(핀터레스트)
  "img-src 'self' data: blob: https://cdn.shopify.com https://i.pinimg.com",
  "font-src 'self' data:",
  "media-src 'self'",
  // 브라우저가 말을 걸 수 있는 곳은 우리 서버뿐입니다.
  // (쇼피파이와의 대화는 전부 서버에서만 일어납니다)
  // 개발 중에는 코드 변경을 실시간으로 받아오는 통로(HMR)도 열어 둡니다.
  `connect-src 'self'${isDev ? ' ws: wss:' : ''}`,
  // 결제는 쇼피파이 결제창으로 넘어갑니다.
  "form-action 'self' https://*.myshopify.com https://shop.app",
  "frame-ancestors 'none'", // 다른 사이트가 우리 화면을 몰래 덧씌우지 못하게
  "base-uri 'self'",
  "object-src 'none'",
  /**
   * ⚠️ https로 서비스되는 곳에서만 켭니다 (배포 환경).
   *    이 지시어는 페이지 안의 모든 요청을 https로 강제 승격시킵니다.
   *    크롬은 localhost를 예외로 봐주지만 사파리는 예외 없이 승격시켜서,
   *    http://localhost:3000 에서 CSS·JS가 전부 https로 요청되고 실패합니다.
   *    (실제로 사파리에서 스타일이 하나도 없는 맨 HTML만 뜬 적이 있습니다)
   *    로컬은 http라 항상 끕니다 — `npm run dev` 든 `npm run start` 든 마찬가지입니다.
   *    배포 환경에서만 켜지고, http 접속 자체는 위의 HSTS가 막아 줍니다.
   */
  ...(isDeployed ? ["upgrade-insecure-requests"] : []),
].join('; ');

const securityHeaders = [
  { key: 'Content-Security-Policy', value: CSP },
  // 한 번 https로 들어온 브라우저는 이후 2년간 http로 되돌아가지 않습니다.
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
  // 서버가 알려준 파일 종류를 브라우저가 제멋대로 추측하지 않게 합니다.
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'DENY' },
  // 외부 사이트로 나갈 때 어느 페이지에서 왔는지까지는 알려주지 않습니다.
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  // 쓰지 않는 기기 권한은 아예 닫아 둡니다.
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()' },
];

const nextConfig: NextConfig = {
  // 서버 종류를 광고하지 않습니다.
  poweredByHeader: false,

  // React <ViewTransition> 연동은 Next 16.3부터 기본 동작이라 설정이 필요 없습니다.
  // (16.2까지 쓰던 experimental.viewTransition 플래그는 제거됐습니다 —
  //  남겨 두면 빌드가 타입 검사에서 실패합니다)

  images: {
    // 쇼피파이가 실제로 이미지를 두는 경로로 좁혔습니다 —
    // 이렇게 하지 않으면 이미지 최적화 기능이 아무 이미지나 리사이즈해 주는
    // 공개 프록시처럼 쓰일 수 있습니다.
    remotePatterns: [
      { protocol: 'https', hostname: 'cdn.shopify.com', pathname: '/s/files/**' },
      { protocol: 'https', hostname: 'i.pinimg.com', pathname: '/**' },
    ],
    formats: ['image/avif', 'image/webp'],
  },

  async headers() {
    return [
      { source: '/:path*', headers: securityHeaders },
      {
        // 해시가 붙은 빌드 산출물은 내용이 바뀌면 이름도 바뀝니다 — 영구 캐시해도 안전합니다.
        source: '/archives/:path*',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }],
      },
    ];
  },
};

export default nextConfig;
