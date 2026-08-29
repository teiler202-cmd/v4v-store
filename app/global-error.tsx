'use client';

/**
 * 루트 레이아웃 자체가 깨졌을 때의 최후 방어선.
 * 여기서는 레이아웃을 못 쓰므로 html/body를 직접 그려야 합니다.
 */
export default function GlobalError({ reset }: { error: Error; reset: () => void }) {
  return (
    <html lang="ko">
      <body
        style={{
          margin: 0,
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '1.5rem',
          background: '#ffffff',
          color: '#0b0b0b',
          fontFamily: 'ui-monospace, Menlo, monospace',
          textAlign: 'center',
          padding: '0 1.5rem',
        }}
      >
        <p style={{ fontSize: 9, letterSpacing: '0.26em', textTransform: 'uppercase', color: '#6b6b6b' }}>
          Something went wrong
        </p>
        <p style={{ fontSize: 13, maxWidth: '36ch', lineHeight: 1.7 }}>
          페이지를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.
        </p>
        <button
          onClick={reset}
          style={{
            border: 'none',
            borderBottom: '1px solid #0b0b0b',
            background: 'none',
            paddingBottom: 4,
            fontSize: 9,
            letterSpacing: '0.24em',
            textTransform: 'uppercase',
            cursor: 'pointer',
          }}
        >
          Try again
        </button>
      </body>
    </html>
  );
}
