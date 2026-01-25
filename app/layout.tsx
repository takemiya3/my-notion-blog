import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL('https://your-domain.vercel.app'), // あなたのドメインに変更
  title: {
    default: '放課後制服動画ナビ - 人物・コンテンツ検索サイト',
    template: '%s | 放課後制服動画ナビ'
  },
  description: '放課後制服動画ナビは、人物とコンテンツの情報を簡単に検索できるサイトです。女優、モデル、グラビア、アイドル、タレントの詳細情報や出演作品を探せます。',
  keywords: ['放課後制服', '動画', '女優', 'モデル', 'グラビア', 'アイドル', 'タレント', 'コンテンツ検索'],
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
    url: 'https://your-domain.vercel.app',
    siteName: '放課後制服動画ナビ',
    title: '放課後制服動画ナビ - 人物・コンテンツ検索サイト',
    description: '人物とコンテンツの情報を簡単に検索できるサイト。女優、モデル、グラビア、アイドル、タレントの詳細情報や出演作品を探せます。',
    images: [
      {
        url: '/og-image.png', // OGP画像を作成して配置
        width: 1200,
        height: 630,
        alt: '放課後制服動画ナビ',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: '放課後制服動画ナビ - 人物・コンテンツ検索サイト',
    description: '人物とコンテンツの情報を簡単に検索できるサイト',
    images: ['/og-image.png'],
  },
  verification: {
    google: 'あなたのGoogle Search Consoleの認証コード',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}