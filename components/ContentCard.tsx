'use client'

import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Content } from '@/lib/notion/contents';

interface ContentCardProps {
  content: Content;
}

export default function ContentCard({ content }: ContentCardProps) {
  const router = useRouter();

  // 画像クリック時のハンドラー
  const handleImageClick = () => {
    router.push(`/content/${content.id}`);
  };

  // タイトルクリック時のハンドラー
  const handleTitleClick = () => {
    router.push(`/content/${content.id}`);
  };

  return (
    <div className="group overflow-hidden rounded-lg border border-gray-200 
                    hover:shadow-lg transition-all duration-300">
      {/* 画像部分 - クリックで遷移 */}
      <div 
        onClick={handleImageClick}
        className="relative aspect-[3/4] overflow-hidden bg-gray-100 cursor-pointer"
      >
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
        {/* タイトル - クリックで遷移 */}
        <h3 
          onClick={handleTitleClick}
          className="font-bold text-base mb-2 line-clamp-2 hover:text-blue-600 
                     transition-colors cursor-pointer"
        >
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