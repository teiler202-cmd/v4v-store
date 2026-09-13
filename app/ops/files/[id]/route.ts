import { NextResponse } from 'next/server';
import { currentMember } from '@/lib/ops/auth';
import { sql } from '@/lib/ops/db';
import { getObject } from '@/lib/ops/storage';

/**
 * 파일 내려주기 — 우리 서버가 중계합니다.
 *
 * Supabase 버킷은 비공개라 브라우저가 직접 열 수 없습니다.
 * 그게 핵심입니다: 견적서·계약서·영수증에 "주소만 알면 열리는" 공개 URL 이
 * 생기지 않습니다. 로그인한 사람만 이 길을 지나갑니다.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const member = await currentMember();
  if (!member) return new NextResponse('로그인이 필요합니다.', { status: 401 });

  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) return new NextResponse('없습니다.', { status: 404 });

  const [file] = await sql<{ storage_path: string; filename: string; mime: string }[]>`
    select storage_path, filename, mime from files where id = ${id} limit 1
  `;
  if (!file) return new NextResponse('없습니다.', { status: 404 });

  const upstream = await getObject(file.storage_path);
  if (!upstream.ok || !upstream.body) {
    console.error('[ops] 파일을 읽지 못했습니다:', file.storage_path, upstream.status);
    return new NextResponse('파일을 읽지 못했습니다.', { status: 502 });
  }

  return new NextResponse(upstream.body, {
    headers: {
      'Content-Type': file.mime,
      // 이미지와 PDF 는 화면에서 바로 열리고, 나머지는 내려받습니다.
      'Content-Disposition':
        `inline; filename*=UTF-8''${encodeURIComponent(file.filename)}`,
      // 로그인한 사람에게만 주는 파일입니다 — 중간 캐시에 남기지 않습니다.
      'Cache-Control': 'private, no-store',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}
