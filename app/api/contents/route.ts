import { NextResponse } from 'next/server';
import { Client } from '@notionhq/client';

const notion = new Client({ auth: process.env.NOTION_API_TOKEN });
const CONTENT_DB_ID = 'f0c63b2acda54155a4110980219c6a2f';

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
        database_id: CONTENT_DB_ID,
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
    const contentsWithImages = await Promise.all(
      slicedResults.map(async (content: any) => {
        try {
          const pageDetails = await notion.pages.retrieve({ page_id: content.id }) as any;

          if (pageDetails.properties?.['サムネイル']?.files?.[0]) {
            const file = pageDetails.properties['サムネイル'].files[0];
            if (file.file?.url) {
              file.file.url = file.file.url.replace('http://', 'https://');
            }
            if (file.external?.url) {
              file.external.url = file.external.url.replace('http://', 'https://');
            }
          }

          return pageDetails;
        } catch (error) {
          console.error(`Error fetching content page ${content.id}:`, error);
          return content;
        }
      })
    );

    return NextResponse.json(contentsWithImages);
  } catch (error) {
    console.error('Error fetching contents:', error);
    return NextResponse.json({ error: 'Failed to fetch contents' }, { status: 500 });
  }
}