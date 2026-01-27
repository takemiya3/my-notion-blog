import Image from 'next/image';
import Link from 'next/link';
import { Content } from '@/lib/notion/contents';

interface ContentCardProps {
  content: Content;
}

export default function ContentCard({ content }: ContentCardProps) {
  return (
    <div className="group overflow-hidden rounded-lg border border-gray-200 
                    hover:shadow-lg transition-all duration-300">
      <div className="relative aspect-[3/4] overflow-hidden bg-gray-100">
        {content.thumbnail ? (
          <Image
            src={content.thumbnail}
            alt={content.title}
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
        <h3 className="font-bold text-base mb-2 line-clamp-2">
          {content.title}
        </h3>
        {content.publishedDate && (
          <p className="text-xs text-gray-500 mb-2">
            {new Date(content.publishedDate).toLocaleDateString('ja-JP')}
          </p>
        )}
        {content.categories.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {content.categories.slice(0, 3).map((cat, idx) => (
              <span 
                key={idx}
                className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded"
              >
                {cat}
              </span>
            ))}
          </div>
        )}
        {content.affiliateUrl && (
          <a
            href={content.affiliateUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full text-center bg-blue-600 text-white py-2 
                       rounded hover:bg-blue-700 transition-colors text-sm"
          >
            詳細を見る
          </a>
        )}
      </div>
    </div>
  );
}