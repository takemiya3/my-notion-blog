import { NextResponse } from 'next/server';
import { Client } from '@notionhq/client';

const notion = new Client({ auth: process.env.NOTION_API_KEY });

export async function GET() {
  try {
    const response = await notion.databases.query({
      database_id: process.env.NOTION_GENRE_DB_ID!,
      filter: {
        property: '公開',
        checkbox: {
          equals: true,
        },
      },
      sorts: [
        {
          property: '表示順',
          direction: 'ascending',
        },
      ],
    });

    return NextResponse.json(response.results);
  } catch (error) {
    console.error('Error fetching genres:', error);
    return NextResponse.json([], { status: 200 });
  }
}