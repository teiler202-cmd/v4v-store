/**
 * 나눔명조 서브셋 — 가게 화면에 실제로 적힌 글자만 담은 woff2 를 만듭니다.
 *
 *   npm run fonts:ko      (npm run dev · npm run build 직전에도 저절로 돕니다: predev · prebuild)
 *
 * ── 왜 ───────────────────────────────────────────────────────────────────
 * 구글 폰트의 나눔명조는 글자 묶음 184조각으로 나뉘어 있어서, 그 @font-face 목록(약 30KB)이
 * 모든 페이지의 첫 CSS 에 실렸고, 한글 페이지 하나를 열 때마다 조각 13~25개(200~400KB)를 받았습니다.
 * 그동안 메뉴를 누른 화면은 최대 0.5초 멈춰 있었습니다(React 가 글꼴 도착을 기다립니다).
 * 실제로 쓰는 글자는 천 자 남짓이라, 굵기마다 파일 하나로 충분합니다.
 *
 * ── 무엇을 모으나 ────────────────────────────────────────────────────────
 * app · components · lib · content 의 .ts .tsx .md .mdx .json 에 적힌 문자열과 JSX 글자 전부
 * (한글만이 아니라 문장부호·한자·영문까지). 운영 보드·스튜디오·메일·상담 프롬프트는 가게 화면이 아니라 뺍니다.
 * .ts/.tsx 는 주석을 건너뜁니다 — 코드 주석의 한글은 화면에 나오지 않는데, 그대로 모으면 글자 수가 30% 늘어납니다.
 * 여기에 기본 문장부호(ASCII 전체, 가운뎃점, 대시, 따옴표, 말줄임표, CJK 기호)는 늘 넣습니다.
 *
 * ⚠️ 이 목록에 없는 글자는 그 자리만 기기 글꼴로 그려집니다. 그래서 dev 서버를 켤 때와 build 때마다 다시 뽑습니다 —
 *    배포에는 따로 할 일이 없습니다. 다만 dev 서버를 켠 채 새 한글을 쓰면 그 글자만 기기 고딕으로 보이니,
 *    dev 서버를 껐다 켜세요(npm run dev 로 켤 때 저절로 돕니다). 쇼피파이·DB 처럼 실행 중에 들어오는 글은 여기서 볼 수 없으니
 *    나눔명조 영역(nanum.className)에는 코드에 적힌 글만 넣어 주세요.
 *
 * ── 원본 ─────────────────────────────────────────────────────────────────
 * scripts/fonts/NanumMyeongjo-{Regular,Bold}.woff2 — google/fonts 저장소(ofl/nanummyeongjo)의 TTF 를
 * 무손실로 woff2 로만 옮긴 것입니다(3MB → 0.5MB). 라이선스는 같은 폴더의 OFL.txt.
 *
 * 힌팅은 뺍니다: 지금까지 구글이 보내던 나눔명조 파일에도 힌팅이 없었습니다 — 넣으면 오히려 윈도에서 모양이 바뀝니다.
 * 같은 입력이면 늘 같은 바이트가 나옵니다. 내용이 같으면 파일을 다시 쓰지 않습니다(dev 서버가 괜히 다시 읽지 않게).
 */

import { readFile, readdir, writeFile, mkdir } from 'node:fs/promises';
import { dirname, join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { brotliDecompressSync } from 'node:zlib';
import ts from 'typescript';
import subsetFont from 'subset-font';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

const SCAN_DIRS = ['app', 'components', 'lib', 'content'];
const EXCLUDE = ['app/ops', 'app/studio', 'lib/ops', 'lib/email', 'lib/cs', 'content/ops'];
const EXTENSIONS = /\.(tsx?|mdx?|json)$/;

/** 문구에 없어도 늘 담는 글자 — [시작, 끝] */
const ALWAYS = [
  [0x0020, 0x007e], // ASCII
  [0x00a0, 0x00a0], // 줄바꿈 없는 공백
  [0x00b7, 0x00b7], // 가운뎃점
  [0x2013, 0x2014], // – —
  [0x2018, 0x201d], // ‘ ’ “ ”
  [0x2026, 0x2026], // …
  [0x3000, 0x303f], // CJK 기호·문장부호(「」、。 등)
];

const FACES = [
  { weight: 400, source: 'scripts/fonts/NanumMyeongjo-Regular.woff2' },
  { weight: 700, source: 'scripts/fonts/NanumMyeongjo-Bold.woff2' },
];
const outputPath = (weight) => `app/fonts/nanum-myeongjo-${weight}.woff2`;

/**
 * 브라우저가 가로쓰기에 저절로 켜는 조판 기능만 남깁니다(harfbuzz·fonttools 의 기본값과 같은 생각).
 * 나눔명조에는 kern(자간 쌍)과 fwid(전각 치환) 둘뿐인데, fwid 는 CSS 로 켜지 않는 한 쓰이지 않으면서
 * 영문·숫자의 전각 글리프 95개(굵기당 약 8KB)를 끌고 옵니다.
 */
const LAYOUT_FEATURES = ['ccmp', 'locl', 'rlig', 'rvrn', 'liga', 'clig', 'calt', 'kern', 'mark', 'mkmk', 'ljmo', 'vjmo', 'tjmo'];

/* ----------------------------------------------------------------- 글자 모으기 */

async function listFiles(dir) {
  const files = [];
  let entries;
  try {
    entries = await readdir(join(ROOT, dir), { withFileTypes: true });
  } catch {
    return files; // content/ 처럼 없을 수도 있는 폴더
  }
  entries.sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0));
  for (const entry of entries) {
    const path = `${dir}/${entry.name}`;
    if (EXCLUDE.some((prefix) => path === prefix || path.startsWith(`${prefix}/`))) continue;
    if (entry.isDirectory()) files.push(...(await listFiles(path)));
    else if (EXTENSIONS.test(entry.name)) files.push(path);
  }
  return files;
}

/** .ts/.tsx 에서 화면에 나갈 수 있는 글 — 문자열·템플릿 조각·JSX 글자. 주석과 식별자는 건너뜁니다. */
function literalsOf(file, source) {
  const kind = file.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS;
  const tree = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, false, kind);
  const parts = [];
  const visit = (node) => {
    if (
      ts.isStringLiteralLike(node) ||
      ts.isJsxText(node) ||
      ts.isTemplateHead(node) ||
      ts.isTemplateMiddle(node) ||
      ts.isTemplateTail(node)
    ) {
      parts.push(node.text ?? '');
    }
    ts.forEachChild(node, visit);
  };
  visit(tree);
  return parts.join('\n');
}

/** JSX 는 &nbsp; 같은 문자 참조를 글자로 바꿔 그립니다 — 바뀐 글자도 함께 담습니다. */
const NAMED = {
  nbsp: 0xa0, amp: 0x26, lt: 0x3c, gt: 0x3e, quot: 0x22, apos: 0x27, middot: 0xb7, times: 0xd7,
  copy: 0xa9, reg: 0xae, trade: 0x2122, deg: 0xb0, hellip: 0x2026, ndash: 0x2013, mdash: 0x2014,
  lsquo: 0x2018, rsquo: 0x2019, ldquo: 0x201c, rdquo: 0x201d, laquo: 0xab, raquo: 0xbb, bull: 0x2022,
  larr: 0x2190, rarr: 0x2192, uarr: 0x2191, darr: 0x2193,
};
const unknownEntities = new Set();
function decodeEntities(text) {
  return text.replace(/&(#x[0-9a-f]+|#[0-9]+|[a-z][a-z0-9]*);/gi, (match, name) => {
    if (name[0] === '#') {
      const code = name[1] === 'x' || name[1] === 'X' ? parseInt(name.slice(2), 16) : parseInt(name.slice(1), 10);
      return code > 0 && code <= 0x10ffff ? String.fromCodePoint(code) : match;
    }
    const code = NAMED[name] ?? NAMED[name.toLowerCase()];
    if (code === undefined) {
      unknownEntities.add(match);
      return match;
    }
    return String.fromCodePoint(code);
  });
}

async function collectCodePoints() {
  const codePoints = new Set();
  const add = (text) => {
    for (const char of text) {
      const cp = char.codePointAt(0);
      // 제어 문자(줄바꿈·탭 등)와 짝 잃은 서로게이트는 글리프가 아닙니다
      if (cp < 0x20 || (cp >= 0x7f && cp <= 0x9f) || (cp >= 0xd800 && cp <= 0xdfff)) continue;
      codePoints.add(cp);
    }
  };

  const files = (await Promise.all(SCAN_DIRS.map(listFiles))).flat();
  for (const file of files) {
    const source = await readFile(join(ROOT, file), 'utf8');
    const text = /\.tsx?$/.test(file) ? literalsOf(file, source) : source;
    add(text);
    add(decodeEntities(text));
  }
  for (const [from, to] of ALWAYS) for (let cp = from; cp <= to; cp++) codePoints.add(cp);

  return { files, codePoints: [...codePoints].sort((a, b) => a - b) };
}

/* ----------------------------------------------------------------- woff2 읽기(검증용) */

// woff2 표 머리의 '잘 알려진 표' 번호 순서 (WOFF2 명세 5.1)
const KNOWN_TAGS = (
  'cmap,head,hhea,hmtx,maxp,name,OS/2,post,cvt ,fpgm,glyf,loca,prep,CFF ,VORG,EBDT,EBLC,gasp,hdmx,kern,' +
  'LTSH,PCLT,VDMX,vhea,vmtx,BASE,GDEF,GPOS,GSUB,EBSC,JSTF,MATH,CBDT,CBLC,COLR,CPAL,SVG ,sbix,acnt,avar,' +
  'bdat,bloc,bsln,cvar,fdsc,feat,fmtx,fvar,gvar,hsty,just,lcar,mort,morx,opbd,prop,trak,Zapf,Silf,Glat,' +
  'Gloc,Feat,Sill'
).split(',');

/** woff2 에서 cmap·maxp 처럼 변형되지 않은 표만 꺼냅니다. */
function readWoff2Tables(buf) {
  if (buf.toString('latin1', 0, 4) !== 'wOF2') throw new Error('woff2 파일이 아닙니다');
  const numTables = buf.readUInt16BE(12);
  const compressedLength = buf.readUInt32BE(20);
  let p = 48;
  const base128 = () => {
    let value = 0;
    for (let i = 0; i < 5; i++) {
      const byte = buf[p++];
      value = value * 128 + (byte & 0x7f);
      if (!(byte & 0x80)) return value;
    }
    throw new Error('woff2 표 목록을 읽지 못했습니다');
  };
  const directory = [];
  for (let i = 0; i < numTables; i++) {
    const flags = buf[p++];
    let tag = KNOWN_TAGS[flags & 0x3f];
    if ((flags & 0x3f) === 0x3f) {
      tag = buf.toString('latin1', p, p + 4);
      p += 4;
    }
    const version = flags >> 6;
    const originalLength = base128();
    // glyf·loca 는 0번이, 나머지는 0번이 아닌 것이 '변형됨'입니다
    const transformed = tag === 'glyf' || tag === 'loca' ? version === 0 : version !== 0;
    directory.push({ tag, transformed, length: transformed ? base128() : originalLength });
  }
  const data = brotliDecompressSync(buf.subarray(p, p + compressedLength));
  const tables = {};
  let offset = 0;
  for (const { tag, transformed, length } of directory) {
    if (!transformed) tables[tag] = data.subarray(offset, offset + length);
    offset += length;
  }
  return tables;
}

/** cmap(형식 4·12)에서 글리프가 실제로 있는 코드 포인트 */
function cmapCodePoints(cmap) {
  const count = cmap.readUInt16BE(2);
  let format4 = -1;
  let format12 = -1;
  for (let i = 0; i < count; i++) {
    const record = 4 + 8 * i;
    const platform = cmap.readUInt16BE(record);
    const encoding = cmap.readUInt16BE(record + 2);
    const offset = cmap.readUInt32BE(record + 4);
    const unicode = platform === 0 || (platform === 3 && (encoding === 1 || encoding === 10));
    if (!unicode) continue;
    const format = cmap.readUInt16BE(offset);
    if (format === 12 && format12 < 0) format12 = offset;
    if (format === 4 && format4 < 0) format4 = offset;
  }

  const found = new Set();
  if (format12 >= 0) {
    const groups = cmap.readUInt32BE(format12 + 12);
    for (let i = 0; i < groups; i++) {
      const group = format12 + 16 + 12 * i;
      const end = cmap.readUInt32BE(group + 4);
      for (let cp = cmap.readUInt32BE(group); cp <= end; cp++) found.add(cp);
    }
    return found;
  }
  if (format4 < 0) throw new Error('유니코드 cmap 이 없습니다');

  const segCountX2 = cmap.readUInt16BE(format4 + 6);
  const ends = format4 + 14;
  const starts = ends + segCountX2 + 2;
  const deltas = starts + segCountX2;
  const ranges = deltas + segCountX2;
  for (let s = 0; s < segCountX2 / 2; s++) {
    const end = cmap.readUInt16BE(ends + 2 * s);
    const start = cmap.readUInt16BE(starts + 2 * s);
    const delta = cmap.readUInt16BE(deltas + 2 * s);
    const range = cmap.readUInt16BE(ranges + 2 * s);
    for (let cp = start; cp <= end && cp !== 0xffff; cp++) {
      let glyph = range === 0 ? cp : cmap.readUInt16BE(ranges + 2 * s + range + 2 * (cp - start));
      if (range !== 0 && glyph === 0) continue;
      glyph = (glyph + delta) & 0xffff;
      if (glyph !== 0) found.add(cp);
    }
  }
  return found;
}

/* ----------------------------------------------------------------- 실행 */

const hex = (cp) => `U+${cp.toString(16).toUpperCase().padStart(4, '0')}`;
const kb = (bytes) => `${(bytes / 1024).toFixed(1)}KB`;

async function main() {
  const started = performance.now();
  const { files, codePoints } = await collectCodePoints();
  const text = String.fromCodePoint(...codePoints);
  const hangul = codePoints.filter((cp) => cp >= 0xac00 && cp <= 0xd7a3).length;
  console.log(`[subset-ko] 파일 ${files.length}개에서 글자 ${codePoints.length}자(한글 음절 ${hangul}자)를 모았습니다.`);
  if (unknownEntities.size) {
    console.warn(`[subset-ko] 모르는 문자 참조: ${[...unknownEntities].join(' ')} — NAMED 표에 더해 주세요.`);
  }

  await mkdir(join(ROOT, 'app/fonts'), { recursive: true });

  for (const { weight, source } of FACES) {
    const original = await readFile(join(ROOT, source));
    const subset = await subsetFont(original, text, {
      targetFormat: 'woff2',
      keepFeatures: LAYOUT_FEATURES,
      noHinting: true,
      // 이름표는 기본(0~6: 저작권·이름·버전)에 14(라이선스 주소)를 더합니다 — 구글이 보내던 파일과 같은 구성입니다.
      preserveNameIds: [14],
    });

    // 원본에 있는 글자가 하나라도 빠졌다면 멈춥니다. 원본에 없는 글자는 지금도 기기 글꼴로 그려지니 알리기만 합니다.
    const inFont = cmapCodePoints(readWoff2Tables(original).cmap);
    const inSubset = cmapCodePoints(readWoff2Tables(subset).cmap);
    const dropped = codePoints.filter((cp) => inFont.has(cp) && !inSubset.has(cp));
    if (dropped.length) throw new Error(`${weight}: 서브셋에서 글자가 빠졌습니다 — ${dropped.map(hex).join(' ')}`);
    const notInFont = codePoints.filter((cp) => !inFont.has(cp));
    const glyphs = readWoff2Tables(subset).maxp.readUInt16BE(4);

    const target = join(ROOT, outputPath(weight));
    const previous = await readFile(target).catch(() => null);
    const same = previous !== null && previous.equals(subset);
    if (!same) await writeFile(target, subset);

    console.log(
      `[subset-ko] ${relative(ROOT, target).split(sep).join('/')}  ${codePoints.length - notInFont.length}자 · ` +
        `글리프 ${glyphs}개 · ${kb(subset.length)} (원본 ${kb(original.length)}) · ${same ? '그대로' : '새로 씀'}`,
    );
    if (weight === FACES[0].weight && notInFont.length) {
      const listed = notInFont.slice(0, 16).map(hex).join(' ');
      console.log(
        `[subset-ko] 나눔명조에 원래 없는 글자 ${notInFont.length}자는 지금처럼 기기 글꼴로 그려집니다: ${listed}${notInFont.length > 16 ? ' …' : ''}`,
      );
    }
  }
  console.log(`[subset-ko] ${Math.round(performance.now() - started)}ms`);
}

main().catch((error) => {
  console.error('[subset-ko] 실패:', error);
  process.exit(1);
});
