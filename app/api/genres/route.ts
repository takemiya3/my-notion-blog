import { NextRequest, NextResponse } from 'next/server';
import { Client } from '@notionhq/client';

const notion = new Client({ auth: process.env.NOTION_API_KEY });
const databaseId = process.env.NOTION_GENRES_DATABASE_ID!;

export async function GET(request: NextRequest) {
  try {
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