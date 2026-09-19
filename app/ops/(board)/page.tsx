import Link from 'next/link';
import { currentMember } from '@/lib/ops/auth';
import { briefing, cascadeBoard, focusBoard, getSetting, memoBoard } from '@/lib/ops/queries';
import { dueWord, humanDate, todayKST, won } from '@/lib/ops/signals';
import { pickVerses } from '@/lib/ops/verses';
import Cascade from './Cascade';
import Focus from './Focus';
import Live from './Live';
import VerseBox from './Verse';

export const metadata = { title: '흐름' };

/** 데이터가 늘 최신이어야 하는 화면입니다 — 캐시하지 않습니다. */
export const dynamic = 'force-dynamic';

/**
 * 보드의 첫 화면.
 *
 * 예전에는 브리핑·철학·할 일·목표·비전·메모가 세로로 길게 이어졌고,
 * 비전을 보려면 스크롤을 끝까지 내려야 했습니다 — 가장 위에 있어야 할 것이
 * 가장 아래 있었던 셈입니다.
 *
 * 지금은 한 화면입니다. 맨 위에 철학과 구절이 크게 있고, 가운데에 비전에서
 * 오늘까지 흐르는 줄기가 있고, 오른쪽은 오늘의 숫자 한 줄과 **사람 칸 둘**입니다.
 * 표는 위 막대에 늘 있습니다.
 *
 * ── 가로 칸의 약속 ───────────────────────────────────────────────────────
 * 옆으로 나뉘는 칸(구절·오른쪽 기둥)에는 `w-full` 을 주지 않습니다.
 *
 * 한 번 크게 깨진 적이 있습니다. `w-full shrink-0` 에 `lg:w-[286px]` 로 너비를
 * 덮어쓰는 방식이었는데, 그 `lg:w-[...]` 한 줄이 (새로 만든 클래스라) 브라우저가
 * 들고 있던 예전 스타일시트에 없었습니다. 덮을 것이 사라지자 칸이 100% 로 부풀고
 * 옆의 `flex-1 min-w-0` 은 0 으로 찌그러져, 철학이 한 줄에 한 낱말씩 쏟아지며
 * 구절과 겹쳐 보였습니다.
 *
 * 세로로 쌓일 때는 stretch 가 알아서 꽉 채웁니다 — `w-full` 은 원래 필요 없었고,
 * 없으면 `lg:w-[...]` 가 빠져도 칸이 제 내용만큼만 차지하고 끝납니다.
 */
export default async function BoardPage() {
  const today = todayKST();

  /**
   * 하나씩 묻습니다 — Promise.all 이 아닙니다.
   *
   * 여섯을 동시에 물으면 접속 여섯 개를 한꺼번에 쥡니다. Supabase 의 풀러는
   * 그 접속을 프로젝트 전체가 나눠 쓰기 때문에, 화면 하나가 그만큼을 잡으면
   * 다음 질의가 오류 없이 멈춰 섭니다. 차례로 물으면 접속은 늘 하나이고,
   * 여섯을 다 합쳐도 눈에 띄지 않는 시간입니다 (전부 인덱스를 타는 질의입니다).
   *
   * ⚠️ 이 화면은 몇십 초마다 스스로 새로 고칩니다(Live.tsx). 여기에 질의를
   *    하나 더하면 그 배수로 늘어납니다. 더하기 전에 기존 질의에 얹을 수 없는지 보세요.
   */
  const tree = await cascadeBoard();
  const brief = await briefing();
  const memos = await memoBoard();
  const party = await focusBoard();
  const member = await currentMember();
  const philosophy = await getSetting('philosophy');

  // 구절은 데이터베이스에 묻지 않습니다 — 저장소 안에 있습니다 (lib/ops/verses.ts).
  const verses = pickVerses(10);

  /**
   * 브리핑 줄. 0인 줄은 지웁니다 — 0을 나열하면 진짜 숫자가 묻힙니다.
   */
  const lines: { label: string; body: string }[] = [];
  const t = brief.tasks;
  const g = brief.goals;
  if (t.overdue || t.today || t.week) {
    lines.push({
      label: '할 일',
      body: [t.overdue && `지남 ${t.overdue}`, t.today && `오늘 ${t.today}`, t.week && `이번 주 ${t.week}`]
        .filter(Boolean).join(' · '),
    });
  }
  if (g.overdue || g.week) {
    lines.push({
      label: '목표',
      body: [g.overdue && `지남 ${g.overdue}`, g.week && `이번 주 기한 ${g.week}`]
        .filter(Boolean).join(' · '),
    });
  }
  if (brief.products.late || brief.products.soon) {
    lines.push({
      label: '스타일',
      body: [brief.products.late && `지연 ${brief.products.late}`,
             brief.products.soon && `2주 내 출시 ${brief.products.soon}`]
        .filter(Boolean).join(' · '),
    });
  }
  if (brief.partners.cold) {
    lines.push({ label: '거래처', body: `2주 넘게 연락 없음 ${brief.partners.cold}` });
  }
  if (brief.money.spentThisMonth) {
    lines.push({
      label: '돈',
      body: `이번 달 ${won(brief.money.spentThisMonth)}` +
        (brief.money.wasteThisMonth ? ` · 낭비 ${won(brief.money.wasteThisMonth)}` : ''),
    });
  }

  // 가장 급한 하나만 이름을 부릅니다. 다섯 개를 부르면 하나도 안 부른 것과 같습니다.
  const urgent = tree.visions
    .flatMap((v) => v.months)
    .flatMap((m) => [...m.tasks, ...m.weeks.flatMap((w) => w.tasks)])
    .filter((task) => task.status !== '완료' && task.due)
    .sort((a, b) => (a.due! < b.due! ? -1 : 1))[0];

  const creed = philosophy?.split('\n').filter(Boolean) ?? [];

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {/* ── 철학 — 데이터가 아니라 기준입니다 ─────────────────────────────── */}
      <header className="flex shrink-0 flex-col gap-3 border-b border-line-soft pb-4 lg:flex-row lg:items-start lg:gap-7">
        <div className="min-w-0 flex-1">
          <p className="font-mono text-[8px] uppercase tracking-[0.22em] text-ash">Philosophy</p>

          {creed.length ? (
            /**
             * 작게 두었더니 아무도 읽지 않았습니다. 막혔을 때 눈이 저절로 가야 하는
             * 문장이라, 이 화면에서 가장 큰 글씨를 줍니다 — 첫 줄이 기준이고
             * 나머지는 그 기준을 푸는 말입니다.
             */
            <div className="mt-2 border-l-2 border-ink/15 pl-3.5 md:pl-4">
              {creed.map((line, index) => (
                <p
                  key={line}
                  className={
                    index === 0
                      ? 'break-keep font-serif-ko text-[17px] leading-[1.55] text-ink md:text-[21px] md:leading-[1.5]'
                      : 'mt-1.5 break-keep font-serif-ko text-[12px] leading-[1.75] text-ash md:text-[13.5px]'
                  }
                >
                  {line}
                </p>
              ))}
            </div>
          ) : (
            <p className="mt-2 font-mono text-[10px] text-ash">
              아직 비어 있습니다 — 이 보드가 무엇을 위해 도는지 한 줄로 적어 두세요.
            </p>
          )}
        </div>

        <VerseBox verses={verses} />
      </header>

      {/* ── 흐름 + 오늘 ──────────────────────────────────────────────────── */}
      <div className="mt-3.5 flex flex-1 flex-col gap-4 lg:min-h-0 lg:flex-row lg:gap-6">
        <Cascade tree={tree} today={today} />

        {/**
          * 오른쪽 기둥 — 오늘 한 줄 + 사람 칸 둘.
          *
          * `lg:min-h-0` 이 있어야 아래의 5:5 가 성립합니다. 이것이 없으면 기둥이
          * 내용만큼 길어지고, 칸들은 나눌 높이를 못 받습니다.
          */}
        <aside className="flex shrink-0 flex-col gap-3 pb-2 lg:min-h-0 lg:w-[300px] lg:pb-0">
          {/* 오늘 — 얇게. 아래 두 칸의 높이를 먹지 않도록 shrink-0 입니다 */}
          <section className="shrink-0 rounded-[10px] border border-line bg-paper px-3.5 py-2.5">
            <div className="flex items-baseline justify-between gap-2">
              <p className="font-mono text-[8px] uppercase tracking-[0.22em] text-ash">Today</p>
              <div className="flex shrink-0 items-baseline gap-2">
                <p className="font-mono text-[9px] uppercase tracking-[0.12em] text-ash">
                  {humanDate(today, today)}
                </p>
                {/* 스스로 새로 고치는 심장 — 화면에 딱 하나만 있으면 됩니다 */}
                <Live />
              </div>
            </div>

            {lines.length === 0 ? (
              <p className="mt-1.5 font-mono text-[10px] text-ash">조용한 날입니다</p>
            ) : (
              <ul className="mt-1.5 flex flex-col gap-1">
                {lines.map((line) => (
                  <li key={line.label} className="flex items-baseline gap-2">
                    <span className="w-[34px] shrink-0 font-mono text-[9px] text-ash">{line.label}</span>
                    <span className="font-mono text-[10px] leading-[1.7] text-ink">{line.body}</span>
                  </li>
                ))}
              </ul>
            )}

            {/* 가장 급한 것 하나 — 예전에는 맨 위 오른쪽에 있던 줄입니다 */}
            <p className="mt-2 truncate border-t border-line-soft pt-2 font-mono text-[10px] text-ink">
              {urgent ? `${urgent.title} — ${dueWord(urgent.due, today)}` : '급한 것 없음'}
            </p>

            <Link
              href="/ops/tasks"
              className="mt-2 inline-block font-mono text-[9px] text-ash transition-colors hover:text-ink"
            >
              할 일 전체 →
            </Link>
          </section>

          {/**
            * 상태 채팅창 — 사람 하나에 칸 하나.
            *
            * 그 사람의 레벨·잡은 일·능력치·쪽지가 한 칸에 모이고, 두 칸이 남은
            * 높이를 5:5 로 나눕니다. 쪽지는 각 칸의 바닥에 붙습니다 — 예전처럼
            * 저 아래 따로 떠 있으면 '누가 한 말인지'를 매번 다시 맞춰 봐야 합니다.
            */}
          <Focus board={party} notes={memos} me={member?.id ?? null} today={today} />
        </aside>
      </div>
    </div>
  );
}
