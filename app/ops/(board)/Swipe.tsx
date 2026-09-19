'use client';

import Link from 'next/link';
import { useCallback, useEffect, useRef, useState, useTransition } from 'react';

/**
 * 옆으로 밀면 나오는 행동들 — 완료 · 수정 · 삭제.
 *
 * 지금까지 목표 하나를 끝내려면 카드를 누르고, 화면을 열고, 상태를 고르고, 저장을
 * 눌렀습니다. 네 번입니다. 트랙패드에서 두 손가락으로 왼쪽으로 밀면 그 자리에서
 * 끝나야 합니다 — 맥과 아이폰에서 메일·미리알림이 오래전부터 그렇게 해 왔고,
 * 손이 이미 그 동작을 알고 있습니다.
 *
 * ── 무엇이 제스처를 가져가는가 ─────────────────────────────────────────────
 * 세로로 흐르는 목록에서는 다툼이 없습니다. 가로로 흐르는 줄(Rail) 안에서는
 * 같은 두 손가락 동작이 '줄을 옆으로 미는 것'이기도 합니다. 그래서 줄 안의 카드는
 * 처음 26px 을 줄에게 줍니다. 그만큼 밀고도 계속 밀면 그때 카드가 가져가고,
 * 가져가는 순간 줄을 원래 자리로 되돌립니다 (뒤가 흐르면서 카드가 열리면 멀미가 납니다).
 * 다 열린 뒤에도 계속 밀면 카드가 손을 놓습니다 — 그 사람은 줄을 밀고 싶었던 겁니다.
 *
 * 트랙패드가 없는 손을 위해 카드에는 '⋯' 손잡이가 하나 붙습니다(handle).
 * 제스처는 지름길이지 유일한 길이 아닙니다.
 */

export type SwipeAction = {
  key: string;
  /** 글자는 아주 작게 붙습니다 — 모양만으로 못 알아보는 사람이 있습니다 */
  label: string;
  glyph: string;
  /** 화면을 여는 행동(수정)은 링크입니다 — ⌘+클릭으로 새 탭도 열립니다 */
  href?: string;
  /** 그 자리에서 끝나는 행동(완료·삭제) */
  run?: () => Promise<{ ok: boolean; message?: string }>;
  /** 되돌릴 수 없는 것에는 한 번 묻습니다 */
  confirm?: string;
  tone?: 'danger';
};

const EASE = 'cubic-bezier(0.16,1,0.3,1)';

/** 행동 한 칸의 너비 (가로로 늘어설 때) */
const ACTION_W = 38;
/**
 * 좁은 카드에서는 행동을 세로로 쌓습니다.
 *
 * 196px 짜리 카드에서 세 칸을 가로로 펼치면 114px 을 먹고, 남은 82px 에는
 * 제목이 남지 않습니다 — 무엇을 지우려는지 안 보이는 서랍은 위험합니다.
 * 세로로 쌓으면 46px 만 쓰고 카드의 대부분이 그대로 보입니다.
 */
const STACK_W = 46;
/** 가로로 흐르는 줄 안에서, 카드가 제스처를 가져가기 전에 줄에게 주는 몫 */
const RAIL_TAKEOVER = 26;
/** 줄 밖에서는 거의 바로 가져갑니다 — 다툴 상대가 없습니다 */
const PLAIN_TAKEOVER = 8;
/** 이만큼 조용하면 손가락을 뗀 것으로 봅니다 (휠 이벤트에는 '끝'이 없습니다) */
const IDLE_MS = 120;
/** 다 열린 뒤에도 이만큼 더 밀면 놓아 줍니다 */
const RELEASE = 56;

/**
 * 열려 있는 것은 언제나 하나뿐입니다.
 * 다섯 장이 동시에 열려 있으면 그건 서랍이 아니라 그냥 다른 화면입니다.
 */
const closers = new Set<() => void>();

export default function Swipe({
  actions, rail, stack, handle, children,
}: {
  actions: SwipeAction[];
  /** 가로로 흐르는 줄(Rail) 안인가 */
  rail?: boolean;
  /** 좁은 카드인가 — 행동을 세로로 쌓습니다 */
  stack?: boolean;
  /** 트랙패드 없이도 열 수 있는 '⋯' 손잡이를 붙일지 */
  handle?: boolean;
  children: React.ReactNode;
}) {
  const box = useRef<HTMLDivElement>(null);
  const [offset, setOffset] = useState(0);
  const [sliding, setSliding] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const at = useRef(0);
  const mine = useRef<() => void>(() => {});
  const noteTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const width = stack ? STACK_W : actions.length * ACTION_W;
  const open = offset > width / 2;

  const move = useCallback((next: number) => {
    at.current = next;
    setOffset(next);
  }, []);

  const shut = useCallback(() => { move(0); }, [move]);

  const show = useCallback(() => {
    for (const other of closers) if (other !== mine.current) other();
    move(width);
  }, [move, width]);

  // 나를 닫는 법을 등록해 둡니다 — 다른 카드가 열릴 때 불립니다.
  useEffect(() => {
    const close = () => move(0);
    mine.current = close;
    closers.add(close);
    return () => { closers.delete(close); };
  }, [move]);

  useEffect(() => () => clearTimeout(noteTimer.current), []);

  /* ── 트랙패드 두 손가락 ─────────────────────────────────────────────────── */

  useEffect(() => {
    const el = box.current;
    if (!el) return;

    const track = rail ? el.closest<HTMLElement>('[data-rail]') : null;
    const takeover = rail ? RAIL_TAKEOVER : PLAIN_TAKEOVER;

    let acc = 0;
    /**
     * 손가락이 민 총량. 화면에 보이는 값(at)은 0~width 로 잘리지만 이건 잘리지 않습니다 —
     * 다 열린 뒤에 '얼마나 더 밀었는지'를 알아야 손을 놓아 줄 수 있습니다.
     */
    let raw = 0;
    let owned = false;
    let released = false;
    let trackLeft = 0;
    let idle: ReturnType<typeof setTimeout> | undefined;

    function settle() {
      setSliding(false);
      if (at.current > width / 2) show(); else shut();
      acc = 0;
      raw = at.current > width / 2 ? width : 0;
      owned = false;
      released = false;
    }

    function onWheel(event: WheelEvent) {
      // 세로로 젓는 손은 화면의 것입니다. 여기서 가로세로를 먼저 가릅니다.
      if (Math.abs(event.deltaX) <= Math.abs(event.deltaY)) return;
      if (released) {
        // 손을 놓은 뒤에도 관성은 한동안 계속 옵니다. 그 관성이 다 지나간 뒤에야
        // 제스처가 끝난 것으로 봅니다 — 안 그러면 미끄러지는 도중에 다시 열립니다.
        clearTimeout(idle);
        idle = setTimeout(settle, IDLE_MS);
        return;
      }

      if (!owned) {
        // 이미 열려 있으면 되돌리는 손짓도 우리 것입니다 (문턱을 두면 못 닫습니다).
        if (at.current > 0) {
          owned = true;
          raw = at.current;
        } else {
          if (acc === 0 && track) trackLeft = track.scrollLeft;
          acc += event.deltaX;
          if (acc < takeover) {
            clearTimeout(idle);
            idle = setTimeout(settle, IDLE_MS);
            return;
          }
          owned = true;
          raw = at.current;
          // 가져오면서 줄을 제자리로 — 카드가 열리는 동안 뒤가 흐르지 않게.
          if (track) track.scrollLeft = trackLeft;
        }
        setSliding(true);
      }

      event.preventDefault();

      raw += event.deltaX;
      if (raw > width + RELEASE) {
        // 다 열고도 계속 미는 손 — 카드가 아니라 줄을 밀고 싶었던 것입니다.
        // 시계는 그대로 겁니다. 이걸 빠뜨리면 제스처가 '끝나지' 않아서
        // released 가 영원히 켜진 채로 남고, 그다음부터는 아무리 밀어도 안 열립니다.
        released = true;
        setSliding(false);
        move(0);
        clearTimeout(idle);
        idle = setTimeout(settle, IDLE_MS);
        return;
      }

      move(Math.max(0, Math.min(width, raw)));
      clearTimeout(idle);
      idle = setTimeout(settle, IDLE_MS);
    }

    // passive: false 여야 preventDefault 가 먹습니다 (기본값은 passive 입니다).
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => {
      el.removeEventListener('wheel', onWheel);
      clearTimeout(idle);
    };
  }, [rail, width, move, show, shut]);

  /* ── 손가락 ─────────────────────────────────────────────────────────────── */

  // 줄 안에서는 손가락을 받지 않습니다 — 그 동작으로 줄을 넘겨야 하니까요.
  const touch = useRef<{ x: number; y: number; from: number; own: boolean } | null>(null);

  function onTouchStart(event: React.TouchEvent) {
    if (rail) return;
    const point = event.touches[0];
    touch.current = { x: point.clientX, y: point.clientY, from: at.current, own: false };
  }

  function onTouchMove(event: React.TouchEvent) {
    const held = touch.current;
    if (!held) return;
    const point = event.touches[0];
    const dx = held.x - point.clientX;           // 왼쪽으로 밀면 양수
    const dy = Math.abs(held.y - point.clientY);

    if (!held.own) {
      if (Math.abs(dx) < 10 || Math.abs(dx) < dy) return;
      held.own = true;
      setSliding(true);
    }
    move(Math.max(0, Math.min(width, held.from + dx)));
  }

  function onTouchEnd() {
    const held = touch.current;
    touch.current = null;
    if (!held?.own) return;
    setSliding(false);
    if (at.current > width / 2) show(); else shut();
  }

  /* ── 열려 있는 동안 ─────────────────────────────────────────────────────── */

  useEffect(() => {
    if (!open) return;
    function onKey(event: KeyboardEvent) { if (event.key === 'Escape') shut(); }
    function onDown(event: PointerEvent) {
      if (!box.current?.contains(event.target as Node)) shut();
    }
    document.addEventListener('keydown', onKey);
    document.addEventListener('pointerdown', onDown);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('pointerdown', onDown);
    };
  }, [open, shut]);

  function fire(action: SwipeAction) {
    if (!action.run) return;
    if (action.confirm && !confirm(action.confirm)) return;
    start(async () => {
      const result = await action.run!();
      if (result.ok) { shut(); return; }
      // 지우지 못한 이유(예: 할 일이 달린 목표)는 그 자리에서 말해 줍니다.
      setNote(result.message ?? '하지 못했습니다.');
      clearTimeout(noteTimer.current);
      noteTimer.current = setTimeout(() => setNote(null), 5000);
    });
  }

  return (
    <div
      ref={box}
      className="relative overflow-hidden"
      style={{ touchAction: rail ? undefined : 'pan-y' }}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      onTouchCancel={onTouchEnd}
    >
      <div
        className="flex items-stretch"
        style={{
          transform: `translateX(${-offset}px)`,
          transition: sliding ? 'none' : `transform 420ms ${EASE}`,
        }}
      >
        {/* 내용 — 열려 있을 때 누르면 먼저 닫힙니다 (아이폰이 그렇게 합니다) */}
        <div
          className="w-full shrink-0"
          onClickCapture={(event) => {
            if (at.current === 0) return;
            event.preventDefault();
            event.stopPropagation();
            shut();
          }}
        >
          {children}
        </div>

        <div
          className={`flex shrink-0 border-l border-line bg-mist ${
            stack ? 'flex-col divide-y divide-line-soft' : 'items-stretch'
          }`}
          style={{ width }}
          aria-hidden={!open}
        >
          {actions.map((action) => {
            // 크기는 style 로 줍니다 — 타일윈드는 실행 중에 만들어지는 클래스를 못 봅니다.
            const look = `flex shrink-0 items-center justify-center transition-colors duration-200 ${
              stack ? 'flex-row gap-1' : 'flex-col gap-0.5'
            } ${
              action.tone === 'danger'
                ? 'text-ash hover:bg-[#b42318] hover:text-paper'
                : 'text-ash hover:bg-ink hover:text-paper'
            } ${pending ? 'opacity-40' : ''}`;
            const size = stack
              ? { width: '100%', flex: '1 1 0' }
              : { width: ACTION_W };
            const inner = (
              <>
                <span className={stack ? 'text-[10px] leading-none' : 'text-[12px] leading-none'}>
                  {action.glyph}
                </span>
                <span className="font-mono text-[7.5px] tracking-[0.06em]">{action.label}</span>
              </>
            );

            return action.href ? (
              <Link
                key={action.key}
                href={action.href}
                tabIndex={open ? 0 : -1}
                style={size}
                className={look}
              >
                {inner}
              </Link>
            ) : (
              <button
                key={action.key}
                type="button"
                disabled={pending}
                tabIndex={open ? 0 : -1}
                onClick={() => fire(action)}
                style={size}
                className={look}
              >
                {inner}
              </button>
            );
          })}
        </div>
      </div>

      {/* 트랙패드가 없는 손을 위한 손잡이 */}
      {handle && !open ? (
        <button
          type="button"
          aria-label="이 카드로 할 수 있는 것"
          onClick={show}
          className="absolute right-1 top-1 rounded px-1 font-mono text-[10px] leading-none text-ash opacity-0 transition-opacity duration-200 hover:text-ink focus-visible:opacity-100 group-hover:opacity-100"
        >
          ⋯
        </button>
      ) : null}

      {note ? (
        <p
          role="status"
          className="absolute inset-x-0 bottom-0 bg-[#b42318] px-2 py-1 text-center font-mono text-[8.5px] leading-[1.5] text-paper"
        >
          {note}
        </p>
      ) : null}
    </div>
  );
}
