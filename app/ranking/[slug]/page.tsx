import { notFound } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Client } from '@notionhq/client';

const notion = new Client({ auth: process.env.NOTION_API_KEY });

export const revalidate = 60;

async function getRankingArticle(slug: string) {
  try {
    const response = await notion.databases.query({
      database_id: process.env.NOTION_RANKING_DB_ID!,
      filter: {
        and: [
          {
            property: 'スラッグ',
            rich_text: {
              equals: slug,
            },
          },
          {
            property: '公開',
            checkbox: {
              equals: true,
            },
          },
        ],
      },
    });

    return response.results[0] || null;
  } catch (error) {
    console.error('Error fetching ranking article:', error);
    return null;
  }
}

async function getPeopleByTags(tags: string[], categories: string[], sortBy: string, limit: number) {
  try {
    const filters: any[] = [
      {
        property: '公開ステータス',
        checkbox: {
          equals: true,
        },
      },
    ];

    // タグで絞り込み
    if (tags && tags.length > 0) {
      tags.forEach(tag => {
        filters.push({
          property: 'カテゴリ',
          multi_select: {
            contains: tag,
          },
        });
      });
    }

    // カテゴリで絞り込み
    if (categories && categories.length > 0) {
      categories.forEach(category => {
        filters.push({
          property: 'カテゴリ',
          multi_select: {
            contains: category,
          },
        });
      });
    }

    const sortProperty = sortBy === '閲覧数' ? '閲覧数' : 
                         sortBy === '売上' ? '売上' : 
                         sortBy === '新着' ? '生年月日' : '人名';

    const response = await notion.databases.query({
      database_id: process.env.NOTION_PERSON_DB_ID!,
      filter: {
        and: filters,
      },
      sorts: [
        {
          property: sortProperty,
          direction: sortBy === '名前' ? 'ascending' : 'descending',
        },
      ],
      page_size: limit,
    });

    return response.results;
  } catch (error) {
    console.error('Error fetching people:', error);
    return [];
  }
}

async function getRankingDetails(rankingUrl: string) {
  try {
    const response = await notion.databases.query({
      database_id: process.env.NOTION_RANKING_DETAIL_DB_ID!,
      filter: {
        and: [
          {
            property: 'ランキング記事',
            relation: {
              contains: rankingUrl,
            },
          },
          {
            property: '公開',
            checkbox: {
              equals: true,
            },
          },
        ],
      },
      sorts: [
        {
          property: '順位',
          direction: 'ascending',
        },
      ],
    });

    return response.results;
  } catch (error) {
    console.error('Error fetching ranking details:', error);
    return [];
  }
}

export default async function RankingArticlePage({ params }: { params: { slug: string } }) {
  const article = await getRankingArticle(params.slug);

  if (!article) {
    notFound();
  }

  // 型アサーション
  const props = (article as any).properties;

  const title = props['記事タイトル']?.title?.[0]?.plain_text || '無題';
  const introduction = props['導入文']?.rich_text?.[0]?.plain_text || '';
  const conclusion = props['まとめ文']?.rich_text?.[0]?.plain_text || '';
  const tags = props['対象タグ']?.multi_select?.map((t: any) => t.name) || [];
  const categories = props['対象カテゴリ']?.multi_select?.map((c: any) => c.name) || [];
  const sortBy = props['並び順']?.select?.name || '閲覧数';
  const limit = props['表示件数']?.number || 10;

  // タグに基づいて人物を自動取得
  const people = await getPeopleByTags(tags, categories, sortBy, limit);

  // ランキング詳細（個別紹介文）を取得
  const rankingDetails = await getRankingDetails(article.id);

  // 紹介文のマップを作成
  const detailsMap = new Map<string, string>();
  rankingDetails.forEach((detail: any) => {
    const detailProps = detail.properties;
    const personUrls = detailProps['人物']?.relation || [];
    if (personUrls.length > 0) {
      const personUrl = personUrls[0];
      const description = detailProps['紹介文']?.rich_text?.[0]?.plain_text || '';
      detailsMap.set(personUrl, description);
    }
  });

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-4xl mx-auto px-4">
          {/* タイトル */}
          <h1 className="text-4xl font-bold text-center mb-8 text-black">
            {title}
          </h1>

          {/* 導入文 */}
          {introduction && (
            <div className="bg-white rounded-xl shadow-md p-6 mb-12">
              <p className="text-gray-700 leading-relaxed">
                {introduction}
              </p>
            </div>
          )}

          {/* ランキング */}
          <div className="space-y-8 mb-12">
            {people.map((person: any, index: number) => {
              const personId = person.id;
              const personProps = person.properties;
              const name = personProps['人名']?.title?.[0]?.plain_text || '名前なし';
              const profileImage = personProps['プロフィール画像']?.files?.[0]?.file?.url || 
                                   personProps['プロフィール画像']?.files?.[0]?.external?.url || '';
              const personTags = personProps['カテゴリ']?.multi_select || [];
              const fanzaLink = personProps['FANZAリンク']?.url || null;
              const description = detailsMap.get(person.url) || '';

              return (
                <div key={personId} className="bg-white rounded-xl shadow-lg p-6">
                  {/* 順位と名前 */}
                  <div className="flex items-center gap-4 mb-4">
                    <div className="bg-gradient-to-r from-pink-500 to-purple-600 text-white font-bold text-2xl w-16 h-16 rounded-full flex items-center justify-center shadow-lg">
                      {index + 1}
                    </div>
                    <h3 className="text-2xl font-bold text-black">{name}</h3>
                  </div>

                  {/* 画像 */}
                  {profileImage && (
                    <div className="mb-4">
                      <img
                        src={profileImage}
                        alt={name}
                        className="w-full h-80 object-cover rounded-lg"
                      />
                    </div>
                  )}

                  {/* タグ */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    {personTags.map((tag: any) => (
                      <span
                        key={tag.name}
                        className="px-3 py-1 bg-pink-100 text-pink-600 rounded-full text-sm font-semibold"
                      >
                        {tag.name}
                      </span>
                    ))}
                  </div>

                  {/* 紹介文 */}
                  {description && (
                    <div className="text-gray-700 mb-6 leading-relaxed">
                      {description}
                    </div>
                  )}

                  {/* ボタン */}
                  <div className="flex gap-3">
                    {fanzaLink && (
                      <a
                        href={fanzaLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-6 rounded-lg text-center transition-colors"
                      >
                        🔴 FANZAで見る
                      </a>
                    )}
                    <Link
                      href={`/person/${personId}`}
                      className="flex-1 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-bold py-3 px-6 rounded-lg text-center transition-colors"
                    >
                      🔍 この女優の作品を探す
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>

          {/* まとめ文 */}
          {conclusion && (
            <div className="bg-white rounded-xl shadow-md p-6">
              <p className="text-gray-700 leading-relaxed">
                {conclusion}
              </p>
            </div>
          )}
        </div>
      </div>
      <Footer />
    </>
  );
}