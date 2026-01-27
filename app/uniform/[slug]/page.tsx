import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { 
  getUniformCategoryBySlug, 
  getAllUniformCategorySlugs 
} from '@/lib/notion/uniformCategories';
import { getContentsByUniformCategory } from '@/lib/notion/contents';
import ContentCard from '@/components/ContentCard';
import Link from 'next/link';

interface PageProps {
  params: { slug: string };
}

export async function generateStaticParams() {
  const slugs = await getAllUniformCategorySlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const category = await getUniformCategoryBySlug(params.slug);
  
  if (!category) {
    return {
      title: 'ページが見つかりません',
    };
  }

  return {
    title: `${category.name} | 放課後制服動画ナビ`,
    description: category.description || `${category.name}のコンテンツ一覧`,
  };
}

export const revalidate = 3600; // 1時間ごとに再生成

export default async function UniformCategoryPage({ params }: PageProps) {
  const category = await getUniformCategoryBySlug(params.slug);
  
  if (!category) {
    notFound();
  }

  const contents = await getContentsByUniformCategory(category.id);

  return (
    <div className="container mx-auto px-4 py-8">
      {/* パンくずリスト */}
      <nav className="mb-6 text-sm text-gray-600">
        <Link href="/" className="hover:text-blue-600">ホーム</Link>
        <span className="mx-2">/</span>
        <Link href="/uniform" className="hover:text-blue-600">制服検索</Link>
        <span className="mx-2">/</span>
        <span className="text-gray-900">{category.name}</span>
      </nav>

      {/* ヘッダー */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-4">{category.name}</h1>
        {category.description && (
          <p className="text-gray-600">{category.description}</p>
        )}
        <p className="text-sm text-gray-500 mt-2">
          {contents.length}件のコンテンツ
        </p>
      </div>

      {/* コンテンツグリッド */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 
                      gap-6">
        {contents.map((content) => (
          <ContentCard key={content.id} content={content} />
        ))}
      </div>

      {contents.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          現在、このカテゴリにはコンテンツがありません。
        </div>
      )}

      {/* 戻るリンク */}
      <div className="mt-12 text-center">
        <Link 
          href="/uniform"
          className="inline-block bg-gray-200 text-gray-700 px-6 py-3 rounded 
                     hover:bg-gray-300 transition-colors"
        >
          ← 制服検索に戻る
        </Link>
      </div>
    </div>
  );
}