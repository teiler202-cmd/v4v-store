/**
 * 스키마를 바꾸는 유일한 통로.
 *
 *   npm run ops:migrate -- ops-migration/002-cascade.sql
 *
 * ── 왜 ops:q 로는 안 되는가 ─────────────────────────────────────────────
 * scripts/ops-query.mjs 는 `alter table` 을 막습니다. 일상적으로 묻고 고치는
 * 도구가 표 모양까지 바꿀 수 있으면, 오타 하나가 컬럼을 날립니다.
 *
 * 대신 스키마 변경은 **파일로** 합니다. 파일은 깃에 남고, 리뷰할 수 있고,
 * 다시 돌려도 같은 결과가 나옵니다(`if not exists`). 이 스크립트는 그 파일만
 * 실행합니다 — 명령줄에서 SQL 을 직접 받지 않습니다.
 *
 * 한 트랜잭션으로 돕니다. 중간에서 실패하면 아무것도 바뀌지 않습니다.
 */

import { readFile } from 'node:fs/promises';
import path from 'node:path';
import postgres from 'postgres';

const arg = process.argv[2];
if (!arg) {
  console.error('쓰는 법: npm run ops:migrate -- ops-migration/002-cascade.sql');
  process.exit(1);
}

const file = path.resolve(process.cwd(), arg);
const root = path.resolve(process.cwd(), 'ops-migration');
// 아무 파일이나 실행하지 않습니다 — 마이그레이션은 한 폴더에만 삽니다.
if (!file.startsWith(root + path.sep) || !file.endsWith('.sql')) {
  console.error('ops-migration/ 안의 .sql 파일만 실행합니다.');
  process.exit(1);
}

const url = process.env.OPS_DATABASE_URL;
if (!url) {
  console.error('OPS_DATABASE_URL 이 없습니다. node --env-file=.env.local 로 실행하세요.');
  process.exit(1);
}

const body = await readFile(file, 'utf8');
console.log(`${path.relative(process.cwd(), file)} — ${body.split('\n').length}줄`);

const sql = postgres(url, { prepare: false, max: 1 });
try {
  // .simple() 이라야 한 파일 안의 여러 문장과 do $$ … $$ 블록이 한 번에 돕니다.
  await sql.begin((tx) => [tx.unsafe(body).simple()]);
  console.log('적용했습니다.');
} catch (error) {
  console.error('실패 — 아무것도 바뀌지 않았습니다:', error.message);
  process.exitCode = 1;
} finally {
  await sql.end();
}
