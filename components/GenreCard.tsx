import Image from 'next/image';
import Link from 'next/link';
import { Genre } from '@/lib/notion/genres';

interface GenreCardProps {
  genre: Genre;
  contentCount?: number;
}

export default function GenreCard({ genre, contentCount }: GenreCardProps) {
  return (
    <Link 
      href={`/genres/${genre.slug}`}
      className="group block overflow-hidden rounded-lg border border-gray-200 
                 hover:shadow-lg transition-all duration-300"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-gray-100">
        {genre.image ? (
          <Image
            src={genre.image}
            alt={genre.name}
            fill
            className="object-cover group-hover:scale-105 transition-transform 
                       duration-300"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        ) : (
          <div className="flex items-center justify-center h-full text-gray-400">
            <span className="text-4xl">🎬</span>
          </div>
        )}
      </div>
      <div className="p-4">
        <h3 className="font-bold text-lg mb-2 group-hover:text-blue-600 
                       transition-colors">
          {genre.name}
        </h3>
        {genre.description && (
          <p className="text-sm text-gray-600 line-clamp-2">
            {genre.description}
          </p>
        )}
        {contentCount !== undefined && (
          <p className="text-xs text-gray-500 mt-2">
            {contentCount}件のコンテンツ
          </p>
        )}
      </div>
    </Link>
  );
}