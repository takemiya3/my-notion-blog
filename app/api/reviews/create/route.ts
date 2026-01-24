import { NextResponse } from 'next/server';
import { Client } from '@notionhq/client';

const notion = new Client({ auth: process.env.NOTION_API_KEY });

export async function POST(request: Request) {
  try {
    const { pageId, pageType, userName, rating, content } = await request.json();
    
    // バリデーション
    if (!pageId || !pageType || !userName || !rating || !content) {
      return NextResponse.json(
        { error: 'すべての項目を入力してください' },
        { status: 400 }
      );
    }
    
    // 評価を星表示に変換
    const ratingMap: { [key: number]: string } = {
      5: '5 Stars',
      4: '4 Stars',
      3: '3 Stars',
      2: '2 Stars',
      1: '1 Star'
    };
    
    // Notionの口コミDBに登録
    const properties: any = {
      '口コミID': {
        title: [{ text: { content: `REV-${Date.now()}` } }]
      },
      'ページ種別': {
        select: { name: pageType }
      },
      '投稿者名': {
        rich_text: [{ text: { content: userName } }]
      },
      '評価': {
        select: { name: ratingMap[rating] }
      },
      '口コミ内容': {
        rich_text: [{ text: { content: content } }]
      },
      '公開ステータス': {
        checkbox: true // 即座に公開（承認制にする場合はfalse）
      }
    };
    
    // リレーションを設定（人物 or コンテンツ）
    if (pageType === '人物') {
      properties['関連人物'] = {
        relation: [{ id: pageId }]
      };
    } else if (pageType === 'コンテンツ') {
      properties['関連コンテンツ'] = {
        relation: [{ id: pageId }]
      };
    }
    
    const response = await notion.pages.create({
      parent: { database_id: process.env.NOTION_REVIEW_DB_ID! },
      properties
    });
    
    return NextResponse.json({ 
      success: true, 
      reviewId: response.id,
      message: '口コミを投稿しました！'
    });
  } catch (error) {
    console.error('Error creating review:', error);
    return NextResponse.json(
      { error: '口コミの投稿に失敗しました' },
      { status: 500 }
    );
  }
}