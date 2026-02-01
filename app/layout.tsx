import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Header from '@/components/Header';
import Footer from '@/components/Footer';  // ← 追加


const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  metadataBase: new URL('https://seifuku-jk.com'),
  title: {
    default: '制服AV・エロ動画専門サイト｜放課後制服動画ナビ',
    template: '%s | 放課後制服動画ナビ'
  },
  description: '制服AV・エロ動画を完全網羅！セーラー服・ブレザー・JK制服・スクール水着・体操服など、制服系アダルト動画と女優情報を検索できる専門サイト。FANZA対応の最新作品を毎日更新中。',
  keywords: [
    '制服AV', '制服エロ動画', 'セーラー服AV', 'JK制服動画', 'ブレザーAV', 
    'スクール水着エロ動画', '体操服AV', '制服女優', '制服アダルト', 
    '女子高生制服', 'JKコスプレ', '制服フェチ', 'ブルマAV', 
    '放課後制服', 'FANZA制服', '制服系AV女優', '制服動画サイト'
  ],
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
    siteName: '制服AV・エロ動画専門サイト｜放課後制服動画ナビ',
    title: '制服AV・エロ動画専門サイト｜放課後制服動画ナビ',
    description: 'セーラー服・ブレザー・JK制服・スクール水着・体操服など、制服系AV・エロ動画を完全網羅。FANZA対応の最新作品と人気女優情報を毎日更新。',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: '制服AV・エロ動画専門サイト｜放課後制服動画ナビ',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: '制服AV・エロ動画専門サイト｜放課後制服動画ナビ',
    description: 'セーラー服・ブレザー・JK制服・スクール水着など制服系AV・エロ動画を網羅。FANZA対応の最新作品と女優情報を検索',
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
        <Header />
        <main>{children}</main>
        <Footer /> 
      </body>
    </html>
  );
}