import { NextResponse } from 'next/server';
import { Client } from '@notionhq/client';

const notion = new Client({ auth: process.env.NOTION_API_KEY });

export async function GET() {
  try {
    const envCheck = {
      NOTION_API_KEY: process.env.NOTION_API_KEY ? '設定済み ✅' : '未設定 ❌',
      NOTION_PEOPLE_DB_ID: process.env.NOTION_PEOPLE_DB_ID || '未設定 ❌',
      NOTION_RANKING_DB_ID: process.env.NOTION_RANKING_DB_ID || '未設定 ❌',
      NOTION_RANKING_DETAIL_DB_ID: process.env.NOTION_RANKING_DETAIL_DB_ID || '未設定 ❌',
    };

    let allArticles: any[] = [];
    let articlesError: string | null = null;
    
    if (process.env.NOTION_RANKING_DB_ID) {
      try {
        const response = await notion.databases.query({
          database_id: process.env.NOTION_RANKING_DB_ID,
        });
        allArticles = response.results.map((article: any) => {
          const props = article.properties;
          return {
            id: article.id,
            タイトル: props['記事タイトル']?.title?.[0]?.plain_text || '【空】',
            スラッグ: props['スラッグ']?.rich_text?.[0]?.plain_text || '【空】',
            公開: props['公開']?.checkbox || false,
          };
        });
      } catch (error) {
        articlesError = error instanceof Error ? error.message : 'Unknown error';
      }
    }

    return NextResponse.json({
      環境変数: envCheck,
      全記事: allArticles,
      エラー: articlesError,
    }, { status: 200 });

  } catch (error) {
    return NextResponse.json({
      エラー: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}