import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Client } from '@notionhq/client';
import type { Metadata } from 'next';
import GenreContentCard from '@/components/GenreContentCard';

const notion = new Client({ auth: process.env.NOTION_API_KEY });

const GENRE_DB_ID = process.env.NOTION_GENRE_DB_ID!;
const CONTENT_DB_ID = process.env.NOTION_CONTENT_DB_ID!;

export const revalidate = 60;

// ✅ 静的パス生成
export async function generateStaticParams() {
  try {
    const response = await notion.databases.query({
      database_id: GENRE_DB_ID,
      filter: {
        property: '公開',
        checkbox: {
          equals: true,
        },
      },
    });

    return response.results.map((genre) => ({
      id: genre.id,
    }));
  } catch (error) {
    console.error('Error generating static params:', error);
    return [];
  }
}

async function getGenreData(genreId: string) {
  try {
    const genre = await notion.pages.retrieve({ page_id: genreId });
    return genre;
  } catch (error) {
    console.error('Error fetching genre:', error);
    return null;
  }
}

async function getGenreContents(genreName: string) {
  try {
    const response = await notion.databases.query({
      database_id: CONTENT_DB_ID,
      filter: {
        and: [
          {
            property: 'ジャンル',
            select: { equals: genreName },
          },
          {
            property: '公開ステータス',
            checkbox: { equals: true },
          },
        ],
      },
      sorts: [
        {
          property: '公開日',
          direction: 'descending',
        },
      ],
      page_size: 100,
    });

    return response.results;
  } catch (error) {
    console.error('Error fetching genre contents:', error);
    return [];
  }
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const resolvedParams = await params;
  const genre = await getGenreData(resolvedParams.id);

  if (!genre) {
    return {
      title: 'ジャンルが見つかりません',
    };
  }

  // @ts-ignore
  const properties = genre.properties;
  const name = properties['ジャンル名']?.title[0]?.plain_text || 'ジャンル';
  const description = properties['説明']?.rich_text[0]?.plain_text || '';

  return {
    title: `${name} | 放課後制服動画ナビ`,
    description: description || `${name}ジャンルのコンテンツ一覧`,
    openGraph: {
      title: `${name} | 放課後制服動画ナビ`,
      description: description || `${name}ジャンルのコンテンツ一覧`,
    },
  };
}

export default async function GenrePage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const genre = await getGenreData(resolvedParams.id);

  if (!genre) {
    notFound();
  }

  // @ts-ignore
  const properties = genre.properties;
  const name = properties['ジャンル名']?.title[0]?.plain_text || 'ジャンル';
  const description = properties['説明']?.rich_text[0]?.plain_text || '';
  const image = properties['イメージ画像']?.files[0]?.file?.url ||
    properties['イメージ画像']?.files[0]?.external?.url || '';

  const contents = await getGenreContents(name);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* パンくずリスト */}
        <nav className="mb-6 text-sm text-gray-600">
          <Link href="/" className="hover:text-pink-500">ホーム</Link>
          <span className="mx-2">/</span>
          <span className="text-black">{name}</span>
        </nav>

        {/* ジャンルヘッダー */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          <div className="flex flex-col md:flex-row gap-8">
            {/* イメージ画像 */}
            {image && (
              <div className="flex-shrink-0">
                <Image
                  src={image}
                  alt={name}
                  width={256}
                  height={256}
                  className="w-64 h-64 object-cover rounded-lg shadow-md"
                  priority
                />
              </div>
            )}

            {/* ジャンル情報 */}
            <div className="flex-1">
              <h1 className="text-4xl font-bold mb-4 text-black">{name}</h1>
              {description && (
                <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                  {description}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* コンテンツ一覧 */}
        <section>
          <h2 className="text-2xl font-bold mb-6 text-black">
            コンテンツ ({contents.length}件)
          </h2>

          {contents.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-12 text-center">
              <p className="text-gray-600">
                このジャンルにはまだコンテンツがありません
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {contents.map((content: any) => {
                const contentId = content.id;
                const title = content.properties['タイトル']?.title[0]?.plain_text || '無題';
                const thumbnail = content.properties['サムネイル']?.files[0]?.file?.url ||
                  content.properties['サムネイル']?.files[0]?.external?.url || '';
                const views = content.properties['閲覧数']?.number || 0;
                const publishedDate = content.properties['公開日']?.date?.start || '';
                const affiliateUrl = content.properties['アフィリエイトURL']?.url || '';

                return (
                  <GenreContentCard
                    key={contentId}
                    contentId={contentId}
                    title={title}
                    thumbnail={thumbnail}
                    views={views}
                    publishedDate={publishedDate}
                    affiliateUrl={affiliateUrl}
                  />
                );
              })}
            </div>
          )}
        </section>

        {/* 戻るボタン */}
        <div className="mt-12 text-center">
          <Link
            href="/"
            className="inline-block bg-gray-200 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-300 transition-colors"
          >
            ← ホームに戻る
          </Link>
        </div>
      </div>
    </div>
  );
}