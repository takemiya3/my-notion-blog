import { notFound } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Client } from '@notionhq/client';

const notion = new Client({ auth: process.env.NOTION_API_KEY });

async function getContentData(contentId: string) {
  try {
    const content = await notion.pages.retrieve({ page_id: contentId });
    return content;
  } catch (error) {
    console.error('Error fetching content:', error);
    return null;
  }
}

async function getRelatedPeople(personIds: string[]) {
  if (personIds.length === 0) return [];

  try {
    const people = await Promise.all(
      personIds.map((id) => notion.pages.retrieve({ page_id: id }))
    );
    return people;
  } catch (error) {
    console.error('Error fetching related people:', error);
    return [];
  }
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
  const sales = properties['売上']?.number || 0;
  const genre = properties['ジャンル']?.select?.name || '';
  const maker = properties['メーカー']?.rich_text?.[0]?.plain_text || '';
  const affiliateUrl = properties['アフィリエイトURL']?.url || '';
  const categories = properties['カテゴリ']?.multi_select || [];
  const personRelations = properties['出演者']?.relation || [];

  const people = await getRelatedPeople(personRelations.map((r: any) => r.id));

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-5xl mx-auto px-4">
          {/* パンくずリスト */}
          <nav className="mb-6 text-sm text-gray-600">
            <Link href="/" className="hover:text-pink-500">ホーム</Link>
            <span className="mx-2">/</span>
            <span className="text-black">{title}</span>
          </nav>

          {/* コンテンツ詳細 */}
          <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
            <div className="flex flex-col md:flex-row gap-8">
              {/* サムネイル */}
              {thumbnail && (
                <div className="flex-shrink-0">
                  <img
                    src={thumbnail}
                    alt={title}
                    className="w-full md:w-80 h-auto object-cover rounded-lg shadow-md"
                  />
                </div>
              )}

              {/* コンテンツ情報 */}
              <div className="flex-1">
                <h1 className="text-4xl font-bold mb-4 text-black">{title}</h1>

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

                {/* メタ情報 */}
                <div className="space-y-2 mb-6 text-gray-700">
                  {releaseDate && (
                    <p><span className="font-semibold">公開日:</span> {releaseDate}</p>
                  )}
                  {genre && (
                    <p><span className="font-semibold">ジャンル:</span> {genre}</p>
                  )}
                  {maker && (
                    <p><span className="font-semibold">メーカー:</span> {maker}</p>
                  )}
                  <p><span className="font-semibold">閲覧数:</span> {views.toLocaleString()} views</p>
                  {sales > 0 && (
                    <p><span className="font-semibold">売上:</span> ¥{sales.toLocaleString()}</p>
                  )}
                </div>

                {/* 説明文 */}
                {description && (
                  <p className="text-gray-700 leading-relaxed mb-6 whitespace-pre-wrap">
                    {description}
                  </p>
                )}

                {/* アフィリエイトリンク */}
                {affiliateUrl && (
                  <a
                    href={affiliateUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block px-8 py-3 bg-pink-500 text-white font-bold rounded-lg hover:bg-pink-600 transition shadow-md"
                  >
                     FANZAで詳細を見る
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* 出演者一覧 */}
          {people.length > 0 && (
            <section className="mb-8">
              <h2 className="text-3xl font-bold mb-6 text-black">出演者</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
                {people.map((person: any) => {
                  const personId = person.id;
                  const name = person.properties['人名']?.title[0]?.plain_text || '名前なし';
                  const profileImage = person.properties['プロフィール画像']?.files[0]?.file?.url || person.properties['プロフィール画像']?.files[0]?.external?.url || '';
                  const fanzaLink = person.properties['FANZAリンク']?.url || null;

                  return (
                    <div key={personId} className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow p-4">
                      <Link href={`/person/${personId}`}>
                        {profileImage && (
                          <img
                            src={profileImage}
                            alt={name}
                            className="w-full h-48 object-cover rounded-lg mb-3"
                          />
                        )}
                        <h3 className="font-bold text-center text-black mb-3">{name}</h3>
                      </Link>
                      
                      {/* FANZAリンクボタン */}
                      {fanzaLink && (
                        <a
                          href={fanzaLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block text-center bg-red-600 hover:bg-red-700 text-white text-sm font-bold py-2 px-3 rounded-lg transition-colors duration-200"
                        >
                          動画を見る
                        </a>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          )}
        </div>
      </div>
      <Footer />
    </>
  );
}