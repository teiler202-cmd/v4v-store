import type { ReactNode } from 'react';

/**
 * 아주 작은 마크다운 렌더러.
 *
 * ── 왜 라이브러리를 안 쓰는가 ───────────────────────────────────────────
 * 읽어야 하는 글은 우리가 저장소에 직접 쓴 문서 일곱 개뿐입니다.
 * 거기 쓰인 문법은 제목·문단·목록·표·인용·강조·링크·코드가 전부입니다.
 * 그걸 위해 marked + DOMPurify 를 들이면 번들이 훨씬 커지고, 스토어 쪽
 * 빌드까지 함께 무거워집니다.
 *
 * ── 왜 HTML 문자열이 아니라 React 요소인가 ─────────────────────────────
 * dangerouslySetInnerHTML 을 쓰면 문서에 섞인 글자가 그대로 태그가 됩니다.
 * 지금은 우리가 쓴 문서뿐이라 안전하지만, 나중에 누가 외부 글을 붙여 넣는
 * 순간 조용히 구멍이 됩니다. 요소로 만들면 그런 일이 생길 수 없습니다.
 *
 * 지원하지 않는 문법(이미지, 중첩 목록, 각주 등)은 그냥 글자로 나옵니다 —
 * 조용히 사라지지 않습니다.
 */

export type Doc = {
  slug: string;
  title: string;
  icon: string;
  summary: string;
  order: number;
  body: string;
};

/** `---` 로 둘러싼 머리말을 떼어 냅니다 */
export function parseFrontmatter(slug: string, raw: string): Doc {
  const match = /^---\n([\s\S]*?)\n---\n?/.exec(raw);
  const meta: Record<string, string> = {};
  let body = raw;

  if (match) {
    body = raw.slice(match[0].length);
    for (const line of match[1].split('\n')) {
      const at = line.indexOf(':');
      if (at === -1) continue;
      meta[line.slice(0, at).trim()] = line.slice(at + 1).trim();
    }
  }

  return {
    slug,
    title: meta.title ?? slug,
    icon: meta.icon ?? '',
    summary: meta.summary ?? '',
    order: Number(meta.order ?? 99),
    body,
  };
}

/* ── 한 줄 안의 강조·링크·코드 ──────────────────────────────────────────── */

const INLINE = /(\*\*[^*]+\*\*|`[^`]+`|\[[^\]]+\]\([^)]+\))/g;

function inline(text: string, keyPrefix: string): ReactNode[] {
  return text.split(INLINE).filter(Boolean).map((piece, index) => {
    const key = `${keyPrefix}-${index}`;

    if (piece.startsWith('**') && piece.endsWith('**')) {
      return <strong key={key} className="font-semibold">{piece.slice(2, -2)}</strong>;
    }
    if (piece.startsWith('`') && piece.endsWith('`')) {
      return (
        <code key={key} className="rounded bg-mist px-1 py-0.5 font-mono text-[0.9em]">
          {piece.slice(1, -1)}
        </code>
      );
    }
    const link = /^\[([^\]]+)\]\(([^)]+)\)$/.exec(piece);
    if (link) {
      const [, label, href] = link;
      // 다른 문서로 가는 링크는 상대 주소로 씁니다 (예: [Finance](finance)).
      const external = /^(https?:)?\/\//.test(href) || href.startsWith('mailto:');
      return (
        <a
          key={key}
          href={external ? href : `/ops/docs/${href}`}
          {...(external ? { target: '_blank', rel: 'noreferrer' } : {})}
          className="underline underline-offset-2 decoration-line hover:decoration-ink"
        >
          {label}
        </a>
      );
    }
    return <span key={key}>{piece}</span>;
  });
}

/* ── 블록 ───────────────────────────────────────────────────────────────── */

function splitRow(line: string): string[] {
  return line.replace(/^\||\|$/g, '').split('|').map((cell) => cell.trim());
}

/**
 * 본문을 블록 단위로 읽어 React 요소로 만듭니다.
 *
 * `slots` 로 `<!-- 이름 -->` 자리에 끼워 넣을 것을 줍니다 —
 * Operations 문서의 사업자 정보 표가 그렇게 들어갑니다 (lib/brand.ts 에서 직접 읽습니다).
 */
export function renderMarkdown(body: string, slots: Record<string, ReactNode> = {}): ReactNode[] {
  const lines = body.split('\n');
  const out: ReactNode[] = [];
  let index = 0;

  while (index < lines.length) {
    const line = lines[index];

    // 빈 줄
    if (!line.trim()) { index += 1; continue; }

    // 끼워 넣는 자리
    const slot = /^<!--\s*([a-z-]+)\s*-->$/.exec(line.trim());
    if (slot) {
      if (slots[slot[1]]) out.push(<div key={`slot-${index}`}>{slots[slot[1]]}</div>);
      index += 1;
      continue;
    }

    // 제목
    const heading = /^(#{1,4})\s+(.*)$/.exec(line);
    if (heading) {
      const level = heading[1].length;
      const size = ['text-[19px]', 'text-[15px]', 'text-[13px]', 'text-[12px]'][level - 1];
      const Tag = (['h1', 'h2', 'h3', 'h4'] as const)[level - 1];
      out.push(
        <Tag key={index} className={`font-grotesk ${size} mt-7 mb-2 font-bold tracking-[-0.02em] first:mt-0`}>
          {inline(heading[2], `h${index}`)}
        </Tag>
      );
      index += 1;
      continue;
    }

    // 구분선
    if (/^---+$/.test(line.trim())) {
      out.push(<hr key={index} className="my-7 border-line-soft" />);
      index += 1;
      continue;
    }

    // 인용 — 여러 줄을 한 덩어리로 모읍니다
    if (line.startsWith('>')) {
      const quoted: string[] = [];
      while (index < lines.length && lines[index].startsWith('>')) {
        quoted.push(lines[index].replace(/^>\s?/, ''));
        index += 1;
      }
      out.push(
        <blockquote key={index} className="my-3 border-l-2 border-line pl-3.5 text-[12.5px] leading-[1.9] text-ash">
          {quoted.filter(Boolean).map((q, i) => <p key={i} className="mb-1 last:mb-0">{inline(q, `q${index}-${i}`)}</p>)}
        </blockquote>
      );
      continue;
    }

    // 표 — 헤더 줄과 구분 줄이 붙어 있어야 표로 봅니다
    if (line.trim().startsWith('|') && /^\|[\s:|-]+\|$/.test(lines[index + 1]?.trim() ?? '')) {
      const header = splitRow(line);
      index += 2;
      const rows: string[][] = [];
      while (index < lines.length && lines[index].trim().startsWith('|')) {
        rows.push(splitRow(lines[index]));
        index += 1;
      }
      out.push(
        <div key={index} className="my-3 overflow-x-auto">
          <table className="w-full min-w-[420px] border-collapse text-left">
            <thead>
              <tr className="border-b border-line">
                {header.map((cell, i) => (
                  <th key={i} className="px-2 py-1.5 font-mono text-[9px] uppercase tracking-[0.1em] text-ash">
                    {cell}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, r) => (
                <tr key={r} className="border-b border-line-soft align-top">
                  {row.map((cell, c) => (
                    <td key={c} className="px-2 py-2 text-[12px] leading-[1.65]">
                      {inline(cell, `t${r}-${c}`)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
      continue;
    }

    // 목록 — 체크박스도 같은 덩어리로 봅니다
    if (/^\s*[-*]\s/.test(line)) {
      const items: { text: string; checked: boolean | null }[] = [];
      while (index < lines.length && /^\s*[-*]\s/.test(lines[index])) {
        const text = lines[index].replace(/^\s*[-*]\s/, '');
        const box = /^\[([ x])\]\s*(.*)$/.exec(text);
        items.push(box ? { text: box[2], checked: box[1] === 'x' } : { text, checked: null });
        index += 1;
      }
      out.push(
        <ul key={index} className="my-2 flex flex-col gap-1">
          {items.map((item, i) => (
            <li key={i} className="flex gap-2 text-[12.5px] leading-[1.8]">
              <span className="shrink-0 text-ash">{item.checked === null ? '·' : item.checked ? '☑' : '☐'}</span>
              <span>{inline(item.text, `li${index}-${i}`)}</span>
            </li>
          ))}
        </ul>
      );
      continue;
    }

    // 문단 — 빈 줄을 만날 때까지 이어 붙입니다
    const paragraph: string[] = [];
    while (
      index < lines.length && lines[index].trim() &&
      !/^(#{1,4}\s|>|\||\s*[-*]\s|---+$|<!--)/.test(lines[index])
    ) {
      paragraph.push(lines[index].trim());
      index += 1;
    }
    if (paragraph.length) {
      out.push(
        <p key={index} className="my-2 text-[12.5px] leading-[1.9]">
          {inline(paragraph.join(' '), `p${index}`)}
        </p>
      );
    }
  }

  return out;
}
