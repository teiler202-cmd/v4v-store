import Link from 'next/link';

/** 없는 주소로 들어왔을 때 — 검색엔진에도 404로 정확히 알려집니다. */
export default function NotFound() {
  return (
    <div className="flex min-h-[70vh] w-full flex-col items-center justify-center gap-6 bg-paper px-6 text-center text-ink">
      <p className="font-mono text-[9px] uppercase tracking-[0.26em] text-ash">404</p>
      <p className="max-w-[36ch] text-[13px] leading-relaxed text-ink">
        찾으시는 페이지가 없습니다.
      </p>
      <Link
        href="/"
        className="border-b border-ink pb-1 font-mono text-[9px] uppercase tracking-[0.24em] text-ink transition-opacity duration-300 hover:opacity-45"
      >
        Back to shop
      </Link>
    </div>
  );
}
