import Link from 'next/link';

/**
 * 검은색 라인만으로 그린 소셜 아이콘.
 * 주소를 노출하지 않고 아이콘만 남겨 화면을 조용하게 유지합니다.
 */
const LINKS = [
  {
    label: 'Instagram',
    href: 'https://www.instagram.com/vision4visionary/',
    icon: (
      <>
        <rect x="3" y="3" width="18" height="18" rx="5" />
        <circle cx="12" cy="12" r="4.1" />
        <circle cx="17.2" cy="6.8" r="0.5" fill="currentColor" stroke="none" />
      </>
    ),
  },
  {
    label: 'YouTube',
    href: 'https://youtube.com/@vision4visionary',
    icon: (
      <>
        <rect x="2.5" y="5.5" width="19" height="13" rx="4" />
        <path d="M10.3 9.4 L15.2 12 L10.3 14.6 Z" />
      </>
    ),
  },
];

export default function SocialLinks({ className = '' }: { className?: string }) {
  return (
    <div className={`flex items-center gap-4 ${className}`}>
      {LINKS.map(({ label, href, icon }) => (
        <Link
          key={label}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={label}
          title={label}
          className="text-ink transition-opacity duration-500 ease-silk hover:opacity-40"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-[19px] w-[19px]"
            aria-hidden
          >
            {icon}
          </svg>
        </Link>
      ))}
    </div>
  );
}
