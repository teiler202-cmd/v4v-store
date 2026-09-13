/**
 * 한 줄기 — 철학에서 오늘까지.
 *
 *   철학 ─ 비전(연) ─ 목표(월) ─ 목표(주) ─ 할 일(일)
 *
 * 보드의 첫 화면이 보여 주는 것은 표가 아니라 이 흐름입니다. 표는 그 아래에
 * 늘 있지만, 아침에 열었을 때 가장 먼저 답해야 하는 질문은 하나입니다 —
 * **오늘 하는 이 일이 어느 비전으로 흘러가는가.**
 *
 * 이 파일은 순수한 계산입니다 (데이터베이스도, 화면도 모릅니다).
 * 서버가 행을 읽어 여기서 나무로 세우고, 그 나무를 화면이 그립니다.
 *
 * 진행률은 네 층 모두 **같은 규칙 하나**입니다 — 그 아래 달린 할 일 중 끝난 비율.
 * 층마다 다른 계산을 쓰면 60%가 무슨 60%인지 매번 다시 물어야 합니다.
 */

import { type Flow, flow, sumFlow } from './signals';

/* ── 데이터베이스에서 오는 모양 ─────────────────────────────────────────── */

export type VisionRow = {
  id: string; title: string; one_liner: string | null; metric: string | null;
  target: string | null; current: string | null; due: string | null; status: string;
};

export type GoalRow = {
  id: string; title: string; done_when: string | null; area: string | null;
  status: string; priority: string | null; due: string | null;
  horizon: string; parent_id: string | null; vision_id: string | null;
};

export type TaskRow = {
  id: string; title: string; status: string; due: string | null;
  field: string | null; priority: string | null; goal_id: string;
};

/* ── 화면이 받는 모양 ───────────────────────────────────────────────────── */

export type DayTask = TaskRow & { goal_title: string };

export type WeekNode = {
  id: string; title: string; done_when: string | null; area: string | null;
  status: string; due: string | null;
  /** 이 주 목표에 달린 할 일 */
  flow: Flow;
  tasks: DayTask[];
};

export type MonthNode = {
  id: string; title: string; done_when: string | null; area: string | null;
  status: string; priority: string | null; due: string | null;
  /** 이 달 아래 전부 (주 목표의 할 일 + 이 달에 바로 달린 할 일) */
  flow: Flow;
  /** 주 목표들만 모은 것 — 월↔주 파이프의 세기 */
  weekFlow: Flow;
  weeks: WeekNode[];
  /** 주 목표를 거치지 않고 달에 바로 달린 할 일 */
  tasks: DayTask[];
};

export type VisionNode = {
  id: string; title: string; one_liner: string | null; metric: string | null;
  target: string | null; current: string | null; due: string | null; status: string;
  /** 이 비전 아래 전부 — 연↔월 파이프의 세기 */
  flow: Flow;
  months: MonthNode[];
};

export type Cascade = {
  visions: VisionNode[];
  /**
   * 비전에 매달리지 않은 목표.
   *
   * 숨기지 않습니다. 어느 비전으로도 흘러가지 않는 일이 있다면 그건
   * 고쳐야 할 사실이지 감출 사실이 아닙니다.
   */
  loose: MonthNode[];
};

/* ── 정렬 ───────────────────────────────────────────────────────────────── */

const GOAL_STATUS_ORDER: Record<string, number> = { 진행중: 0, 대기: 1, 보류: 2, 완료: 3 };
const GOAL_PRIORITY_ORDER: Record<string, number> = { 지금: 0, '이번 분기': 1, 언젠가: 2 };
const TASK_PRIORITY_ORDER: Record<string, number> = { 높음: 0, 보통: 1, 낮음: 2 };

/** 빈 값은 언제나 뒤로 — 마감 없는 것이 맨 위에 오면 진짜 급한 것이 가려집니다 */
function byDue(a: string | null, b: string | null): number {
  if (a === b) return 0;
  if (!a) return 1;
  if (!b) return -1;
  return a < b ? -1 : 1;
}

function goalOrder(a: GoalRow, b: GoalRow): number {
  const status = (GOAL_STATUS_ORDER[a.status] ?? 9) - (GOAL_STATUS_ORDER[b.status] ?? 9);
  if (status) return status;
  const due = byDue(a.due, b.due);
  if (due) return due;
  return (GOAL_PRIORITY_ORDER[a.priority ?? ''] ?? 9) - (GOAL_PRIORITY_ORDER[b.priority ?? ''] ?? 9);
}

function taskOrder(a: TaskRow, b: TaskRow): number {
  // 끝난 일은 아래로 — 지우지 않고 남겨 두되, 오늘의 시야를 가리지 않게.
  const done = Number(a.status === '완료') - Number(b.status === '완료');
  if (done) return done;
  const due = byDue(a.due, b.due);
  if (due) return due;
  return (TASK_PRIORITY_ORDER[a.priority ?? ''] ?? 9) - (TASK_PRIORITY_ORDER[b.priority ?? ''] ?? 9);
}

/* ── 세우기 ─────────────────────────────────────────────────────────────── */

export function buildCascade(
  visions: VisionRow[],
  goals: GoalRow[],
  tasks: TaskRow[]
): Cascade {
  const goalById = new Map(goals.map((g) => [g.id, g]));

  // 할 일을 목표별로 모읍니다.
  const tasksOf = new Map<string, DayTask[]>();
  for (const task of tasks) {
    const goal = goalById.get(task.goal_id);
    if (!goal) continue;
    const list = tasksOf.get(task.goal_id) ?? [];
    list.push({ ...task, goal_title: goal.title });
    tasksOf.set(task.goal_id, list);
  }
  for (const list of tasksOf.values()) list.sort(taskOrder);

  function flowOf(goalId: string): Flow {
    const list = tasksOf.get(goalId) ?? [];
    return flow(list.filter((t) => t.status === '완료').length, list.length);
  }

  // 주 목표를 달 목표 아래로.
  const weeksOf = new Map<string, WeekNode[]>();
  const looseWeeks: GoalRow[] = [];
  for (const goal of goals) {
    if (goal.horizon !== '주') continue;
    const node: WeekNode = {
      id: goal.id, title: goal.title, done_when: goal.done_when, area: goal.area,
      status: goal.status, due: goal.due,
      flow: flowOf(goal.id),
      tasks: tasksOf.get(goal.id) ?? [],
    };
    const parent = goal.parent_id && goalById.get(goal.parent_id)?.horizon === '월'
      ? goal.parent_id
      : null;
    if (!parent) { looseWeeks.push(goal); continue; }
    const list = weeksOf.get(parent) ?? [];
    list.push(node);
    weeksOf.set(parent, list);
  }
  for (const list of weeksOf.values()) {
    list.sort((a, b) => {
      const done = Number(a.status === '완료') - Number(b.status === '완료');
      return done || byDue(a.due, b.due);
    });
  }

  function monthNode(goal: GoalRow): MonthNode {
    const weeks = weeksOf.get(goal.id) ?? [];
    const own = flowOf(goal.id);
    const weekFlow = sumFlow(weeks.map((w) => w.flow));
    return {
      id: goal.id, title: goal.title, done_when: goal.done_when, area: goal.area,
      status: goal.status, priority: goal.priority, due: goal.due,
      flow: sumFlow([weekFlow, own]),
      weekFlow,
      weeks,
      tasks: tasksOf.get(goal.id) ?? [],
    };
  }

  /**
   * 부모를 잃은 주 목표는 버리지 않고 달 목표처럼 세웁니다 —
   * 화면에서 사라지면 아무도 고치지 못합니다.
   */
  const months = goals.filter((g) => g.horizon === '월').concat(looseWeeks).sort(goalOrder);

  const visionNodes: VisionNode[] = visions.map((vision) => {
    const mine = months.filter((g) => g.vision_id === vision.id).map(monthNode);
    return {
      id: vision.id, title: vision.title, one_liner: vision.one_liner, metric: vision.metric,
      target: vision.target, current: vision.current, due: vision.due, status: vision.status,
      flow: sumFlow(mine.map((m) => m.flow)),
      months: mine,
    };
  });

  return {
    visions: visionNodes,
    loose: months.filter((g) => !g.vision_id || !visions.some((v) => v.id === g.vision_id)).map(monthNode),
  };
}
