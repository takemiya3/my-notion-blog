import Link from 'next/link';
import { Client } from '@notionhq/client';

const notion = new Client({ auth: process.env.NOTION_API_KEY });

export const revalidate = 60;

async function getRankings() {
  try {
    const response = await notion.databases.query({
      database_id: process.env.NOTION_RANKING_DB_ID!,
      filter: {
        property: '公開',
        checkbox: {
          equals: true,
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
    console.error('Error fetching rankings:', error);
    return [];
  }
}

export default async function RankingPage() {
  const rankings = await getRankings();

  return (
    <>
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-7xl mx-auto px-4">
          <h1 className="text-4xl font-bold text-center mb-12 text-black">
            ランキング記事一覧
          </h1>

          {rankings.length === 0 ? (
            <p className="text-center text-gray-600 py-12">
              まだランキング記事がありません
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {rankings.map((ranking: any) => {
                const props = ranking.properties;
                const title = props['記事タイトル']?.title?.[0]?.plain_text || '無題';
                const slug = props['スラッグ']?.rich_text?.[0]?.plain_text || '';
                const theme = props['テーマ']?.select?.name || '';
                const thumbnail = props['サムネイル']?.files?.[0]?.file?.url || 
                                 props['サムネイル']?.files?.[0]?.external?.url || '';
                const description = props['メタディスクリプション']?.rich_text?.[0]?.plain_text || '';

                return (
                  <Link
                    key={ranking.id}
                    href={`/ranking/${slug}`}
                    className="bg-white rounded-xl shadow-lg hover:shadow-2xl transition-all overflow-hidden group"
                  >
                    {thumbnail && (
                      <div className="relative overflow-hidden">
                        <img
                          src={thumbnail}
                          alt={title}
                          className="w-full h-56 object-cover group-hover:scale-110 transition-transform duration-300"
                        />
                      </div>
                    )}
                    <div className="p-6">
                      {theme && (
                        <span className="inline-block px-3 py-1 bg-pink-100 text-pink-600 rounded-full text-sm font-semibold mb-3">
                          {theme}
                        </span>
                      )}
                      <h2 className="text-2xl font-bold mb-3 text-black group-hover:text-pink-600 transition-colors">
                        {title}
                      </h2>
                      {description && (
                        <p className="text-gray-600 line-clamp-3">
                          {description}
                        </p>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
}