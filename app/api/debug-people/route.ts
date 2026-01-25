import { NextResponse } from 'next/server';
import { Client } from '@notionhq/client';

const notion = new Client({ auth: process.env.NOTION_API_KEY });

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category') || '女優';

    // フィルター条件1: カテゴリで検索
    const filters: any[] = [
      {
        property: '公開ステータス',
        checkbox: {
          equals: true,
        },
      },
      {
        property: 'カテゴリ',
        multi_select: {
          contains: category,
        },
      },
    ];

    const response = await notion.databases.query({
      database_id: process.env.NOTION_PEOPLE_DB_ID!,
      filter: {
        and: filters,
      },
      page_size: 100,
    });

    const people = response.results.map((person: any) => {
      const props = person.properties;
      return {
        id: person.id,
        人名: props['人名']?.title?.[0]?.plain_text || '',
        カテゴリ: props['カテゴリ']?.multi_select?.map((c: any) => c.name) || [],
        公開ステータス: props['公開ステータス']?.checkbox || false,
      };
    });

    return NextResponse.json({
      検索カテゴリ: category,
      データベースID: process.env.NOTION_PEOPLE_DB_ID,
      見つかった人数: people.length,
      人物リスト: people,
    });

  } catch (error) {
    return NextResponse.json({
      エラー: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}