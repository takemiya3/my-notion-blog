import { notFound } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Client } from '@notionhq/client';

const notion = new Client({ auth: process.env.NOTION_API_KEY });

export const revalidate = 60;

async function getRankingArticle(slug: string) {
  console.log('🔍 getRankingArticle called with slug:', slug);
  try {
    const response = await notion.databases.query({
      database_id: process.env.NOTION_RANKING_DB_ID!,
      filter: {
        property: '公開',
        checkbox: {
          equals: true,
        },
      },
    });

    console.log('📊 Total articles found:', response.results.length);

    const article = response.results.find((result: any) => {
      const props = result.properties;
      const articleSlug = props['スラッグ']?.rich_text?.[0]?.plain_text || '';
      console.log('  - Article slug:', articleSlug, '| Match:', articleSlug === slug);
      return articleSlug === slug;
    });

    if (article) {
      console.log('✅ Article found!');
    } else {
      console.log('❌ Article NOT found');
    }

    return article || null;
  } catch (error) {
    console.error('💥 Error in getRankingArticle:', error);
    throw error;
  }
}

async function getPeopleByTags(tags: string[], categories: string[], sortBy: string, limit: number) {
  console.log('👥 getPeopleByTags called');
  try {
    const filters: any[] = [
      {
        property: '公開ステータス',
        checkbox: {
          equals: true,
        },
      },
    ];

    if (tags && tags.length > 0) {
      const tagFilters = tags.map(tag => ({
        property: 'カテゴリ',
        multi_select: {
          contains: tag,
        },
      }));

      if (categories && categories.length > 0) {
        const categoryFilters = categories.map(category => ({
          property: 'カテゴリ',
          multi_select: {
            contains: category,
          },
        }));

        filters.push({
          or: [...tagFilters, ...categoryFilters],
        });
      } else {
        filters.push({
          or: tagFilters,
        });
      }
    } else if (categories && categories.length > 0) {
      const categoryFilters = categories.map(category => ({
        property: 'カテゴリ',
        multi_select: {
          contains: category,
        },
      }));

      filters.push({
        or: categoryFilters,
      });
    }

    const sortProperty = sortBy === '閲覧数' ? '閲覧数' :
                        sortBy === '売上' ? '売上' :
                        sortBy === '新着' ? '生年月日' : '人名';

    const response = await notion.databases.query({
      database_id: process.env.NOTION_PEOPLE_DB_ID!,
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

    console.log('✅ People found:', response.results.length);
    return response.results;
  } catch (error) {
    console.error('💥 Error in getPeopleByTags:', error);
    return [];
  }
}

async function getRankingDetails(rankingId: string) {
  console.log('📝 getRankingDetails called for:', rankingId);
  try {
    const response = await notion.databases.query({
      database_id: process.env.NOTION_RANKING_DETAIL_DB_ID!,
      filter: {
        and: [
          {
            property: 'ランキング記事',
            relation: {
              contains: rankingId,
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

    console.log('✅ Ranking details found:', response.results.length);
    return response.results;
  } catch (error) {
    console.error('💥 Error in getRankingDetails:', error);
    return [];
  }
}

// ★★★ ここを修正：paramsをawaitする ★★★
export default async function RankingArticlePage({ 
  params 
}: { 
  params: Promise<{ slug: string }> 
}) {
  const { slug } = await params; // ← awaitを追加
  
  console.log('🚀 Page render started for slug:', slug);

  try {
    const article = await getRankingArticle(slug);

    if (!article) {
      console.log('❌ Calling notFound()');
      notFound();
    }

    const props = (article as any).properties;

    const title = props['記事タイトル']?.title?.[0]?.plain_text || '無題';
    const introduction = props['導入文']?.rich_text?.[0]?.plain_text || '';
    const conclusion = props['まとめ文']?.rich_text?.[0]?.plain_text || '';
    const tags = props['対象タグ']?.multi_select?.map((t: any) => t.name) || [];
    const categories = props['対象カテゴリ']?.multi_select?.map((c: any) => c.name) || [];
    const sortBy = props['並び順']?.select?.name || '閲覧数';
    const limit = props['表示件数']?.number || 10;

    console.log('📄 Article data:', { title, tags, categories, sortBy, limit });

    const people = await getPeopleByTags(tags, categories, sortBy, limit);
    const rankingDetails = await getRankingDetails((article as any).id);

    const detailsMap = new Map<string, string>();
    rankingDetails.forEach((detail: any) => {
      const detailProps = detail.properties;
      const personRelations = detailProps['人物']?.relation || [];
      if (personRelations.length > 0) {
        const personId = personRelations[0].id;
        const description = detailProps['紹介文']?.rich_text?.[0]?.plain_text || '';
        detailsMap.set(personId, description);
      }
    });

    console.log('✅ Rendering page successfully');

    return (
      <>
        <Header />
        <div className="min-h-screen bg-gray-50 py-12">
          <div className="max-w-4xl mx-auto px-4">
            <h1 className="text-4xl font-bold text-center mb-8 text-black">
              {title}
            </h1>

            {introduction && (
              <div className="bg-white rounded-xl shadow-md p-6 mb-12">
                <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                  {introduction}
                </p>
              </div>
            )}

            <div className="space-y-8 mb-12">
              {people.length === 0 ? (
                <div className="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-6">
                  <p className="text-yellow-800">該当する人物が見つかりませんでした。</p>
                  <p className="text-sm text-yellow-600 mt-2">タグ: {tags.join(', ') || 'なし'}</p>
                  <p className="text-sm text-yellow-600">カテゴリ: {categories.join(', ') || 'なし'}</p>
                </div>
              ) : (
                people.map((person: any, index: number) => {
                  const personId = person.id;
                  const personProps = person.properties;
                  const name = personProps['人名']?.title?.[0]?.plain_text || '名前なし';
                  const profileImage = personProps['プロフィール画像']?.files?.[0]?.file?.url ||
                                      personProps['プロフィール画像']?.files?.[0]?.external?.url || '';
                  const personTags = personProps['カテゴリ']?.multi_select || [];
                  const fanzaLink = personProps['FANZAリンク']?.url || null;
                  const description = detailsMap.get(personId) || '';

                  return (
                    <div key={personId} className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-2xl transition-shadow">
                      <div className="flex flex-col md:flex-row">
                        {profileImage && (
                          <div className="md:w-2/5">
                            <img
                              src={profileImage}
                              alt={name}
                              className="w-full h-72 md:h-full object-cover"
                            />
                          </div>
                        )}

                        <div className="flex-1 p-6">
                          <div className="flex items-center gap-4 mb-4">
                            <div className="bg-gradient-to-r from-pink-500 to-purple-600 text-white font-bold text-3xl w-16 h-16 rounded-full flex items-center justify-center shadow-lg flex-shrink-0">
                              {index + 1}
                            </div>
                            <h3 className="text-2xl font-bold text-black">{name}</h3>
                          </div>

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

                          {description && (
                            <div className="text-gray-700 mb-6 leading-relaxed whitespace-pre-wrap">
                              {description}
                            </div>
                          )}

                          <div className="flex flex-col sm:flex-row gap-3">
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
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {conclusion && (
              <div className="bg-white rounded-xl shadow-md p-6">
                <h2 className="text-2xl font-bold mb-4 text-black">まとめ</h2>
                <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                  {conclusion}
                </p>
              </div>
            )}
          </div>
        </div>
        <Footer />
      </>
    );
  } catch (error) {
    console.error('💥💥💥 FATAL ERROR:', error);
    return (
      <>
        <Header />
        <div className="min-h-screen bg-red-50 py-12">
          <div className="max-w-4xl mx-auto px-4">
            <h1 className="text-4xl font-bold text-center mb-8 text-red-600">
              エラーが発生しました
            </h1>
            <div className="bg-white rounded-xl shadow-md p-6">
              <p className="text-gray-700 mb-4 font-mono text-sm">
                {error instanceof Error ? error.message : JSON.stringify(error)}
              </p>
              <p className="text-sm text-gray-500">スラッグ: {slug}</p>
            </div>
          </div>
        </div>
        <Footer />
      </>
    );
  }
}