import { Metadata } from 'next';
import Link from 'next/link';
import { getPeopleByCategory } from '@/lib/notion/people';
import { getContentsByCategory } from '@/lib/notion/contents';
import PersonCard from '@/components/PersonCard';
import ContentCard from '@/components/ContentCard';

interface PageProps {
  params: { slug: string };
}

// カテゴリのメタデータマップ
const CATEGORY_META: { [key: string]: { title: string; description: string } } = {
  '女優': { title: '女優', description: 'プロの女優さんの作品一覧' },
  '素人系': { title: '素人系', description: '素人系女優の作品一覧' },
  'アイドル系': { title: 'アイドル系', description: 'アイドル系女優の作品一覧' },
  '10代': { title: '10代', description: '10代の女優の作品一覧' },
  '20代': { title: '20代', description: '20代の女優の作品一覧' },
  '30代': { title: '30代', description: '30代の女優の作品一覧' },
  'かわいい': { title: 'かわいい', description: 'かわいい系の女優の作品一覧' },
  '美人': { title: '美人', description: '美人系の女優の作品一覧' },
  '巨乳': { title: '巨乳', description: '巨乳の女優の作品一覧' },
  '美乳': { title: '美乳', description: '美乳の女優の作品一覧' },
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const category = decodeURIComponent(params.slug);
  const meta = CATEGORY_META[category] || { title: category, description: `${category}の作品一覧` };

  return {
    title: `${meta.title} | 放課後制服動画ナビ`,
    description: meta.description,
  };
}

export const revalidate = 3600;

export default async function CategoryPage({ params }: PageProps) {
  const category = decodeURIComponent(params.slug);
  const meta = CATEGORY_META[category] || { title: category, description: `${category}の作品一覧` };
  
  const people = await getPeopleByCategory(category);
  const contents = await getContentsByCategory(category);

  return (
    <div className="container mx-auto px-4 py-8">
      {/* パンくずリスト */}
      <nav className="mb-6 text-sm text-gray-600">
        <Link href="/" className="hover:text-blue-600">ホーム</Link>
        <span className="mx-2">/</span>
        <Link href="/categories" className="hover:text-blue-600">カテゴリ一覧</Link>
        <span className="mx-2">/</span>
        <span className="text-gray-900">{meta.title}</span>
      </nav>

      {/* ヘッダー */}
      <div className="mb-12">
        <h1 className="text-4xl font-bold mb-4">{meta.title}</h1>
        <p className="text-gray-600 text-lg">{meta.description}</p>
      </div>

      {/* 人物セクション */}
      {people.length > 0 && (
        <div className="mb-12">
          <h2 className="text-2xl font-bold mb-6">
            {meta.title}の女優 <span className="text-gray-500 text-lg">({people.length}人)</span>
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {people.map((person) => (
              <PersonCard key={person.id} person={person} />
            ))}
          </div>
        </div>
      )}

      {/* コンテンツセクション */}
      <div>
        <h2 className="text-2xl font-bold mb-6">
          {meta.title}の作品 <span className="text-gray-500 text-lg">({contents.length}件)</span>
        </h2>
        
        {contents.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {contents.map((content) => (
              <ContentCard key={content.id} content={content} />
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-center py-12">
            現在、このカテゴリのコンテンツはありません。
          </p>
        )}
      </div>
    </div>
  );
}