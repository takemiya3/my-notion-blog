'use client'

import { useState } from 'react'
import Image from 'next/image'

export default function SampleImageGallery({ images }: { images: string[] }) {
  const [mainImage, setMainImage] = useState(images[0] || '')
  const sampleImages = images.slice(0, 9) // 最大9枚

  if (sampleImages.length === 0) return null

  return (
    <div className="mt-8">
      {/* メイン画像 */}
      <div className="relative w-full aspect-[3/4] bg-gray-100 rounded-lg overflow-hidden">
        <Image
          src={mainImage}
          alt="サンプル画像"
          fill
          className="object-cover"
          priority
        />
      </div>

      {/* サムネイルギャラリー（横スクロール） */}
      <div className="mt-4">
        <h3 className="text-sm font-semibold mb-2">サンプル画像</h3>
        <div className="overflow-x-auto scrollbar-hide -mx-4 px-4">
          <div className="flex gap-2 pb-4">
            {sampleImages.map((img, index) => (
              <button
                key={index}
                onClick={() => setMainImage(img)}
                className={`relative flex-shrink-0 w-24 h-32 rounded-md overflow-hidden transition-all ${
                  mainImage === img
                    ? 'ring-2 ring-pink-500 opacity-100'
                    : 'opacity-70 hover:opacity-100'
                }`}
              >
                <Image
                  src={img}
                  alt={`サンプル ${index + 1}`}
                  fill
                  className="object-cover"
                  sizes="96px"
                />
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}