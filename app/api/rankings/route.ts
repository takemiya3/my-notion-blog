import { NextResponse } from 'next/server';
import { Client } from '@notionhq/client';

const notion = new Client({ auth: process.env.NOTION_API_KEY });

export const revalidate = 60;

export async function GET() {
  try {
    const response = await notion.databases.query({
      database_id: process.env.NOTION_RANKING_DB_ID!,
      filter: {
        property: '公開',
        checkbox: {
          equals: true,
        },
      },
      sorts: [
        {
          property: '公開日',
          direction: 'descending',
        },
      ],
    });

    return NextResponse.json(response.results);
  } catch (error) {
    console.error('Error fetching rankings:', error);
    return NextResponse.json({ error: 'Failed to fetch rankings' }, { status: 500 });
  }
}