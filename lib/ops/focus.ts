/**
 * 지금 누가 무엇을 쥐고 있는가 — 그리고 그동안 무엇을 쌓았는가.
 *
 * cascade.ts 와 같은 자리의 파일입니다: 순수한 계산이고, 데이터베이스도 화면도
 * 모릅니다. 서버가 행을 읽어 여기서 사람별로 묶고, 그 묶음을 화면이 그립니다.
 *
 * ── 세 칸 ────────────────────────────────────────────────────────────────
 * 한 사람은 늘 할 일 셋을 손에 쥡니다. 하나를 끝내면 그 칸이 비고, 빈 칸은
 * 화면에서 눈에 띕니다 — 바로 채우라는 뜻입니다. 넷을 쥐어도 막지 않습니다.
 * 막아야 하는 것은 '아무것도 안 쥐고 있는 상태'지 부지런함이 아닙니다.
 *
 * ── 경험치 ───────────────────────────────────────────────────────────────
 * 분야(디자인·생산·콘텐츠·마케팅·재무·운영·브랜딩)가 곧 능력치입니다.
 * 끝낸 할 일 하나가 그 분야에 10. 저장하지 않습니다 — 끝난 할 일을 셀 때마다
 * 다시 계산합니다. 그래서 숫자와 사실이 어긋날 수 없습니다.
 */

import { expOf, levelOf, FOCUS_SLOTS, type Level } from './signals';

/* ── 데이터베이스에서 오는 모양 ─────────────────────────────────────────── */

export type FocusSlot = {
  member_id: string; task_id: string; picked_at: string;
  title: string; status: string; due: string | null;
  field: string | null; priority: string | null;
  goal_id: string; goal_title: string;
};

/** 한 사람이 한 분야에서 끝낸 할 일 — 경험치의 근거입니다 */
export type FieldExp = { member_id: string; field: string | null; done: number; today: number };

/** 아직 아무도 쥐지 않은 할 일 — 빈 칸을 채울 때 고르는 목록 */
export type PoolTask = {
  id: string; title: string; field: string | null;
  due: string | null; priority: string | null; goal_title: string;
};

export type FocusBoard = {
  members: { id: string; name: string }[];
  slots: FocusSlot[];
  stats: FieldExp[];
  pool: PoolTask[];
};

/* ── 화면이 받는 모양 ───────────────────────────────────────────────────── */

/** 분야가 비어 있는 할 일도 어딘가에는 쌓여야 합니다 */
export const NO_FIELD = '미분류';

export type Stat = {
  field: string;
  done: number;
  today: number;
  exp: number;
  level: Level;
};

export type Player = {
  id: string;
  name: string;
  slots: FocusSlot[];
  stats: Stat[];
  /** 전 분야 합 */
  exp: number;
  todayExp: number;
  level: Level;
  /** 세 칸에서 모자란 수 — 0이면 다 채운 것입니다 */
  short: number;
};

export function buildParty(board: FocusBoard): Player[] {
  return board.members.map((member) => {
    const slots = board.slots
      .filter((slot) => slot.member_id === member.id)
      .sort((a, b) => (a.picked_at < b.picked_at ? -1 : 1));

    const stats: Stat[] = board.stats
      .filter((row) => row.member_id === member.id)
      .map((row) => ({
        field: row.field ?? NO_FIELD,
        done: row.done,
        today: row.today,
        exp: expOf(row.done),
        level: levelOf(expOf(row.done)),
      }))
      // 많이 쌓은 분야가 위로. 같으면 이름순 — 순서가 매번 바뀌면 눈이 못 따라갑니다.
      .sort((a, b) => b.done - a.done || a.field.localeCompare(b.field, 'ko'));

    const done = stats.reduce((sum, stat) => sum + stat.done, 0);
    const today = stats.reduce((sum, stat) => sum + stat.today, 0);

    return {
      id: member.id,
      name: member.name,
      slots,
      stats,
      exp: expOf(done),
      todayExp: expOf(today),
      level: levelOf(expOf(done)),
      short: Math.max(0, FOCUS_SLOTS - slots.length),
    };
  });
}
