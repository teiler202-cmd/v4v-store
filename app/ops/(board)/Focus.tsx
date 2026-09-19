'use client';

import Link from 'next/link';
import { useState, useTransition } from 'react';
import { dropFocus, pickFocus } from '../actions';
import { buildParty, type FocusBoard, type Player, type PoolTask } from '@/lib/ops/focus';
import { dueWord, FOCUS_SLOTS } from '@/lib/ops/signals';
import Memo from './Memo';
import TaskStatus from './TaskStatus';

/**
 * 상태창 — 지금 누가 무엇을 잡고 있는가.
 *
 * 게임에서 파티원의 체력과 지금 쓰는 기술이 늘 한쪽에 떠 있는 것과 같은 자리입니다.
 * 서로에게 "지금 뭐 해?" 라고 묻지 않으려고 만들었습니다. 잡으면 상대 화면에
 * 나타나고(Live.tsx 가 몇십 초마다 맞춥니다), 끝내면 그 자리에서 사라집니다.
 *
 * 규칙은 하나입니다 — **늘 셋을 쥐고 있을 것.** 하나를 끝내면 칸이 비고,
 * 빈 칸은 점선으로 남아 눈에 걸립니다. 채우기 전에는 그 사람의 줄이 완성되지 않습니다.
 *
 * 분야는 능력치입니다. 끝낸 할 일이 그 분야에 쌓이고, 쌓인 만큼 레벨이 오릅니다.
 * 어느 분야가 비어 있는지가 그 사람이 다음에 무엇을 배워야 하는지이기도 합니다.
 *
 * ── 한 사람에 한 칸 ──────────────────────────────────────────────────────
 * 예전에는 '파티' 한 카드 안에 두 사람이 줄로 쌓이고, 쪽지는 저 아래 따로
 * 떠 있었습니다. 한 사람을 보려면 두 군데를 봐야 했던 셈입니다.
 *
 * 지금은 사람이 곧 칸입니다. 그 사람의 레벨·잡은 일·능력치·쪽지가 한 칸에
 * 모이고, 두 칸이 오른쪽을 위아래 반씩(5:5) 나눠 씁니다. 칸의 높이는 서로
 * 같습니다 — 누구의 칸이 더 큰 화면이 되지 않게.
 *
 * 칸 안에서 스크롤은 가운데(잡은 일·능력치)에서만 일어납니다. 이름줄은 위에,
 * 쪽지는 아래에 못 박혀 있어서 아무리 내려도 '누구의 칸인지'와 '말을 남기는 자리'는
 * 늘 보입니다.
 */
export default function Focus({
  board, notes, me, today,
}: {
  board: FocusBoard;
  /** 사람별 쪽지 — memoBoard() 가 주는 그대로입니다 */
  notes: { member_id: string; body: string }[];
  me: string | null;
  today: string;
}) {
  const party = buildParty(board);
  const [picking, setPicking] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const [pending, start] = useTransition();

  function pick(taskId: string) {
    start(async () => {
      const result = await pickFocus(taskId);
      if (!result.ok) { setNote(result.message); return; }
      setNote(null);
      setPicking(false);
    });
  }

  function drop(taskId: string) {
    start(async () => {
      const result = await dropFocus(taskId);
      if (!result.ok) setNote(result.message);
    });
  }

  if (party.length === 0) {
    return (
      <section className="rounded-[10px] border border-line bg-paper px-3.5 py-3">
        <p className="font-mono text-[10px] text-ash">사람이 없습니다.</p>
      </section>
    );
  }

  return (
    /**
     * `lg:flex-1` 로 오른쪽에 남은 높이를 전부 받고, 칸마다 `lg:basis-0` 을 줘서
     * 그 높이를 사람 수로 똑같이 나눕니다 — 둘이면 5:5 입니다. 내용이 많은 칸이
     * 더 커지지 않게 basis 를 0 으로 못 박는 것이 핵심입니다.
     *
     * 좁은 화면(lg 아래)에서는 나누지 않습니다. 세로로 반씩 자르면 둘 다 못 읽습니다.
     */
    <div className="flex flex-col gap-3 lg:min-h-0 lg:flex-1">
      {party.map((player) => (
        <Pane
          key={player.id}
          player={player}
          mine={player.id === me}
          body={notes.find((row) => row.member_id === player.id)?.body ?? ''}
          today={today}
          pending={pending}
          picking={picking && player.id === me}
          warning={player.id === me ? note : null}
          onOpen={() => { setNote(null); setPicking(true); }}
          onClose={() => setPicking(false)}
          onPick={pick}
          onDrop={drop}
          pool={board.pool}
        />
      ))}
    </div>
  );
}

/* ── 한 사람 = 한 칸 ────────────────────────────────────────────────────── */

function Pane({
  player, mine, body, today, pending, picking, pool, warning,
  onOpen, onClose, onPick, onDrop,
}: {
  player: Player;
  mine: boolean;
  body: string;
  today: string;
  pending: boolean;
  picking: boolean;
  pool: PoolTask[];
  /** 잡기·놓기가 거절당했을 때의 말 — 그 사람의 칸 안에서만 보입니다 */
  warning: string | null;
  onOpen: () => void;
  onClose: () => void;
  onPick: (taskId: string) => void;
  onDrop: (taskId: string) => void;
}) {
  return (
    <section className="flex min-h-0 flex-col overflow-hidden rounded-[10px] border border-line bg-paper lg:flex-1 lg:basis-0">
      {/* ── 이름 · 레벨 · 오늘 얻은 것 — 못 박혀 있습니다 ──────────────── */}
      <div className="shrink-0 border-b border-line-soft px-3.5 py-2.5">
        <div className="flex items-baseline gap-1.5">
          <span className="truncate text-[11.5px] font-medium text-ink">{player.name}</span>
          <span className="shrink-0 font-mono text-[8.5px] uppercase tracking-[0.1em] text-ash">
            Lv.{player.level.level}
          </span>
          {mine ? (
            <span className="shrink-0 rounded-full bg-ink px-1.5 py-[1px] font-mono text-[7.5px] text-paper">
              나
            </span>
          ) : null}
          <span className="ml-auto shrink-0 font-mono text-[8.5px] tabular-nums text-ash">
            {player.exp} EXP
            {player.todayExp ? <span className="text-ink"> +{player.todayExp}</span> : null}
          </span>
        </div>

        {/* 다음 레벨까지 */}
        <div className="mt-1 h-[3px] w-full overflow-hidden rounded-full bg-ink/[0.08]">
          <div
            className="h-full rounded-full bg-ink transition-all duration-[900ms] ease-[cubic-bezier(0.16,1,0.3,1)]"
            style={{ width: `${player.level.pct}%` }}
          />
        </div>
      </div>

      {/* ── 잡은 일 · 능력치 — 칸 안에서 여기만 흐릅니다 ────────────────── */}
      <div className="min-h-0 flex-1 overflow-y-auto px-3.5 py-2.5">
        {/* 세 칸 */}
        <ul className="flex flex-col gap-1">
          {player.slots.map((slot) => (
            <li
              key={slot.task_id}
              className="flex items-center gap-1.5 rounded-[7px] border border-line-soft bg-mist/70 py-1 pl-1.5 pr-1"
            >
              <TaskStatus id={slot.task_id} status={slot.status} />
              <Link href={`/ops/tasks/${slot.task_id}`} className="min-w-0 flex-1">
                <span className="block truncate text-[11px] leading-[1.4] text-ink">{slot.title}</span>
                <span className="block truncate font-mono text-[8px] leading-[1.5] text-ash">
                  {[slot.field, slot.due ? dueWord(slot.due, today) : null, slot.goal_title]
                    .filter(Boolean).join(' · ')}
                </span>
              </Link>
              {mine ? (
                <button
                  type="button"
                  aria-label="손 떼기"
                  title="손 떼기 (할 일은 그대로 남습니다)"
                  disabled={pending}
                  onClick={() => onDrop(slot.task_id)}
                  className="shrink-0 px-1 font-mono text-[10px] leading-none text-ash transition-colors hover:text-ink"
                >
                  ×
                </button>
              ) : null}
            </li>
          ))}

          {/* 빈 칸 — 채우기 전에는 이 줄이 끝나지 않습니다 */}
          {Array.from({ length: player.short }).map((_, index) =>
            mine ? (
              <li key={`gap-${index}`}>
                <button
                  type="button"
                  onClick={onOpen}
                  className="flex w-full items-center gap-1.5 rounded-[7px] border border-dashed border-ink/30 px-2 py-[7px] text-left font-mono text-[9px] text-ash transition-colors hover:border-ink hover:text-ink"
                >
                  <span className="text-[11px] leading-none">+</span>
                  {index === 0 ? '비었습니다 — 하나 더 잡으세요' : '한 칸 더'}
                </button>
              </li>
            ) : (
              <li
                key={`gap-${index}`}
                className="rounded-[7px] border border-dashed border-line px-2 py-[7px] font-mono text-[9px] text-ash/60"
              >
                빈 칸
              </li>
            )
          )}
        </ul>

        {mine && player.short === 0 && player.slots.length >= FOCUS_SLOTS ? (
          <button
            type="button"
            onClick={onOpen}
            className="mt-1 font-mono text-[8.5px] text-ash transition-colors hover:text-ink"
          >
            + 한 칸 더
          </button>
        ) : null}

        {picking ? (
          <Picker pool={pool} today={today} pending={pending} onPick={onPick} onClose={onClose} />
        ) : null}

        {warning ? (
          <p role="status" className="mt-2 font-mono text-[9px] leading-[1.6] text-[#b42318]">
            {warning}
          </p>
        ) : null}

        <Stats player={player} />
      </div>

      {/* ── 쪽지 — 바닥에 못 박혀 있습니다 ──────────────────────────────── */}
      <Memo body={body} mine={mine} />
    </section>
  );
}

/* ── 고르기 ─────────────────────────────────────────────────────────────── */

/**
 * 빈 칸을 채울 할 일 고르기.
 *
 * 이미 누가 쥐고 있는 것과 끝난 것은 목록에 없습니다(queries.ts 의 pool) —
 * 고를 수 없는 것을 보여 주고 누른 뒤에 거절하는 것보다 낫습니다.
 */
function Picker({
  pool, today, pending, onPick, onClose,
}: {
  pool: PoolTask[];
  today: string;
  pending: boolean;
  onPick: (taskId: string) => void;
  onClose: () => void;
}) {
  const [query, setQuery] = useState('');
  const shown = query.trim()
    ? pool.filter((task) =>
        (task.title + ' ' + task.goal_title).toLowerCase().includes(query.trim().toLowerCase()))
    : pool;

  return (
    <div className="mt-1.5 rounded-[7px] border border-line bg-mist/50 p-1.5">
      <div className="flex items-center gap-1.5">
        <input
          autoFocus
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="찾기"
          className="min-w-0 flex-1 rounded border border-line bg-paper px-1.5 py-1 font-mono text-[9.5px] outline-none focus:border-ink"
        />
        <button
          type="button"
          onClick={onClose}
          className="shrink-0 px-1 font-mono text-[9px] text-ash hover:text-ink"
        >
          닫기
        </button>
      </div>

      {shown.length === 0 ? (
        <p className="px-1 py-2 font-mono text-[9px] leading-[1.7] text-ash">
          {pool.length === 0 ? '잡을 수 있는 할 일이 없습니다.' : '찾는 것이 없습니다.'}
          <br />
          <Link href="/ops/tasks/new" className="text-ink underline underline-offset-2">
            + 할 일 만들기
          </Link>
        </p>
      ) : (
        /* 칸이 화면 절반이라 목록을 짧게 잡습니다 — 길면 고르는 동안 칸 밖으로 나갑니다 */
        <ul className="mt-1 max-h-[132px] overflow-y-auto">
          {shown.map((task) => (
            <li key={task.id}>
              <button
                type="button"
                disabled={pending}
                onClick={() => onPick(task.id)}
                className="w-full rounded px-1.5 py-1 text-left transition-colors hover:bg-paper disabled:opacity-40"
              >
                <span className="block truncate text-[10.5px] leading-[1.4] text-ink">{task.title}</span>
                <span className="block truncate font-mono text-[8px] leading-[1.5] text-ash">
                  {[task.field, task.due ? dueWord(task.due, today) : '마감 없음', task.goal_title]
                    .filter(Boolean).join(' · ')}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/* ── 능력치 ─────────────────────────────────────────────────────────────── */

/**
 * 분야별로 쌓인 것.
 *
 * 힘·지능·민첩 대신 디자인·생산·콘텐츠…입니다. 끝낸 할 일 하나가 10 —
 * 가중치는 없습니다(signals.ts 의 EXP_PER_TASK). 막대는 다음 레벨까지 남은 길이고,
 * 옆의 숫자는 그 분야에서 끝낸 개수입니다.
 */
function Stats({ player }: { player: Player }) {
  if (player.stats.length === 0) {
    return (
      <p className="mt-2 font-mono text-[8.5px] leading-[1.6] text-ash/70">
        아직 쌓인 분야가 없습니다 — 할 일을 끝내면 그 분야에 쌓입니다.
      </p>
    );
  }

  return (
    <div className="mt-2 grid grid-cols-2 gap-x-2.5 gap-y-[3px]">
      {player.stats.map((stat) => (
        <div
          key={stat.field}
          className="flex items-center gap-1"
          title={`${stat.field} · 끝낸 것 ${stat.done}개 · ${stat.exp} EXP`}
        >
          <span className="w-[30px] shrink-0 truncate font-mono text-[8px] text-ash">
            {stat.field}
          </span>
          <span className="h-[3px] min-w-0 flex-1 overflow-hidden rounded-full bg-ink/[0.08]">
            <span
              className="block h-full rounded-full bg-ink/70 transition-all duration-[900ms] ease-[cubic-bezier(0.16,1,0.3,1)]"
              style={{ width: `${stat.level.pct}%` }}
            />
          </span>
          <span className="shrink-0 font-mono text-[8px] tabular-nums text-ash">
            <span className="text-ash/60">Lv</span>{stat.level.level}
            {stat.today ? <span className="text-ink"> +{stat.today}</span> : null}
          </span>
        </div>
      ))}
    </div>
  );
}
