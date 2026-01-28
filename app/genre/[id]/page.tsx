import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Client } from '@notionhq/client';
import type { Metadata } from 'next';

const notion = new Client({ auth: process.env.NOTION_API_KEY });

export const revalidate = 60;

// 静的パス生成（必須！）
export async function generateStaticParams() {
  const response = await notion.databases.query({
    database_id: process.env.NOTION_GENRE_DB_ID!,
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

async function getGenreContents(genreId: string) {
  try {
    const response = await notion.databases.query({
      database_id: process.env.NOTION_CONTENT_DB_ID!,
      filter: {
        property: 'ジャンル',
        relation: {
          contains: genreId,
        },
      },
      sorts: [
        {
          property: '公開日',
          direction: 'descending',
        },
      ],
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

  return {
    title: `${name} | 放課後制服動画ナビ`,
    description: `${name}ジャンルのコンテンツ一覧`,
  };
}

export default async function GenrePage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const genre = await getGenreData(resolvedParams.id);

  if (!genre) {
    notFound();
  }

  const contents = await getGenreContents(resolvedParams.id);

  // @ts-ignore
  const properties = genre.properties;
  const name = properties['ジャンル名']?.title[0]?.plain_text || 'ジャンル';

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <nav className="mb-6 text-sm text-gray-600">
          <Link href="/" className="hover:text-pink-500">ホーム</Link>
          <span className="mx-2">/</span>
          <span className="text-black">{name}</span>
        </nav>

        <h1 className="text-4xl font-bold mb-8 text-black">{name}</h1>

        <section>
          <h2 className="text-2xl font-bold mb-6 text-black">
            コンテンツ ({contents.length}件)
          </h2>
          {contents.length === 0 ? (
            <p className="text-center text-gray-600 py-12">
              まだコンテンツがありません
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {contents.map((content: any) => {
                const contentId = content.id;
                const title = content.properties['タイトル']?.title[0]?.plain_text || '無題';
                const thumbnail = content.properties['サムネイル']?.files[0]?.file?.url || 
                                 content.properties['サムネイル']?.files[0]?.external?.url || '';

                return (
                  <Link
                    key={contentId}
                    href={`/content/${contentId}`}
                    className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow overflow-hidden"
                  >
                    {thumbnail && (
                      <Image
                        src={thumbnail}
                        alt={title}
                        width={300}
                        height={200}
                        className="w-full h-48 object-cover"
                      />
                    )}
                    <div className="p-4">
                      <h3 className="font-bold text-lg line-clamp-2 text-black">
                        {title}
                      </h3>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}