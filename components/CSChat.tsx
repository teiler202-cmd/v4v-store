'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

/**
 * 화면 오른쪽 아래에 상주하는 상담 도우미.
 *
 * 사이트의 규칙을 그대로 씁니다 — 각진 모서리, 머리카락 굵기의 선,
 * 모노 대문자 마이크로 라벨, 잉크와 종이 두 색.
 *
 * 답변은 스트리밍으로 받습니다. 한 번에 받아 놓고 보여 주면
 * 3–4초 동안 아무 일도 일어나지 않는 것처럼 보여서, 손님이 창을 닫습니다.
 */

const SILK = [0.16, 1, 0.3, 1] as const;

type Message = { role: 'user' | 'assistant'; content: string };

/** 처음 열었을 때 보여 주는 길잡이 — 무엇을 물어도 되는지 알려 줍니다 */
const QUICK = [
  '배송은 얼마나 걸리나요?',
  '사이즈 교환이 가능한가요?',
  '내 주문은 어디까지 왔나요?',
  '세탁은 어떻게 하나요?',
];

const GREETING =
  '무엇을 도와드릴까요. 배송, 교환, 사이즈, 주문 조회에 대해 물어보실 수 있습니다.';

export default function CSChat() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  // 새 글자가 도착할 때마다 맨 아래를 따라갑니다.
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, busy]);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  // 열려 있는 동안 Esc 로 닫습니다.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  // 화면을 떠날 때 진행 중인 요청을 끊습니다.
  useEffect(() => () => abortRef.current?.abort(), []);

  const send = useCallback(
    async (text: string) => {
      const question = text.trim();
      if (!question || busy) return;

      const history: Message[] = [...messages, { role: 'user', content: question }];
      setMessages([...history, { role: 'assistant', content: '' }]);
      setInput('');
      setBusy(true);

      const controller = new AbortController();
      abortRef.current = controller;

      try {
        const response = await fetch('/api/cs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ messages: history }),
          signal: controller.signal,
        });

        // 도우미가 꺼져 있거나 너무 자주 물은 경우 — 서버가 안내 문구를 줍니다.
        if (!response.ok || !response.body) {
          const data = await response.json().catch(() => null);
          setMessages((prev) => {
            const next = [...prev];
            next[next.length - 1] = {
              role: 'assistant',
              content: data?.message ?? '지금은 답변을 드릴 수 없습니다. 잠시 후 다시 시도해 주세요.',
            };
            return next;
          });
          return;
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let answer = '';

        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          answer += decoder.decode(value, { stream: true });
          setMessages((prev) => {
            const next = [...prev];
            next[next.length - 1] = { role: 'assistant', content: answer };
            return next;
          });
        }
      } catch (error) {
        if ((error as Error)?.name === 'AbortError') return;
        setMessages((prev) => {
          const next = [...prev];
          next[next.length - 1] = {
            role: 'assistant',
            content: '연결이 끊어졌습니다. 잠시 후 다시 시도해 주세요.',
          };
          return next;
        });
      } finally {
        setBusy(false);
        abortRef.current = null;
      }
    },
    [busy, messages]
  );

  return (
    <div className="v4v-chrome pointer-events-none fixed bottom-5 right-5 z-50 flex flex-col items-end gap-3 md:bottom-7 md:right-7">
      <AnimatePresence>
        {open && (
          <motion.section
            key="panel"
            initial={{ opacity: 0, y: 14, filter: 'blur(6px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            exit={{ opacity: 0, y: 10, filter: 'blur(4px)' }}
            transition={{ duration: 0.55, ease: SILK }}
            aria-label="고객 상담"
            className="pointer-events-auto flex h-[min(560px,72vh)] w-[min(380px,calc(100vw-2.5rem))] flex-col border border-line bg-paper shadow-[0_24px_70px_-30px_rgba(11,11,11,0.4)]"
          >
            {/* 머리 */}
            <header className="flex items-start justify-between border-b border-line-soft px-5 py-4">
              <div className="flex flex-col gap-1">
                <p className="font-mono text-[8.5px] uppercase tracking-[0.2em] text-ash">
                  Assistance
                </p>
                <p className="text-[12.5px] tracking-[-0.01em] text-ink">V4V 상담 도우미</p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="상담 창 닫기"
                className="mt-0.5 text-ash transition-opacity duration-500 ease-silk hover:opacity-50"
              >
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.1" aria-hidden>
                  <path d="M6 6 L18 18 M18 6 L6 18" />
                </svg>
              </button>
            </header>

            {/* 대화 */}
            <div
              ref={scrollRef}
              role="log"
              aria-live="polite"
              className="flex-1 overflow-y-auto px-5 py-5"
            >
              <p className="text-[12.5px] font-light leading-[1.85] tracking-[-0.01em] text-ash">
                {GREETING}
              </p>

              {messages.length === 0 && (
                <ul className="mt-5 flex flex-col items-start gap-2">
                  {QUICK.map((q) => (
                    <li key={q}>
                      <button
                        type="button"
                        onClick={() => send(q)}
                        className="border border-line px-3 py-2 text-left text-[11.5px] leading-[1.5] tracking-[-0.01em] text-ink transition-colors duration-500 ease-silk hover:border-ink"
                      >
                        {q}
                      </button>
                    </li>
                  ))}
                </ul>
              )}

              <div className="flex flex-col gap-5 pt-5">
                {messages.map((message, i) =>
                  message.role === 'user' ? (
                    <p
                      key={i}
                      className="ml-auto max-w-[85%] bg-mist px-3.5 py-2.5 text-[12.5px] leading-[1.7] tracking-[-0.01em] text-ink"
                    >
                      {message.content}
                    </p>
                  ) : (
                    <p
                      key={i}
                      className="max-w-[92%] whitespace-pre-wrap text-[12.5px] font-light leading-[1.85] tracking-[-0.01em] text-ink"
                    >
                      {message.content || (
                        <span className="inline-block animate-pulse font-mono text-[10px] text-ash">
                          ···
                        </span>
                      )}
                    </p>
                  )
                )}
              </div>
            </div>

            {/* 입력 */}
            <footer className="border-t border-line-soft px-5 pb-4 pt-3">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  send(input);
                }}
                className="flex items-end gap-3"
              >
                <textarea
                  ref={inputRef}
                  rows={1}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    // 줄바꿈은 Shift+Enter — 대화창에서는 Enter 가 보내기입니다.
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      send(input);
                    }
                  }}
                  placeholder="무엇이든 물어보세요"
                  maxLength={2000}
                  disabled={busy}
                  className="max-h-24 w-full resize-none bg-transparent py-1 text-[12.5px] leading-[1.6] tracking-[-0.01em] text-ink outline-none placeholder:text-ash/50 disabled:opacity-40"
                />
                <button
                  type="submit"
                  disabled={busy || !input.trim()}
                  className="shrink-0 pb-1 font-mono text-[8.5px] uppercase tracking-[0.2em] text-ink transition-opacity duration-500 ease-silk hover:opacity-40 disabled:opacity-25"
                >
                  Send
                </button>
              </form>

              <p className="mt-2.5 text-[9px] leading-[1.6] text-ash/70">
                AI가 답변합니다. 비밀번호·카드번호는 입력하지 마세요. 정확한 처리가 필요한 문의는
                고객센터로 연결해 드립니다.
              </p>
            </footer>
          </motion.section>
        )}
      </AnimatePresence>

      {/* 부르는 버튼 */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? '상담 창 닫기' : '상담 도우미 열기'}
        aria-expanded={open}
        className="pointer-events-auto flex h-11 items-center gap-2 border border-ink bg-ink px-4 text-paper transition-opacity duration-500 ease-silk hover:opacity-80"
      >
        <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.1" aria-hidden>
          <path d="M4 5h16v11H9l-5 4V5Z" />
        </svg>
        <span className="font-mono text-[8.5px] uppercase tracking-[0.2em]">Help</span>
      </button>
    </div>
  );
}
