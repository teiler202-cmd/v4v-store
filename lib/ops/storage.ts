import 'server-only';

/**
 * 파일 보관 — Supabase Storage 의 비공개 버킷.
 *
 * ── 왜 SDK 를 안 쓰는가 ─────────────────────────────────────────────────
 * @supabase/supabase-js 는 이 파일이 하는 일(올리기·내려받기·지우기)에 비해
 * 너무 큽니다. Storage 는 그냥 REST 라서 fetch 세 번이면 끝납니다.
 * 스토어 쪽에서 쇼피파이 GraphQL 을 직접 부르는 것과 같은 이유입니다.
 *
 * ── 왜 비공개 버킷인가 ──────────────────────────────────────────────────
 * 견적서·계약서·영수증이 주소만 알면 열리는 공개 URL 에 있으면 안 됩니다.
 * 버킷을 비공개로 두고, 우리 서버가 /ops/files/<id> 로 중계합니다.
 * 그래서 로그인한 사람만 파일을 봅니다.
 *
 * 덤으로 CSP 도 그대로 둘 수 있습니다 — next.config.ts 의 img-src 는
 * 'self' 와 쇼피파이 CDN 뿐이라, *.supabase.co 주소를 화면에 직접 걸면
 * 이미지가 아예 뜨지 않습니다.
 */

export const OPS_BUCKET = 'ops';

/** 올릴 수 있는 것. 목록에 없는 종류는 받지 않습니다. */
export const ALLOWED_MIME = new Set([
  'image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/avif',
  'application/pdf',
  'text/plain', 'text/csv', 'text/markdown',
  'application/zip',
  'video/mp4', 'video/quicktime',
]);

/** 한 파일의 상한. 휴대폰으로 찍은 영수증·검수 사진이 넉넉히 들어갑니다. */
export const MAX_BYTES = 25 * 1024 * 1024;

export function hasStorageConfig() {
  return Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_KEY);
}

function base() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY;
  if (!url || !key) throw new Error('SUPABASE_URL / SUPABASE_SERVICE_KEY 가 없습니다.');
  return { url: url.replace(/\/$/, ''), key };
}

/**
 * 버킷 안에서 쓸 경로.
 *
 * 사용자가 준 파일명을 그대로 쓰지 않습니다 — 한글·공백·`../` 가 섞이면
 * 경로가 깨지거나 엉뚱한 곳을 가리킬 수 있습니다. 사람이 보는 이름은
 * files 표의 filename 컬럼에 따로 두고, 여기서는 무작위 이름만 씁니다.
 */
export function storagePath(kind: 'archive' | 'ledger' | 'qc', id: string, filename: string) {
  const ext = /\.([A-Za-z0-9]{1,8})$/.exec(filename)?.[1]?.toLowerCase() ?? 'bin';
  return `${kind}/${id}/${crypto.randomUUID()}.${ext}`;
}

export async function putObject(path: string, body: ArrayBuffer, mime: string) {
  const { url, key } = base();
  const response = await fetch(`${url}/storage/v1/object/${OPS_BUCKET}/${path}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${key}`,
      'Content-Type': mime,
      // 같은 경로가 이미 있으면 덮지 않고 실패시킵니다 — 무작위 이름이라
      // 부딪힐 일이 없고, 부딪혔다면 그건 버그입니다.
      'x-upsert': 'false',
    },
    body,
  });
  if (!response.ok) {
    console.error('[ops] 업로드 실패:', response.status, await response.text().catch(() => ''));
    throw new Error('파일을 올리지 못했습니다.');
  }
}

export async function getObject(path: string): Promise<Response> {
  const { url, key } = base();
  return fetch(`${url}/storage/v1/object/${OPS_BUCKET}/${path}`, {
    headers: { Authorization: `Bearer ${key}` },
    cache: 'no-store',
  });
}

export async function removeObject(path: string) {
  const { url, key } = base();
  const response = await fetch(`${url}/storage/v1/object/${OPS_BUCKET}/${path}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${key}` },
  });
  // 이미 없는 파일을 지우려는 것은 오류가 아닙니다.
  if (!response.ok && response.status !== 404) {
    console.error('[ops] 파일 삭제 실패:', response.status);
  }
}
