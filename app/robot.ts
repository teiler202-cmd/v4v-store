import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*', // 모든 검색 엔진 봇 허용
      allow: '/', // 기본적으로 모든 페이지 접근 허용
      disallow: ['/admin/', '/private/'], // 검색에 노출되면 안 되는 페이지 차단
    },
    sitemap: 'https://vision4visionary.com/sitemap.xml', // 사이트맵 위치 안내
  };
}