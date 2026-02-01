import { NextResponse } from 'next/server';
import { getPersonBySlug } from '@/lib/notion/people';
import { getContentsByPerson } from '@/lib/notion/contents';
import { Client } from '@notionhq/client';

const notion = new Client({ auth: process.env.NOTION_API_KEY });

export async function GET(
  request: Request,
  { params }: { params: { slug: string } }
) {
  try {
    const person = await getPersonBySlug(params.slug);
    
    if (!person) {
      return NextResponse.json({ error: 'Person not found' }, { status: 404 });
    }

    const contents = await getContentsByPerson(person.id);
    
    // 関連コンテンツ取得
    let response = await notion.databases.query({
      database_id: process.env.NOTION_CONTENT_DB_ID!,
      filter: {
        and: [
          {
            property: '公開ステータス',
            checkbox: { equals: true },
          },
          {
            property: '出演者',
            relation: { contains: person.id },
          },
        ],
      },
      sorts: [{ property: '閲覧数', direction: 'descending' }],
      page_size: 30,
    });

    if (response.results.length <= 10) {
      response = await notion.databases.query({
        database_id: process.env.NOTION_CONTENT_DB_ID!,
        filter: {
          property: '公開ステータス',
          checkbox: { equals: true },
        },
        sorts: [{ property: '閲覧数', direction: 'descending' }],
        page_size: 30,
      });
    }

    const shuffled = [...response.results];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    const relatedContents = shuffled.slice(0, 10);

    return NextResponse.json({
      person,
      contents,
      relatedContents,
    });
  } catch (error) {
    console.error('Error fetching person data:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}