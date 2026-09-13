'use client';

import { useState, useTransition } from 'react';
import CopyBlock from '@/components/CopyBlock';
import { issueCredits, scanBuyers, type IssueSummary } from './actions';
import type { FounderBuyer, ProductBrief } from '@/lib/founder';

const field =
  'w-full border-0 border-b border-line bg-transparent pb-2.5 pt-1 font-mono text-[12px] tracking-[0.02em] text-ink outline-none transition-colors duration-500 placeholder:text-ash/50 focus:border-ink';
const label = 'font-mono text-[8.5px] uppercase tracking-[0.24em] text-ash';
const solid =
  'bg-ink px-6 py-3 font-mono text-[9px] uppercase tracking-[0.24em] text-paper transition-opacity duration-500 ease-silk hover:opacity-80 disabled:opacity-30';
const ghost =
  'border border-line px-6 py-3 font-mono text-[9px] uppercase tracking-[0.24em] text-ink transition-colors duration-500 hover:border-ink disabled:opacity-30';

function formatDate(iso: string) {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('ko-KR', {
    year: '2-digit',
    month: '2-digit',
    day: '2-digit',
  });
}

export default function FounderConsole({
  limit,
  collectionHandle,
  configured,
}: {
  limit: number;
  collectionHandle: string;
  configured: boolean;
}) {
  const [handle, setHandle] = useState('');
  const [startNumber, setStartNumber] = useState('1');
  const [product, setProduct] = useState<ProductBrief | null>(null);
  const [buyers, setBuyers] = useState<FounderBuyer[]>([]);
  const [scanned, setScanned] = useState(0);
  const [summary, setSummary] = useState<IssueSummary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [pending, startTransition] = useTransition();

  /** 아직 코드를 받지 않은 사람만이 발급 대상입니다 */
  const pendingBuyers = buyers.filter((b) => !b.alreadyTagged);

  const scan = () => {
    setError(null);
    setSummary(null);
    setConfirming(false);
    startTransition(async () => {
      const result = await scanBuyers(handle);
      if (!result.ok) {
        setError(result.message);
        setProduct(null);
        setBuyers([]);
        return;
      }
      setProduct(result.product);
      setBuyers(result.buyers);
      setScanned(result.scanned);
    });
  };

  const issue = () => {
    setError(null);
    setConfirming(false);
    startTransition(async () => {
      const result = await issueCredits(pendingBuyers, Number(startNumber) || 1);
      setSummary(result);
      // 발급된 사람은 목록에서 '기록됨'으로 바뀝니다 — 두 번 누르는 사고를 막습니다.
      const issued = new Set(result.credits.map((c) => c.customerId));
      setBuyers((prev) =>
        prev.map((b) => (issued.has(b.customerId) ? { ...b, alreadyTagged: true } : b))
      );
    });
  };

  return (
    <div className="flex flex-col gap-14">
      {/* ---------- 설정 상태 ---------- */}
      <section className="flex flex-col gap-3 border border-line px-6 py-5">
        <span className={label}>Configuration</span>
        <ul className="flex flex-col gap-1.5 font-mono text-[10px] leading-[1.7] text-ash">
          <li>
            Admin API — {configured ? '연결됨' : '토큰 없음 (SHOPIFY_ADMIN_ACCESS_TOKEN)'}
          </li>
          <li>정원 — {limit}명</li>
          <li>
            무료 대상 —{' '}
            {collectionHandle
              ? `컬렉션 '${collectionHandle}' 안의 상품 1개`
              : '전 품목 중 아무거나 1개 (V4V_FOUNDER_COLLECTION_HANDLE 로 좁힐 수 있음)'}
          </li>
          <li>유효 기간 — 무기한</li>
        </ul>
        {!configured && (
          <p className="font-mono text-[10px] leading-[1.7] text-ink">
            토큰에 read_orders · write_discounts · write_customers 권한이 필요합니다.
            범위를 바꿨다면 토큰을 다시 발급받아야 적용됩니다.
          </p>
        )}
      </section>

      {/* ---------- 1단계 ---------- */}
      <section className="flex flex-col gap-6">
        <div className="flex flex-col gap-1">
          <span className={label}>Step 01 — 구매자 찾기</span>
          <p className="font-mono text-[10px] leading-[1.8] text-ash">
            첫 티셔츠의 상품 핸들을 넣으세요. 주소 /products/ 뒤에 오는 이름입니다.
          </p>
        </div>

        <div className="flex flex-col gap-4 md:flex-row md:items-end md:gap-6">
          <div className="flex flex-1 flex-col gap-2">
            <label className={label} htmlFor="handle">
              Product handle
            </label>
            <input
              id="handle"
              value={handle}
              onChange={(e) => setHandle(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handle.trim() && scan()}
              placeholder="midbar-slub-tee"
              className={field}
              autoComplete="off"
              spellCheck={false}
            />
          </div>
          <button onClick={scan} disabled={pending || !handle.trim()} className={solid}>
            {pending ? 'Working…' : 'Scan'}
          </button>
        </div>

        {error && (
          <p className="border-l border-ink pl-4 font-mono text-[10px] leading-[1.8] text-ink">
            {error}
          </p>
        )}

        {product && (
          <div className="flex flex-col gap-4">
            <p className="font-mono text-[10px] leading-[1.8] text-ash">
              {product.title} — 주문 {scanned}건을 훑어 구매자 {buyers.length}명을 찾았습니다
              {buyers.length > pendingBuyers.length &&
                ` (이미 기록된 ${buyers.length - pendingBuyers.length}명 제외)`}
              .
            </p>

            {buyers.length > 0 && (
              <div className="overflow-x-auto border-t border-line-soft">
                <table className="w-full min-w-[560px] font-mono text-[10px]">
                  <thead>
                    <tr className="border-b border-line-soft text-left text-ash">
                      <th className="py-2.5 pr-4 font-normal">#</th>
                      <th className="py-2.5 pr-4 font-normal">Email</th>
                      <th className="py-2.5 pr-4 font-normal">Name</th>
                      <th className="py-2.5 pr-4 font-normal">Order</th>
                      <th className="py-2.5 pr-4 font-normal">Date</th>
                      <th className="py-2.5 font-normal">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {buyers.map((buyer, index) => (
                      <tr key={buyer.customerId} className="border-b border-line-soft">
                        <td className="py-2.5 pr-4 tabular-nums text-ash">{index + 1}</td>
                        <td className="py-2.5 pr-4 text-ink">{buyer.email}</td>
                        <td className="py-2.5 pr-4 text-ash">{buyer.name || '—'}</td>
                        <td className="py-2.5 pr-4 text-ash">{buyer.orderName}</td>
                        <td className="py-2.5 pr-4 tabular-nums text-ash">
                          {formatDate(buyer.orderedAt)}
                        </td>
                        <td className="py-2.5 text-ash">
                          {buyer.alreadyTagged ? '기록됨' : '대기'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </section>

      {/* ---------- 2단계 ---------- */}
      {pendingBuyers.length > 0 && (
        <section className="flex flex-col gap-6 border-t border-line pt-12">
          <div className="flex flex-col gap-1">
            <span className={label}>Step 02 — 보증 수표 발급</span>
            <p className="font-mono text-[10px] leading-[1.8] text-ash">
              {pendingBuyers.length}명에게 만료 없는 무료 코드를 하나씩 만듭니다. 주문이 이른
              순서로 번호가 붙습니다. 실제 스토어가 바뀌는 작업이며 되돌리려면 쇼피파이
              관리자에서 할인을 직접 지워야 합니다.
            </p>
          </div>

          <div className="flex flex-col gap-4 md:flex-row md:items-end md:gap-6">
            <div className="flex w-full flex-col gap-2 md:w-40">
              <label className={label} htmlFor="start">
                Start at No.
              </label>
              <input
                id="start"
                value={startNumber}
                onChange={(e) => setStartNumber(e.target.value.replace(/\D/g, ''))}
                inputMode="numeric"
                className={field}
              />
            </div>

            {confirming ? (
              <div className="flex flex-wrap items-center gap-3">
                <span className="font-mono text-[10px] text-ink">
                  {pendingBuyers.length}명에게 발급합니다. 진행할까요?
                </span>
                <button onClick={issue} disabled={pending} className={solid}>
                  {pending ? 'Issuing…' : 'Confirm'}
                </button>
                <button onClick={() => setConfirming(false)} disabled={pending} className={ghost}>
                  Cancel
                </button>
              </div>
            ) : (
              <button onClick={() => setConfirming(true)} disabled={pending} className={solid}>
                Issue {pendingBuyers.length} credits
              </button>
            )}
          </div>
        </section>
      )}

      {/* ---------- 3단계 ---------- */}
      {summary && (
        <section className="flex flex-col gap-6 border-t border-line pt-12">
          <div className="flex flex-col gap-1">
            <span className={label}>Step 03 — 명부 보관</span>
            <p className="font-mono text-[10px] leading-[1.8] text-ink">
              {summary.credits.length}건 발급 · {summary.failures.length}건 건너뜀. 아래 CSV를
              지금 복사해 사이트 밖에 보관하세요. 훗날 쇼피파이를 떠나더라도 이 명부만 있으면
              약속을 지킬 수 있습니다.
            </p>
          </div>

          {summary.credits.length > 0 && (
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className={label}>founding-50.csv</span>
                <CopyBlock code={summary.csv} label="Copy CSV" />
              </div>
              <pre className="overflow-x-auto border border-line bg-mist px-5 py-4 font-mono text-[10px] leading-[1.9] text-ink">
                {summary.csv}
              </pre>
            </div>
          )}

          {summary.failures.length > 0 && (
            <div className="flex flex-col gap-2">
              <span className={label}>건너뛴 항목</span>
              <ul className="flex flex-col gap-1 font-mono text-[10px] leading-[1.8] text-ash">
                {summary.failures.map((failure, index) => (
                  <li key={`${failure.email}-${index}`}>
                    {failure.email} — {failure.message}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>
      )}
    </div>
  );
}
