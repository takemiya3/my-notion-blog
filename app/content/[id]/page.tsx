import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import Footer from '@/components/Footer';
import ReviewSection from '@/components/ReviewSection';
import { Client } from '@notionhq/client';
import type { Metadata } from 'next';
import SampleImageGallery from './SampleImageGallery';

const notion = new Client({ auth: process.env.NOTION_API_KEY });

export const revalidate = 60;

async function getContentData(contentId: string) {
  try {
    const content = await notion.pages.retrieve({ page_id: contentId });
    return content;
  } catch (error) {
    console.error('Error fetching content:', error);
    return null;
  }
}

async function getPerformers(performerIds: string[]) {
  try {
    const performers = await Promise.all(
      performerIds.map(async (id) => {
        try {
          const person = await notion.pages.retrieve({ page_id: id });
          // @ts-ignore
          const name = person.properties['人名']?.title[0]?.plain_text || '不明';
          return { id, name };
        } catch {
          return { id, name: '不明' };
        }
      })
    );
    return performers;
  } catch (error) {
    console.error('Error fetching performers:', error);
    return [];
  }
}

async function getRelatedContents(category: string, genre: string, currentContentId: string, limit: number = 10) {
  try {
    const filters: any[] = [
      {
        property: '公開ステータス',
        checkbox: {
          equals: true,
        },
      },
    ];

    const categoryGenreFilters: any[] = [];

    if (category) {
      categoryGenreFilters.push({
        property: 'カテゴリ',
        multi_select: {
          contains: category,
        },
      });
    }

    if (genre) {
      categoryGenreFilters.push({
        property: 'ジャンル',
        select: {
          equals: genre,
        },
      });
    }

    if (categoryGenreFilters.length > 0) {
      filters.push({
        or: categoryGenreFilters,
      });
    }

    const response = await notion.databases.query({
      database_id: process.env.NOTION_CONTENT_DB_ID!,
      filter: {
        and: filters,
      },
      sorts: [
        {
          property: '閲覧数',
          direction: 'descending',
        },
      ],
      page_size: limit + 1,
    });

    const relatedContents = response.results.filter((content: any) => content.id !== currentContentId);

    return relatedContents.slice(0, limit);
  } catch (error) {
    console.error('Error fetching related contents:', error);
    return [];
  }
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const resolvedParams = await params;
  const content = await getContentData(resolvedParams.id);

  if (!content) {
    return {
      title: 'コンテンツが見つかりません',
      description: 'お探しのコンテンツページは見つかりませんでした。',
    };
  }

  // @ts-ignore
  const properties = content.properties;
  const title = properties['タイトル']?.title[0]?.plain_text || '無題';
  const description = properties['概要文']?.rich_text[0]?.plain_text || properties['説明文']?.rich_text[0]?.plain_text || '';
  const thumbnail = properties['サムネイル']?.files[0]?.file?.url || properties['サムネイル']?.files[0]?.external?.url || '';
  const releaseDate = properties['公開日']?.date?.start || '';
  const categories = properties['カテゴリ']?.multi_select || [];
  const performerRelations = properties['出演者']?.relation || [];

  const performerIds = performerRelations.map((rel: any) => rel.id);
  const performers = await getPerformers(performerIds);
  const performerNames = performers.map(p => p.name).join('、');

  const categoryNames = categories.map((cat: any) => cat.name).join('、');

  const metaDescription = description ||
    `${title}${performerNames ? ` - ${performerNames}が出演。` : '。'}${categoryNames ? `カテゴリ：${categoryNames}。` : ''}${releaseDate ? `公開日：${releaseDate}。` : ''}口コミ、評価などの詳細情報をご覧いただけます。`;

  return {
    title: title,
    description: metaDescription.slice(0, 160),
    keywords: [title, ...performerNames.split('、').filter(Boolean), ...categoryNames.split('、').filter(Boolean), 'コンテンツ', '動画'],
    openGraph: {
      title: `${title} - 放課後制服動画ナビ`,
      description: metaDescription.slice(0, 160),
      url: `{{https://seifuku-jk.com/content/${resolvedParams.id}}}`,
      type: 'video.other',
      images: thumbnail ? [
        {
          url: thumbnail,
          width: 1200,
          height: 630,
          alt: title,
        },
      ] : [],
    },
    twitter: {
      card: 'summary_large_image',
      title: title,
      description: metaDescription.slice(0, 160),
      images: thumbnail ? [thumbnail] : [],
    },
  };
}

export default async function ContentPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const content = await getContentData(resolvedParams.id);

  if (!content) {
    notFound();
  }

  // @ts-ignore
  const properties = content.properties;

  // ✅ デバッグ：プロパティ名を全て確認
  console.log('=== 全プロパティ名 ===');
  console.log(Object.keys(properties));

  // ✅ サムネイルの詳細情報
  console.log('\n=== サムネイル詳細 ===');
  console.log(JSON.stringify(properties['サムネイル'], null, 2));

  // ✅ サンプル画像の詳細情報
  console.log('\n=== サンプル画像詳細 ===');
  console.log(JSON.stringify(properties['サンプル画像'], null, 2));

  const title = properties['タイトル']?.title[0]?.plain_text || '無題';

  // 複数のパターンで画像URLを取得してみる
  const thumbnail =
    properties['サムネイル']?.files?.[0]?.file?.url ||
    properties['サムネイル']?.files?.[0]?.external?.url ||
    properties['サムネイル']?.url ||
    '';

  console.log('\n取得したサムネイルURL:', thumbnail);

  const sampleImages = properties['サンプル画像']?.files?.map(
    (file: any) => {
      const url = file.file?.url || file.external?.url || file.url;
      console.log('サンプル画像URL:', url);
      return url;
    }
  ).filter(Boolean) || [];

  console.log('\nサンプル画像配列:', sampleImages);
  console.log('サンプル画像件数:', sampleImages.length);
  console.log('================================\n');

  const description = properties['概要文']?.rich_text[0]?.plain_text || properties['説明文']?.rich_text[0]?.plain_text || '';
  const performerNamesText = properties['出演者名']?.rich_text[0]?.plain_text || '';
  const releaseDate = properties['公開日']?.date?.start || '';
  const views = properties['閲覧数']?.number || 0;
  const affiliateUrl = properties['アフィリエイトURL']?.url || '';
  const categories = properties['カテゴリ']?.multi_select || [];
  const category = categories[0]?.name || '';
  const genre = properties['ジャンル']?.select?.name || '';
  const performerRelations = properties['出演者']?.relation || [];

  const performerIds = performerRelations.map((rel: any) => rel.id);
  const performers = await getPerformers(performerIds);

  const relatedContents = await getRelatedContents(category, genre, resolvedParams.id, 8);

  const contentJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'VideoObject',
    name: title,
    description: description,
    thumbnailUrl: thumbnail,
    uploadDate: releaseDate,
    contentUrl: `{{https://seifuku-jk.com/content/${resolvedParams.id}}}`,
    interactionStatistic: {
      '@type': 'InteractionCounter',
      interactionType: { '@type': 'WatchAction' },
      userInteractionCount: views,
    },
    actor: performers.map(performer => ({
      '@type': 'Person',
      name: performer.name,
      url: `{{https://seifuku-jk.com/person/${performer.id}}}`,
    })),
  };

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'ホーム',
        item: 'https://seifuku-jk.com',
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: title,
        item: `{{https://seifuku-jk.com/content/${resolvedParams.id}}}`,
      },
    ],
  };

  return (
    <>
      {/* 構造化データを追加 */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML=177
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML=178
      />

      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4">
          {/* パンくずリスト */}
          <nav className="mb-6 text-sm text-gray-600">
            <Link href="/" className="hover:text-pink-500">ホーム</Link>
            <span className="mx-2">/</span>
            <span className="text-black">{title}</span>
          </nav>

          {/* コンテンツ情報 */}
          <div className="bg-white rounded-lg shadow-lg p-6 md:p-8 mb-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* 左側：サムネイルとアフィリエイト */}
              <div className="lg:col-span-1">
                {thumbnail && (
                  <div className="mb-6">
                    <Image
                      src={thumbnail}
                      alt={`${title}のサムネイル`}
                      width={400}
                      height={600}
                      className="w-full h-auto object-cover rounded-lg shadow-md"
                      priority
                    />
                  </div>
                )}

                {/* サンプル画像ギャラリー */}
                {sampleImages.length > 0 && (
                  <div className="mb-6">
                    <SampleImageGallery images={sampleImages} />
                  </div>
                )}

                {/* アフィリエイトボタン */}
                {affiliateUrl && (
                  <div className="sticky top-4">
                    <a
                      href={affiliateUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block w-full bg-gradient-to-r from-pink-500 to-red-500 hover:from-pink-600 hover:to-red-600 text-white font-bold py-4 px-6 rounded-lg transition-all duration-200 text-center shadow-lg hover:shadow-xl"
                    >
                      🎬 動画をチェック
                    </a>
                  </div>
                )}
              </div>

              {/* 右側：コンテンツ詳細 */}
              <div className="lg:col-span-2">
                <h1 className="text-3xl md:text-4xl font-bold mb-4 text-black leading-tight">{title}</h1>

                {/* カテゴリタグ */}
                <div className="flex flex-wrap gap-2 mb-6">
                  {categories.map((cat: any) => (
                    <span key={cat.name} className="px-3 py-1 bg-purple-100 text-purple-600 rounded-full text-sm font-semibold">
                      {cat.name}
                    </span>
                  ))}
                  {genre && (
                    <span className="px-3 py-1 bg-blue-100 text-blue-600 rounded-full text-sm font-semibold">
                      {genre}
                    </span>
                  )}
                </div>

                {/* メタ情報 */}
                <div className="bg-gray-50 rounded-lg p-4 mb-6 space-y-2">
                  {releaseDate && (
                    <p className="text-gray-700 flex items-center gap-2">
                      <span className="font-semibold">📅 公開日:</span> {releaseDate}
                    </p>
                  )}
                  <p className="text-gray-700 flex items-center gap-2">
                    <span className="font-semibold">👁 閲覧数:</span> {views.toLocaleString()}
                  </p>
                  {performerNamesText && (
                    <p className="text-gray-700 flex items-center gap-2">
                      <span className="font-semibold">👥 出演者:</span> {performerNamesText}
                    </p>
                  )}
                </div>

                {/* 概要文 */}
                {description && (
                  <div className="mb-6">
                    <h2 className="text-xl font-bold mb-3 text-black">📝 概要</h2>
                    <p className="text-gray-700 leading-relaxed whitespace-pre-wrap bg-gray-50 p-4 rounded-lg">
                      {description}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 出演者一覧（リレーションから） */}
          {performers.length > 0 && (
            <section className="mb-12">
              <h2 className="text-2xl md:text-3xl font-bold mb-6 text-black">
                👥 出演者 ({performers.length}名)
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {performers.map((performer) => (
                  <Link
                    key={performer.id}
                    href={`/person/${performer.id}`}
                    className="bg-white p-4 rounded-lg shadow hover:shadow-lg transition-all hover:scale-105 text-center"
                  >
                    <p className="font-bold text-black text-sm">{performer.name}</p>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* 人気の作品セクション */}
          <section className="mb-12">
            <h2 className="text-2xl md:text-3xl font-bold mb-6 text-black">
              🔥 人気の作品
            </h2>
            {relatedContents.length === 0 ? (
              <p className="text-center text-gray-600 py-12 bg-white rounded-lg">
                関連するコンテンツが見つかりませんでした
              </p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 md:gap-6">
                {relatedContents.map((relatedContent: any) => {
                  const contentId = relatedContent.id;
                  const contentTitle = relatedContent.properties['タイトル']?.title[0]?.plain_text || '無題';
                  const contentThumbnail = relatedContent.properties['サムネイル']?.files[0]?.file?.url || relatedContent.properties['サムネイル']?.files[0]?.external?.url || '';
                  const contentViews = relatedContent.properties['閲覧数']?.number || 0;

                  return (
                    <Link
                      key={contentId}
                      href={`/content/${contentId}`}
                      className="bg-white rounded-lg shadow hover:shadow-xl transition-all hover:scale-105 overflow-hidden group"
                    >
                      {contentThumbnail && (
                        <div className="relative aspect-[3/4] overflow-hidden">
                          <Image
                            src={contentThumbnail}
                            alt={contentTitle}
                            fill
                            className="object-cover group-hover:scale-110 transition-transform duration-300"
                          />
                        </div>
                      )}
                      <div className="p-3">
                        <h3 className="font-bold text-sm mb-2 line-clamp-2 text-black min-h-[2.5rem]">
                          {contentTitle}
                        </h3>
                        <p className="text-xs text-gray-600 flex items-center gap-1">
                          <span>👁</span>
                          <span>{contentViews.toLocaleString()}</span>
                        </p>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </section>

          {/* 口コミセクション */}
          <ReviewSection pageId={resolvedParams.id} pageType="コンテンツ" />
        </div>
      </div>
      <Footer />
    </>
  );
}