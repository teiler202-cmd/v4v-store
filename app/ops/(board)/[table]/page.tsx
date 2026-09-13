import Link from 'next/link';
import { notFound } from 'next/navigation';
import { listRows, refLookup } from '@/lib/ops/queries';
import { tableOf, type Field } from '@/lib/ops/schema';
import {
  contactSignal, defectRate, goalSignal, humanDate, marginRate, marginVerdict,
  taskSignal, todayKST, won,
} from '@/lib/ops/signals';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: Promise<{ table: string }> }) {
  const { table } = await params;
  return { title: tableOf(table)?.label ?? '표' };
}

export default async function TablePage({ params }: { params: Promise<{ table: string }> }) {
  const { table } = await params;
  const def = tableOf(table);
  if (!def) notFound();

  const today = todayKST();
  const columns = def.fields.filter((f) => f.inList);
  const rows = await listRows(def.name);
  const lookup = await refLookup(
    columns.filter((f) => f.type === 'ref' && f.ref).map((f) => f.ref as string)
  );

  return (
    <div className="flex flex-col gap-4">
      <header className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <h1 className="font-grotesk text-[18px] font-bold tracking-[-0.02em]">{def.label}</h1>
        <span className="font-mono text-[10px] text-ash">{rows.length}개</span>
        <Link
          href={`/ops/${def.name}/new`}
          className="ml-auto rounded bg-ink px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.12em] text-paper"
        >
          {def.unit} 추가
        </Link>
      </header>

      <p className="font-mono text-[10px] leading-[1.8] text-ash">{def.purpose}</p>

      {rows.length === 0 ? (
        <p className="rounded border border-dashed border-line p-6 text-center font-mono text-[10.5px] text-ash">
          아직 없습니다.
        </p>
      ) : (
        // 열이 많은 표는 가로로 스크롤됩니다 — 페이지 전체가 밀리지 않게 이 안에서만.
        <div className="-mx-1 overflow-x-auto">
          <table className="w-full min-w-[640px] border-collapse text-left">
            <thead>
              <tr className="border-b border-line">
                <th className="w-6 px-1 py-2" />
                {columns.map((field) => (
                  <th key={field.key} className="px-2 py-2 font-mono text-[9px] uppercase tracking-[0.12em] text-ash">
                    {field.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-b border-line-soft align-top hover:bg-paper">
                  <td className="px-1 py-2.5 font-mono text-[11px] leading-none">
                    {rowSignal(def.name, row, today)}
                  </td>
                  {columns.map((field, index) => (
                    <td key={field.key} className="px-2 py-2.5 text-[12px] leading-[1.5]">
                      {index === 0 ? (
                        <Link href={`/ops/${def.name}/${row.id}`} className="underline underline-offset-2 decoration-line hover:decoration-ink">
                          {cell(field, row, lookup, today) || '(제목 없음)'}
                        </Link>
                      ) : (
                        <span className="text-ash">{cell(field, row, lookup, today)}</span>
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

/** 표마다 맨 앞에 붙는 신호 한 글자. 노션의 수식 컬럼이 하던 일입니다. */
function rowSignal(table: string, row: Record<string, unknown>, today: string): string {
  const s = (k: string) => (row[k] as string | null) ?? null;
  switch (table) {
    case 'tasks':    return taskSignal(String(row.status), s('due'), today);
    case 'goals':    return goalSignal(String(row.status), s('due'), today);
    case 'partners': return contactSignal(s('last_contact'), today);
    case 'products': return marginVerdict(marginRate(row.price as number, row.cost as number)) ?? '';
    case 'qc_log': {
      const rate = defectRate(row.qty_checked as number, row.qty_defect as number);
      return rate === null ? '' : rate > 5 ? '🔴' : rate > 0 ? '🟠' : '🟢';
    }
    default: return '';
  }
}

function cell(
  field: Field,
  row: Record<string, unknown>,
  lookup: Record<string, Map<string, string>>,
  today: string
): string {
  const value = row[field.key];
  if (value === null || value === undefined || value === '') return '—';

  switch (field.type) {
    case 'money':  return won(value as number);
    case 'date':   return humanDate(value as string, today);
    case 'bool':   return value ? '예' : '아니오';
    case 'multi':  return (value as string[]).join(' · ') || '—';
    case 'ref':    return lookup[field.ref as string]?.get(value as string) ?? '—';
    default:       return String(value);
  }
}
