import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import Script from 'next/script';
import ReviewSection from '@/components/ReviewSection';
import type { Metadata } from 'next';
import { getAffiliatesByPath } from '@/lib/getAffiliates';
import AffiliateWidget from '@/components/AffiliateWidget';
import { getPersonBySlug } from '@/lib/notion/people';
import { getContentsByPerson } from '@/lib/notion/contents';

// ✅ ISR設定
export const revalidate = 3600;
export const dynamicParams = true;

// ✅ ビルド時は生成しない
export async function generateStaticParams() {
  return [];
}

// ✅ params を slug に変更
interface PageProps {
  params: Promise<{ slug: string }>;
}

// 年齢を計算する関数
function calculateAge(birthDate: string): number | null {
  if (!birthDate) return null;
  const today = new Date();
  const birth = new Date(birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }

  return age;
}

// ✅ ランダム表示対応の関連コンテンツ取得関数
async function getRelatedContents(personId: string, limit: number = 10) {
  const { Client } = require('@notionhq/client');
  const notion = new Client({ auth: process.env.NOTION_API_KEY });

  try {
    let response = await notion.databases.query({
      database_id: process.env.NOTION_CONTENT_DB_ID!,
      filter: {
        and: [
          {
            property: '公開ステータス',
            checkbox: {
              equals: true,
            },
          },
          {
            property: '出演者',
            relation: {
              contains: personId,
            },
          },
        ],
      },
      sorts: [
        {
          property: '閲覧数',
          direction: 'descending',
        },
      ],
      page_size: limit * 3,
    });

    if (response.results.length <= limit) {
      response = await notion.databases.query({
        database_id: process.env.NOTION_CONTENT_DB_ID!,
        filter: {
          property: '公開ステータス',
          checkbox: {
            equals: true,
          },
        },
        sorts: [
          {
            property: '閲覧数',
            direction: 'descending',
          },
        ],
        page_size: limit * 3,
      });
    }

    const shuffled = [...response.results];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    return shuffled.slice(0, limit);
  } catch (error) {
    console.error('Error fetching related contents:', error);
    return [];
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const resolvedParams = await params;
  const person = await getPersonBySlug(resolvedParams.slug);

  if (!person) {
    return {
      title: '人物が見つかりません',
      description: 'お探しの人物ページは見つかりませんでした。',
    };
  }

  const categoryNames = person.categories.join('、');
  const metaDescription = person.description ||
    `${person.name}のプロフィール。${categoryNames}として活躍。${person.birthDate ? `生年月日：${person.birthDate}。` : ''}出演コンテンツ一覧、口コミ、評価などの詳細情報をご覧いただけます。`;

  return {
    title: `${person.name} - プロフィール・出演作品 | 放課後制服動画ナビ`,
    description: metaDescription.slice(0, 160),
    openGraph: {
      title: `${person.name} - 放課後制服動画ナビ`,
      description: metaDescription.slice(0, 160),
      url: `https://www.seifuku-jk.com/person/${resolvedParams.slug}`,
      type: 'profile',
      images: person.image ? [
        {
          url: person.image,
          width: 800,
          height: 600,
          alt: person.name,
        },
      ] : [],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${person.name} - 放課後制服動画ナビ`,
      description: metaDescription.slice(0, 160),
      images: person.image ? [person.image] : [],
    },
  };
}

export default async function PersonPage({ params }: PageProps) {
  const resolvedParams = await params;
  const person = await getPersonBySlug(resolvedParams.slug);

  if (!person) {
    notFound();
  }

  const contents = await getContentsByPerson(person.id);

  // ✅ アフィリエイト取得
  const affiliates = await getAffiliatesByPath('/person/*');

  // 年齢を計算
  const age = calculateAge(person.birthDate || '');

  // ✅ ランダム表示対応の関連コンテンツ取得
  const relatedContents = await getRelatedContents(person.id, 10);

  // 構造化データ: Person型
  const personJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: person.name,
    image: person.image,
    birthDate: person.birthDate || undefined,
    description: person.description || `${person.name}のプロフィールページ`,
    jobTitle: person.categories.join('、') || undefined,
    height: person.height ? `${person.height}cm` : undefined,
    url: `https://www.seifuku-jk.com/person/${resolvedParams.slug}`,
    sameAs: [
      person.fanzaLink,
    ].filter(Boolean),
  };

  // 構造化データ: パンくずリスト
  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'ホーム',
        item: 'https://www.seifuku-jk.com',
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: '女優一覧',
        item: 'https://www.seifuku-jk.com/people',
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: person.name,
        item: `https://www.seifuku-jk.com/person/${resolvedParams.slug}`,
      },
    ],
  };

  // 構造化データ: 出演作品一覧（ItemList）
  const contentsItemListJsonLd = contents.length > 0 ? {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: `${person.name}の出演作品`,
    numberOfItems: contents.length,
    itemListElement: contents.slice(0, 10).map((content: any, index: number) => ({
      '@type': 'ListItem',
      position: index + 1,
      item: {
        '@type': 'VideoObject',
        name: content.title || '無題',
        thumbnailUrl: content.thumbnail || '',
        uploadDate: content.releaseDate || '',
        url: `https://www.seifuku-jk.com/content/${content.id}`,
      },
    })),
  } : null;

  return (
    <>
      {/* 構造化データ */}
      <Script
        id="person-structured-data"
        type="application/ld+json"
        dangerouslySetInnerHTML={{__html: JSON.stringify(personJsonLd)}}
      />
      <Script
        id="breadcrumb-structured-data"
        type="application/ld+json"
        dangerouslySetInnerHTML={{__html: JSON.stringify(breadcrumbJsonLd)}}
      />
      {contentsItemListJsonLd && (
        <Script
          id="contents-itemlist-structured-data"
          type="application/ld+json"
          dangerouslySetInnerHTML={{__html: JSON.stringify(contentsItemListJsonLd)}}
        />
      )}

      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-5xl mx-auto px-4">
          {/* パンくずリスト */}
          <nav className="mb-6 text-sm text-gray-600">
            <Link href="/" className="hover:text-pink-500">ホーム</Link>
            <span className="mx-2">/</span>
            <Link href="/people" className="hover:text-pink-500">女優一覧</Link>
            <span className="mx-2">/</span>
            <span className="text-black">{person.name}</span>
          </nav>

          {/* プロフィール情報 */}
          <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
            <div className="flex flex-col md:flex-row gap-8">
              {/* プロフィール画像 */}
              {person.image && (
                <div className="flex-shrink-0">
                  <Image
                    src={person.image}
                    alt={`${person.name}のプロフィール画像`}
                    width={256}
                    height={320}
                    className="w-64 h-80 object-cover rounded-lg shadow-md"
                    priority
                  />
                </div>
              )}

              {/* プロフィール詳細 */}
              <div className="flex-1">
                <h1 className="text-4xl font-bold mb-4 text-black">{person.name}</h1>

                {/* カテゴリタグ */}
                <div className="flex flex-wrap gap-2 mb-4">
                  {person.categories.map((cat: string) => (
                    <span
                      key={cat}
                      className="px-3 py-1 bg-pink-100 text-pink-600 rounded-full text-sm font-semibold"
                    >
                      {cat}
                    </span>
                  ))}
                </div>

                {/* プロフィール情報グリッド */}
                <div className="space-y-2 mb-6">
                  {/* 生年月日 */}
                  {person.birthDate && (
                    <p className="text-gray-700">
                      <span className="font-semibold">生年月日:</span> {person.birthDate}
                    </p>
                  )}

                  {/* 年齢 */}
                  {age !== null && (
                    <p className="text-gray-700">
                      <span className="font-semibold">年齢:</span> {age}歳
                    </p>
                  )}

                  {/* 出身 */}
                  {person.origin && (
                    <p className="text-gray-700">
                      <span className="font-semibold">出身:</span> {person.origin}
                    </p>
                  )}

                  {/* 身長 */}
                  {person.height && (
                    <p className="text-gray-700">
                      <span className="font-semibold">身長:</span> {person.height}cm
                    </p>
                  )}

                  {/* カップ数 */}
                  {person.cupSize && (
                    <p className="text-gray-700">
                      <span className="font-semibold">カップ数:</span> {person.cupSize}カップ
                    </p>
                  )}

                  {/* スリーサイズ */}
                  {person.measurements && (
                    <p className="text-gray-700">
                      <span className="font-semibold">スリーサイズ:</span> {person.measurements}
                    </p>
                  )}
                </div>

                {/* 説明文 */}
                {person.description && (
                  <p className="text-gray-700 leading-relaxed mb-6 whitespace-pre-wrap">
                    {person.description}
                  </p>
                )}

                {/* FANZAリンクボタン */}
                {person.fanzaLink && (
                  <div className="mt-6">
                    <a
                      href={person.fanzaLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-8 rounded-lg transition-colors duration-200"
                    >
                      🎬 動画はこちらから
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ✅ アフィリエイトウィジェット（出演コンテンツの上）*/}
          {affiliates.map((affiliate) => (
            <AffiliateWidget
              key={affiliate.id}
              dataId={affiliate.dataId}
            />
          ))}

          {/* 出演コンテンツ一覧 */}
          <section className="mb-12">
            <h2 className="text-3xl font-bold mb-6 text-black">
              出演コンテンツ ({contents.length}件)
            </h2>

            {contents.length === 0 ? (
              <p className="text-center text-gray-600 py-12">
                まだコンテンツがありません
              </p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {contents.map((content: any) => {
                  return (
                    <Link
                      key={content.id}
                      href={`/content/${content.id}`}
                      className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow overflow-hidden"
                    >
                      {content.thumbnail && (
                        <Image
                          src={content.thumbnail}
                          alt={content.title}
                          width={300}
                          height={200}
                          className="w-full h-48 object-cover"
                        />
                      )}
                      <div className="p-4">
                        <h3 className="font-bold text-lg mb-2 line-clamp-2 text-black">
                          {content.title}
                        </h3>
                        {content.releaseDate && (
                          <p className="text-sm text-gray-600 mb-1">
                            📅 {content.releaseDate}
                          </p>
                        )}
                        <p className="text-sm text-gray-600">
                          👁 {content.views?.toLocaleString() || 0} views
                        </p>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </section>

          {/* 人気の作品セクション */}
          <section className="mb-12">
            <h2 className="text-3xl font-bold mb-6 text-black">
              🔥 人気の作品
            </h2>

            {relatedContents.length === 0 ? (
              <p className="text-center text-gray-600 py-12">
                関連するコンテンツが見つかりませんでした
              </p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
                {relatedContents.map((content: any) => {
                  const contentId = content.id;
                  const title = content.properties['タイトル']?.title[0]?.plain_text || '無題';
                  const thumbnail = content.properties['サムネイル']?.files[0]?.file?.url || content.properties['サムネイル']?.files[0]?.external?.url || '';
                  const views = content.properties['閲覧数']?.number || 0;

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
                          width={200}
                          height={150}
                          className="w-full h-32 object-cover"
                        />
                      )}
                      <div className="p-3">
                        <h3 className="font-bold text-sm mb-1 line-clamp-2 text-black">
                          {title}
                        </h3>
                        <p className="text-xs text-gray-600">
                          👁 {views.toLocaleString()}
                        </p>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </section>

          {/* 口コミセクション */}
          <ReviewSection pageId={person.id} pageType="人物" />
        </div>
      </div>
    </>
  );
}