import Link from 'next/link';
import Bilingual from '@/components/Bilingual';
import LanguageToggle from '@/components/LanguageToggle';
import SocialLinks from '@/components/SocialLinks';
import NewsletterForm from '@/components/NewsletterForm';
import { hasAdminConfig } from '@/lib/shopify-admin';

const POLICIES = [
  { href: '/policies/terms-of-service', label: 'Terms of Service' },
  { href: '/policies/privacy-policy', label: 'Privacy Policy' },
  { href: '/policies/refund-policy', label: 'Refund Policy' },
  { href: '/policies/shipping-policy', label: 'Shipping Policy' },
  { href: '/policies/contact', label: 'Contact' },
];

/** 사업자 정보 — 국내 표기가 원본이고, 해외 이용자를 위해 영문을 함께 둡니다. */
const BUSINESS = [
  { en: 'Representative: Ahn Seung', ko: '대표: 안세웅' },
  { en: 'Business Reg. No. 501-07-57403', ko: '사업자등록번호: 501-07-57403' },
  { en: 'Mail-order Licence: pending', ko: '통신판매업신고: 발급 대기 중' },
  { en: 'Privacy Officer: Ahn Seung', ko: '개인정보보호책임자: 안세웅' },
  {
    en: '10, Geumhwa-ro 11beon-gil, Giheung-gu, Yongin-si, Gyeonggi-do, Korea',
    ko: '주소: 경기도 용인시 기흥구 금화로 11번길 10, 303동 8층',
  },
  { en: 'Customer Service: +82 10 5634 8804', ko: '고객센터: 010-5634-8804' },
  { en: 'Hosting: Shopify Inc.', ko: '호스팅 제공자: Shopify Inc.' },
];

export default function Footer() {
  /**
   * 구독 창구는 '실제로 저장되는 곳이 있을 때'만 띄웁니다.
   *
   * 눌러도 아무 데도 기록되지 않는 폼을 손님에게 보여 주는 것이 가장 나쁩니다.
   * (동의는 쇼피파이 고객 정보에 기록되고, 그러려면 Admin API 토큰이 필요합니다)
   */
  const newsletterReady = hasAdminConfig();

  return (
    <footer
      style={{ viewTransitionName: 'v4v-footer' }}
      className="v4v-chrome w-full border-t border-line-soft bg-paper px-6 pb-14 pt-24 text-ink md:px-10 md:pt-32"
    >
      <div className="mx-auto flex max-w-[1500px] flex-col gap-12">
        {/* 0. 뉴스레터 */}
        {newsletterReady && (
          <div className="border-b border-line-soft pb-12">
            <NewsletterForm />
          </div>
        )}

        {/* 1. 정책 링크 */}
        <nav className="flex flex-wrap gap-x-7 gap-y-3">
          {POLICIES.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className="font-mono text-[8.5px] uppercase tracking-[0.16em] text-ash transition-colors duration-500 ease-silk hover:text-ink md:text-[9px]"
            >
              {label}
            </Link>
          ))}
        </nav>

        {/* 2. 법적 필수 표기 사항 */}
        <div className="flex flex-col gap-4">
          <Bilingual
            en="Vision for Visionary"
            ko="비전포비저너리 (V4V)"
            inline
            className="font-mono text-[9px] uppercase tracking-[0.16em] text-ink"
          />

          <div className="grid grid-cols-1 gap-x-10 gap-y-2.5 md:grid-cols-2">
            {BUSINESS.map(({ en, ko }) => (
              <Bilingual
                key={ko}
                en={en}
                ko={ko}
                className="text-[10px] font-light leading-[1.55] tracking-[-0.005em] text-ash md:text-[10.5px]"
              />
            ))}
          </div>
        </div>

        {/* 3. 소셜 · 언어 · 저작권 */}
        <div className="flex flex-col gap-5 border-t border-line-soft pt-8">
          <div className="flex flex-wrap items-center justify-between gap-5">
            <SocialLinks />
            <LanguageToggle />
          </div>

          <div className="flex flex-col gap-2 font-mono text-[8.5px] uppercase tracking-[0.16em] text-ash md:flex-row md:items-center md:justify-between md:text-[9px]">
            <span>© {new Date().getFullYear()} Vision for Visionary</span>
            <span className="opacity-60">Vision in Motion, Performance in Action</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
