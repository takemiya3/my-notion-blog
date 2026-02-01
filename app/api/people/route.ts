import { NextResponse } from 'next/server';
import { Client } from '@notionhq/client';

const notion = new Client({ auth: process.env.NOTION_API_TOKEN });
const PEOPLE_DB_ID = 'b070b2eb8ab24ebead49aeaedebf52e1';

export async function GET(request: Request) {
  try {
    // ✅ URLパラメータからlimitとoffsetを取得
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    // ✅ 全データを取得（または必要な分だけ）
    let allResults: any[] = [];
    let hasMore = true;
    let startCursor: string | undefined = undefined;

    // offsetとlimitを考慮して必要な件数を取得
    const totalNeeded = offset + limit;

    while (hasMore && allResults.length < totalNeeded) {
      const response = await notion.databases.query({
        database_id: PEOPLE_DB_ID,
        page_size: 100,
        start_cursor: startCursor,
      });

      allResults = allResults.concat(response.results);
      hasMore = response.has_more;
      startCursor = response.next_cursor || undefined;
    }

    // ✅ offsetとlimitでスライス
    const slicedResults = allResults.slice(offset, offset + limit);

    // 画像URLの修正処理
    const peopleWithImages = await Promise.all(
      slicedResults.map(async (person: any) => {
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