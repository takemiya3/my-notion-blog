import { notFound } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ReviewSection from '@/components/ReviewSection';
import { Client } from '@notionhq/client';

const notion = new Client({ auth: process.env.NOTION_API_KEY });

export const revalidate = 60;

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

export default async function PersonPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const person = await getPersonData(resolvedParams.id);

  if (!person) {
    notFound();
  }

  const contents = await getPersonContents(resolvedParams.id);

  // @ts-ignore
  const properties = person.properties;
  const name = properties['人名']?.title[0]?.plain_text || '名前なし';
  const profileImage = properties['プロフィール画像']?.files[0]?.file?.url || properties['プロフィール画像']?.files[0]?.external?.url || '';
  const birthDate = properties['生年月日']?.date?.start || '';
  const description = properties['説明文']?.rich_text[0]?.plain_text || '';

  const fanzaLink = properties['FANZAリンク']?.url || null;

  const categories = properties['カテゴリ']?.multi_select || [];
  const twitterUrl = properties['TwitterURL']?.url || '';
  const instagramUrl = properties['InstagramURL']?.url || '';

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-5xl mx-auto px-4">
          {/* パンくずリスト */}
          <nav className="mb-6 text-sm text-gray-600">
            <Link href="/" className="hover:text-pink-500">ホーム</Link>
            <span className="mx-2">/</span>
            <span className="text-black">{name}</span>
          </nav>

          {/* プロフィール情報 */}
          <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
            <div className="flex flex-col md:flex-row gap-8">
              {/* プロフィール画像 */}
              {profileImage && (
                <div className="flex-shrink-0">
                  <img
                    src={profileImage}
                    alt={name}
                    className="w-64 h-80 object-cover rounded-lg shadow-md"
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

                {/* 生年月日 */}
                {birthDate && (
                  <p className="text-gray-700 mb-4">
                    <span className="font-semibold">生年月日:</span> {birthDate}
                  </p>
                )}

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
                      動画はこちらから
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

          {/* 口コミセクション */}
          <ReviewSection pageId={resolvedParams.id} pageType="人物" />
        </div>
      </div>
      <Footer />
    </>
  );
}