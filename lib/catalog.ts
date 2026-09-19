/* -----------------------------------------------------------
   카탈로그 분류 — Shop 드롭다운과 상품 필터가 함께 쓰는 지도
   세계(MIDBAR·EDEN) 두 컬렉션이 위에, 품목(TOP·BOTTOM·OUTER·ACC)이 아래에 옵니다.

   분류는 쇼피파이의 명시적 신호(태그·상품 유형·컬렉션 핸들)를 먼저 읽고,
   아직 태그가 없는 상품을 위해 제목의 낱말로도 추론합니다.
   (관리자에서 'midbar' / 'top' 같은 태그를 달면 그 신호가 그대로 우선합니다)
   ----------------------------------------------------------- */

export type ShopWorld = 'midbar' | 'eden';
export type ShopCategory = 'top' | 'bottom' | 'outer' | 'acc';

export interface ShopFilter {
  world?: ShopWorld;
  category?: ShopCategory;
}

export const SHOP_WORLDS: readonly { key: ShopWorld; label: string }[] = [
  { key: 'midbar', label: 'MIDBAR' },
  { key: 'eden', label: 'EDEN' },
] as const;

export const SHOP_CATEGORIES: readonly { key: ShopCategory; label: string }[] = [
  { key: 'top', label: 'Top' },
  { key: 'bottom', label: 'Bottom' },
  { key: 'outer', label: 'Outer' },
  { key: 'acc', label: 'Acc' },
] as const;

const WORLD_WORDS: Record<ShopWorld, string[]> = {
  midbar: ['midbar', '미드바', '광야'],
  eden: ['eden', '에덴', '동산'],
};

const CATEGORY_WORDS: Record<ShopCategory, string[]> = {
  top: ['top', 'tee', 't-shirt', 'tshirt', 'shirt', 'knit', 'sweater', 'hoodie', 'sweatshirt', 'blouse', 'polo', '티셔츠', '셔츠', '니트', '후드', '맨투맨', '상의'],
  bottom: ['bottom', 'pants', 'pant', 'denim', 'jeans', 'trouser', 'trousers', 'slacks', 'shorts', 'skirt', 'leggings', '팬츠', '데님', '슬랙스', '스커트', '하의', '바지'],
  outer: ['outer', 'outerwear', 'jacket', 'coat', 'parka', 'padding', 'puffer', 'blouson', 'jumper', 'cardigan', 'vest', 'anorak', 'windbreaker', '자켓', '재킷', '코트', '패딩', '점퍼', '가디건', '아우터'],
  acc: ['acc', 'accessory', 'accessories', 'cap', 'hat', 'beanie', 'bag', 'belt', 'scarf', 'muffler', 'socks', 'ring', 'necklace', 'bracelet', 'keyring', 'wallet', '모자', '캡', '비니', '가방', '벨트', '머플러', '양말', '반지', '목걸이', '팔찌', '악세사리', '액세서리'],
};

/** URL 쿼리 값을 아는 필터로만 좁혀 읽습니다 — 낯선 값은 조용히 무시합니다. */
export function parseShopFilter(world: string | null, category: string | null): ShopFilter | null {
  const filter: ShopFilter = {};
  if (world === 'midbar' || world === 'eden') filter.world = world;
  if (category === 'top' || category === 'bottom' || category === 'outer' || category === 'acc') {
    filter.category = category;
  }
  return filter.world || filter.category ? filter : null;
}

export function shopFilterLabel(filter: ShopFilter): string {
  const world = filter.world && SHOP_WORLDS.find((w) => w.key === filter.world)?.label;
  const category = filter.category && SHOP_CATEGORIES.find((c) => c.key === filter.category)?.label;
  return [world, category].filter(Boolean).join(' — ');
}

/** 상품이 내보이는 모든 분류 신호를 한 줄로 모읍니다. */
function haystackOf(product: any): string {
  return [
    product?.title,
    product?.productType,
    ...(Array.isArray(product?.tags) ? product.tags : []),
    ...((product?.collections?.edges ?? []).map((edge: any) => edge?.node?.handle) as string[]),
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
}

/** 낱말 단위로 찾습니다 — 'top'이 'stop' 속에서 울리지 않게. (한글은 낱말 경계가 없어 그대로 찾습니다) */
function hasWord(haystack: string, word: string): boolean {
  if (/[a-z0-9]/.test(word)) {
    const escaped = word.replace(/[.*+?^${}()|[\]\\-]/g, '\\$&');
    return new RegExp(`(^|[^a-z0-9])${escaped}([^a-z0-9]|$)`).test(haystack);
  }
  return haystack.includes(word);
}

export function matchesShopFilter(product: any, filter: ShopFilter): boolean {
  const haystack = haystackOf(product);
  if (filter.world && !WORLD_WORDS[filter.world].some((word) => hasWord(haystack, word))) {
    return false;
  }
  if (filter.category && !CATEGORY_WORDS[filter.category].some((word) => hasWord(haystack, word))) {
    return false;
  }
  return true;
}
