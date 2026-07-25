import Link from 'next/link';

export default function Footer() {
  return (
    // 🔥 mt-20을 삭제하고 pt-32로 안쪽 여백을 넉넉히 주어 하얀 배경이 채워지게 합니다.
    // 🔥 border-white/10 (다크모드용 선)을 border-zinc-200 (화이트모드용 선)으로 변경
    <footer className="w-full bg-white text-zinc-500 border-t border-zinc-200 pt-32 pb-12 px-6 md:px-10 text-xs font-light tracking-wide">
      <div className="max-w-[1400px] mx-auto flex flex-col gap-10">
        
        {/* 1. 정책 링크들 */}
        <div className="flex flex-wrap gap-6 uppercase tracking-widest text-[10px]">
          <Link href="/policies/terms-of-service" className="hover:text-black transition-colors">Terms of Service</Link>
          <Link href="/policies/privacy-policy" className="hover:text-black transition-colors">Privacy Policy</Link>
          <Link href="/policies/refund-policy" className="hover:text-black transition-colors">Refund Policy</Link>
          <Link href="/policies/shipping-policy" className="hover:text-black transition-colors">Shipping Policy</Link>
          <Link href="/policies/contact" className="hover:text-black transition-colors">Contact</Link>
        </div>

        {/* 2. 법적 필수 표기 사항 */}
        <div className="flex flex-col gap-2 text-zinc-500 leading-relaxed">
          <p>
            {/* 🔥 화이트 배경에 맞게 폰트 컬러를 조금 더 진하게(zinc-800) 수정 */}
            <strong className="font-medium text-zinc-800">비전포비저너리(V4V)</strong>
          </p>
          <p>
            대표: [안세웅] | 사업자등록번호: [501-07-57403] | 통신판매업신고: [발급 대기 중...]
          </p>
          <p>
            주소: [경기도 용인시 기흥구 금화로 11번길 10, 303동 8층] | 고객센터: [010-5634-8804]
          </p>
          <p>
            개인정보보호책임자: [안세웅] | 호스팅 제공자: Shopify Inc.
          </p>
        </div>

        {/* 3. 저작권 표기 */}
        {/* 🔥 여기의 구분선도 border-white/5 에서 border-zinc-200으로 변경하여 잘 보이게 처리 */}
        <div className="pt-8 border-t border-zinc-200 text-zinc-400 flex justify-between items-center">
          <span>© {new Date().getFullYear()} VISION FOR VISIONARY. All rights reserved.</span>
        </div>
      </div>
    </footer>
  );
}