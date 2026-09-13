import Link from 'next/link';
import { currentMember } from '@/lib/ops/auth';
import { briefing, cascadeBoard, getSetting, memoBoard } from '@/lib/ops/queries';
import { dueWord, humanDate, todayKST, won } from '@/lib/ops/signals';
import Cascade from './Cascade';
import Memo from './Memo';

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
 * 지금은 한 화면입니다. 가운데에 비전에서 오늘까지 흐르는 줄기가 있고,
 * 오른쪽에 오늘의 숫자와 쪽지가 있습니다. 표는 위 막대에 늘 있습니다.
 */
export default async function BoardPage() {
  const today = todayKST();

  /**
   * 하나씩 묻습니다 — Promise.all 이 아닙니다.
   *
   * 다섯을 동시에 물으면 접속 다섯 개를 한꺼번에 쥡니다. Supabase 의 풀러는
   * 그 접속을 프로젝트 전체가 나눠 쓰기 때문에, 화면 하나가 그만큼을 잡으면
   * 다음 질의가 오류 없이 멈춰 섭니다. 차례로 물으면 접속은 늘 하나이고,
   * 다섯을 다 합쳐도 눈에 띄지 않는 시간입니다 (전부 인덱스를 타는 질의입니다).
   */
  const tree = await cascadeBoard();
  const brief = await briefing();
  const memos = await memoBoard();
  const member = await currentMember();
  const philosophy = await getSetting('philosophy');

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

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {/* ── 철학 — 데이터가 아니라 기준입니다 ─────────────────────────────── */}
      <header className="flex shrink-0 flex-col items-start gap-x-5 gap-y-1.5 border-b border-line-soft pb-3 sm:flex-row">
        <div className="min-w-0 flex-1">
          <p className="font-mono text-[8px] uppercase tracking-[0.22em] text-ash">Philosophy</p>
          {philosophy ? (
            <div className="mt-1">
              {philosophy.split('\n').filter(Boolean).map((line, index) => (
                <p
                  key={line}
                  className={`break-keep font-serif-ko leading-[1.6] ${
                    index === 0 ? 'text-[13px] text-ink' : 'text-[11.5px] text-ash'
                  }`}
                >
                  {line}
                </p>
              ))}
            </div>
          ) : (
            <p className="mt-1 font-mono text-[10px] text-ash">
              아직 비어 있습니다 — 이 보드가 무엇을 위해 도는지 한 줄로 적어 두세요.
            </p>
          )}
        </div>

        <div className="shrink-0 sm:text-right">
          <p className="font-mono text-[9px] uppercase tracking-[0.16em] text-ash">
            {humanDate(today, today)}
          </p>
          <p className="mt-0.5 max-w-[280px] truncate font-mono text-[10.5px] text-ink sm:mt-1">
            {urgent ? `${urgent.title} — ${dueWord(urgent.due, today)}` : '급한 것 없음'}
          </p>
        </div>
      </header>

      {/* ── 흐름 + 오늘 ──────────────────────────────────────────────────── */}
      <div className="mt-3.5 flex flex-1 flex-col gap-4 lg:min-h-0 lg:flex-row lg:gap-6">
        <Cascade tree={tree} today={today} />

        <aside className="flex w-full shrink-0 flex-col gap-3 pb-2 lg:w-[268px] lg:overflow-y-auto lg:pb-0">
          <section className="rounded-[10px] border border-line bg-paper px-3.5 py-3">
            <p className="font-mono text-[8px] uppercase tracking-[0.22em] text-ash">Today</p>
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
            <Link
              href="/ops/tasks"
              className="mt-2 inline-block font-mono text-[9px] text-ash transition-colors hover:text-ink"
            >
              할 일 전체 →
            </Link>
          </section>

          {/* 메모 — 임시 저장소입니다. 남을 것은 할 일·목표·작업물로 옮깁니다. */}
          {memos.map((memo) => (
            <Memo
              key={memo.member_id}
              name={memo.name}
              body={memo.body}
              mine={memo.member_id === member?.id}
            />
          ))}
        </aside>
      </div>
    </div>
  );
}
