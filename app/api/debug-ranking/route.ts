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
    let rankings = [];
    let rankingError = null;
    
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
      } catch (error: any) {
        rankingError = error.message;
      }
    }

    return NextResponse.json({
      環境変数: envCheck,
      ランキング記事数: rankings.length,
      ランキングエラー: rankingError,
      ランキングデータ: rankings.length > 0 ? rankings[0] : null,
    }, { status: 200 });

  } catch (error: any) {
    return NextResponse.json({
      エラー: error.message,
      スタック: error.stack,
    }, { status: 500 });
  }
}