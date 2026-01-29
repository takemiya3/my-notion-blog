import { Client } from '@notionhq/client';

const notion = new Client({ auth: process.env.NOTION_API_KEY });
const AFFILIATE_DB_ID = process.env.NOTION_AFFILIATE_DB_ID!;

export async function getAffiliatesByPath(path: string) {
  try {
    const response = await notion.databases.query({
      database_id: AFFILIATE_DB_ID,
      filter: {
        and: [
          {
            property: '公開ステータス',
            checkbox: { equals: true },
          },
          {
            property: '配置場所',
            rich_text: { equals: path },
          },
        ],
      },
    });
    
    return response.results.map((page: any) => ({
      id: page.id,
      name: page.properties['ウィジェット名']?.title[0]?.plain_text || '',
      dataId: page.properties['data-id']?.rich_text[0]?.plain_text || '',
      type: page.properties['ウィジェット種類']?.select?.name || 'DMM',
    }));
  } catch (error) {
    console.error('Error fetching affiliates:', error);
    return [];
  }
}