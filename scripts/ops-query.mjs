/**
 * 보드에 SQL 을 직접 물어봅니다 — 사람과 에이전트가 같이 씁니다.
 *
 *   npm run ops:q -- "select title, due from tasks where status <> '완료' order by due"
 *   npm run ops:q -- "update tasks set status='완료' where id='...'"   (--write 필요)
 *
 * ── 왜 이게 필요한가 ────────────────────────────────────────────────────
 * 노션 시절에는 에이전트가 MCP 로 보드를 만졌습니다. 그런데 수식 값이
 * `formulaResult://` 로만 돌아오고, 뷰 종류는 못 바꾸고, 상대 날짜 필터도
 * 없어서 — 간단한 질문 하나에도 여러 번 왕복해야 했습니다.
 *
 * 이제는 그냥 SQL 입니다. 한 번에 답이 나옵니다.
 *
 * ── 안전장치 ────────────────────────────────────────────────────────────
 * 기본은 읽기 전용입니다. 쓰려면 --write 를 붙여야 합니다.
 * 표를 통째로 없애는 명령은 --write 를 붙여도 막습니다 — 그건 실수로
 * 부를 수 있는 종류의 것이 아니고, 정말 필요하면 Supabase 콘솔에서 합니다.
 */

import postgres from 'postgres';

const args = process.argv.slice(2);
const write = args.includes('--write');
const json = args.includes('--json');
const query = args.filter((a) => !a.startsWith('--')).join(' ').trim();

if (!query) {
  console.error('쓰는 법: npm run ops:q -- "select * from tasks limit 5"');
  console.error('         npm run ops:q -- --write "update tasks set status=\'완료\' where id=\'…\'"');
  process.exit(1);
}

const url = process.env.OPS_DATABASE_URL;
if (!url) {
  console.error('OPS_DATABASE_URL 이 없습니다. node --env-file=.env.local 로 실행하세요.');
  process.exit(1);
}

/** 되돌릴 수 없는 것들 — --write 로도 열어 주지 않습니다 */
const FORBIDDEN = /\b(drop|truncate|alter\s+table|create\s+(table|database)|grant|revoke)\b/i;
if (FORBIDDEN.test(query)) {
  console.error('이 명령은 여기서 실행하지 않습니다. 스키마를 바꾸려면 ops-migration/schema.sql 을');
  console.error('고치고 Supabase SQL Editor 에서 실행하세요.');
  process.exit(1);
}

const MUTATES = /^\s*(insert|update|delete)\b/i;
if (MUTATES.test(query) && !write) {
  console.error('쓰는 명령입니다. 확인했다면 --write 를 붙이세요.');
  process.exit(1);
}

const sql = postgres(url, { prepare: false, max: 1 });
try {
  const rows = await sql.unsafe(query);

  if (json) {
    console.log(JSON.stringify(rows, null, 2));
  } else if (rows.length === 0) {
    console.log('(행 없음)');
  } else {
    // 값이 긴 메모가 섞여 있어도 읽히게 — 한 행씩 세로로 씁니다.
    for (const [index, row] of rows.entries()) {
      if (index) console.log('─'.repeat(60));
      for (const [key, value] of Object.entries(row)) {
        if (value === null) continue;
        const text = String(value).replace(/\n/g, '\n' + ' '.repeat(18));
        console.log(`${key.padEnd(16)} ${text}`);
      }
    }
    console.log(`\n${rows.length}행`);
  }
} catch (error) {
  console.error('실패:', error.message);
  process.exitCode = 1;
} finally {
  await sql.end();
}
