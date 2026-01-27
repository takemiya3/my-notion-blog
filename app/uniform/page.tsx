import { Metadata } from 'next';
import { getUniformCategories } from '@/lib/notion/uniformCategories';
import UniformCategoryCard from '@/components/UniformCategoryCard';

export const metadata: Metadata = {
  title: '制服検索 | 放課後制服動画ナビ',
  description: 'セーラー服、ブレザー、体操服など、制服の種類別にコンテンツを探せます。',
};

export const revalidate = 3600; // 1時間ごとに再生成

export default async function UniformPage() {
  const categories = await getUniformCategories();

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-4">制服検索</h1>
        <p className="text-gray-600">
          お好みの制服カテゴリから、コンテンツを探すことができます。
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 
                      gap-6">
        {categories.map((category) => (
          <UniformCategoryCard key={category.id} category={category} />
        ))}
      </div>

      {categories.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          現在、公開中の制服カテゴリはありません。
        </div>
      )}
    </div>
  );
}