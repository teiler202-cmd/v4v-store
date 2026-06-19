import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="w-full bg-black text-zinc-500 border-t border-white/10 py-12 px-6 md:px-10 text-xs font-light tracking-wide mt-20">
      <div className="max-w-[1400px] mx-auto flex flex-col gap-10">
        
        {/* 1. 정책 링크들 (클릭하면 정책 상세 페이지로 이동) */}
        <div className="flex flex-wrap gap-6 uppercase tracking-widest text-[10px]">
          <Link href="/policies/terms-of-service" className="hover:text-white transition-colors">Terms of Service</Link>
          <Link href="/policies/privacy-policy" className="hover:text-white transition-colors">Privacy Policy</Link>
          <Link href="/policies/refund-policy" className="hover:text-white transition-colors">Refund Policy</Link>
          <Link href="/policies/shipping-policy" className="hover:text-white transition-colors">Shipping Policy</Link>
          <Link href="/policies/contact" className="hover:text-white transition-colors">Contact</Link>
        </div>

        {/* 2. 법적 필수 표기 사항 (PG사 심사 통과용) */}
        <div className="flex flex-col gap-2 text-zinc-600 leading-relaxed">
          <p>
            <strong className="font-medium text-zinc-400">비전포비저너리(V4V)</strong>
          </p>
          <p>
            대표: [안세웅] | 사업자등록번호: [501-07-57403] | 통신판매업신고: [발급 대기 중...]
          </p>
          <p>
            주소: [경기도 용인시 기흥구 금화로 11번길 10, 303동 8층] | 고객센터: [010-5634-8804] ([c])
          </p>
          <p>
            개인정보보호책임자: [안세웅] | 호스팅 제공자: Shopify Inc.
          </p>
        </div>

        {/* 3. 저작권 표기 */}
        <div className="pt-8 border-t border-white/5 text-zinc-700 flex justify-between items-center">
          <span>© {new Date().getFullYear()} VISION FOR VISIONARY. All rights reserved.</span>
        </div>
      </div>
    </footer>
  );
}