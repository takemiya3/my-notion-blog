import Image from 'next/image';
import Link from 'next/link';
import { UniformCategory } from '@/lib/notion/uniformCategories';

interface UniformCategoryCardProps {
  category: UniformCategory;
}

export default function UniformCategoryCard({ 
  category 
}: UniformCategoryCardProps) {
  return (
    <Link 
      href={`/uniform/${category.slug}`}
      className="group block overflow-hidden rounded-lg border border-gray-200 
                 hover:shadow-lg transition-all duration-300"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-gray-100">
        {category.image ? (
          <Image
            src={category.image}
            alt={category.name}
            fill
            className="object-cover group-hover:scale-105 transition-transform 
                       duration-300"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        ) : (
          <div className="flex items-center justify-center h-full text-gray-400">
            <span className="text-4xl">🎽</span>
          </div>
        )}
      </div>
      <div className="p-4">
        <h3 className="font-bold text-lg mb-2 group-hover:text-blue-600 
               transition-colors text-black">  {/* ← text-black 追加 */}
  {category.name}
</h3>
        {category.description && (
          <p className="text-sm text-gray-600 line-clamp-2">
            {category.description}
          </p>
        )}
        {category.contentCount !== undefined && (
          <p className="text-xs text-gray-500 mt-2">
            {category.contentCount}件のコンテンツ
          </p>
        )}
      </div>
    </Link>
  );
}