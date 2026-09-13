/**
 * 보드에 사람을 등록하고 비밀번호를 정합니다.
 *
 *   node --env-file=.env.local scripts/ops-member.mjs <이메일> <이름>
 *
 * 같은 이메일로 다시 돌리면 비밀번호만 바뀝니다 — 이게 곧 재설정입니다.
 *
 * 가입 화면도 재설정 메일도 만들지 않은 이유: 쓰는 사람이 둘입니다.
 * 그 화면들은 코드도 늘리고 뚫릴 구멍도 늘립니다.
 */

import { randomBytes, scrypt } from 'node:crypto';
import { promisify } from 'node:util';
import postgres from 'postgres';

const scryptAsync = promisify(scrypt);

const [, , email, ...nameParts] = process.argv;
const name = nameParts.join(' ').trim();

if (!email || !name) {
  console.error('쓰는 법: node --env-file=.env.local scripts/ops-member.mjs <이메일> <이름>');
  process.exit(1);
}

const url = process.env.OPS_DATABASE_URL;
if (!url) {
  console.error('OPS_DATABASE_URL 이 없습니다. node --env-file=.env.local 로 실행하세요.');
  process.exit(1);
}

/**
 * 비밀번호를 화면에 남기지 않고 받습니다.
 *
 * ⚠️ 처음에는 readline 의 출력 통로(_writeToOutput)를 가로채는 방법을 썼는데,
 *    글자를 칠 때마다 readline 이 "프롬프트 + 지금까지 친 글자"를 통째로 다시 그리는 바람에
 *    비밀번호가 터미널에 그대로 찍혔습니다. 실제로 한 번 노출됐습니다.
 *
 *    그래서 readline 을 쓰지 않습니다. 입력을 raw 모드로 바꿔 글자를 직접 받고,
 *    받은 글자는 화면에 아무것도 쓰지 않습니다. 터미널이 대신 그려 줄 기회가 없습니다.
 */
function askHidden(question) {
  return new Promise((resolve) => {
    const { stdin, stdout } = process;

    if (!stdin.isTTY) {
      console.error('\n터미널에서 직접 실행하세요 (입력을 가릴 수 없는 환경입니다).');
      process.exit(1);
    }

    stdout.write(question);

    const wasRaw = stdin.isRaw;
    stdin.setRawMode(true);
    stdin.resume();
    stdin.setEncoding('utf8');

    let value = '';

    const done = () => {
      stdin.setRawMode(wasRaw);
      stdin.pause();
      stdin.removeListener('data', onData);
      stdout.write('\n');
      resolve(value);
    };

    const onData = (chunk) => {
      // 붙여넣기는 한 덩어리로 들어옵니다 — 글자 단위로 훑습니다.
      for (const ch of chunk) {
        if (ch === '\r' || ch === '\n' || ch === '') return done();
        if (ch === '') {            // Ctrl-C
          stdin.setRawMode(wasRaw);
          stdout.write('\n취소했습니다.\n');
          process.exit(130);
        }
        if (ch === '' || ch === '\b') {   // 지우기
          value = value.slice(0, -1);
          continue;
        }
        // 화살표·기능키 같은 제어 문자는 버립니다.
        if (ch < ' ') continue;
        value += ch;
      }
    };

    stdin.on('data', onData);
  });
}

const password = await askHidden('비밀번호 (10자 이상, 화면에 보이지 않습니다): ');
if (password.length < 10) {
  console.error('너무 짧습니다. 10자 이상으로 정하세요.');
  process.exit(1);
}

const again = await askHidden('한 번 더: ');
if (password !== again) {
  console.error('두 번 입력한 값이 다릅니다.');
  process.exit(1);
}

const salt = randomBytes(16);
const key = await scryptAsync(password, salt, 64);
const hash = `scrypt$${salt.toString('hex')}$${key.toString('hex')}`;

const sql = postgres(url, { prepare: false, max: 1 });
try {
  const [row] = await sql`
    insert into members (email, name, password_hash)
    values (${email.trim().toLowerCase()}, ${name}, ${hash})
    on conflict (email) do update set name = excluded.name, password_hash = excluded.password_hash
    returning id, email, name
  `;
  // 메모 칸도 함께 만들어 둡니다 — 보드에 빈 칸이 바로 보이게.
  await sql`insert into memos (member_id, body) values (${row.id}, '') on conflict do nothing`;
  console.log(`준비됐습니다: ${row.name} <${row.email}>`);
} catch (error) {
  console.error('실패:', error.message);
  process.exitCode = 1;
} finally {
  await sql.end();
}
