import { NextResponse } from 'next/server';
import { Client } from '@notionhq/client';

const notion = new Client({ auth: process.env.NOTION_API_TOKEN });
const PEOPLE_DB_ID = 'b070b2eb8ab24ebead49aeaedebf52e1';

export async function GET(request: Request) {
  try {
    // URLパラメータからlimitを取得（デフォルト100）
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '100');

    const response = await notion.databases.query({
      database_id: PEOPLE_DB_ID,
      page_size: Math.min(limit, 100) // Notion APIの上限は100
    });

    const peopleWithImages = await Promise.all(
      response.results.map(async (person: any) => {
        try {
          const pageDetails = await notion.pages.retrieve({ page_id: person.id }) as any;

          if (pageDetails.properties?.['プロフィール画像']?.files?.[0]) {
            const file = pageDetails.properties['プロフィール画像'].files[0];
            if (file.file?.url) {
              file.file.url = file.file.url.replace('http://', 'https://');
            }
            if (file.external?.url) {
              file.external.url = file.external.url.replace('http://', 'https://');
            }
          }

          return pageDetails;
        } catch (error) {
          console.error(`Error fetching person page ${person.id}:`, error);
          return person;
        }
      })
    );

    return NextResponse.json(peopleWithImages);
  } catch (error) {
    console.error('Error fetching people:', error);
    return NextResponse.json({ error: 'Failed to fetch people' }, { status: 500 });
  }
}