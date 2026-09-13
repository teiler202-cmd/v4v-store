import { NextResponse } from 'next/server';
import { currentMember } from '@/lib/ops/auth';
import { sql } from '@/lib/ops/db';
import {
  ALLOWED_MIME, MAX_BYTES, hasStorageConfig, putObject, storagePath,
} from '@/lib/ops/storage';

/**
 * 파일 올리기.
 *
 * 서버 액션이 아니라 라우트 핸들러로 받습니다.
 * 서버 액션의 요청 크기 상한은 기본 1MB 이고, 그걸 올리려면
 * next.config.ts 에서 **사이트 전체**를 올려야 합니다 — 손님이 쓰는
 * 스토어 쪽 액션까지 큰 요청을 받게 되는 건 원치 않습니다.
 * 라우트 핸들러에는 그 상한이 없으니 여기만 크게 받습니다.
 */

/** 어느 표에 붙는 파일인가 — 셋 중 하나입니다 */
const OWNERS = {
  archive_id: 'archive',
  ledger_id: 'ledger',
  qc_log_id: 'qc',
} as const;

export async function POST(request: Request) {
  const member = await currentMember();
  if (!member) return NextResponse.json({ message: '로그인이 필요합니다.' }, { status: 401 });

  if (!hasStorageConfig()) {
    return NextResponse.json(
      { message: 'SUPABASE_URL / SUPABASE_SERVICE_KEY 가 설정되지 않았습니다.' },
      { status: 503 }
    );
  }

  const form = await request.formData();
  const file = form.get('file');
  if (!(file instanceof File)) {
    return NextResponse.json({ message: '파일이 없습니다.' }, { status: 400 });
  }

  // 어느 행에 붙일지 — 정확히 하나여야 합니다 (schema.sql 의 files_one_owner 와 같은 규칙).
  const owners = (Object.keys(OWNERS) as (keyof typeof OWNERS)[])
    .map((key) => [key, form.get(key)] as const)
    .filter(([, value]) => typeof value === 'string' && value);

  if (owners.length !== 1) {
    return NextResponse.json({ message: '어디에 붙일 파일인지 하나만 지정하세요.' }, { status: 400 });
  }
  const [ownerKey, ownerValue] = owners[0];
  const ownerId = String(ownerValue);
  if (!/^[0-9a-f-]{36}$/i.test(ownerId)) {
    return NextResponse.json({ message: '잘못된 연결입니다.' }, { status: 400 });
  }

  if (file.size > MAX_BYTES) {
    return NextResponse.json(
      { message: `파일이 너무 큽니다 (최대 ${Math.round(MAX_BYTES / 1024 / 1024)}MB).` },
      { status: 413 }
    );
  }
  if (!ALLOWED_MIME.has(file.type)) {
    return NextResponse.json({ message: `받지 않는 파일 종류입니다: ${file.type || '알 수 없음'}` }, { status: 415 });
  }

  const path = storagePath(OWNERS[ownerKey], ownerId, file.name);

  try {
    await putObject(path, await file.arrayBuffer(), file.type);

    const [row] = await sql<{ id: string }[]>`
      insert into files (storage_path, filename, mime, bytes, ${sql(ownerKey)}, uploaded_by)
      values (${path}, ${file.name}, ${file.type}, ${file.size}, ${ownerId}, ${member.id})
      returning id
    `;
    return NextResponse.json({ id: row.id, filename: file.name });
  } catch (error) {
    console.error('[ops] 파일 저장 실패:', error);
    return NextResponse.json({ message: '파일을 저장하지 못했습니다.' }, { status: 500 });
  }
}
