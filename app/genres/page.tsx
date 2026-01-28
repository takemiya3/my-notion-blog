import { Client } from '@notionhq/client';
import Image from 'next/image';
import Link from 'next/link';
import type { Metadata } from 'next';

const notion = new Client({ auth: process.env.NOTION_API_KEY });
const GENRE_DB_ID = process.env.NOTION_GENRE_DB_ID!;

export const metadata: Metadata = {
  title: 'ジャンル一覧 | 放課後制服動画ナビ',
  description: '制服動画のジャンル一覧ページです。',
};

export const revalidate = 60;

async function getAllGenres() {
  try {
    const response = await notion.databases.query({
      database_id: GENRE_DB_ID,
      filter: {
        property: '公開',
        checkbox: { equals: true },
      },
      sorts: [
        {
          property: 'ジャンル名',
          direction: 'ascending',
        },
      ],
    });

    return response.results;
  } catch (error) {
    console.error('Error fetching genres:', error);
    return [];
  }
}

export default async function GenresPage() {
  const genres = await getAllGenres();

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-4 text-black">ジャンル一覧</h1>
          <p className="text-gray-600">
            {genres.length}種類のジャンルがあります
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {genres.map((genre: any) => {
            const genreId = genre.id;
            const name = genre.properties['ジャンル名']?.title[0]?.plain_text || 'ジャンル名未設定';
            const description = genre.properties['説明']?.rich_text[0]?.plain_text || '';
            const image = genre.properties['イメージ画像']?.files[0]?.file?.url ||
              genre.properties['イメージ画像']?.files[0]?.external?.url || '';

            return (
              <Link
                key={genreId}
                href={`/genre/${genreId}`}
                className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow overflow-hidden"
              >
                <div className="relative aspect-[16/9] bg-gray-100">
                  {image ? (
                    <Image
                      src={image}
                      alt={name}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full text-gray-400">
                      <span className="text-6xl">🎬</span>
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <h3 className="font-bold text-xl mb-2 text-black">
                    {name}
                  </h3>
                  {description && (
                    <p className="text-sm text-gray-600 line-clamp-2">
                      {description}
                    </p>
                  )}
                </div>
              </Link>
            );
          })}
        </div>

        {genres.length === 0 && (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <p className="text-gray-600">まだ登録されているジャンルがありません</p>
          </div>
        )}

        <div className="mt-12 text-center">
          <Link
            href="/"
            className="inline-block bg-gray-200 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-300 transition-colors"
          >
            ← ホームに戻る
          </Link>
        </div>
      </div>
    </div>
  );
}