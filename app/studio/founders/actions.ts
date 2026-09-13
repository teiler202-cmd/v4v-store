'use server';

/**
 * 창립 50인 콘솔의 서버 동작.
 *
 * ⚠️ 서버 액션은 화면을 거치지 않고 POST 로 직접 호출할 수 있습니다.
 *    페이지에서 notFound() 로 막는 것만으로는 부족해서,
 *    여기서도 매번 개발 환경인지 다시 확인합니다.
 *    (이 액션들은 실제 스토어의 할인과 고객 태그를 바꿉니다)
 */

import {
  FOUNDER_LIMIT,
  findProductByHandle,
  issueCredit,
  listBuyers,
  toCsv,
  type FounderBuyer,
  type IssuedCredit,
  type ProductBrief,
} from '@/lib/founder';

function devOnly() {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('founder console is development-only');
  }
}

export type ScanResult =
  | { ok: true; product: ProductBrief; buyers: FounderBuyer[]; scanned: number }
  | { ok: false; message: string };

/** 상품 핸들을 받아 그 상품을 산 사람들을 순서대로 돌려줍니다 */
export async function scanBuyers(handle: string): Promise<ScanResult> {
  devOnly();

  const product = await findProductByHandle(handle);
  if (!product) {
    return { ok: false, message: `'${handle}' 상품을 찾지 못했습니다. 핸들을 확인하세요.` };
  }

  const result = await listBuyers(product.id);
  if (!result.ok) return result;

  return { ok: true, product, buyers: result.buyers, scanned: result.scanned };
}

export type IssueSummary = {
  credits: IssuedCredit[];
  failures: { email: string; message: string }[];
  csv: string;
};

/**
 * 아직 기록되지 않은 사람들에게 순서대로 번호를 매기고 코드를 발급합니다.
 *
 * `startNumber` 는 '다음에 줄 번호'입니다. 이미 1~12번을 발급했다면 13을 넣으세요.
 * 이미 태그가 달린 사람(alreadyTagged)은 건너뜁니다 — 두 번 주지 않기 위해서입니다.
 *
 * 한 명씩 순서대로 처리합니다. 동시에 쏘면 쇼피파이 API 한도에 걸리고,
 * 무엇보다 번호가 뒤섞입니다. 50명이면 몇 초 더 걸릴 뿐입니다.
 */
export async function issueCredits(
  buyers: FounderBuyer[],
  startNumber: number
): Promise<IssueSummary> {
  devOnly();

  const credits: IssuedCredit[] = [];
  const failures: { email: string; message: string }[] = [];
  let next = Math.max(1, Math.floor(startNumber) || 1);

  for (const buyer of buyers) {
    if (next > FOUNDER_LIMIT) {
      failures.push({ email: buyer.email, message: `정원 ${FOUNDER_LIMIT}명을 넘었습니다.` });
      continue;
    }
    if (buyer.alreadyTagged) {
      failures.push({ email: buyer.email, message: '이미 창립 멤버로 기록돼 있어 건너뜁니다.' });
      continue;
    }

    const outcome = await issueCredit(buyer, next);
    if (outcome.ok) {
      credits.push(outcome.credit);
      next += 1;
    } else {
      failures.push({ email: outcome.email, message: outcome.message });
    }
  }

  return { credits, failures, csv: toCsv(credits) };
}
