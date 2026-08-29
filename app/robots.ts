import { MetadataRoute } from 'next';

/**
 * ⚠️ 파일 이름이 반드시 robots.ts(복수형)여야 합니다.
 *    예전에 robot.ts 였을 때는 robots.txt가 아예 생성되지 않았습니다.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      // 개인 정보가 담기거나 색인될 이유가 없는 경로만 막습니다.
      // (예전에는 존재하지도 않는 /admin/, /private/ 를 막고
      //  정작 계정 화면은 열어 두었습니다)
      disallow: ['/account', '/account/', '/checkout', '/api/'],
    },
    sitemap: 'https://vision4visionary.com/sitemap.xml',
  };
}
