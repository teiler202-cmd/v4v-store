import Link from 'next/link';
import { notFound } from 'next/navigation';
import { sql } from '@/lib/ops/db';
import { getRow, refOptions } from '@/lib/ops/queries';
import { tableOf } from '@/lib/ops/schema';
import { dueWord, humanDate, marginRate, marginVerdict, progress, todayKST, won } from '@/lib/ops/signals';
import Files, { type FileRow } from './Files';
import RowForm from './RowForm';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: Promise<{ table: string; id: string }> }) {
  const { table, id } = await params;
  const def = tableOf(table);
  if (!def) return { title: '표' };
  return { title: id === 'new' ? `${def.unit} 추가` : def.label };
}

export default async function RowPage({
  params, searchParams,
}: {
  params: Promise<{ table: string; id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { table, id } = await params;
  const def = tableOf(table);
  if (!def) notFound();

  const isNew = id === 'new';
  const row = isNew ? null : await getRow(def.name, id);
  if (!isNew && !row) notFound();

  /**
   * 새 행은 주소로 미리 채웁니다 — /ops/goals/new?horizon=주&parent_id=…
   *
   * 흐름 화면의 '+ 주 목표' 는 이미 어느 달 목표 아래인지 알고 있습니다.
   * 그걸 폼에서 다시 고르게 하면, 고르는 걸 잊은 행이 반드시 생깁니다.
   * 아는 칸은 아는 쪽이 채웁니다. 값이 맞는지는 저장할 때 다시 봅니다.
   */
  const query = await searchParams;
  const preset: Record<string, unknown> = {};
  if (isNew) {
    for (const field of def.fields) {
      const value = query[field.key];
      if (typeof value === 'string' && value) preset[field.key] = value;
    }
  }

  // ref 칸의 선택지 — 다른 표의 행 목록
  const refTables = [...new Set(def.fields.filter((f) => f.ref).map((f) => f.ref as string))];
  const options: Record<string, { id: string; label: string }[]> = {};
  await Promise.all(refTables.map(async (t) => { options[t] = await refOptions(t); }));

  const today = todayKST();

  return (
    <div className="flex flex-col gap-6">
      <header className="flex items-baseline gap-2">
        <Link href={`/ops/${def.name}`} className="font-mono text-[10px] text-ash hover:text-ink">
          ← {def.label}
        </Link>
      </header>

      <RowForm
        table={def.name}
        id={isNew ? null : id}
        fields={def.fields}
        values={(row ?? preset) as Record<string, unknown>}
        options={options}
      />

      {/* 계산되는 값은 고칠 수 없습니다 — 보여 주기만 합니다 */}
      {row ? <Computed table={def.name} row={row} /> : null}
      {row ? <RowFiles table={def.name} id={row.id} /> : null}
      {row && def.name === 'goals' ? <GoalTasks goalId={row.id} today={today} /> : null}
    </div>
  );
}

/** 파일이 붙을 수 있는 표는 셋입니다 — 작업물, 지출(영수증), 검수(사진) */
const FILE_OWNER = {
  archive: 'archive_id',
  ledger: 'ledger_id',
  qc_log: 'qc_log_id',
} as const;

async function RowFiles({ table, id }: { table: string; id: string }) {
  const ownerKey = FILE_OWNER[table as keyof typeof FILE_OWNER];
  if (!ownerKey) return null;

  const files = await sql<FileRow[]>`
    select id, filename, mime, bytes from files
    where ${sql(ownerKey)} = ${id}
    order by created_at
  `;
  return <Files ownerKey={ownerKey} ownerId={id} files={files} />;
}

async function Computed({
  table, row,
}: { table: string; row: Record<string, unknown> }) {
  const items: [string, string][] = [];

  if (table === 'products') {
    const rate = marginRate(row.price as number, row.cost as number);
    items.push(['마진율', rate === null ? '원가나 판매가가 비어 있습니다' : `${rate}% ${marginVerdict(rate) ?? ''}`]);
    const [spend] = await sql<{ total: number }[]>`
      select coalesce(sum(amount), 0)::int as total from ledger where product_id = ${row.id as string}
    `;
    items.push(['실지출', won(spend.total)]);
  }

  if (table === 'partners') {
    const [qc] = await sql<{ avg: number | null }[]>`
      select round(avg(qty_defect::numeric / nullif(qty_checked, 0)) * 100, 1) as avg
      from qc_log where partner_id = ${row.id as string}
    `;
    items.push(['평균 불량률', qc.avg === null ? '검수 기록이 없습니다' : `${qc.avg}%`]);
  }

  if (table === 'qc_log') {
    const checked = row.qty_checked as number | null;
    const defect = row.qty_defect as number | null;
    items.push([
      '불량률',
      !checked ? '검수 수량이 비어 있습니다' : `${Math.round(((defect ?? 0) / checked) * 1000) / 10}%`,
    ]);
  }

  if (items.length === 0) return null;

  return (
    <section className="rounded border border-line bg-paper p-4">
      <p className="mb-2 font-mono text-[9px] uppercase tracking-[0.15em] text-ash">
        계산되는 값 · 고치지 않습니다
      </p>
      <dl className="flex flex-col gap-1">
        {items.map(([label, value]) => (
          <div key={label} className="flex gap-3">
            <dt className="w-[80px] shrink-0 font-mono text-[10px] text-ash">{label}</dt>
            <dd className="font-mono text-[11px]">{value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

async function GoalTasks({ goalId, today }: { goalId: string; today: string }) {
  const tasks = await sql<{ id: string; title: string; status: string; due: string | null }[]>`
    select id, title, status, due from tasks where goal_id = ${goalId}
    order by (status = '완료'), due asc nulls last
  `;
  const done = tasks.filter((t) => t.status === '완료').length;
  const pct = progress(done, tasks.length);

  return (
    <section>
      <div className="mb-2 flex items-baseline gap-2.5">
        <h2 className="font-grotesk text-[12px] font-bold">이 목표의 할 일</h2>
        <span className="font-mono text-[9.5px] text-ash">
          {pct === null ? '아직 없습니다' : `${pct}% · ${done}/${tasks.length}`}
        </span>
        <Link href="/ops/tasks/new" className="ml-auto font-mono text-[9.5px] text-ash hover:text-ink">
          할 일 추가 →
        </Link>
      </div>
      {tasks.length === 0 ? (
        <p className="rounded border border-dashed border-line p-4 font-mono text-[10px] text-ash">
          할 일이 하나도 없는 목표는 움직이지 않습니다.
        </p>
      ) : (
        <ul className="divide-y divide-line-soft border-y border-line-soft">
          {tasks.map((task) => (
            <li key={task.id} className="flex items-center gap-3 py-2">
              <Link href={`/ops/tasks/${task.id}`} className="min-w-0 flex-1 truncate text-[12.5px]">
                {task.status === '완료' ? <s className="text-ash">{task.title}</s> : task.title}
              </Link>
              <span className="shrink-0 font-mono text-[9.5px] text-ash">
                {task.status === '완료' ? '완료' : task.due ? dueWord(task.due, today) : humanDate(null)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
