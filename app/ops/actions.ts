'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { sql } from '@/lib/ops/db';
import { endSession, findMemberByLogin, requireMember, startSession } from '@/lib/ops/auth';
import { rateLimit, tooManyMessage } from '@/lib/rateLimit';
import { TABLES, tableOf, type Field } from '@/lib/ops/schema';
import { removeObject } from '@/lib/ops/storage';

/**
 * 보드의 모든 쓰기.
 *
 * ⚠️ 서버 액션은 화면을 거치지 않고 POST 로 직접 부를 수 있습니다.
 *    proxy.ts 가 /ops 주소를 막아도 이 함수들은 따로 노출됩니다.
 *    그래서 모든 함수가 맨 앞에서 requireMember() 를 부릅니다. 예외 없습니다.
 */

export type SaveResult = { ok: true; id: string } | { ok: false; message: string };

/* ── 값 다듬기 ──────────────────────────────────────────────────────────── */

/**
 * 폼에서 온 문자열을 컬럼이 받을 수 있는 값으로 바꿉니다.
 * 모르는 값은 넣지 않고 오류로 돌려보냅니다 — 조용히 null 로 만들면
 * 사용자는 저장됐다고 믿고 데이터는 사라집니다.
 */
function coerce(field: Field, form: FormData): { value: unknown } | { error: string } {
  const raw = form.get(field.key);

  if (field.type === 'multi') {
    const picked = form.getAll(field.key).map(String).filter(Boolean);
    const bad = picked.find((p) => field.options && !field.options.includes(p));
    if (bad) return { error: `${field.label}: 모르는 값 "${bad}"` };
    return { value: picked };
  }

  if (field.type === 'bool') return { value: raw === 'on' || raw === 'true' };

  const text = typeof raw === 'string' ? raw.trim() : '';

  if (!text) {
    if (field.required) return { error: `${field.label}을(를) 비워 둘 수 없습니다.` };
    return { value: null };
  }

  switch (field.type) {
    case 'select':
      if (field.options && !field.options.includes(text)) {
        return { error: `${field.label}: 모르는 값 "${text}"` };
      }
      return { value: text };

    case 'date':
      // <input type="date"> 는 항상 YYYY-MM-DD 로 보냅니다. 아니면 손댄 요청입니다.
      if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) return { error: `${field.label}: 날짜 형식이 아닙니다.` };
      return { value: text };

    case 'money': {
      // "30,000" 처럼 쉼표를 넣어 적는 편이 자연스럽습니다.
      const n = Number(text.replace(/[,\s₩]/g, ''));
      if (!Number.isFinite(n)) return { error: `${field.label}: 숫자가 아닙니다.` };
      return { value: Math.round(n) };
    }

    case 'number': {
      const n = Number(text.replace(/,/g, ''));
      if (!Number.isFinite(n)) return { error: `${field.label}: 숫자가 아닙니다.` };
      return { value: n };
    }

    case 'ref':
      if (!/^[0-9a-f-]{36}$/i.test(text)) return { error: `${field.label}: 잘못된 연결입니다.` };
      return { value: text };

    case 'url':
      if (!/^https?:\/\//i.test(text)) return { error: `${field.label}: http로 시작하는 주소여야 합니다.` };
      return { value: text };

    default:
      return { value: text };
  }
}

/* ── 행 저장 ────────────────────────────────────────────────────────────── */

export async function saveRow(
  table: string,
  id: string | null,
  form: FormData
): Promise<SaveResult> {
  await requireMember();

  const def = tableOf(table);
  if (!def) return { ok: false, message: '모르는 표입니다.' };

  const patch: Record<string, unknown> = {};
  for (const field of def.fields) {
    // 폼에 아예 없는 칸은 건드리지 않습니다 (일부만 담은 폼을 지원하기 위해).
    // 체크박스는 꺼져 있을 때 폼에서 사라지므로 예외입니다.
    if (!form.has(field.key) && field.type !== 'bool' && field.type !== 'multi') continue;

    const out = coerce(field, form);
    if ('error' in out) return { ok: false, message: out.error };
    patch[field.key] = out.value;
  }

  if (Object.keys(patch).length === 0) return { ok: false, message: '바뀐 것이 없습니다.' };

  // 목표가 자기 자신을 상위로 두면 화면이 자기를 끝없이 그립니다.
  // 데이터베이스에도 같은 제약이 있지만(goals_parent_not_self), 여기서 먼저
  // 막아야 사람이 읽을 수 있는 말로 돌려줄 수 있습니다.
  if (def.name === 'goals' && id && patch.parent_id === id) {
    return { ok: false, message: '자기 자신을 상위 목표로 둘 수 없습니다.' };
  }

  try {
    if (id) {
      const rows = await sql<{ id: string }[]>`
        update ${sql(def.name)} set ${sql(patch)} where id = ${id} returning id
      `;
      if (!rows[0]) return { ok: false, message: '그 행을 찾지 못했습니다.' };
      revalidatePath('/ops', 'layout');
      return { ok: true, id: rows[0].id };
    }

    const rows = await sql<{ id: string }[]>`
      insert into ${sql(def.name)} ${sql(patch)} returning id
    `;
    revalidatePath('/ops', 'layout');
    return { ok: true, id: rows[0].id };
  } catch (error) {
    return { ok: false, message: dbMessage(error) };
  }
}

/**
 * 데이터베이스가 거절한 이유를 사람 말로.
 * 원문을 그대로 보여 주면 컬럼 이름과 제약 이름이 화면에 새어 나갑니다.
 */
function dbMessage(error: unknown): string {
  const code = (error as { code?: string })?.code;
  if (code === '23503') return '연결된 행이 없어졌습니다. 새로고침하고 다시 골라 주세요.';
  if (code === '23505') return '이미 같은 값이 있습니다.';
  if (code === '23514') return '고를 수 없는 값입니다.';
  console.error('[ops] 저장 실패:', error);
  return '저장하지 못했습니다.';
}

/** 할 일 상태만 빠르게 바꾸기 — 보드에서 체크 한 번으로 */
export async function setTaskStatus(id: string, status: string): Promise<SaveResult> {
  await requireMember();
  const allowed = TABLES.tasks.fields.find((f) => f.key === 'status')?.options ?? [];
  if (!allowed.includes(status)) return { ok: false, message: '모르는 상태입니다.' };

  const rows = await sql<{ id: string }[]>`
    update tasks set status = ${status} where id = ${id} returning id
  `;
  if (!rows[0]) return { ok: false, message: '그 할 일을 찾지 못했습니다.' };
  revalidatePath('/ops', 'layout');
  return { ok: true, id: rows[0].id };
}

/**
 * 행 지우기.
 *
 * 끝난 일은 지우지 않고 상태만 바꾸는 것이 이 보드의 규칙입니다 —
 * 지난 원가와 불량률이 다음 시즌의 유일한 근거이기 때문입니다.
 * 그래도 잘못 만든 행은 지울 수 있어야 해서 남겨 둡니다.
 */
export async function deleteRow(table: string, id: string): Promise<SaveResult> {
  await requireMember();
  const def = tableOf(table);
  if (!def) return { ok: false, message: '모르는 표입니다.' };

  try {
    const rows = await sql<{ id: string }[]>`
      delete from ${sql(def.name)} where id = ${id} returning id
    `;
    if (!rows[0]) return { ok: false, message: '그 행을 찾지 못했습니다.' };
    revalidatePath('/ops', 'layout');
    return { ok: true, id };
  } catch (error) {
    const code = (error as { code?: string })?.code;
    // 할 일이 달린 목표는 지울 수 없습니다 (schema.sql 의 on delete restrict).
    if (code === '23503') {
      return { ok: false, message: '여기에 연결된 것이 남아 있습니다. 먼저 옮기거나 지워 주세요.' };
    }
    return { ok: false, message: dbMessage(error) };
  }
}

/* ── 파일 ───────────────────────────────────────────────────────────────── */

/**
 * 파일 지우기.
 *
 * 표의 행과 버킷의 바이트를 둘 다 없앱니다. 행만 지우면 아무도 찾을 수 없는
 * 바이트가 버킷에 영원히 남고, 바이트만 지우면 화면에 깨진 링크가 남습니다.
 * 버킷 쪽이 실패해도 행은 지웁니다 — 화면이 거짓말하는 쪽이 더 나쁩니다.
 */
export async function deleteFile(id: string): Promise<SaveResult> {
  await requireMember();

  const [file] = await sql<{ storage_path: string }[]>`
    delete from files where id = ${id} returning storage_path
  `;
  if (!file) return { ok: false, message: '그 파일을 찾지 못했습니다.' };

  await removeObject(file.storage_path);
  revalidatePath('/ops', 'layout');
  return { ok: true, id };
}

/* ── 메모 ───────────────────────────────────────────────────────────────── */

export async function saveMemo(body: string): Promise<SaveResult> {
  const member = await requireMember();
  // 남의 칸에 쓸 수 없습니다 — 언제나 자기 칸입니다.
  await sql`
    insert into memos (member_id, body) values (${member.id}, ${body})
    on conflict (member_id) do update set body = excluded.body, updated_at = now()
  `;
  revalidatePath('/ops', 'layout');
  return { ok: true, id: member.id };
}

/* ── 로그인 ─────────────────────────────────────────────────────────────── */

export async function signIn(_prev: unknown, form: FormData): Promise<{ message: string } | void> {
  // 비밀번호를 사전으로 찍어 보는 것을 막습니다 (스토어 로그인과 같은 장치).
  const limited = await rateLimit('ops-signin', { limit: 8, windowMs: 60_000, blockMs: 10 * 60_000 });
  if (!limited.ok) return { message: tooManyMessage(limited.retryAfterSec) };

  const email = String(form.get('email') ?? '');
  const password = String(form.get('password') ?? '');
  if (!email || !password) return { message: '이메일과 비밀번호를 입력하세요.' };

  const member = await findMemberByLogin(email, password);
  // 어느 쪽이 틀렸는지 알려 주지 않습니다.
  if (!member) return { message: '이메일 또는 비밀번호가 맞지 않습니다.' };

  await startSession(member.id);
  redirect('/ops');
}

export async function signOut() {
  await endSession();
  redirect('/ops/login');
}
