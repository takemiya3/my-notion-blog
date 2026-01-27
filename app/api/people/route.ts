import { NextRequest, NextResponse } from 'next/server';
import { Client } from '@notionhq/client';

const notion = new Client({ auth: process.env.NOTION_API_KEY });
const databaseId = process.env.NOTION_PERSON_DB_ID!;

export async function GET(request: NextRequest) {
  try {
    if (!process.env.NOTION_API_KEY) {
      throw new Error('NOTION_API_KEY is not set');
    }
    if (!databaseId) {
      throw new Error('NOTION_PERSON_DB_ID is not set');
    }

    const { searchParams } = new URL(request.url);
    const categoryFilter = searchParams.get('category');
    const limit = searchParams.get('limit');

    const query: any = {
      database_id: databaseId,
    };

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
    console.error('Error fetching people:', error);
    return NextResponse.json(
      { error: 'Failed to fetch people', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}