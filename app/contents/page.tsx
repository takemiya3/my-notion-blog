import { Metadata } from 'next';
import Link from 'next/link';
import { getAllContents } from '@/lib/notion/contents';
import ContentCard from '@/components/ContentCard';

export const metadata: Metadata = {
  title: 'コンテンツ一覧 | 放課後制服動画ナビ',
  description: '制服系動画コンテンツを新着順に一覧表示。お気に入りの作品を見つけよう。',
};

export const revalidate = 3600; // 1時間ごとに再生成

export default async function ContentsPage() {
  const contents = await getAllContents();

  return (
    <div className="container mx-auto px-4 py-8">
      {/* ヘッダー */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-4">コンテンツ一覧</h1>
        <p className="text-gray-600">
          制服系動画コンテンツを新着順に表示しています。
        </p>
        <p className="text-sm text-gray-500 mt-2">
          全{contents.length}件
        </p>
      </div>

      {/* フィルターメニュー */}
      <div className="mb-6 flex gap-4 flex-wrap">
        <Link 
          href="/uniform"
          className="px-4 py-2 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 
                     transition-colors"
        >
          🎽 制服で絞り込む
        </Link>
        <Link 
          href="/genres"
          className="px-4 py-2 bg-purple-100 text-purple-700 rounded hover:bg-purple-200 
                     transition-colors"
        >
          🎬 ジャンルで絞り込む
        </Link>
      </div>

      {/* コンテンツグリッド */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 
                      gap-4 md:gap-6">
        {contents.map((content) => (
          <ContentCard key={content.id} content={content} />
        ))}
      </div>

      {contents.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          現在、公開中のコンテンツはありません。
        </div>
      )}
    </div>
  );
}