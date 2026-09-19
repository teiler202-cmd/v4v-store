import 'server-only';
import { sql } from './db';
import { TABLES, type TableName, tableOf } from './schema';
import { plusDays, todayKST } from './signals';
import { buildCascade, type Cascade, type GoalRow, type TaskRow, type VisionRow } from './cascade';
import type { FieldExp, FocusBoard, FocusSlot, PoolTask } from './focus';

/**
 * 읽기.
 *
 * 표 이름과 컬럼 이름은 반드시 schema.ts 의 정의에서 나옵니다 — 화면이 보낸
 * 문자열을 그대로 SQL 에 넣지 않습니다. postgres.js 의 sql(...) 은 식별자를
 * 따옴표로 감싸 주지만, 그 전에 우리가 아는 이름인지 먼저 확인합니다.
 */

export type Row = Record<string, unknown> & { id: string };

function assertTable(name: string): TableName {
  const def = tableOf(name);
  if (!def) throw new Error(`모르는 표: ${name}`);
  return def.name;
}

/* ── 목록 ───────────────────────────────────────────────────────────────── */

export async function listRows(table: string, opts: { limit?: number } = {}): Promise<Row[]> {
  const name = assertTable(table);
  const limit = opts.limit ?? 500;

  const rows = await sql<Row[]>`select * from ${sql(name)} limit ${limit}`;
  return sortRows(name, rows);
}

/**
 * 정렬은 SQL 이 아니라 여기서 합니다.
 *
 * order by 를 문자열로 조립하려면 sql.unsafe 를 써야 하는데, 표가 수십~수백 행인
 * 보드에서 그만한 위험을 질 이유가 없습니다. 나중에 행이 수만 개가 되면
 * 그때 인덱스와 함께 SQL 정렬로 옮깁니다.
 *
 * 비어 있는 값은 언제나 뒤로 보냅니다 — 마감일 없는 할 일이 맨 위에 오면
 * 진짜 급한 것이 가려집니다.
 */
export function sortRows(name: TableName, rows: Row[]): Row[] {
  const order = TABLES[name].orderBy;
  return [...rows].sort((a, b) => {
    for (const { key, dir } of order) {
      const av = a[key];
      const bv = b[key];
      const aEmpty = av === null || av === undefined || av === '';
      const bEmpty = bv === null || bv === undefined || bv === '';
      if (aEmpty && bEmpty) continue;
      if (aEmpty) return 1;
      if (bEmpty) return -1;
      if (av === bv) continue;
      const cmp = typeof av === 'number' && typeof bv === 'number'
        ? av - bv
        : String(av).localeCompare(String(bv), 'ko');
      return dir === 'desc' ? -cmp : cmp;
    }
    return 0;
  });
}

export async function getRow(table: string, id: string): Promise<Row | null> {
  const name = assertTable(table);
  const rows = await sql<Row[]>`select * from ${sql(name)} where id = ${id} limit 1`;
  return rows[0] ?? null;
}

/**
 * ref 칸의 선택지 — 다른 표의 행을 id 와 이름만 가볍게.
 * members 는 schema.ts 의 TABLES 에 없어서 따로 처리합니다.
 */
export async function refOptions(table: string): Promise<{ id: string; label: string }[]> {
  if (table === 'members') {
    return sql<{ id: string; label: string }[]>`
      select id, name as label from members order by name
    `;
  }
  const name = assertTable(table);
  const titleKey = TABLES[name].titleKey;
  return sql<{ id: string; label: string }[]>`
    select id, ${sql(titleKey)} as label from ${sql(name)} order by ${sql(titleKey)}
  `;
}

/** 화면에서 ref 값을 이름으로 바꿔 보여 주려면 한 번에 다 읽어 두는 편이 빠릅니다 */
export async function refLookup(tables: string[]): Promise<Record<string, Map<string, string>>> {
  const out: Record<string, Map<string, string>> = {};
  for (const t of [...new Set(tables)]) {
    const rows = await refOptions(t);
    out[t] = new Map(rows.map((r) => [r.id, r.label]));
  }
  return out;
}

/* ── 보드 ───────────────────────────────────────────────────────────────── */

export type BoardTask = {
  id: string; title: string; status: string; due: string | null;
  field: string | null; priority: string | null;
  goal_id: string; goal_title: string;
};

export type BoardGoal = {
  id: string; title: string; done_when: string | null; area: string | null;
  status: string; priority: string | null; due: string | null;
  vision_id: string | null;
  task_total: number; task_done: number;
};

export type BoardVision = {
  id: string; title: string; one_liner: string | null;
  current: string | null; target: string | null; due: string | null;
  status: string; goal_count: number;
};

/** 지금 — 끝나지 않은 할 일을 마감 순으로 */
export async function openTasks(): Promise<BoardTask[]> {
  return sql<BoardTask[]>`
    select t.id, t.title, t.status, t.due, t.field, t.priority,
           t.goal_id, g.title as goal_title
    from tasks t
    join goals g on g.id = t.goal_id
    where t.status <> '완료'
    order by t.due asc nulls last, t.priority asc
  `;
}

/** 목표 카드 — 할 일 개수와 완료 개수를 함께 (진행률은 읽는 쪽에서 계산) */
export async function goalCards(): Promise<BoardGoal[]> {
  return sql<BoardGoal[]>`
    select g.id, g.title, g.done_when, g.area, g.status, g.priority, g.due, g.vision_id,
           count(t.id)::int                                    as task_total,
           count(t.id) filter (where t.status = '완료')::int    as task_done
    from goals g
    left join tasks t on t.goal_id = g.id
    group by g.id
    order by
      case g.status when '진행중' then 0 when '대기' then 1 when '보류' then 2 else 3 end,
      g.due asc nulls last
  `;
}

export async function visionCards(): Promise<BoardVision[]> {
  return sql<BoardVision[]>`
    select v.id, v.title, v.one_liner, v.current, v.target, v.due, v.status,
           count(g.id)::int as goal_count
    from visions v
    left join goals g on g.vision_id = v.id
    group by v.id
    order by v.sort asc, v.created_at asc
  `;
}

export async function memoBoard(): Promise<{ member_id: string; name: string; body: string }[]> {
  return sql<{ member_id: string; name: string; body: string }[]>`
    select m.id as member_id, m.name, coalesce(x.body, '') as body
    from members m
    left join memos x on x.member_id = m.id
    order by m.created_at
  `;
}

export async function getSetting(key: string): Promise<string | null> {
  const rows = await sql<{ value: string }[]>`select value from settings where key = ${key}`;
  return rows[0]?.value ?? null;
}

/* ── 흐름 ───────────────────────────────────────────────────────────────── */

/**
 * 첫 화면이 쓰는 단 하나의 조회 — 정말로 한 번입니다.
 *
 * 처음에는 비전·목표·할 일을 Promise.all 로 셋 한꺼번에 물었습니다. 빠를 줄
 * 알았는데 반대였습니다. Supabase 의 트랜잭션 풀러는 접속을 **여럿이 나눠 쓰는**
 * 자리입니다. 한 화면이 접속 여덟 개를 동시에 잡으면 풀러의 몫이 바닥나고,
 * 그다음 질의는 오류도 없이 그냥 멈춰 섭니다 (화면은 영원히 돌고 로그는 조용합니다).
 *
 * 그래서 세 표를 json_agg 로 한 줄에 담아 **왕복 한 번, 접속 하나**로 받습니다.
 * 날짜는 to_json(date) 이 'YYYY-MM-DD' 문자열로 내보내 줍니다 — 우리가 날짜를
 * 다루는 방식(signals.ts)과 그대로 맞습니다.
 *
 * 세 표를 다 합쳐도 수백 행입니다. 나무는 lib/ops/cascade.ts 가 세웁니다.
 */
export async function cascadeBoard(): Promise<Cascade> {
  const [row] = await sql<{ visions: VisionRow[]; goals: GoalRow[]; tasks: TaskRow[] }[]>`
    select
      (select coalesce(json_agg(v order by v.sort, v.created_at), '[]'::json) from (
        select id, title, one_liner, metric, target, current, due, status, sort, created_at
        from visions
      ) v) as visions,
      (select coalesce(json_agg(g), '[]'::json) from (
        select id, title, done_when, area, status, priority, due, horizon, parent_id, vision_id
        from goals limit 500
      ) g) as goals,
      (select coalesce(json_agg(t), '[]'::json) from (
        select id, title, status, due, field, priority, goal_id
        from tasks limit 1000
      ) t) as tasks
  `;

  return buildCascade(row.visions, row.goals, row.tasks);
}

/* ── 브리핑 ─────────────────────────────────────────────────────────────── */

/**
 * 매일 아침 보던 📡 콜아웃.
 *
 * 노션에서는 에이전트가 스케줄로 돌며 이 문단을 덮어썼습니다 —
 * 클로드 데스크톱이 켜져 있어야 했고, 안 켜 두면 어제 숫자가 그대로 남았습니다.
 * 이제는 보드를 열 때마다 이 함수가 돕니다. 틀린 숫자가 남아 있을 수 없습니다.
 *
 * 없는 숫자를 만들지 않습니다 — 데이터가 비어 있으면 0 이고, 0 인 줄은 화면에서 지웁니다.
 */
export type Briefing = {
  today: string;
  tasks: { overdue: number; today: number; week: number };
  goals: { overdue: number; week: number };
  products: { late: number; soon: number };
  partners: { cold: number };
  money: { spentThisMonth: number; wasteThisMonth: number };
};

export async function briefing(): Promise<Briefing> {
  const today = todayKST();
  const weekEnd = plusDays(today, 7);
  const tomorrow = plusDays(today, 1);
  const twoWeeks = plusDays(today, 14);
  const monthStart = today.slice(0, 8) + '01';
  const contactWarm = plusDays(today, -14);

  /**
   * 다섯 표를 한 번에 셉니다.
   *
   * 처음에는 표마다 질의를 따로 보냈습니다 — 왕복이 다섯 번이고, 그 다섯이
   * 보드의 다른 조회들과 겹치면서 접속 수를 넘겨 화면이 통째로 멈춘 적이 있습니다.
   * 하나로 합치니 왕복도 한 번, 붙잡는 접속도 하나입니다.
   */
  const [r] = await sql<{
    t_overdue: number; t_today: number; t_week: number;
    g_overdue: number; g_week: number;
    p_late: number; p_soon: number;
    pa_cold: number;
    m_spent: number; m_waste: number;
  }[]>`
    select
      (select count(*) filter (where due <  ${today})                                    from tasks where status <> '완료')::int as t_overdue,
      (select count(*) filter (where due >= ${today} and due <= ${tomorrow})             from tasks where status <> '완료')::int as t_today,
      (select count(*) filter (where due >  ${tomorrow} and due <= ${weekEnd})           from tasks where status <> '완료')::int as t_week,
      (select count(*) filter (where due <  ${today})                                    from goals where status <> '완료')::int as g_overdue,
      (select count(*) filter (where due >= ${today} and due <= ${weekEnd})              from goals where status <> '완료')::int as g_week,
      (select count(*) filter (where launch_on <  ${today})                              from products where stage not in ('판매중','종료'))::int as p_late,
      (select count(*) filter (where launch_on >= ${today} and launch_on <= ${twoWeeks}) from products where stage not in ('판매중','종료'))::int as p_soon,
      -- 컨택 경과 14일↑ (signals.ts 의 CONTACT_WARM 과 같은 값입니다)
      (select count(*) from partners
        where status in ('거래중','견적 대기')
          and (last_contact is null or last_contact <= ${contactWarm}))::int as pa_cold,
      (select coalesce(sum(amount), 0) from ledger
        where scope = '사업' and spent_on >= ${monthStart} and spent_on <= ${today})::int as m_spent,
      (select coalesce(sum(amount) filter (where nature = '낭비'), 0) from ledger
        where scope = '사업' and spent_on >= ${monthStart} and spent_on <= ${today})::int as m_waste
  `;

  return {
    today,
    tasks: { overdue: r.t_overdue, today: r.t_today, week: r.t_week },
    goals: { overdue: r.g_overdue, week: r.g_week },
    products: { late: r.p_late, soon: r.p_soon },
    partners: { cold: r.pa_cold },
    money: { spentThisMonth: r.m_spent, wasteThisMonth: r.m_waste },
  };
}

/* ── 집중 ───────────────────────────────────────────────────────────────── */

/**
 * 지금 누가 무엇을 쥐고 있는가 — 그리고 그동안 무엇을 끝냈는가.
 *
 * cascadeBoard 와 같은 방식입니다: 네 가지를 따로 묻지 않고 json_agg 로 한 줄에 담아
 * **왕복 한 번, 접속 하나**로 받습니다. 이 화면은 몇십 초마다 스스로 새로 고치기
 * 때문에(Live.tsx), 여기서 질의를 늘리면 그 배수로 늘어납니다.
 *
 * 경험치는 컬럼이 아닙니다. '끝낸 할 일'을 분야별로 센 수(done)만 가져오고,
 * 경험치와 레벨은 signals.ts 가 화면에서 계산합니다 — 계산되는 값을 저장하지 않는
 * 이 보드의 규칙 그대로입니다.
 */
export async function focusBoard(): Promise<FocusBoard> {
  const today = todayKST();

  const [row] = await sql<{
    members: { id: string; name: string }[];
    slots: FocusSlot[];
    stats: FieldExp[];
    pool: PoolTask[];
  }[]>`
    select
      (select coalesce(json_agg(m order by m.created_at), '[]'::json) from (
        select id, name, created_at from members
      ) m) as members,

      (select coalesce(json_agg(s order by s.picked_at), '[]'::json) from (
        select f.member_id, f.task_id, f.picked_at,
               t.title, t.status, t.due, t.field, t.priority,
               t.goal_id, g.title as goal_title
        from focus f
        join tasks t on t.id = f.task_id
        join goals g on g.id = t.goal_id
      ) s) as slots,

      -- 담당이 없는 채로 끝난 할 일은 누구의 경험치도 아닙니다. 그대로 둡니다 —
      -- 주인 없는 성과를 아무에게나 붙이는 것이 숫자를 더 나쁘게 만듭니다.
      (select coalesce(json_agg(e), '[]'::json) from (
        select owner_id as member_id, field,
               count(*)::int                                as done,
               count(*) filter (where done_on = ${today})::int as today
        from tasks
        where status = '완료' and owner_id is not null
        group by owner_id, field
      ) e) as stats,

      (select coalesce(json_agg(p order by p.due asc nulls last, p.title), '[]'::json) from (
        select t.id, t.title, t.field, t.due, t.priority, g.title as goal_title
        from tasks t
        join goals g on g.id = t.goal_id
        left join focus x on x.task_id = t.id
        where t.status <> '완료' and x.task_id is null
        order by t.due asc nulls last
        limit 80
      ) p) as pool
  `;

  return {
    members: row.members ?? [],
    slots: row.slots ?? [],
    stats: row.stats ?? [],
    pool: row.pool ?? [],
  };
}
