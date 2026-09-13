import Link from 'next/link';
import { redirect } from 'next/navigation';
import { currentMember } from '@/lib/ops/auth';
import { hasOpsConfig } from '@/lib/ops/db';
import { signOut } from '../actions';
import Nav from './Nav';

/**
 * 로그인한 사람만 지나갑니다.
 *
 * proxy.ts 도 /ops 를 막지만 그건 쿠키가 있는지만 봅니다.
 * 서명이 맞는지, 그런 사람이 정말 있는지는 여기서 확인합니다.
 *
 * ── 껍데기는 움직이지 않습니다 ──────────────────────────────────────────
 * 화면 전체 높이를 이 레이아웃이 잡고(h-[100svh]), 스크롤은 본문 안에서만
 * 일어납니다. 그래서 표를 아무리 내려도 위 막대는 제자리에 있고,
 * 첫 화면(흐름)은 '한 화면에 다 보이는' 약속을 지킬 수 있습니다.
 */
export default async function BoardLayout({ children }: { children: React.ReactNode }) {
  if (!hasOpsConfig()) redirect('/ops/login');

  const member = await currentMember();
  if (!member) redirect('/ops/login');

  return (
    <div className="flex h-[100svh] flex-col overflow-hidden bg-mist text-ink">
      <header className="z-20 shrink-0 border-b border-line-soft bg-paper/85 backdrop-blur-xl">
        <div className="mx-auto flex h-12 w-full max-w-[1480px] items-center gap-4 px-4 md:px-6">
          <Link href="/ops" className="flex shrink-0 items-baseline gap-2">
            <span className="font-grotesk text-[13px] font-bold tracking-[-0.04em]">V4V</span>
            <span className="hidden font-mono text-[8px] uppercase tracking-[0.22em] text-ash sm:inline">
              Board
            </span>
          </Link>

          <span className="hidden h-3.5 w-px shrink-0 bg-line-soft sm:block" />

          <Nav />

          <form action={signOut} className="flex shrink-0 items-center gap-2.5">
            <span className="hidden font-mono text-[9.5px] text-ash md:inline">{member.name}</span>
            <button
              type="submit"
              className="font-mono text-[9.5px] text-ash transition-colors hover:text-ink"
            >
              나가기
            </button>
          </form>
        </div>
      </header>

      <main className="mx-auto flex min-h-0 w-full max-w-[1480px] flex-1 flex-col overflow-y-auto px-4 py-4 md:px-6">
        {children}
      </main>
    </div>
  );
}
