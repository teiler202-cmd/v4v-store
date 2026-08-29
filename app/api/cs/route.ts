import Anthropic from '@anthropic-ai/sdk';
import { NextRequest, NextResponse } from 'next/server';
import { buildSystem } from '@/lib/cs/prompt';
import { rateLimit, tooManyMessage } from '@/lib/rateLimit';
import { CONTACT } from '@/lib/brand';

/**
 * AI 상담 도우미.
 *
 * 브라우저는 우리 서버에만 말을 겁니다 — 모델 호출은 전부 여기서 일어납니다.
 * (API 키를 브라우저로 내보내면 누구나 우리 계정으로 모델을 쓸 수 있습니다.
 *  CSP 의 connect-src 'self' 도 그래서 손댈 필요가 없습니다)
 *
 * 필요한 환경변수: ANTHROPIC_API_KEY
 * 없으면 도우미는 답을 지어내는 대신 고객센터를 안내합니다.
 */

export const dynamic = 'force-dynamic';
// 스트리밍 답변이 기본 제한(10초)에 잘리지 않도록 넉넉히 둡니다.
export const maxDuration = 60;

/** 손님이 쓰는 모델. 바꾸고 싶으면 환경변수로 덮어씁니다. */
const MODEL = process.env.CS_MODEL || 'claude-opus-5';

/** 한 번에 보낼 수 있는 글자 수 — 프롬프트를 통째로 밀어 넣는 시도를 막습니다 */
const MAX_CHARS = 2000;
/** 대화가 길어져도 최근 것만 넘깁니다 */
const MAX_TURNS = 24;

const FALLBACK = `지금은 상담 도우미를 연결할 수 없습니다. ${CONTACT.cs} 로 문의해 주시면 빠르게 도와드리겠습니다. (${CONTACT.hoursKo})`;

type Incoming = { role: 'user' | 'assistant'; content: string };

function sanitize(raw: unknown): Anthropic.MessageParam[] | null {
  if (!Array.isArray(raw) || raw.length === 0) return null;

  const messages = (raw as Incoming[])
    .slice(-MAX_TURNS)
    .filter((m) => (m?.role === 'user' || m?.role === 'assistant') && typeof m.content === 'string')
    .map((m) => ({ role: m.role, content: m.content.slice(0, MAX_CHARS).trim() }))
    .filter((m) => m.content.length > 0);

  // 첫 메시지는 손님이어야 하고, 마지막도 손님이어야 합니다(답할 차례).
  while (messages.length && messages[0].role !== 'user') messages.shift();
  if (!messages.length || messages[messages.length - 1].role !== 'user') return null;

  return messages;
}

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: '요청을 읽지 못했습니다.' }, { status: 400 });
  }

  const messages = sanitize((body as { messages?: unknown })?.messages);
  if (!messages) {
    return NextResponse.json({ message: '메시지를 입력해 주세요.' }, { status: 400 });
  }

  // 한 사람이 도우미를 계속 붙잡고 있지 못하게 — 10분에 30번.
  const limit = await rateLimit('cs-chat', { limit: 30, windowMs: 600_000, blockMs: 300_000 });
  if (!limit.ok) {
    return NextResponse.json({ message: tooManyMessage(limit.retryAfterSec) }, { status: 429 });
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    console.error('[cs] ANTHROPIC_API_KEY 가 없습니다 — 상담 도우미가 꺼진 상태입니다.');
    return NextResponse.json({ message: FALLBACK }, { status: 503 });
  }

  const client = new Anthropic();
  const system = await buildSystem();

  const encoder = new TextEncoder();

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        const response = client.messages.stream({
          model: MODEL,
          max_tokens: 8000,
          system,
          messages,
          // 상담은 오래 생각할 일이 아닙니다 — 낮은 노력으로 빠르게 답합니다.
          // (생각 자체를 끄는 대신 노력을 낮춥니다. 끄면 도구 호출이나
          //  내부 태그가 본문에 새어 나오는 문제가 알려져 있습니다)
          thinking: { type: 'adaptive' },
          output_config: { effort: 'low' },
        });

        for await (const event of response) {
          if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
            controller.enqueue(encoder.encode(event.delta.text));
          }
        }

        const final = await response.finalMessage();
        // 안전 정책으로 답을 거절한 경우 — 빈 화면 대신 사람에게 넘깁니다.
        if (final.stop_reason === 'refusal') {
          controller.enqueue(encoder.encode(`\n\n${FALLBACK}`));
        }
      } catch (error) {
        // 메시지만 남깁니다 — 예외 본문에 손님의 대화가 섞여 있을 수 있습니다.
        console.error('[cs] 응답 실패:', error instanceof Error ? error.message : 'unknown');
        controller.enqueue(encoder.encode(FALLBACK));
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'no-store',
      // 프록시가 스트림을 모아 두었다가 한꺼번에 보내지 않도록.
      'X-Accel-Buffering': 'no',
    },
  });
}
