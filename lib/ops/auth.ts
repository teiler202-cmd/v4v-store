import 'server-only';
import { cookies } from 'next/headers';
import { createHmac, randomBytes, scrypt, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';
import { sql } from './db';

/**
 * 운영 보드의 로그인 — 두 사람 몫.
 *
 * 가입 화면도, 비밀번호 재설정 메일도 만들지 않았습니다.
 * 쓰는 사람이 둘인데 그 화면들을 만들면, 코드는 늘고 뚫릴 구멍도 늘어납니다.
 * 비밀번호는 `npm run ops:member` 로 정합니다.
 *
 * 세션은 서명된 쿠키 한 장입니다. 서버에 세션 표를 두지 않습니다 —
 * 대신 만료가 짧고(14일), 비밀키를 바꾸면 전부 한 번에 무효가 됩니다.
 */

const scryptAsync = promisify(scrypt) as (
  password: string, salt: Buffer, keylen: number
) => Promise<Buffer>;

export const OPS_COOKIE = 'v4v_ops';
const MAX_AGE_SEC = 60 * 60 * 24 * 14; // 14일

function secret(): string {
  const value = process.env.OPS_SESSION_SECRET;
  // 비밀키가 없으면 누구든 쿠키를 위조할 수 있습니다. 조용히 넘어가지 않습니다.
  if (!value || value.length < 32) {
    throw new Error('OPS_SESSION_SECRET 이 없거나 너무 짧습니다 (32자 이상).');
  }
  return value;
}

/* ── 비밀번호 ───────────────────────────────────────────────────────────── */

/** scrypt 로 해시합니다. 결과는 `scrypt$<salt>$<hash>` 한 줄입니다. */
export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const key = await scryptAsync(password, salt, 64);
  return `scrypt$${salt.toString('hex')}$${key.toString('hex')}`;
}

/**
 * 맞는 비밀번호인지.
 *
 * 길이가 다를 때 timingSafeEqual 은 예외를 던집니다 — 먼저 길이를 맞춰 봅니다.
 * 비교 자체는 상수 시간이라, 맞는 글자 수가 응답 속도로 새지 않습니다.
 */
export async function verifyPassword(password: string, stored: string | null): Promise<boolean> {
  if (!stored) return false;
  const [scheme, saltHex, hashHex] = stored.split('$');
  if (scheme !== 'scrypt' || !saltHex || !hashHex) return false;

  const expected = Buffer.from(hashHex, 'hex');
  const actual = await scryptAsync(password, Buffer.from(saltHex, 'hex'), expected.length);
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

/* ── 세션 쿠키 ──────────────────────────────────────────────────────────── */

/** `<memberId>.<만료시각>.<서명>` — 서명이 맞아야만 믿습니다. */
function signCookie(memberId: string, expiresAt: number): string {
  const body = `${memberId}.${expiresAt}`;
  const mac = createHmac('sha256', secret()).update(body).digest('base64url');
  return `${body}.${mac}`;
}

function readCookie(value: string): string | null {
  const parts = value.split('.');
  if (parts.length !== 3) return null;
  const [memberId, expiresRaw, mac] = parts;

  const expected = createHmac('sha256', secret()).update(`${memberId}.${expiresRaw}`).digest('base64url');
  const a = Buffer.from(mac);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;

  const expiresAt = Number(expiresRaw);
  if (!Number.isFinite(expiresAt) || expiresAt < Date.now()) return null;

  return memberId;
}

export async function startSession(memberId: string) {
  const expiresAt = Date.now() + MAX_AGE_SEC * 1000;
  const store = await cookies();
  store.set(OPS_COOKIE, signCookie(memberId, expiresAt), {
    httpOnly: true,
    // 개발 중에만 예외 — 사파리는 http://localhost 에서 Secure 쿠키를 저장하지 않습니다.
    // (스토어 쪽 lib/session.ts 와 같은 이유입니다)
    secure: process.env.NODE_ENV !== 'development',
    sameSite: 'lax',
    path: '/',
    maxAge: MAX_AGE_SEC,
  });
}

export async function endSession() {
  const store = await cookies();
  store.delete(OPS_COOKIE);
}

/**
 * 존재하지 않는 계정에 맞서 돌릴 해시 한 줄.
 * 무작위 비밀번호로 만든 것이라 어떤 입력과도 맞지 않습니다.
 */
const DUMMY_HASH =
  'scrypt$00000000000000000000000000000000$' + '0'.repeat(128);

export type Member = { id: string; email: string; name: string };

/**
 * 지금 보고 있는 사람. 로그인하지 않았으면 null.
 *
 * ⚠️ 서버 액션은 화면을 거치지 않고 POST 로 직접 부를 수 있습니다.
 *    proxy.ts 가 /ops 를 막는 것만으로는 부족해서, 모든 서버 액션이
 *    맨 앞에서 requireMember() 를 부릅니다.
 */
export async function currentMember(): Promise<Member | null> {
  const store = await cookies();
  const raw = store.get(OPS_COOKIE)?.value;
  if (!raw) return null;

  const memberId = readCookie(raw);
  if (!memberId) return null;

  const rows = await sql<Member[]>`
    select id, email, name from members where id = ${memberId} limit 1
  `;
  return rows[0] ?? null;
}

/** 로그인하지 않았으면 던집니다. 쓰기 동작은 전부 이걸로 시작합니다. */
export async function requireMember(): Promise<Member> {
  const member = await currentMember();
  if (!member) throw new Error('로그인이 필요합니다.');
  return member;
}

/** 이메일과 비밀번호로 찾기. 맞지 않으면 null — 어느 쪽이 틀렸는지 알려 주지 않습니다. */
export async function findMemberByLogin(email: string, password: string): Promise<Member | null> {
  const rows = await sql<{ id: string; email: string; name: string; password_hash: string | null }[]>`
    select id, email, name, password_hash
    from members
    where lower(email) = lower(${email.trim()})
    limit 1
  `;
  const row = rows[0];

  /**
   * 없는 이메일이어도 scrypt 를 한 번 돌립니다.
   *
   * 그냥 early return 하면 "없는 계정"은 즉시, "있는 계정"은 해시 계산만큼
   * 느리게 답합니다. 그 차이로 누가 이 보드를 쓰는지 알아낼 수 있습니다.
   * 아래 DUMMY_HASH 는 아무도 모르는 비밀번호의 해시라 절대 맞지 않습니다.
   */
  const ok = await verifyPassword(password, row?.password_hash ?? DUMMY_HASH);
  if (!row || !row.password_hash || !ok) return null;
  return { id: row.id, email: row.email, name: row.name };
}
