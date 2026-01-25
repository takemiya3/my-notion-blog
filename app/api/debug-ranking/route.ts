import { NextResponse } from 'next/server';
import { Client } from '@notionhq/client';

const notion = new Client({ auth: process.env.NOTION_API_KEY });

export async function GET() {
  try {
    // 環境変数の確認
    const envCheck = {
      NOTION_API_KEY: process.env.NOTION_API_KEY ? '設定済み ✅' : '未設定 ❌',
      NOTION_PEOPLE_DB_ID: process.env.NOTION_PEOPLE_DB_ID || '未設定 ❌',
      NOTION_RANKING_DB_ID: process.env.NOTION_RANKING_DB_ID || '未設定 ❌',
      NOTION_RANKING_DETAIL_DB_ID: process.env.NOTION_RANKING_DETAIL_DB_ID || '未設定 ❌',
    };

    // ランキング記事を取得
    let rankings: any[] = [];
    let rankingError: string | null = null;
    
    if (process.env.NOTION_RANKING_DB_ID) {
      try {
        const response = await notion.databases.query({
          database_id: process.env.NOTION_RANKING_DB_ID,
          filter: {
            property: '公開',
            checkbox: {
              equals: true,
            },
          },
        });
        rankings = response.results;
      } catch (error) {
        rankingError = error instanceof Error ? error.message : 'Unknown error';
      }
    }

    return NextResponse.json({
      環境変数: envCheck,
      ランキング記事数: rankings.length,
      ランキングエラー: rankingError,
      ランキングデータサンプル: rankings.length > 0 ? {
        id: (rankings[0] as any).id,
        properties: Object.keys((rankings[0] as any).properties || {}),
      } : null,
    }, { status: 200 });

  } catch (error) {
    return NextResponse.json({
      エラー: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}