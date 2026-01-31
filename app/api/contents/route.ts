import { NextResponse } from 'next/server';
import { Client } from '@notionhq/client';

const notion = new Client({ auth: process.env.NOTION_API_TOKEN });
const CONTENT_DB_ID = 'b070b2eb8ab24ebead49aeaedebf52e1';

export async function GET() {
  try {
    const response = await notion.databases.query({
      database_id: CONTENT_DB_ID,
      sorts: [{ property: '公開日', direction: 'descending' }],
      page_size: 100
    });

    const contentsWithImages = await Promise.all(
      response.results.map(async (content: any) => {
        try {
          const pageDetails = await notion.pages.retrieve({ page_id: content.id });

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