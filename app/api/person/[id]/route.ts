import { NextResponse } from 'next/server';
import { Client } from '@notionhq/client';

const notion = new Client({
  auth: process.env.NOTION_API_KEY,
});

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    const person = await notion.pages.retrieve({ page_id: id });
    
    const contentsResponse = await notion.databases.query({
      database_id: process.env.NOTION_CONTENT_DB_ID!,
      filter: {
        and: [
          {
            property: '公開ステータス',
            checkbox: {
              equals: true,
            },
          },
          {
            property: '出演者',
            relation: {
              contains: id,
            },
          },
        ],
      },
    });
    
    return NextResponse.json({
      person,
      contents: contentsResponse.results,
    });
  } catch (error) {
    console.error('Error fetching person:', error);
    return NextResponse.json({ error: 'Failed to fetch person' }, { status: 500 });
  }
}