import Link from 'next/link';

const POLICIES = [
  { href: '/policies/terms-of-service', label: 'Terms of Service' },
  { href: '/policies/privacy-policy', label: 'Privacy Policy' },
  { href: '/policies/refund-policy', label: 'Refund Policy' },
  { href: '/policies/shipping-policy', label: 'Shipping Policy' },
  { href: '/policies/contact', label: 'Contact' },
];

export default function Footer() {
  return (
    <footer style={{ viewTransitionName: 'v4v-footer' }} className="v4v-chrome w-full border-t border-line-soft bg-paper px-6 pb-14 pt-28 text-ink md:px-10 md:pt-36">
      <div className="mx-auto flex max-w-[1500px] flex-col gap-14">
        {/* 1. 정책 링크 */}
        <nav className="flex flex-wrap gap-x-8 gap-y-3">
          {POLICIES.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className="font-mono text-[8.5px] uppercase tracking-[0.22em] text-ash transition-colors duration-500 ease-silk hover:text-ink md:text-[9px]"
            >
              {label}
            </Link>
          ))}
        </nav>

        {/* 2. 법적 필수 표기 사항 */}
        <div className="grid grid-cols-1 gap-x-10 gap-y-2 text-[10px] font-light leading-[1.9] tracking-[0.01em] text-ash md:grid-cols-2 md:text-[10.5px]">
          <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-ink md:col-span-2">
            비전포비저너리 (V4V)
          </p>
          <p>대표: 안세웅 &nbsp;|&nbsp; 사업자등록번호: 501-07-57403</p>
          <p>통신판매업신고: 발급 대기 중</p>
          <p>주소: 경기도 용인시 기흥구 금화로 11번길 10, 303동 8층</p>
          <p>고객센터: 010-5634-8804</p>
          <p>개인정보보호책임자: 안세웅</p>
          <p>호스팅 제공자: Shopify Inc.</p>
        </div>

        {/* 3. 저작권 */}
        <div className="flex flex-col gap-3 border-t border-line-soft pt-8 font-mono text-[8.5px] uppercase tracking-[0.2em] text-ash md:flex-row md:items-center md:justify-between md:text-[9px]">
          <span>© {new Date().getFullYear()} Vision for Visionary</span>
          <span className="opacity-60">Vision in Motion, Performance in Action</span>
        </div>
      </div>
    </footer>
  );
}
