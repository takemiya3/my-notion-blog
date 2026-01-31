import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import Script from 'next/script';
import ReviewSection from '@/components/ReviewSection';
import { Client } from '@notionhq/client';
import type { Metadata } from 'next';
import { getAffiliatesByPath } from '@/lib/getAffiliates';
import AffiliateWidget from '@/components/AffiliateWidget';

const notion = new Client({ auth: process.env.NOTION_API_KEY });

export const revalidate = 60;

// ✅ 静的パス生成（必須！）
export async function generateStaticParams() {
  try {
    const response = await notion.databases.query({
      database_id: process.env.NOTION_PEOPLE_DB_ID!,
      filter: {
        property: '公開ステータス',
        checkbox: {
          equals: true,
        },
      },
    });

    return response.results.map((person) => ({
      id: person.id,
    }));
  } catch (error) {
    console.error('Error generating static params:', error);
    return [];
  }
}

// 年齢を計算する関数
function calculateAge(birthDate: string): number | null {
  if (!birthDate) return null;
  const today = new Date();
  const birth = new Date(birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  
  // 誕生日がまだ来ていない場合は1を引く
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  
  return age;
}

async function getPersonData(personId: string) {
  try {
    const person = await notion.pages.retrieve({ page_id: personId });
    return person;
  } catch (error) {
    console.error('Error fetching person:', error);
    return null;
  }
}

async function getPersonContents(personId: string) {
  try {
    const response = await notion.databases.query({
      database_id: process.env.NOTION_CONTENT_DB_ID!,
      filter: {
        property: '出演者',
        relation: {
          contains: personId,
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
    console.error('Error fetching person contents:', error);
    return [];
  }
}

async function getRelatedContents(personCategories: string[], currentPersonId: string, limit: number = 10) {
  try {
    if (!personCategories || personCategories.length === 0) {
      const response = await notion.databases.query({
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
        page_size: limit,
      });

      return response.results;
    }

    const categoryFilters = personCategories.map(category => ({
      property: 'カテゴリ',
      multi_select: {
        contains: category,
      },
    }));

    const response = await notion.databases.query({
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
            or: categoryFilters,
          },
        ],
      },
      sorts: [
        {
          property: '閲覧数',
          direction: 'descending',
        },
      ],
      page_size: limit,
    });

    return response.results;
  } catch (error) {
    console.error('Error fetching related contents:', error);
    return [];
  }
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const resolvedParams = await params;
  const person = await getPersonData(resolvedParams.id);
  
  if (!person) {
    return {
      title: '人物が見つかりません',
      description: 'お探しの人物ページは見つかりませんでした。',
    };
  }

  // @ts-ignore
  const properties = person.properties;
  const name = properties['人名']?.title[0]?.plain_text || '名前なし';
  const description = properties['説明文']?.rich_text[0]?.plain_text || '';
  const profileImage = properties['プロフィール画像']?.files[0]?.file?.url || properties['プロフィール画像']?.files[0]?.external?.url || '';
  const categories = properties['カテゴリ']?.multi_select || [];
  const birthDate = properties['生年月日']?.date?.start || '';
  
  const categoryNames = categories.map((cat: any) => cat.name).join('、');
  const metaDescription = description ||
    `${name}のプロフィール。${categoryNames}として活躍。${birthDate ? `生年月日：${birthDate}。` : ''}出演コンテンツ一覧、口コミ、評価などの詳細情報をご覧いただけます。`;

  return {
    title: `${name} - プロフィール・出演作品 | 放課後制服動画ナビ`,
    description: metaDescription.slice(0, 160),
    openGraph: {
      title: `${name} - 放課後制服動画ナビ`,
      description: metaDescription.slice(0, 160),
      url: `https://www.seifuku-jk.com/person/${resolvedParams.id}`,
      type: 'profile',
      images: profileImage ? [
        {
          url: profileImage,
          width: 800,
          height: 600,
          alt: name,
        },
      ] : [],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${name} - 放課後制服動画ナビ`,
      description: metaDescription.slice(0, 160),
      images: profileImage ? [profileImage] : [],
    },
  };
}

export default async function PersonPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const person = await getPersonData(resolvedParams.id);
  
  if (!person) {
    notFound();
  }
  
  const contents = await getPersonContents(resolvedParams.id);
  
  // ✅ アフィリエイト取得（NEW!）
  const affiliates = await getAffiliatesByPath('/person/*');
  
  // @ts-ignore
  const properties = person.properties;
  const name = properties['人名']?.title[0]?.plain_text || '名前なし';
  const profileImage = properties['プロフィール画像']?.files[0]?.file?.url || properties['プロフィール画像']?.files[0]?.external?.url || '';
  const birthDate = properties['生年月日']?.date?.start || '';
  const description = properties['説明文']?.rich_text[0]?.plain_text || '';
  const threeSizes = properties['スリーサイズ']?.rich_text[0]?.plain_text || '';
  const fanzaLink = properties['FANZAリンク']?.url || null;
  const birthplace = properties['出身']?.rich_text[0]?.plain_text || '';
  const height = properties['身長']?.number || null;
  const cupSize = properties['カップ数']?.select?.name || '';
  
  // 年齢を計算
  const age = calculateAge(birthDate);
  
  const categories = properties['カテゴリ']?.multi_select || [];
  const categoryNames = categories.map((cat: any) => cat.name);
  
  const twitterUrl = properties['TwitterURL']?.url || '';
  const instagramUrl = properties['InstagramURL']?.url || '';
  
  const relatedContents = await getRelatedContents(categoryNames, resolvedParams.id, 10);
  
  // 構造化データ: Person型
  const personJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: name,
    image: profileImage,
    birthDate: birthDate || undefined,
    description: description || `${name}のプロフィールページ`,
    jobTitle: categories.map((cat: any) => cat.name).join('、') || undefined,
    height: height ? `${height}cm` : undefined,
    url: `https://www.seifuku-jk.com/person/${resolvedParams.id}`,
    sameAs: [
      twitterUrl,
      instagramUrl,
      fanzaLink,
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
        name: name,
        item: `https://www.seifuku-jk.com/person/${resolvedParams.id}`,
      },
    ],
  };
  
  // 構造化データ: 出演作品一覧（ItemList）
  const contentsItemListJsonLd = contents.length > 0 ? {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: `${name}の出演作品`,
    numberOfItems: contents.length,
    itemListElement: contents.slice(0, 10).map((content: any, index: number) => ({
      '@type': 'ListItem',
      position: index + 1,
      item: {
        '@type': 'VideoObject',
        name: content.properties['タイトル']?.title[0]?.plain_text || '無題',
        thumbnailUrl: content.properties['サムネイル']?.files[0]?.file?.url ||
                      content.properties['サムネイル']?.files[0]?.external?.url || '',
        uploadDate: content.properties['公開日']?.date?.start || '',
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
            <span className="text-black">{name}</span>
          </nav>

          {/* プロフィール情報 */}
          <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
            <div className="flex flex-col md:flex-row gap-8">
              {/* プロフィール画像 */}
              {profileImage && (
                <div className="flex-shrink-0">
                  <Image
                    src={profileImage}
                    alt={`${name}のプロフィール画像`}
                    width={256}
                    height={320}
                    className="w-64 h-80 object-cover rounded-lg shadow-md"
                    priority
                  />
                </div>
              )}

              {/* プロフィール詳細 */}
              <div className="flex-1">
                <h1 className="text-4xl font-bold mb-4 text-black">{name}</h1>
                
                {/* カテゴリタグ */}
                <div className="flex flex-wrap gap-2 mb-4">
                  {categories.map((cat: any) => (
                    <span
                      key={cat.name}
                      className="px-3 py-1 bg-pink-100 text-pink-600 rounded-full text-sm font-semibold"
                    >
                      {cat.name}
                    </span>
                  ))}
                </div>

                {/* プロフィール情報グリッド */}
                <div className="space-y-2 mb-6">
                  {/* 生年月日 */}
                  {birthDate && (
                    <p className="text-gray-700">
                      <span className="font-semibold">生年月日:</span> {birthDate}
                    </p>
                  )}
                  
                  {/* 年齢 */}
                  {age !== null && (
                    <p className="text-gray-700">
                      <span className="font-semibold">年齢:</span> {age}歳
                    </p>
                  )}
                  
                  {/* 出身 */}
                  {birthplace && (
                    <p className="text-gray-700">
                      <span className="font-semibold">出身:</span> {birthplace}
                    </p>
                  )}
                  
                  {/* 身長 */}
                  {height && (
                    <p className="text-gray-700">
                      <span className="font-semibold">身長:</span> {height}cm
                    </p>
                  )}
                  
                  {/* カップ数 */}
                  {cupSize && (
                    <p className="text-gray-700">
                      <span className="font-semibold">カップ数:</span> {cupSize}カップ
                    </p>
                  )}
                  
                  {/* スリーサイズ */}
                  {threeSizes && (
                    <p className="text-gray-700">
                      <span className="font-semibold">スリーサイズ:</span> {threeSizes}
                    </p>
                  )}
                </div>

                {/* 説明文 */}
                {description && (
                  <p className="text-gray-700 leading-relaxed mb-6 whitespace-pre-wrap">
                    {description}
                  </p>
                )}

                {/* FANZAリンクボタン */}
                {fanzaLink && (
                  <div className="mt-6">
                    <a
                      href={fanzaLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-8 rounded-lg transition-colors duration-200"
                    >
                      🎬 動画はこちらから
                    </a>
                  </div>
                )}

                {/* SNSリンク */}
                {(twitterUrl || instagramUrl) && (
                  <div className="flex gap-4 mt-4">
                    {twitterUrl && (
                      <a
                        href={twitterUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
                      >
                        🐦 Twitter
                      </a>
                    )}
                    {instagramUrl && (
                      <a
                        href={instagramUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 transition"
                      >
                        📷 Instagram
                      </a>
                    )}
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
                  const contentId = content.id;
                  const title = content.properties['タイトル']?.title[0]?.plain_text || '無題';
                  const thumbnail = content.properties['サムネイル']?.files[0]?.file?.url || content.properties['サムネイル']?.files[0]?.external?.url || '';
                  const views = content.properties['閲覧数']?.number || 0;
                  const releaseDate = content.properties['公開日']?.date?.start || '';

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
                        <h3 className="font-bold text-lg mb-2 line-clamp-2 text-black">
                          {title}
                        </h3>
                        {releaseDate && (
                          <p className="text-sm text-gray-600 mb-1">
                            📅 {releaseDate}
                          </p>
                        )}
                        <p className="text-sm text-gray-600">
                          👁 {views.toLocaleString()} views
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
          <ReviewSection pageId={resolvedParams.id} pageType="人物" />
        </div>
      </div>
    </>
  );
}