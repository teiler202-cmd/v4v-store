'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { deleteRow, saveRow } from '@/app/ops/actions';
import type { Field } from '@/lib/ops/schema';

/**
 * 행 하나를 고치는 폼.
 *
 * 칸의 종류는 lib/ops/schema.ts 가 정합니다 — 표를 하나 더 만들어도
 * 이 파일은 그대로입니다. 노션의 속성 편집기를 대신하는 자리입니다.
 */
export default function RowForm({
  table, id, fields, values, options,
}: {
  table: string;
  id: string | null;
  fields: Field[];
  values: Record<string, unknown>;
  options: Record<string, { id: string; label: string }[]>;
}) {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const [pending, start] = useTransition();

  function onSubmit(form: FormData) {
    setMessage(null);
    start(async () => {
      const result = await saveRow(table, id, form);
      if (!result.ok) { setMessage(result.message); return; }
      // 새로 만든 행은 방금 만들어진 주소로 옮겨 갑니다.
      if (!id) router.replace(`/ops/${table}/${result.id}`);
      else router.refresh();
      setMessage('저장했습니다.');
    });
  }

  function onDelete() {
    if (!id) return;
    if (!confirm('이 행을 지웁니다. 되돌릴 수 없습니다.')) return;
    start(async () => {
      const result = await deleteRow(table, id);
      if (!result.ok) { setMessage(result.message); return; }
      router.push(`/ops/${table}`);
    });
  }

  return (
    <form action={onSubmit} className="flex flex-col gap-4">
      {fields.map((field) => (
        <label key={field.key} className="flex flex-col gap-1">
          <span className="font-mono text-[9px] uppercase tracking-[0.15em] text-ash">
            {field.label}
            {field.required ? <span className="text-[#b42318]"> *</span> : null}
          </span>
          <Input field={field} value={values[field.key]} options={options} selfId={id} table={table} />
          {field.hint ? (
            <span className="font-mono text-[9px] leading-[1.7] text-ash/80">{field.hint}</span>
          ) : null}
        </label>
      ))}

      <div className="mt-2 flex items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="h-10 rounded bg-ink px-5 font-mono text-[10px] uppercase tracking-[0.15em] text-paper disabled:opacity-40"
        >
          {pending ? '저장 중' : '저장'}
        </button>

        {id ? (
          <button
            type="button"
            onClick={onDelete}
            disabled={pending}
            className="font-mono text-[10px] text-ash underline underline-offset-4 hover:text-[#b42318]"
          >
            지우기
          </button>
        ) : null}

        {message ? (
          <span role="status" className="font-mono text-[10px] text-ash">{message}</span>
        ) : null}
      </div>
    </form>
  );
}

const BOX =
  'rounded border border-line bg-paper px-3 py-2 text-[13px] outline-none focus:border-ink';

function Input({
  field, value, options, selfId, table,
}: {
  field: Field;
  value: unknown;
  options: Record<string, { id: string; label: string }[]>;
  /** 자기 자신을 상위로 고르지 못하게 (목표의 '상위 목표') */
  selfId: string | null;
  table: string;
}) {
  const name = field.key;

  if (field.type === 'longtext') {
    return <textarea name={name} defaultValue={(value as string) ?? ''} rows={4} className={`${BOX} resize-y leading-[1.8]`} />;
  }

  if (field.type === 'select') {
    // 비울 수 없는 칸에는 빈 선택지를 두지 않습니다 — 고를 수 있게 해 두고
    // 저장할 때 혼내는 것보다, 애초에 못 고르게 하는 편이 낫습니다.
    const fallback = field.required ? (field.options?.[0] ?? '') : '';
    return (
      <select
        name={name}
        defaultValue={(value as string) || fallback}
        className={`${BOX} h-10`}
      >
        {field.required ? null : <option value="">—</option>}
        {field.options?.map((option) => <option key={option} value={option}>{option}</option>)}
      </select>
    );
  }

  if (field.type === 'ref') {
    const list = (options[field.ref as string] ?? []).filter(
      (item) => !(field.ref === table && item.id === selfId)
    );
    return (
      <select name={name} defaultValue={(value as string) ?? ''} className={`${BOX} h-10`}>
        <option value="">—</option>
        {list.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
      </select>
    );
  }

  if (field.type === 'multi') {
    const picked = new Set((value as string[] | null) ?? []);
    return (
      <div className="flex flex-wrap gap-x-4 gap-y-1.5 py-1">
        {field.options?.map((option) => (
          <span key={option} className="flex items-center gap-1.5">
            <input
              type="checkbox"
              name={name}
              value={option}
              defaultChecked={picked.has(option)}
              className="h-3.5 w-3.5 accent-[#0b0b0b]"
            />
            <span className="text-[12px]">{option}</span>
          </span>
        ))}
      </div>
    );
  }

  if (field.type === 'bool') {
    return (
      <input type="checkbox" name={name} defaultChecked={Boolean(value)} className="h-4 w-4 accent-[#0b0b0b]" />
    );
  }

  const type =
    field.type === 'date' ? 'date'
    : field.type === 'email' ? 'email'
    : field.type === 'phone' ? 'tel'
    : field.type === 'url' ? 'url'
    : field.type === 'number' ? 'number'
    : 'text';

  return (
    <input
      name={name}
      type={type}
      // 금액은 "30,000" 처럼 쉼표를 넣어 적는 편이 자연스러워서 text 로 둡니다
      // (서버에서 쉼표를 떼고 숫자로 바꿉니다).
      inputMode={field.type === 'money' ? 'numeric' : undefined}
      defaultValue={value === null || value === undefined ? '' : String(value)}
      className={`${BOX} h-10`}
    />
  );
}
