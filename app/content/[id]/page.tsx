import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ReviewSection from '@/components/ReviewSection';
import { Client } from '@notionhq/client';
import type { Metadata } from 'next';

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

// メタデータ生成関数
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
  const description = properties['説明文']?.rich_text[0]?.plain_text || '';
  const thumbnail = properties['サムネイル']?.files[0]?.file?.url || properties['サムネイル']?.files[0]?.external?.url || '';
  const releaseDate = properties['公開日']?.date?.start || '';
  const categories = properties['カテゴリ']?.multi_select || [];
  const performerRelations = properties['出演者']?.relation || [];
  
  // 出演者名を取得
  const performerIds = performerRelations.map((rel: any) => rel.id);
  const performers = await getPerformers(performerIds);
  const performerNames = performers.map(p => p.name).join('、');

  // カテゴリを文字列化
  const categoryNames = categories.map((cat: any) => cat.name).join('、');

  // descriptionを生成（説明文がない場合は自動生成）
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
  const title = properties['タイトル']?.title[0]?.plain_text || '無題';
  const thumbnail = properties['サムネイル']?.files[0]?.file?.url || properties['サムネイル']?.files[0]?.external?.url || '';
  const description = properties['説明文']?.rich_text[0]?.plain_text || '';
  const releaseDate = properties['公開日']?.date?.start || '';
  const views = properties['閲覧数']?.number || 0;
  const videoUrl = properties['動画URL']?.url || null;
  const categories = properties['カテゴリ']?.multi_select || [];
  const performerRelations = properties['出演者']?.relation || [];

  // 出演者情報を取得
  const performerIds = performerRelations.map((rel: any) => rel.id);
  const performers = await getPerformers(performerIds);

  // 構造化データを生成
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

  // パンくずリストの構造化データ
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
        dangerouslySetInnerHTML={ { __html: JSON.stringify(contentJsonLd) } }
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={ {__html: JSON.stringify(breadcrumbJsonLd) } }
      />

      <Header />
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-5xl mx-auto px-4">
          {/* パンくずリスト */}
          <nav className="mb-6 text-sm text-gray-600">
            <Link href="/" className="hover:text-pink-500">ホーム</Link>
            <span className="mx-2">/</span>
            <span className="text-black">{title}</span>
          </nav>

          {/* コンテンツ情報 */}
          <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
            <div className="flex flex-col md:flex-row gap-8">
              {/* サムネイル */}
              {thumbnail && (
                <div className="flex-shrink-0">
                  <Image
                    src={thumbnail}
                    alt={`${title}のサムネイル`}
                    width={400}
                    height={300}
                    className="w-full md:w-96 h-auto object-cover rounded-lg shadow-md"
                    priority
                  />
                </div>
              )}

              {/* コンテンツ詳細 */}
              <div className="flex-1">
                <h1 className="text-4xl font-bold mb-4 text-black">{title}</h1>

                {/* カテゴリタグ */}
                <div className="flex flex-wrap gap-2 mb-4">
                  {categories.map((cat: any) => (
                    <span
                      key={cat.name}
                      className="px-3 py-1 bg-purple-100 text-purple-600 rounded-full text-sm font-semibold"
                    >
                      {cat.name}
                    </span>
                  ))}
                </div>

                {/* メタ情報 */}
                <div className="space-y-2 mb-6">
                  {releaseDate && (
                    <p className="text-gray-700">
                      <span className="font-semibold">📅 公開日:</span> {releaseDate}
                    </p>
                  )}
                  <p className="text-gray-700">
                    <span className="font-semibold">👁 閲覧数:</span> {views.toLocaleString()}
                  </p>
                </div>

                {/* 説明文 */}
                {description && (
                  <p className="text-gray-700 leading-relaxed mb-6 whitespace-pre-wrap">
                    {description}
                  </p>
                )}

                {/* 動画URLボタン */}
                {videoUrl && (
                  <div className="mt-6">
                    <a
                      href={videoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-8 rounded-lg transition-colors duration-200"
                    >
                      動画を見る
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 出演者一覧 */}
          {performers.length > 0 && (
            <section className="mb-12">
              <h2 className="text-3xl font-bold mb-6 text-black">
                出演者 ({performers.length}名)
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {performers.map((performer) => (
                  <Link
                    key={performer.id}
                    href={`/person/${performer.id}`}
                    className="bg-white p-4 rounded-lg shadow hover:shadow-lg transition-shadow text-center"
                  >
                    <p className="font-bold text-black">{performer.name}</p>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* 口コミセクション */}
          <ReviewSection pageId={resolvedParams.id} pageType="コンテンツ" />
        </div>
      </div>
      <Footer />
    </>
  );
}