import { MetadataRoute } from 'next';
import { SITE_URL, POLICY_LINKS } from '@/lib/brand';
import { getProducts } from '@/lib/shopify';

/**
 * 사이트맵.
 *
 * 예전에는 홈·어바웃·아카이브·텔레그램 네 줄이 전부였습니다 —
 * 정작 팔고 있는 상품과, 결제 전에 읽혀야 하는 정책 페이지가 빠져 있었습니다.
 * 색인에도 손해지만, 카드사·PG 심사처럼 '무엇을 파는 곳인지' 훑어보는
 * 쪽에서도 상품 주소를 찾을 방법이 없었습니다.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: SITE_URL, lastModified: now, changeFrequency: 'daily', priority: 1.0 },
    { url: `${SITE_URL}/about`, lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${SITE_URL}/archives`, lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${SITE_URL}/essay`, lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${SITE_URL}/contact`, lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${SITE_URL}/telegram`, lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
  ];

  const policyRoutes: MetadataRoute.Sitemap = POLICY_LINKS.map(({ path }) => ({
    url: `${SITE_URL}${path}`,
    lastModified: now,
    changeFrequency: 'monthly' as const,
    priority: 0.5,
  }));

  // 쇼피파이가 흔들려도 사이트맵 전체가 500으로 죽지는 않게 합니다 —
  // 상품 줄만 빠지고 나머지는 그대로 나갑니다.
  let productRoutes: MetadataRoute.Sitemap = [];
  try {
    const products = await getProducts();
    productRoutes = products.map((product: any) => ({
      url: `${SITE_URL}/products/${product.handle}`,
      lastModified: now,
      changeFrequency: 'weekly' as const,
      priority: 0.9,
    }));
  } catch (error) {
    console.error('[sitemap] 상품 목록을 불러오지 못했습니다:', error);
  }

  return [...staticRoutes, ...productRoutes, ...policyRoutes];
}
