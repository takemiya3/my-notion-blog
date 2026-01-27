import { notFound } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

const NOTION_API_KEY = process.env.NOTION_API_KEY;
const NOTION_UNIFORM_CATEGORY_DB_ID = process.env.NOTION_UNIFORM_CATEGORY_DB_ID;

interface UniformCategory {
  id: string;
  name: string;
  slug: string;
  description: string;
  contentIds: string[];
}

interface Content {
  id: string;
  title: string;
  imageUrl?: string;
}

async function getUniformCategoryBySlug(slug: string): Promise<UniformCategory | null> {
  const { Client } = require('@notionhq/client');
  const notion = new Client({ auth: NOTION_API_KEY });

  const response = await notion.databases.query({
    database_id: NOTION_UNIFORM_CATEGORY_DB_ID,
    filter: {
      property: 'スラッグ',
      rich_text: {
        equals: slug,
      },
    },
  });

  if (response.results.length === 0) return null;

  const page = response.results[0] as any;
  const properties = page.properties;

  return {
    id: page.id,
    name: properties['カテゴリ名']?.title?.[0]?.plain_text || '',
    slug: properties['スラッグ']?.rich_text?.[0]?.plain_text || '',
    description: properties['説明文']?.rich_text?.[0]?.plain_text || '',
    contentIds: properties['コンテンツ']?.relation?.map((r: any) => r.id) || [],
  };
}

async function getContentsByIds(ids: string[]): Promise<Content[]> {
  if (ids.length === 0) return [];

  const { Client } = require('@notionhq/client');
  const notion = new Client({ auth: NOTION_API_KEY });

  const contents: Content[] = [];

  for (const id of ids) {
    try {
      const page = await notion.pages.retrieve({ page_id: id });
      const properties = (page as any).properties;

      const title = properties['タイトル']?.title?.[0]?.plain_text || '';
      const imageUrl = properties['サムネイル']?.files?.[0]?.file?.url ||
                      properties['サムネイル']?.files?.[0]?.external?.url;

      contents.push({
        id: page.id,
        title,
        imageUrl,
      });
    } catch (error) {
      console.error(`Failed to fetch content ${id}:`, error);
    }
  }

  return contents;
}

export default async function UniformCategoryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const category = await getUniformCategoryBySlug(slug);

  if (!category) {
    notFound();
  }

  const contents = await getContentsByIds(category.contentIds);

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50">
        <div className="container mx-auto px-4 py-8">
          <div className="mb-8">
            <Link href="/" className="text-pink-600 hover:text-pink-700 mb-4 inline-block">
              ← ホームに戻る
            </Link>
            <h1 className="text-4xl font-bold text-gray-800 mb-4">{category.name}</h1>
            <p className="text-gray-600 text-lg">{category.description}</p>
          </div>

          {contents.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">このカテゴリにはまだコンテンツがありません</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {contents.map((content) => (
                <Link
                  key={content.id}
                  href={`/content/${content.id}`}
                  className="bg-white rounded-lg shadow-md hover:shadow-xl transition-shadow overflow-hidden"
                >
                  {content.imageUrl ? (
                    <img
                      src={content.imageUrl}
                      alt={content.title}
                      className="w-full h-48 object-cover"
                    />
                  ) : (
                    <div className="w-full h-48 bg-gradient-to-br from-pink-100 to-purple-100 flex items-center justify-center">
                      <span className="text-4xl">🎽</span>
                    </div>
                  )}
                  <div className="p-4">
                    <h3 className="font-semibold text-gray-800 line-clamp-2">{content.title}</h3>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
      <Footer />
    </>
  );
}