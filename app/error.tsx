'use client';

import { useEffect } from 'react';

/**
 * 페이지를 그리다 문제가 생겼을 때 보여줄 화면.
 *
 * 이게 없으면 Next의 기본 오류 화면(개발자용 문구)이 손님에게 그대로 보입니다.
 * 그리고 이 안전망이 있어야, 데이터 요청 실패를 조용히 삼키는 대신
 * 정직하게 알리고 다시 시도하게 만들 수 있습니다.
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[page]', error);
  }, [error]);

  return (
    <div className="flex min-h-[70vh] w-full flex-col items-center justify-center gap-6 bg-paper px-6 text-center text-ink">
      <p className="font-mono text-[9px] uppercase tracking-[0.26em] text-ash">
        Something went wrong
      </p>
      <p className="max-w-[36ch] text-[13px] leading-relaxed text-ink">
        화면을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.
      </p>
      <button
        onClick={reset}
        className="border-b border-ink pb-1 font-mono text-[9px] uppercase tracking-[0.24em] text-ink transition-opacity duration-300 hover:opacity-45"
      >
        Try again
      </button>
    </div>
  );
}
