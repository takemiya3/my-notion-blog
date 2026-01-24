import { notFound } from 'next/navigation';
import { Client } from '@notionhq/client';
import Link from 'next/link';

const notion = new Client({
  auth: process.env.NOTION_API_KEY,
});

async function getContent(id: string) {
  try {
    const page = await notion.pages.retrieve({ page_id: id });
    return page;
  } catch (error) {
    return null;
  }
}

async function getPeople(personIds: string[]) {
  const people = [];
  for (const id of personIds) {
    try {
      const person = await notion.pages.retrieve({ page_id: id });
      people.push(person);
    } catch (error) {
      console.error('Error fetching person:', error);
    }
  }
  return people;
}

export default async function ContentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  
  const content = await getContent(id);
  
  if (!content) {
    notFound();
  }

  // @ts-ignore
  const title = content.properties['タイトル']?.title[0]?.plain_text || '無題';
  // @ts-ignore
  const description = content.properties['説明文']?.rich_text[0]?.plain_text || '';
  // @ts-ignore
  const thumbnail = content.properties['サムネイル']?.files[0]?.file?.url || content.properties['サムネイル']?.files[0]?.external?.url || '';
  // @ts-ignore
  const categories = content.properties['カテゴリ']?.multi_select || [];
  // @ts-ignore
  const genres = content.properties['ジャンル']?.multi_select || [];
  // @ts-ignore
  const maker = content.properties['メーカー']?.select?.name || '';
  // @ts-ignore
  const views = content.properties['閲覧数']?.number || 0;
  // @ts-ignore
  const sales = content.properties['売上']?.number || 0;
  // @ts-ignore
  const publishDate = content.properties['公開日']?.date?.start || '';
  // @ts-ignore
  const affiliateUrl = content.properties['アフィリエイトURL']?.url || '';
  // @ts-ignore
  const performers = content.properties['出演者']?.relation || [];

  const people = await getPeople(performers.map((p: any) => p.id));

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <Link href="/" className="text-blue-600 hover:underline mb-4 inline-block">
          ← ホームに戻る
        </Link>

        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {thumbnail && (
            <img
              src={thumbnail}
              alt={title}
              className="w-full h-96 object-cover"
            />
          )}
          
          <div className="p-8">
            <h1 className="text-3xl font-bold mb-4">{title}</h1>
            
            <div className="flex flex-wrap gap-2 mb-4">
              {categories.map((cat: any) => (
                <span
                  key={cat.name}
                  className="px-3 py-1 bg-pink-100 text-pink-600 rounded-full text-sm"
                >
                  {cat.name}
                </span>
              ))}
              {genres.map((genre: any) => (
                <span
                  key={genre.name}
                  className="px-3 py-1 bg-blue-100 text-blue-600 rounded-full text-sm"
                >
                  {genre.name}
                </span>
              ))}
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
              <div>
                <p className="text-gray-600 text-sm">公開日</p>
                <p className="font-bold">{publishDate}</p>
              </div>
              <div>
                <p className="text-gray-600 text-sm">閲覧数</p>
                <p className="font-bold">{views.toLocaleString()}</p>
              </div>
              {sales > 0 && (
                <div>
                  <p className="text-gray-600 text-sm">売上</p>
                  <p className="font-bold">{sales.toLocaleString()}</p>
                </div>
              )}
              {maker && (
                <div>
                  <p className="text-gray-600 text-sm">メーカー</p>
                  <p className="font-bold">{maker}</p>
                </div>
              )}
            </div>

            {description && (
              <div className="mb-6">
                <h2 className="text-xl font-bold mb-2">説明</h2>
                <p className="text-gray-700 leading-relaxed">{description}</p>
              </div>
            )}

            {people.length > 0 && (
              <div className="mb-6">
                <h2 className="text-xl font-bold mb-4">出演者</h2>
                <div className="flex flex-wrap gap-4">
                  {people.map((person: any) => {
                    const personId = person.id;
                    const name = person.properties['人名']?.title[0]?.plain_text || '名前なし';
                    const profileImage = person.properties['プロフィール画像']?.files[0]?.file?.url || person.properties['プロフィール画像']?.files[0]?.external?.url || '';

                    return (
                      <Link
                        key={personId}
                        href={`/person/${personId}`}
                        className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                      >
                        {profileImage && (
                          <img
                            src={profileImage}
                            alt={name}
                            className="w-12 h-12 rounded-full object-cover"
                          />
                        )}
                        <span className="font-medium">{name}</span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}

            {affiliateUrl && (
              <a
                href={affiliateUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full bg-pink-600 text-white text-center py-3 rounded-lg font-bold hover:bg-pink-700 transition-colors"
              >
                詳細を見る →
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}