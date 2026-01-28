import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL('https://seifuku-jk.com'),
  title: {
    default: '放課後制服動画ナビ - 人物・コンテンツ検索サイト',
    template: '%s | 放課後制服動画ナビ'
  },
  description: '放課後制服動画ナビは、制服・セーラー服・ブレザー・体操服・スクール水着などの動画作品と出演者の詳細情報を検索できる専門サイトです。',
  keywords: ['放課後制服', '制服動画', 'セーラー服', 'ブレザー', '体操服', 'スクール水着', 'ブルマ', '美少女'],
  authors: [{ name: '放課後制服動画ナビ' }],
  creator: '放課後制服動画ナビ',
  publisher: '放課後制服動画ナビ',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    type: 'website',
    locale: 'ja_JP',
    url: 'https://seifuku-jk.com',
    siteName: '放課後制服動画ナビ',
    title: '放課後制服動画ナビ - 人物・コンテンツ検索サイト',
    description: '制服・セーラー服・ブレザー・体操服・スクール水着などの動画作品と出演者の詳細情報を検索できる専門サイトです。',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: '放課後制服動画ナビ',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: '放課後制服動画ナビ - 人物・コンテンツ検索サイト',
    description: '制服・セーラー服・ブレザー・体操服・スクール水着などの動画作品と出演者情報を検索',
    images: ['/og-image.png'],
  },
  verification: {
    google: 'WBCY4vg92wAP_uVnvFYzxTFdXam-8wjHu6HYUp9yN1U',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
       <body className={inter.className}>
        <Header /> {/* ← これを追加 */}
        <main>{children}</main>
      </body>
    </html>
  );
}