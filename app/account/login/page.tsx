import { redirect } from 'next/navigation';
import type { Metadata } from 'next';
import AuthPanel from '@/components/AuthPanel';
import { getCustomerSession } from '@/app/account/actions';

export const metadata: Metadata = { title: 'Account' };
export const dynamic = 'force-dynamic';

/**
 * 로그인 후 돌아갈 주소를 '내부 경로'로만 좁힙니다.
 *
 * 앞자리 문자만 보는 검사(`/`로 시작하는가)는 뚫립니다 —
 * 브라우저는 주소에서 백슬래시를 슬래시처럼 읽기 때문에
 * `/\evil.com` 이 `https://evil.com/` 으로 해석됩니다.
 * 그래서 문자열 대신 URL 파서에게 출처를 물어봅니다.
 */
function safeNext(raw?: string) {
  if (!raw) return '/account';
  try {
    const url = new URL(raw, 'https://internal.invalid');
    // 절대주소·프로토콜상대주소(//evil.com)·백슬래시 우회가 여기서 전부 걸립니다.
    if (url.origin !== 'https://internal.invalid') return '/account';
    return url.pathname + url.search + url.hash;
  } catch {
    return '/account';
  }
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;

  // 쿠키가 '있는지'가 아니라 '살아 있는지'를 봅니다.
  // 존재 여부만 보면, 만료된 쿠키를 든 사용자가 /account 로 튕겼다가
  // 다시 여기로 돌아오는 무한 왕복에 갇힙니다.
  const session = await getCustomerSession();
  if (session.status === 'ok') redirect('/account');

  const destination = safeNext(next);

  return (
    <div className="flex min-h-[70vh] w-full flex-col items-center bg-paper px-6 pb-32 pt-20 text-ink md:pt-28">
      <header className="mb-14 flex flex-col items-center text-center md:mb-16">
        <h1 className="font-grotesk text-[16px] font-bold uppercase tracking-[0.2em] text-ink md:text-[22px] md:tracking-[0.18em]">
          ( Account )
        </h1>
        <p className="mt-4 font-mono text-[8.5px] uppercase tracking-[0.26em] text-ash md:text-[9.5px]">
          Vision in Motion, Performance in Action
        </p>
      </header>

      <AuthPanel next={destination} />
    </div>
  );
}
