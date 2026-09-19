'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { deleteRow, markDone } from '@/app/ops/actions';
import type { Cascade as Tree, MonthNode, VisionNode, WeekNode } from '@/lib/ops/cascade';
import {
  dueWord, flow, flowStrength, humanDate, monthWord, plusDays, sumFlow, weekRange,
  type Flow,
} from '@/lib/ops/signals';
import Swipe, { type SwipeAction } from './Swipe';
import TaskStatus from './TaskStatus';

/**
 * 흐름 — 이 보드의 첫 화면.
 *
 *   철학 ─ 비전(年) ─ 목표(月) ─ 목표(週) ─ 할 일(日)
 *
 * 네 층을 따로 스크롤해서 보면 매번 머릿속에서 다시 이어 붙여야 합니다.
 * 그래서 한 화면에 넷을 세로로 쌓고, 사이사이에 **관**을 놓았습니다.
 * 관은 아래 층이 끝낸 만큼 차오릅니다 — 주 목표를 60% 끝냈으면
 * 월과 주 사이의 관이 60까지 차고, 그만큼 굵어지고, 그만큼 빨리 흐릅니다.
 *
 * 고르는 것은 하나뿐입니다. 비전을 고르면 그 아래 달이, 달을 고르면 그 주가,
 * 주를 고르면 그 날의 할 일이 따라옵니다. 한 번에 한 줄기만 봅니다 —
 * 세 줄기를 동시에 펼치면 그건 다시 표입니다.
 */

const EASE = 'cubic-bezier(0.16,1,0.3,1)';

/**
 * 한 줄(또는 한 칸)을 옆으로 밀면 나오는 것 — 완료 · 수정 · 삭제.
 *
 * 세 표가 '끝났다'를 다르게 부릅니다(비전은 달성, 나머지는 완료). 그 차이는
 * 서버가 압니다(actions.ts 의 markDone) — 화면은 무엇을 밀었는지만 넘깁니다.
 *
 * 삭제만 한 번 묻습니다. 끝난 행은 지우지 않는 것이 이 보드의 규칙이라,
 * 여기서 지우는 것은 '잘못 만든 행'뿐이어야 합니다.
 */
function rowActions(table: 'visions' | 'goals' | 'tasks', id: string, title: string): SwipeAction[] {
  return [
    {
      key: 'done',
      glyph: '✓',
      label: table === 'visions' ? '달성' : '완료',
      run: () => markDone(table, id),
    },
    { key: 'edit', glyph: '✎', label: '수정', href: `/ops/${table}/${id}` },
    {
      key: 'delete',
      glyph: '×',
      label: '삭제',
      tone: 'danger',
      confirm: `"${title}" 을(를) 지웁니다. 되돌릴 수 없습니다.`,
      run: () => deleteRow(table, id),
    },
  ];
}

/** 비전 하나로 취급하는 '비전 없는 목표' 묶음 */
const LOOSE = '__loose';

export default function Cascade({ tree, today }: { tree: Tree; today: string }) {
  const [pick, setPick] = useState<{ vision?: string; month?: string; week?: string }>({});

  const years = useMemo<VisionNode[]>(() => {
    const list = [...tree.visions];
    if (tree.loose.length) {
      list.push({
        id: LOOSE,
        title: '비전 없는 목표',
        one_liner: '어느 비전으로도 흐르지 않습니다. 숨기지 않고 그대로 둡니다.',
        metric: null, target: null, current: null, due: null, status: '—',
        flow: sumFlow(tree.loose.map((m) => m.flow)),
        months: tree.loose,
      });
    }
    return list;
  }, [tree]);

  /**
   * 고른 것이 사라졌으면(다른 비전으로 옮겼거나, 방금 지웠거나) 첫 번째로 되돌립니다.
   * 상태를 따로 고쳐 주는 효과(useEffect)를 두지 않습니다 — 그리는 순간 계산하면
   * '한 박자 늦게 맞는' 화면이 아예 생기지 않습니다.
   */
  const vision = years.find((v) => v.id === pick.vision) ?? years[0] ?? null;
  const months = vision?.months ?? [];
  const month = months.find((m) => m.id === pick.month) ?? months[0] ?? null;

  /**
   * 주 목표에 매달지 않고 달에 바로 붙은 할 일도 한 칸을 받습니다.
   * 안 보여 주면 영원히 정리되지 않고, 아래 층 숫자와도 어긋납니다.
   */
  const weeks = useMemo<WeekNode[]>(() => {
    if (!month) return [];
    if (!month.tasks.length) return month.weeks;
    return [
      ...month.weeks,
      {
        id: `${month.id}:direct`,
        title: '주에 매달지 않은 할 일',
        done_when: null,
        area: month.area,
        status: '—',
        due: null,
        flow: flow(month.tasks.filter((t) => t.status === '완료').length, month.tasks.length),
        tasks: month.tasks,
      },
    ];
  }, [month]);

  const week = weeks.find((w) => w.id === pick.week) ?? weeks[0] ?? null;

  /* ── 관 세 개 ─────────────────────────────────────────────────────────── */
  const yearToMonth = vision?.flow ?? flow(0, 0);
  /**
   * 월↔주 관은 주 목표들의 진행을 봅니다.
   * 다만 주 목표는 있는데 그 아래 할 일이 아직 하나도 없으면 '할 일 없음'만 남습니다 —
   * 달에 붙은 할 일 여섯 개를 눈앞에 두고 그렇게 말하면 거짓말처럼 들립니다.
   * 그럴 때는 달 전체로 셉니다.
   */
  const monthToWeek = month ? (month.weekFlow.total ? month.weekFlow : month.flow) : flow(0, 0);
  const weekToDay = week?.flow ?? flow(0, 0);

  return (
    // min-w-0 — 옆의 기둥과 나란히 설 때 안의 가로 줄(Rail)이 줄기를 밀어내지 않게
    <div className="flex min-w-0 flex-col gap-0 lg:min-h-0 lg:flex-1">
      {/* ── 年 ─────────────────────────────────────────────────────────── */}
      <Band glyph="年" word="비전" hint="연 단위 · 2–3개를 넘기지 않습니다" href="/ops/visions">
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {years.map((item) => (
            <Card
              key={item.id}
              selected={item.id === vision?.id}
              onSelect={() => setPick({ vision: item.id })}
              flow={item.flow}
              eyebrow={item.due ? humanDate(item.due, today) : '기한 없음'}
              title={item.title}
              meta={[
                `목표 ${item.months.length}`,
                item.current ? `지금 ${item.current}` : null,
              ]}
              // '비전 없는 목표'는 진짜 행이 아닙니다 — 끝내거나 지울 것이 없습니다.
              actions={item.id === LOOSE ? undefined : rowActions('visions', item.id, item.title)}
            />
          ))}
          {years.length === 0 ? <Empty>비전이 없습니다.</Empty> : null}
        </div>
      </Band>

      <Pipe from="비전" to="이 달" flow={yearToMonth} />

      {/* ── 月 ─────────────────────────────────────────────────────────── */}
      <Band
        glyph="月"
        word="달 목표"
        hint={vision ? `${vision.title} 아래 ${months.length}개` : undefined}
        href="/ops/goals"
        add={vision && vision.id !== LOOSE
          ? { href: `/ops/goals/new?horizon=월&vision_id=${vision.id}`, label: '달 목표' }
          : undefined}
      >
        {months.length === 0 ? (
          <Empty>이 비전을 향하는 달 목표가 아직 없습니다.</Empty>
        ) : (
          <Rail>
            {months.map((item) => (
              <Card
                key={item.id}
                wide
                selected={item.id === month?.id}
                onSelect={() => setPick({ vision: vision?.id, month: item.id })}
                flow={item.flow}
                eyebrow={[item.area, monthWord(item.due, today) ?? '기한 없음'].filter(Boolean).join(' · ')}
                title={item.title}
                meta={[
                  item.status,
                  item.weeks.length ? `주 ${item.weeks.length}` : null,
                ]}
                actions={rowActions('goals', item.id, item.title)}
              />
            ))}
          </Rail>
        )}
      </Band>

      <Pipe
        from="이 달"
        to="이번 주"
        flow={monthToWeek}
        note={month && month.weekFlow.total === 0 ? '주 목표에 달린 할 일이 없어 달 전체로 셉니다' : undefined}
      />

      {/* ── 週 ─────────────────────────────────────────────────────────── */}
      <Band
        glyph="週"
        word="주 목표"
        hint={month ? `${month.title} 아래` : undefined}
        href="/ops/goals"
        add={month
          ? {
              href: `/ops/goals/new?horizon=주&parent_id=${month.id}${
                vision && vision.id !== LOOSE ? `&vision_id=${vision.id}` : ''
              }${month.area ? `&area=${encodeURIComponent(month.area)}` : ''}`,
              label: '주 목표',
            }
          : undefined}
      >
        {weeks.length === 0 ? (
          <Empty>
            이 달을 이번 주 크기로 쪼개면 여기에 놓입니다.
          </Empty>
        ) : (
          <Rail>
            {weeks.map((item) => (
              <Card
                key={item.id}
                wide
                selected={item.id === week?.id}
                onSelect={() => setPick({ vision: vision?.id, month: month?.id, week: item.id })}
                flow={item.flow}
                eyebrow={item.due ? dueWord(item.due, today) || humanDate(item.due, today) : '기한 없음'}
                title={item.title}
                meta={[item.status === '—' ? null : item.status, `할 일 ${item.tasks.length}`]}
                actions={item.id.endsWith(':direct')
                  ? undefined
                  : rowActions('goals', item.id, item.title)}
              />
            ))}
          </Rail>
        )}
      </Band>

      <Pipe from="이번 주" to="오늘" flow={weekToDay} />

      {/* ── 日 ─────────────────────────────────────────────────────────── */}
      <Day week={week} month={month} today={today} />
    </div>
  );
}

/* ── 층 ─────────────────────────────────────────────────────────────────── */

function Band({
  glyph, word, hint, href, add, children,
}: {
  glyph: string;
  word: string;
  hint?: string;
  href?: string;
  add?: { href: string; label: string };
  children: React.ReactNode;
}) {
  return (
    <section className="grid shrink-0 grid-cols-[38px_minmax(0,1fr)] gap-x-3 md:grid-cols-[54px_minmax(0,1fr)] md:gap-x-4">
      <div className="relative flex flex-col items-center">
        <span className="v4v-jp-serif text-[15px] leading-none text-ink">{glyph}</span>
        {/* 층과 층을 잇는 실 — 관이 없는 자리에서도 줄기가 끊기지 않게 */}
        <span className="absolute inset-x-0 bottom-0 top-6 mx-auto w-px bg-line-soft" />
      </div>

      <div className="min-w-0 pb-2">
        <div className="mb-1.5 flex items-baseline gap-2">
          {href ? (
            <Link href={href} className="font-mono text-[10px] tracking-[0.02em] text-ink hover:underline hover:underline-offset-4">
              {word}
            </Link>
          ) : (
            <span className="font-mono text-[10px] text-ink">{word}</span>
          )}
          {hint ? (
            <span className="truncate font-mono text-[9px] text-ash">{hint}</span>
          ) : null}
          {add ? (
            <Link
              href={add.href}
              className="ml-auto shrink-0 font-mono text-[9px] text-ash transition-colors hover:text-ink"
            >
              + {add.label}
            </Link>
          ) : null}
        </div>
        {children}
      </div>
    </section>
  );
}

/* ── 관 ─────────────────────────────────────────────────────────────────── */

/**
 * 두 층 사이를 잇는 관 한 마디.
 *
 * 차오른 높이 = 아래 층이 끝낸 비율. 굵기·밝기·흐르는 속도가 전부 같은 숫자에서
 * 나옵니다. 숫자를 읽기 전에 눈이 먼저 압니다.
 */
function Pipe({
  from, to, flow: value, note,
}: { from: string; to: string; flow: Flow; note?: string }) {
  const pct = value.pct;
  const strength = flowStrength(pct);

  return (
    <div className="grid shrink-0 grid-cols-[38px_minmax(0,1fr)] gap-x-3 md:grid-cols-[54px_minmax(0,1fr)] md:gap-x-4">
      <div className="relative h-[32px] md:h-[38px]">
        {/* 관은 비어 있어도 늘 거기 있습니다 — 끊긴 것과 안 흐르는 것은 다릅니다 */}
        <span className="absolute inset-y-0 left-1/2 w-[7px] -translate-x-1/2 rounded-full bg-ink/[0.09]" />
        <span className="absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-line" />
        <span
          className="absolute left-1/2 top-0 -translate-x-1/2 overflow-hidden rounded-full bg-ink transition-all duration-[900ms]"
          style={{
            // 찰수록 굵어집니다 — 다 차면 관을 꽉 채웁니다 (7px)
            height: `${pct ?? 0}%`,
            width: `${2 + strength * 5}px`,
            opacity: pct === null ? 0 : 0.35 + strength * 0.65,
            transitionTimingFunction: EASE,
          }}
        >
          <span
            className="v4v-flow-stream absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-transparent via-paper to-transparent opacity-80"
            style={{ '--flow': strength } as React.CSSProperties}
          />
        </span>
        {/* 관의 끝 — 아래 층으로 들어가는 자리 */}
        <span
          className="absolute bottom-0 left-1/2 h-[3px] w-[3px] -translate-x-1/2 translate-y-[1px] rounded-full bg-ink transition-opacity duration-[900ms]"
          style={{ opacity: 0.12 + strength * 0.88 }}
        />
      </div>

      <div className="flex h-[32px] items-center gap-2 md:h-[38px]">
        <span className="font-mono text-[9px] text-ash">
          {from} <span className="text-ash/50">→</span> {to}
        </span>
        <span
          className="font-mono text-[10px] tabular-nums transition-colors duration-500"
          style={{ color: pct ? `rgba(11,11,11,${0.4 + strength * 0.6})` : undefined }}
        >
          {pct === null ? <span className="text-ash">할 일 없음</span> : `${pct}%`}
        </span>
        {pct !== null ? (
          <span className="font-mono text-[9px] text-ash tabular-nums">
            {value.done}/{value.total}
          </span>
        ) : null}
        {note ? <span className="truncate font-mono text-[9px] text-ash/80">· {note}</span> : null}
      </div>
    </div>
  );
}

/* ── 칸 ─────────────────────────────────────────────────────────────────── */

function Card({
  selected, onSelect, flow: value, eyebrow, title, meta, href, wide, actions,
}: {
  selected: boolean;
  onSelect: () => void;
  flow: Flow;
  eyebrow?: string;
  title: string;
  meta?: (string | null | undefined)[];
  href?: string;
  wide?: boolean;
  /** 옆으로 밀면 나오는 것. 진짜 행이 아닌 칸(비전 없는 목표 등)에는 없습니다 */
  actions?: SwipeAction[];
}) {
  const pct = value.pct;
  const strength = flowStrength(pct);

  const body = (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className="flex w-full flex-col gap-1 px-3 py-2.5 text-left outline-none focus-visible:ring-1 focus-visible:ring-ink/40"
    >
      {eyebrow ? (
        <span className={`truncate font-mono text-[8.5px] uppercase tracking-[0.14em] ${selected ? 'text-ash' : 'text-ash/75'}`}>
          {eyebrow}
        </span>
      ) : null}

      <span className={`line-clamp-2 text-[12.5px] font-medium leading-[1.45] ${selected ? 'text-ink' : 'text-ink/65'}`}>
        {title}
      </span>

      <span className="mt-0.5 flex items-baseline gap-1.5 font-mono text-[9px] text-ash">
        <span className="tabular-nums">{pct === null ? '—' : `${pct}%`}</span>
        {meta?.filter(Boolean).map((item) => (
          <span key={item} className="truncate text-ash/80">· {item}</span>
        ))}
      </span>
    </button>
  );

  return (
    <div
      className={`group relative shrink-0 overflow-hidden rounded-[10px] border transition-all duration-500 ${
        wide ? 'w-[196px]' : ''
      } ${
        selected
          ? 'border-ink/85 bg-paper shadow-[0_1px_3px_rgba(11,11,11,0.06)]'
          : 'border-line bg-paper/55 hover:border-ink/35 hover:bg-paper'
      }`}
      style={{ transitionTimingFunction: EASE }}
    >
      {actions ? (
        // wide 인 칸은 가로로 흐르는 줄 안에 있습니다 — 제스처를 줄과 나눠 씁니다(Swipe.tsx).
        <Swipe actions={actions} rail={wide} stack={wide} handle>{body}</Swipe>
      ) : (
        body
      )}

      {/* 칸 아래 실선 한 줄이 그 칸의 진행입니다 */}
      <span
        className="pointer-events-none absolute inset-x-0 bottom-0 h-[2px] bg-ink transition-all duration-[900ms]"
        style={{
          width: `${pct ?? 0}%`,
          opacity: pct === null ? 0 : 0.2 + strength * 0.8,
          transitionTimingFunction: EASE,
        }}
      />

      {/* 밀어서 여는 칸에는 '수정'이 그 자리에 있습니다 — 화살표를 두 번 두지 않습니다 */}
      {href && !actions ? (
        <Link
          href={href}
          aria-label="자세히"
          className="absolute right-1.5 top-1.5 rounded px-1 font-mono text-[9px] text-ash opacity-0 transition-opacity duration-200 hover:text-ink focus-visible:opacity-100 group-hover:opacity-100"
        >
          ↗
        </Link>
      ) : null}
    </div>
  );
}

/** 가로로 흐르는 칸들 — 많아지면 이 안에서만 밀립니다 */
function Rail({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative -mx-1">
      <div
        // Swipe 가 이 표시를 보고 '여기는 가로로 흐르는 줄'임을 압니다.
        data-rail
        className="flex gap-2 overflow-x-auto px-1 pb-0.5"
        // globals.css 의 `* { scrollbar-width: thin }` 이 유틸리티보다 세서
        // 여기서는 인라인으로 못 박습니다 — 막대가 층 사이 간격을 먹습니다.
        style={{ scrollbarWidth: 'none' }}
      >
        {children}
      </div>
      {/* 오른쪽 끝을 흐리게 — 옆에 더 있다는 말을 글자 없이 합니다 */}
      <span className="pointer-events-none absolute inset-y-0 right-0 w-10 bg-gradient-to-l from-mist to-transparent" />
    </div>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return (
    <p className="rounded-[10px] border border-dashed border-line px-3 py-3 font-mono text-[10px] leading-[1.8] text-ash">
      {children}
    </p>
  );
}

/* ── 日 ─────────────────────────────────────────────────────────────────── */

type Scope = '오늘' | '이번 주' | '전체';

function Day({
  week, month, today,
}: { week: WeekNode | null; month: MonthNode | null; today: string }) {
  const [chosen, setChosen] = useState<Scope | null>(null);
  const tasks = week?.tasks ?? [];
  const weekEnd = weekRange(today).end;

  /** 지난 것은 어느 창에서도 빠지지 않습니다 — 밀린 일이 사라지면 안 됩니다 */
  const counts = {
    오늘: tasks.filter((t) => t.due && t.due <= today).length,
    '이번 주': tasks.filter((t) => t.due && t.due <= weekEnd).length,
    전체: tasks.length,
  };

  /**
   * 아직 고르지 않았다면 **비어 있지 않은 가장 좁은 창**을 폅니다.
   * '이번 주'로 못 박아 두었더니, 마감이 다음 달인 할 일만 있는 목표에서는
   * 빈 화면이 떴습니다 — 할 일이 여섯 개나 있는데도요.
   * 한 번이라도 직접 고르면 그 선택을 지킵니다.
   */
  const scope: Scope = chosen ?? (counts['오늘'] ? '오늘' : counts['이번 주'] ? '이번 주' : '전체');

  const shown = tasks.filter((task) => {
    if (scope === '전체') return true;
    if (!task.due) return false;
    return task.due <= (scope === '오늘' ? today : weekEnd);
  });

  const goalId = week && !week.id.endsWith(':direct') ? week.id : month?.id;

  return (
    <section className="grid min-h-[188px] shrink-0 grid-cols-[38px_minmax(0,1fr)] gap-x-3 md:grid-cols-[54px_minmax(0,1fr)] md:gap-x-4 lg:min-h-[150px] lg:flex-1 lg:shrink">
      <div className="flex flex-col items-center">
        <span className="v4v-jp-serif text-[15px] leading-none text-ink">日</span>
      </div>

      <div className="flex min-h-0 flex-col">
        <div className="mb-1.5 flex items-baseline gap-2">
          <Link href="/ops/tasks" className="font-mono text-[10px] text-ink hover:underline hover:underline-offset-4">
            할 일
          </Link>
          <span className="truncate font-mono text-[9px] text-ash">
            {week ? week.title : '주 목표를 고르면 여기에 나옵니다'}
          </span>

          <div className="ml-auto flex shrink-0 items-center gap-1">
            {(['오늘', '이번 주', '전체'] as Scope[]).map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setChosen(item)}
                aria-pressed={scope === item}
                className={`rounded-full px-2 py-0.5 font-mono text-[9px] transition-colors duration-200 ${
                  scope === item ? 'bg-ink text-paper' : 'text-ash hover:text-ink'
                }`}
              >
                {item} <span className="tabular-nums opacity-60">{counts[item]}</span>
              </button>
            ))}
            {goalId ? (
              <Link
                href={`/ops/tasks/new?goal_id=${goalId}&due=${plusDays(today, 0)}`}
                className="ml-1 shrink-0 font-mono text-[9px] text-ash transition-colors hover:text-ink"
              >
                + 할 일
              </Link>
            ) : null}
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto rounded-[10px] border border-line bg-paper">
          {shown.length === 0 ? (
            <p className="flex h-full items-center justify-center whitespace-pre-line px-6 text-center font-mono text-[10px] leading-[1.9] text-ash">
              {tasks.length === 0
                ? '이 주 목표에 달린 할 일이 없습니다.\n오늘 손댈 수 있는 크기로 하나 적어 두세요.'
                : `${scope}에 해당하는 할 일이 없습니다.`}
            </p>
          ) : (
            <ul className="divide-y divide-line-soft">
              {shown.map((task) => {
                const done = task.status === '완료';
                const late = !done && task.due && task.due < today;
                return (
                  // 세로로 흐르는 목록이라 제스처를 다툴 상대가 없습니다 — 손가락도 받습니다.
                  <li key={task.id} className="v4v-settle">
                    <Swipe actions={rowActions('tasks', task.id, task.title)}>
                      <div className="flex items-center gap-2.5 px-3 py-2">
                        <TaskStatus id={task.id} status={task.status} />
                        <Link href={`/ops/tasks/${task.id}`} className="min-w-0 flex-1">
                          <p
                            className={`truncate text-[12.5px] leading-[1.5] transition-colors duration-300 ${
                              done ? 'text-ash line-through decoration-line' : 'text-ink'
                            }`}
                          >
                            {task.title}
                          </p>
                        </Link>
                        {task.field ? (
                          <span className="hidden shrink-0 font-mono text-[9px] text-ash sm:inline">
                            {task.field}
                          </span>
                        ) : null}
                        <span
                          className={`shrink-0 font-mono text-[9.5px] tabular-nums ${
                            late ? 'text-[#b42318]' : 'text-ash'
                          }`}
                        >
                          {task.due ? dueWord(task.due, today) : '마감 없음'}
                        </span>
                      </div>
                    </Swipe>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}
