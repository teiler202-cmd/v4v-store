import 'server-only';
import { readFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';
import { parseFrontmatter, type Doc } from './markdown';

/**
 * 영역 문서 — 브랜드 정의, 톤앤매너, 검수 기준 같은 '사람이 쓰는 산문'.
 *
 * ── 왜 데이터베이스가 아니라 파일인가 ───────────────────────────────────
 * 이 글들은 표가 아닙니다. 행으로 쪼갤 수 없고, 한 번 쓰고 가끔 고치는 글입니다.
 * 저장소에 두면 깃 히스토리가 그대로 판본 기록이 됩니다 — 브랜드 정의가
 * 언제 왜 바뀌었는지 `git log` 로 볼 수 있습니다. 노션의 '페이지 기록'보다
 * 낫고, 무엇보다 에이전트가 파일로 바로 읽습니다.
 *
 * 노션 시절 규칙 그대로입니다: **섹션 페이지 본문은 사람 소유.**
 * 요청 없이 고치지 않습니다. 그래서 앱에서는 읽기만 하고, 고치는 것은
 * 편집기에서 파일을 여는 것입니다.
 */

const DIR = join(process.cwd(), 'content', 'ops');

export async function listDocs(): Promise<Doc[]> {
  const files = await readdir(DIR);
  const docs = await Promise.all(
    files
      .filter((name) => name.endsWith('.md'))
      .map(async (name) => {
        const slug = name.replace(/\.md$/, '');
        return parseFrontmatter(slug, await readFile(join(DIR, name), 'utf8'));
      })
  );
  return docs.sort((a, b) => a.order - b.order);
}

export async function getDoc(slug: string): Promise<Doc | null> {
  // 주소에서 온 값이 파일 경로가 됩니다 — '../' 같은 것이 섞이면
  // 저장소의 아무 파일이나 읽힐 수 있습니다. 글자를 좁게 제한합니다.
  if (!/^[a-z0-9-]{1,40}$/.test(slug)) return null;

  try {
    return parseFrontmatter(slug, await readFile(join(DIR, `${slug}.md`), 'utf8'));
  } catch {
    return null;
  }
}
