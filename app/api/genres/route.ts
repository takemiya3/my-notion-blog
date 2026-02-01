export const revalidate = 3600;
export const dynamicParams = true;

export async function generateStaticParams() {
  return []; // ビルド時は生成しない
}

import { NextRequest, NextResponse } from 'next/server';
import { Client } from '@notionhq/client';

const notion = new Client({ auth: process.env.NOTION_API_KEY });
const databaseId = process.env.NOTION_GENRE_DB_ID!;

export async function GET(request: NextRequest) {
  try {
    if (!process.env.NOTION_API_KEY) {
      throw new Error('NOTION_API_KEY is not set');
    }
    if (!databaseId) {
      throw new Error('NOTION_GENRE_DB_ID is not set');
    }

    const query: any = {
      database_id: databaseId,
      sorts: [
        {
          property: 'ジャンル名',
          direction: 'ascending',
        },
      ],
    };

    const response = await notion.databases.query(query);
    return NextResponse.json(response.results);
  } catch (error) {
    console.error('Error fetching genres:', error);
    return NextResponse.json(
      { error: 'Failed to fetch genres' },
      { status: 500 }
    );
  }
}