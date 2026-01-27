import { NextRequest, NextResponse } from 'next/server';
import { Client } from '@notionhq/client';

const notion = new Client({ auth: process.env.NOTION_API_KEY });
const databaseId = process.env.NOTION_CONTENTS_DATABASE_ID!;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const categoryFilter = searchParams.get('category');
    const limit = searchParams.get('limit');

    const query: any = {
      database_id: databaseId,
      sorts: [
        {
          property: '公開日',
          direction: 'descending',
        },
      ],
    };

    // カテゴリフィルター（multi_select対応）
    if (categoryFilter) {
      query.filter = {
        property: 'カテゴリ',
        multi_select: {
          contains: categoryFilter
        }
      };
    }

    if (limit) {
      query.page_size = parseInt(limit, 10);
    }

    const response = await notion.databases.query(query);
    return NextResponse.json(response.results);
  } catch (error) {
    console.error('Error fetching contents:', error);
    return NextResponse.json(
      { error: 'Failed to fetch contents', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}