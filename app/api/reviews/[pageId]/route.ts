import { NextResponse } from 'next/server';
import { Client } from '@notionhq/client';

const notion = new Client({ auth: process.env.NOTION_API_KEY });

export const revalidate = 30; // 30秒ごとにキャッシュ更新

export async function GET(
  request: Request,
  { params }: { params: Promise<{ pageId: string }> }
) {
  try {
    const { pageId } = await params;
    
    // まず人物ページの口コミを検索
    const personReviews = await notion.databases.query({
      database_id: process.env.NOTION_REVIEW_DB_ID!,
      filter: {
        and: [
          {
            property: '関連人物',
            relation: {
              contains: pageId
            }
          },
          {
            property: '公開ステータス',
            checkbox: {
              equals: true
            }
          }
        ]
      },
      sorts: [
        {
          property: '投稿日時',
          direction: 'descending'
        }
      ]
    });
    
    // コンテンツページの口コミも検索
    const contentReviews = await notion.databases.query({
      database_id: process.env.NOTION_REVIEW_DB_ID!,
      filter: {
        and: [
          {
            property: '関連コンテンツ',
            relation: {
              contains: pageId
            }
          },
          {
            property: '公開ステータス',
            checkbox: {
              equals: true
            }
          }
        ]
      },
      sorts: [
        {
          property: '投稿日時',
          direction: 'descending'
        }
      ]
    });
    
    // 両方の結果を結合
    const allReviews = [...personReviews.results, ...contentReviews.results];
    
    return NextResponse.json(allReviews);
  } catch (error) {
    console.error('Error fetching reviews:', error);
    return NextResponse.json(
      { error: '口コミの取得に失敗しました' },
      { status: 500 }
    );
  }
}