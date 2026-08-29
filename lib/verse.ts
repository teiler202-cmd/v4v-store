/**
 * 오늘의 구절 — 영문(OurManna) + 국문(getBible, 개역 1952/1961 · 퍼블릭 도메인).
 * 영문 구절의 장·절을 그대로 국문 성경에서 찾아 나란히 보여줍니다.
 */

const BOOK_NUMBERS: Record<string, number> = {
  genesis: 1, exodus: 2, leviticus: 3, numbers: 4, deuteronomy: 5,
  joshua: 6, judges: 7, ruth: 8, '1 samuel': 9, '2 samuel': 10,
  '1 kings': 11, '2 kings': 12, '1 chronicles': 13, '2 chronicles': 14,
  ezra: 15, nehemiah: 16, esther: 17, job: 18, psalm: 19, psalms: 19,
  proverbs: 20, ecclesiastes: 21, 'song of solomon': 22, 'song of songs': 22,
  isaiah: 23, jeremiah: 24, lamentations: 25, ezekiel: 26, daniel: 27,
  hosea: 28, joel: 29, amos: 30, obadiah: 31, jonah: 32, micah: 33,
  nahum: 34, habakkuk: 35, zephaniah: 36, haggai: 37, zechariah: 38, malachi: 39,
  matthew: 40, mark: 41, luke: 42, john: 43, acts: 44, romans: 45,
  '1 corinthians': 46, '2 corinthians': 47, galatians: 48, ephesians: 49,
  philippians: 50, colossians: 51, '1 thessalonians': 52, '2 thessalonians': 53,
  '1 timothy': 54, '2 timothy': 55, titus: 56, philemon: 57, hebrews: 58,
  james: 59, '1 peter': 60, '2 peter': 61, '1 john': 62, '2 john': 63,
  '3 john': 64, jude: 65, revelation: 66,
};

export type DailyVerse = {
  en: string;
  enRef: string;
  ko: string | null;
  koRef: string | null;
};

const FALLBACK: DailyVerse = {
  en: 'I can do all things through him who strengthens me.',
  enRef: 'Philippians 4:13',
  ko: '내게 능력 주시는 자 안에서 내가 모든 것을 할 수 있느니라',
  koRef: '빌립보서 4:13',
};

function parseReference(reference: string) {
  const matched = reference.trim().match(/^(.+?)\s+(\d+)\s*:\s*(\d+)(?:\s*-\s*(\d+))?/);
  if (!matched) return null;

  const bookKey = matched[1].toLowerCase().replace(/\.$/, '').trim();
  const book = BOOK_NUMBERS[bookKey];
  if (!book) return null;

  return {
    book,
    chapter: Number(matched[2]),
    from: Number(matched[3]),
    to: Number(matched[4] || matched[3]),
    suffix: `${matched[2]}:${matched[3]}${matched[4] ? `-${matched[4]}` : ''}`,
  };
}

async function fetchKorean(reference: string) {
  const parsed = parseReference(reference);
  if (!parsed) return null;

  try {
    const response = await fetch(
      `https://api.getbible.net/v2/korean/${parsed.book}/${parsed.chapter}.json`,
      { next: { revalidate: 60 * 60 * 12 } }
    );
    if (!response.ok) return null;

    const chapter = await response.json();
    const verses = (chapter.verses ?? [])
      .filter((v: any) => v.verse >= parsed.from && v.verse <= parsed.to)
      .map((v: any) => String(v.text).trim());

    if (!verses.length) return null;

    return { text: verses.join(' '), ref: `${chapter.book_name} ${parsed.suffix}` };
  } catch {
    return null;
  }
}

export async function getDailyVerse(): Promise<DailyVerse> {
  try {
    const response = await fetch(
      'https://beta.ourmanna.com/api/v1/get?format=json&order=daily',
      { next: { revalidate: 60 * 60 * 3 } }
    );
    if (!response.ok) return FALLBACK;

    const data = await response.json();
    const en = String(data?.verse?.details?.text ?? '').trim();
    const enRef = String(data?.verse?.details?.reference ?? '').trim();
    if (!en || !enRef) return FALLBACK;

    const korean = await fetchKorean(enRef);
    return { en, enRef, ko: korean?.text ?? null, koRef: korean?.ref ?? null };
  } catch {
    return FALLBACK;
  }
}
