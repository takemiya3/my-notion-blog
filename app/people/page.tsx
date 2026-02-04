import { Client } from '@notionhq/client';
import Image from 'next/image';
import Link from 'next/link';
import type { Metadata } from 'next';
import AffiliateWidget from '@/components/AffiliateWidget';
import PeopleList from '@/components/PeopleList';

const notion = new Client({ auth: process.env.NOTION_API_KEY });
const PEOPLE_DB_ID = process.env.NOTION_PEOPLE_DB_ID!;

export const metadata: Metadata = {
  title: '女優一覧 | 放課後制服動画ナビ',
  description: '登録されている女優・タレントの一覧ページです。',
};

export const revalidate = 60;

// ✅ ページネーション対応：全ての人物を取得
async function getAllPeople() {
  try {
    let allPeople: any[] = [];
    let hasMore = true;
    let startCursor: string | undefined = undefined;

    while (hasMore) {
      const response: any = await notion.databases.query({
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
        start_cursor: startCursor,
      });

      allPeople = [...allPeople, ...response.results];
      hasMore = response.has_more;
      startCursor = response.next_cursor;
    }

    return allPeople;
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
        </div>

        {/* ✅ クライアントコンポーネントで検索機能を実装 */}
        <PeopleList initialPeople={people} />

        {/* DMMアフィリエイトウィジェット */}
        <AffiliateWidget dataId="00234802da6988d09ff706bbb6f8512d" />

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