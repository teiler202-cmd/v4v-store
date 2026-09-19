'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useTransition } from 'react';

/**
 * 스스로 새로 고치는 화면.
 *
 * 둘이서 쓰는 보드입니다. 상대가 방금 무엇을 잡았는지, 무엇을 끝냈는지가
 * 내 화면에 나타나지 않으면 '지금 누가 무엇을'이라는 질문은 여전히 말로 물어야 합니다.
 *
 * 웹소켓을 놓지 않았습니다. 사람이 둘이고, 서버 컴포넌트를 한 번 다시 그리는 비용은
 * 질의 몇 개입니다 — 연결을 계속 붙들고 있는 것보다 이 편이 고칠 곳이 적습니다.
 *
 * 보고 있지 않은 탭은 새로 고치지 않습니다. 창을 하루 종일 열어 두는 화면이라,
 * 그 규칙이 없으면 아무도 안 보는 사이에 질의만 쌓입니다.
 */
export default function Live({ every = 20_000 }: { every?: number }) {
  const router = useRouter();
  const [pending, start] = useTransition();

  useEffect(() => {
    function tick() {
      if (document.visibilityState !== 'visible') return;
      start(() => { router.refresh(); });
    }

    const timer = setInterval(tick, every);
    // 다른 일을 하다 돌아왔을 때는 기다리지 않고 바로 맞춥니다.
    document.addEventListener('visibilitychange', tick);
    window.addEventListener('focus', tick);
    return () => {
      clearInterval(timer);
      document.removeEventListener('visibilitychange', tick);
      window.removeEventListener('focus', tick);
    };
  }, [every, router]);

  return (
    <span className="flex items-center gap-1 font-mono text-[8px] uppercase tracking-[0.16em] text-ash">
      <span
        className={`h-[4px] w-[4px] rounded-full transition-all duration-500 ${
          pending ? 'scale-125 bg-ink' : 'bg-ink/30'
        }`}
      />
      Live
    </span>
  );
}
