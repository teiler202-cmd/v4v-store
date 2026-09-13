'use client';

import { useTransition } from 'react';
import { setTaskStatus } from '../actions';

/**
 * 보드에서 할 일을 끝내는 네모 한 칸.
 *
 * 끝난 일을 지우지 않는 것이 이 보드의 규칙입니다 — 상태만 바꿉니다.
 * 되돌리기도 같은 자리에서 되게 해 뒀습니다 (잘못 눌렀을 때 당황하지 않게).
 */
export default function TaskStatus({ id, status }: { id: string; status: string }) {
  const [pending, start] = useTransition();
  const done = status === '완료';

  return (
    <button
      type="button"
      aria-label={done ? '아직 안 끝난 것으로' : '끝낸 것으로'}
      disabled={pending}
      onClick={() => start(async () => { await setTaskStatus(id, done ? '진행중' : '완료'); })}
      className={`grid h-[17px] w-[17px] shrink-0 place-items-center rounded-full border transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
        done ? 'border-ink bg-ink text-paper' : 'border-line hover:border-ink hover:scale-110'
      } ${pending ? 'opacity-40' : ''}`}
    >
      <span className={`text-[9px] leading-none transition-opacity duration-200 ${done ? 'opacity-100' : 'opacity-0'}`}>✓</span>
    </button>
  );
}
