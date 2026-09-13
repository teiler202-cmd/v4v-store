'use client';

import { useRouter } from 'next/navigation';
import { useRef, useState, useTransition } from 'react';
import { deleteFile } from '@/app/ops/actions';

export type FileRow = { id: string; filename: string; mime: string; bytes: number };

/**
 * 행에 붙은 파일들.
 *
 * 서버 액션이 아니라 /ops/files 로 직접 보냅니다 — 서버 액션은 요청이 1MB 로
 * 묶여 있고, 그 상한은 사이트 전체 설정이라 스토어까지 같이 풀리기 때문입니다.
 * 우리 서버로 보내는 요청이라 CSP(connect-src 'self')에도 걸리지 않습니다.
 */
export default function Files({
  ownerKey, ownerId, files,
}: {
  ownerKey: 'archive_id' | 'ledger_id' | 'qc_log_id';
  ownerId: string;
  files: FileRow[];
}) {
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [pending, start] = useTransition();

  async function upload(list: FileList | null) {
    if (!list?.length) return;
    setBusy(true);
    setMessage(null);

    // 여러 장을 한 번에 고를 수 있게 하되, 하나씩 보냅니다 —
    // 한 장이 실패해도 나머지는 올라갑니다.
    for (const file of Array.from(list)) {
      const body = new FormData();
      body.set('file', file);
      body.set(ownerKey, ownerId);
      try {
        const response = await fetch('/ops/files', { method: 'POST', body });
        if (!response.ok) {
          const detail = await response.json().catch(() => ({ message: '올리지 못했습니다.' }));
          setMessage(`${file.name} — ${detail.message}`);
        }
      } catch {
        setMessage(`${file.name} — 연결이 끊겼습니다.`);
      }
    }

    setBusy(false);
    if (input.current) input.current.value = '';
    router.refresh();
  }

  return (
    <section>
      <div className="mb-2 flex items-baseline gap-2.5">
        <h2 className="font-grotesk text-[12px] font-bold">파일</h2>
        <span className="font-mono text-[9.5px] text-ash">{files.length}개</span>
      </div>

      {files.length > 0 ? (
        <ul className="mb-2.5 divide-y divide-line-soft border-y border-line-soft">
          {files.map((file) => (
            <li key={file.id} className="flex items-center gap-3 py-2">
              <a
                href={`/ops/files/${file.id}`}
                target="_blank"
                rel="noreferrer"
                className="min-w-0 flex-1 truncate text-[12.5px] underline underline-offset-2 decoration-line hover:decoration-ink"
              >
                {file.filename}
              </a>
              <span className="shrink-0 font-mono text-[9.5px] text-ash">
                {Math.max(1, Math.round(file.bytes / 1024))}KB
              </span>
              <button
                type="button"
                disabled={pending}
                onClick={() => {
                  if (!confirm(`${file.filename} 을(를) 지웁니다. 되돌릴 수 없습니다.`)) return;
                  start(async () => {
                    const result = await deleteFile(file.id);
                    if (!result.ok) setMessage(result.message);
                    router.refresh();
                  });
                }}
                className="shrink-0 font-mono text-[9.5px] text-ash hover:text-[#b42318]"
              >
                지우기
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      <input
        ref={input}
        type="file"
        multiple
        disabled={busy}
        onChange={(event) => upload(event.target.files)}
        className="block w-full font-mono text-[10px] text-ash file:mr-3 file:rounded file:border file:border-line file:bg-paper file:px-3 file:py-1.5 file:font-mono file:text-[10px] file:text-ink"
      />

      {busy ? <p className="mt-1.5 font-mono text-[10px] text-ash">올리는 중…</p> : null}
      {message ? (
        <p role="alert" className="mt-1.5 font-mono text-[10px] text-[#b42318]">{message}</p>
      ) : null}
    </section>
  );
}
