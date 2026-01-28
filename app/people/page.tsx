import { Client } from '@notionhq/client';
import Image from 'next/image';
import Link from 'next/link';
import type { Metadata } from 'next';

const notion = new Client({ auth: process.env.NOTION_API_KEY });
const PEOPLE_DB_ID = process.env.NOTION_PEOPLE_DB_ID!;

export const metadata: Metadata = {
  title: '女優一覧 | 放課後制服動画ナビ',
  description: '登録されている女優・タレントの一覧ページです。',
};

export const revalidate = 60;

async function getAllPeople() {
  try {
    const response = await notion.databases.query({
      database_id: PEOPLE_DB_ID,
      filter: {
        property: '公開ステータス',
        checkbox: { equals: true },
      },
      sorts: [
        {
          property: '人名',
          direction: 'ascending',
        },
      ],
    });

    return response.results;
  } catch (error) {
    console.error('Error fetching people:', error);
    return [];
  }
}

export default async function PeoplePage() {
  const people = await getAllPeople();

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-4 text-black">女優一覧</h1>
          <p className="text-gray-600">
            {people.length}名の女優が登録されています
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {people.map((person: any) => {
            const personId = person.id;
            const name = person.properties['人名']?.title[0]?.plain_text || '名前未設定';
            const image = person.properties['プロフィール画像']?.files[0]?.file?.url ||
              person.properties['プロフィール画像']?.files[0]?.external?.url || '';
            const category = person.properties['カテゴリ']?.select?.name || '';

            return (
              <Link
                key={personId}
                href={`/person/${personId}`}
                className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow overflow-hidden"
              >
                <div className="relative aspect-[3/4] bg-gray-100">
                  {image ? (
                    <Image
                      src={image}
                      alt={name}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 20vw"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full text-gray-400">
                      <span className="text-5xl">👤</span>
                    </div>
                  )}
                </div>
                <div className="p-3">
                  <h3 className="font-bold text-base line-clamp-1 text-black mb-1">
                    {name}
                  </h3>
                  {category && (
                    <p className="text-xs text-gray-600">{category}</p>
                  )}
                </div>
              </Link>
            );
          })}
        </div>

        {people.length === 0 && (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <p className="text-gray-600">まだ登録されている女優がいません</p>
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