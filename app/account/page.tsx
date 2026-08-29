import Link from 'next/link';
import { redirect } from 'next/navigation';
import type { Metadata } from 'next';
import AccountDashboard from '@/components/AccountDashboard';
import { getCustomerSession } from '@/app/account/actions';

export const metadata: Metadata = { title: 'My Account' };
export const dynamic = 'force-dynamic';

export default async function AccountPage() {
  const session = await getCustomerSession();

  // 쇼피파이가 잠깐 응답하지 못한 경우 —
  // 로그아웃시키지 않고, 다시 시도할 수 있게만 안내합니다.
  if (session.status === 'error') {
    return (
      <div className="flex min-h-[70vh] w-full flex-col items-center justify-center gap-6 bg-paper px-6 text-center text-ink">
        <p className="font-mono text-[9px] uppercase tracking-[0.26em] text-ash">
          Temporarily unavailable
        </p>
        <p className="max-w-[34ch] text-[13px] leading-relaxed text-ink">
          계정 정보를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.
        </p>
        <Link
          href="/account"
          className="border-b border-ink pb-1 font-mono text-[9px] uppercase tracking-[0.24em] text-ink transition-opacity duration-300 hover:opacity-45"
        >
          Retry
        </Link>
      </div>
    );
  }

  // 로그인하지 않았거나 토큰이 만료됐다면 로그인 화면으로 보냅니다.
  if (session.status !== 'ok') redirect('/account/login?next=%2Faccount');

  return (
    <div className="min-h-[70vh] w-full bg-paper text-ink">
      <AccountDashboard customer={session.customer} />
    </div>
  );
}
