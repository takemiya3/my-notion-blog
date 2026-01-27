import { notFound } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

// Notion APIの設定
const NOTION_API_KEY = process.env.NOTION_API_KEY!;
const NOTION_CONTENT_DB_ID = process.env.NOTION_CONTENT_DB_ID!;
const NOTION_UNIFORM_CATEGORY_DB_ID = process.env.NOTION_UNIFORM_CATEGORY_DB_ID!;

async function getUniformCategory(slug: string) {
  const response = await fetch('https://api.notion.com/v1/databases/' + NOTION_UNIFORM_CATEGORY_DB_ID + '/query', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${NOTION_API_KEY}`,
      'Notion-Version': '2022-06-28',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      filter: {
        property: 'スラッグ',
        rich_text: {
          equals: slug,
        },
      },
    }),
    next: { revalidate: 60 },
  });

  const data = await response.json();
  return data.results[0] || null;
}

async function getContentsByUniformCategory(categoryName: string) {
  const response = await fetch('https://api.notion.com/v1/databases/' + NOTION_CONTENT_DB_ID + '/query', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${NOTION_API_KEY}`,
      'Notion-Version': '2022-06-28',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      filter: {
        property: 'ジャンル',
        multi_select: {
          contains: categoryName,
        },
      },
      sorts: [
        {
          property: '公開日',
          direction: 'descending',
        },
      ],
    }),
    next: { revalidate: 60 },
  });

  const data = await response.json();
  return data.results;
}

export default async function UniformCategoryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const category = await getUniformCategory(slug);
  
  if (!category) {
    notFound();
  }

  const categoryName = category.properties?.['カテゴリ名']?.title?.[0]?.plain_text || '';
  const categoryDescription = category.properties?.['説明']?.rich_text?.[0]?.plain_text || '';
  const categoryImage = category.properties?.['カテゴリ画像']?.files?.[0]?.file?.url || 
                       category.properties?.['カテゴリ画像']?.files?.[0]?.external?.url || '';

  const contents = await getContentsByUniformCategory(categoryName);

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gray-50">
        {/* ヒーローセクション */}
        <div
          className="relative h-64 bg-gradient-to-r from-pink-500 to-purple-600 flex items-center justify-center"
          style={
            categoryImage
              ? {
                  backgroundImage: `linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.5)), url(${categoryImage})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                }
              : undefined
          }
        >
          <div className="text-center text-white z-10">
            <h1 className="text-5xl font-bold mb-4">{categoryName}</h1>
            {categoryDescription && (
              <p className="text-xl max-w-2xl mx-auto px-4">{categoryDescription}</p>
            )}
          </div>
        </div>

        {/* パンくずリスト */}
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Link href="/" className="hover:text-pink-500">
              ホーム
            </Link>
            <span>/</span>
            <span className="text-gray-900">{categoryName}</span>
          </div>
        </div>

        {/* コンテンツ一覧 */}
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-black">
              {categoryName}の動画 ({contents.length}件)
            </h2>
          </div>

          {contents.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-gray-500 text-lg mb-4">
                現在、このカテゴリの動画はありません
              </p>
              <Link
                href="/"
                className="inline-block px-6 py-3 bg-pink-500 text-white font-bold rounded-lg hover:bg-pink-600 transition-colors"
              >
                ホームに戻る
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {contents.map((content: any) => {
                const contentId = content.id;
                const title = content.properties['タイトル']?.title[0]?.plain_text || '無題';
                const thumbnail =
                  content.properties['サムネイル']?.files[0]?.file?.url ||
                  content.properties['サムネイル']?.files[0]?.external?.url ||
                  '';
                const views = content.properties['閲覧数']?.number || 0;
                const publishDate = content.properties['公開日']?.date?.start || '';

                return (
                  <Link
                    key={contentId}
                    href={`/content/${contentId}`}
                    className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow overflow-hidden"
                  >
                    {thumbnail && (
                      <img
                        src={thumbnail}
                        alt={title}
                        className="w-full h-48 object-cover"
                      />
                    )}
                    <div className="p-4">
                      <h3 className="font-bold text-lg mb-2 line-clamp-2 text-black">
                        {title}
                      </h3>
                      <div className="flex items-center justify-between text-sm text-gray-600">
                        <span>👁 {views.toLocaleString()} views</span>
                        {publishDate && (
                          <span>{new Date(publishDate).toLocaleDateString('ja-JP')}</span>
                        )}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>
      <Footer />
    </>
  );
}