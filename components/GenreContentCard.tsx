'use client'

import Image from 'next/image';
import Link from 'next/link';

interface GenreContentCardProps {
  contentId: string;
  title: string;
  thumbnail: string;
  views: number;
  publishedDate: string;
  affiliateUrl: string;
}

export default function GenreContentCard({
  contentId,
  title,
  thumbnail,
  views,
  publishedDate,
  affiliateUrl,
}: GenreContentCardProps) {
  return (
    <div className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow overflow-hidden">
      <Link href={`/content/${contentId}`}>
        {thumbnail && (
          <Image
            src={thumbnail}
            alt={title}
            width={300}
            height={200}
            className="w-full h-48 object-cover"
          />
        )}
        <div className="p-4">
          <h3 className="font-bold text-lg line-clamp-2 text-black mb-2">
            {title}
          </h3>
          {publishedDate && (
            <p className="text-sm text-gray-600 mb-1">
              📅 {publishedDate}
            </p>
          )}
          <p className="text-sm text-gray-600 mb-3">
            👁 {views.toLocaleString()} views
          </p>
        </div>
      </Link>

      {affiliateUrl && (
        <div className="px-4 pb-4">
          <a
            href={affiliateUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full text-center bg-red-600 hover:bg-red-700 text-white font-bold py-2 rounded-lg transition-colors"
            onClick={(e) => e.stopPropagation()}
          >
            🎬 動画をチェック
          </a>
        </div>
      )}
    </div>
  );
}