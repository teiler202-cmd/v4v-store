/**
 * 노션에서 빼낸 JSON 을 데이터베이스로 옮깁니다.
 *
 *   node --env-file=.env.local scripts/ops-seed.mjs
 *
 * 여러 번 돌려도 안전합니다 — 같은 id 면 덮어씁니다.
 *
 * ── 왜 노션 id 를 그대로 쓰는가 ─────────────────────────────────────────
 * 노션의 페이지 id 는 32자리 16진수이고, 그건 UUID 에서 하이픈만 뺀 모양입니다.
 * 하이픈을 도로 끼우면 그대로 기본키로 쓸 수 있습니다. 그러면
 *  (1) 목표↔할 일 같은 연결을 새 id 로 다시 이어 줄 필요가 없고
 *  (2) 옮긴 뒤에도 노션 쪽 원본을 id 로 찾아볼 수 있으며
 *  (3) 스크립트를 두 번 돌려도 행이 두 벌 생기지 않습니다.
 */

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import postgres from 'postgres';

const here = dirname(fileURLToPath(import.meta.url));
const dir = join(here, '..', 'ops-migration', 'notion');

const url = process.env.OPS_DATABASE_URL;
if (!url) {
  console.error('OPS_DATABASE_URL 이 없습니다. node --env-file=.env.local 로 실행하세요.');
  process.exit(1);
}

const sql = postgres(url, { prepare: false, max: 1 });

/** '3d5f3e8bd744812e...' → '3d5f3e8b-d744-812e-...' */
const uuid = (id) =>
  id.includes('-') ? id
  : `${id.slice(0,8)}-${id.slice(8,12)}-${id.slice(12,16)}-${id.slice(16,20)}-${id.slice(20)}`;

const read = (name) => JSON.parse(readFileSync(join(dir, name), 'utf8'));
const nz = (v) => (v === '' || v === undefined ? null : v);

const counts = {};
const bump = (k, n = 1) => { counts[k] = (counts[k] ?? 0) + n; };

try {
  // ── 비전 ──────────────────────────────────────────────────────────────
  const visions = read('vision.json');
  for (const [index, v] of visions.entries()) {
    await sql`
      insert into visions (id, title, one_liner, metric, target, current, due, status, sort)
      values (${uuid(v.url.split('/').pop())}, ${v['비전']}, ${nz(v['한 줄'])}, ${nz(v['지표'])},
              ${nz(v['목표값'])}, ${nz(v['현재'])}, ${nz(v['기한'])}, ${v['상태']}, ${index})
      on conflict (id) do update set
        title = excluded.title, one_liner = excluded.one_liner, metric = excluded.metric,
        target = excluded.target, current = excluded.current, due = excluded.due,
        status = excluded.status, sort = excluded.sort
    `;
    bump('비전');
  }

  // ── 목표 ──────────────────────────────────────────────────────────────
  // 비전보다 뒤에 넣습니다 — 앞선 표가 있어야 외래키가 붙습니다.
  for (const g of read('goals.json')) {
    await sql`
      insert into goals (id, title, done_when, area, status, priority, due, done_on, result, note, vision_id)
      values (${uuid(g.id)}, ${g['목표']}, ${nz(g['완료 조건'])}, ${nz(g['영역'])}, ${g['상태']},
              ${nz(g['우선순위'])}, ${nz(g['기한'])}, ${nz(g['완료일'])}, ${nz(g['결과'])}, ${nz(g['메모'])},
              ${g['비전']?.[0] ? uuid(g['비전'][0]) : null})
      on conflict (id) do update set
        title = excluded.title, done_when = excluded.done_when, area = excluded.area,
        status = excluded.status, priority = excluded.priority, due = excluded.due,
        done_on = excluded.done_on, result = excluded.result, note = excluded.note,
        vision_id = excluded.vision_id
    `;
    bump('목표');
  }

  // ── 스타일 ────────────────────────────────────────────────────────────
  // SKU 는 노션이 매긴 번호(2·3·4)를 그대로 씁니다. 다음 번호는 5부터입니다.
  for (const p of read('products.json')) {
    await sql`
      insert into products (id, sku, name, line, kind, stage, cost, price, launch_on, shopify_handle, note)
      values (${uuid(p.id)}, ${p['SKU']}, ${p['스타일명']}, ${nz(p['라인'])}, ${nz(p['품목'])},
              ${p['단계']}, ${p['원가']}, ${p['판매가']}, ${nz(p['출시 예정일'])},
              ${nz(p['Shopify 핸들'])}, ${nz(p['메모'])})
      on conflict (id) do update set
        sku = excluded.sku, name = excluded.name, line = excluded.line, kind = excluded.kind,
        stage = excluded.stage, cost = excluded.cost, price = excluded.price,
        launch_on = excluded.launch_on, shopify_handle = excluded.shopify_handle, note = excluded.note
    `;
    bump('스타일');
  }

  // ── 할 일 ─────────────────────────────────────────────────────────────
  for (const t of read('tasks.json')) {
    await sql`
      insert into tasks (id, title, status, field, priority, due, note, goal_id)
      values (${uuid(t.id)}, ${t['할 일']}, ${t['상태']}, ${nz(t['분야'])}, ${nz(t['우선순위'])},
              ${nz(t['마감일'])}, ${nz(t['메모'])}, ${uuid(t['목표'])})
      on conflict (id) do update set
        title = excluded.title, status = excluded.status, field = excluded.field,
        priority = excluded.priority, due = excluded.due, note = excluded.note,
        goal_id = excluded.goal_id
    `;
    bump('할 일');
  }

  // ── 플레이북 ──────────────────────────────────────────────────────────
  const playbooks = read('playbooks.json');
  for (const p of playbooks) {
    await sql`
      insert into playbooks (id, title, area, status, actor, cadence, tools,
                             trigger_when, input, output, approval, procedure, last_run)
      values (${uuid(p.id)}, ${p['플레이북']}, ${nz(p['영역'])}, ${p['상태']}, ${nz(p['실행 주체'])},
              ${nz(p['주기'])}, ${p['도구'] ?? []}, ${nz(p['트리거'])}, ${nz(p['입력'])},
              ${nz(p['출력'])}, ${nz(p['사람 승인 지점'])}, ${nz(p['절차'] ?? null)}, ${nz(p['마지막 실행'])})
      on conflict (id) do update set
        title = excluded.title, area = excluded.area, status = excluded.status,
        actor = excluded.actor, cadence = excluded.cadence, tools = excluded.tools,
        trigger_when = excluded.trigger_when, input = excluded.input, output = excluded.output,
        approval = excluded.approval, last_run = excluded.last_run,
        -- 절차 본문은 비어 있을 때만 채웁니다. 앱에서 고친 것을 되돌리지 않기 위해서입니다.
        procedure = coalesce(playbooks.procedure, excluded.procedure)
    `;
    bump('플레이북');

    for (const goalId of p['관련 목표'] ?? []) {
      await sql`
        insert into goal_playbooks (goal_id, playbook_id)
        values (${uuid(goalId)}, ${uuid(p.id)})
        on conflict do nothing
      `;
      bump('목표↔플레이북 연결');
    }
  }

  // ── 철학과 메모 ───────────────────────────────────────────────────────
  // DB 가 아니라 보드 페이지의 블록이었던 것들입니다.
  const board = read('board.json');

  await sql`
    insert into settings (key, value) values ('philosophy', ${board.philosophy})
    on conflict (key) do update set value = excluded.value, updated_at = now()
  `;
  bump('철학');

  for (const person of board.members ?? []) {
    if (!person.memo) continue;
    // 사람을 먼저 등록해 두어야 합니다 (npm run ops:member).
    // 아직 없으면 건너뛰고 알려 줍니다 — 없는 사람을 여기서 만들지 않습니다.
    const [member] = await sql`select id from members where name = ${person.name} limit 1`;
    if (!member) {
      console.warn(`⚠️ '${person.name}' 이(가) 아직 등록되지 않아 메모를 옮기지 못했습니다.`);
      console.warn(`   npm run ops:member -- <이메일> '${person.name}' 를 먼저 돌리세요.`);
      continue;
    }
    await sql`
      insert into memos (member_id, body) values (${member.id}, ${person.memo})
      on conflict (member_id) do update set body = excluded.body, updated_at = now()
    `;
    bump('메모');
  }

  // ── 비어 있던 표들 ────────────────────────────────────────────────────
  // 노션에서 Archive · Partners · Ledger · Supply · QC Log 는 행이 0개였습니다.
  // 파일로 남겨 두었으니, 나중에 채워 넣고 다시 돌려도 됩니다.
  for (const [file, label] of [
    ['partners.json', '거래처'], ['ledger.json', '지출'],
    ['supply.json', '살 것'], ['qc_log.json', '검수'], ['archive.json', '작업물'],
  ]) {
    const rows = read(file);
    if (rows.length > 0) {
      console.warn(`⚠️ ${label}(${file}) 에 ${rows.length}행이 있지만 옮기는 코드가 아직 없습니다.`);
    }
  }

  console.log('옮겼습니다:');
  for (const [k, v] of Object.entries(counts)) console.log(`  ${k.padEnd(16)} ${v}`);
} catch (error) {
  console.error('실패:', error.message);
  process.exitCode = 1;
} finally {
  await sql.end();
}
