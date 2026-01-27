import { Client } from '@notionhq/client';
import { NextRequest, NextResponse } from 'next/server';

const notion = new Client({
  auth: process.env.NOTION_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const { pageId } = await request.json();

    if (!pageId) {
      return NextResponse.json(
        { error: 'pageId is required' },
        { status: 400 }
      );
    }

    // NotionページIDから「-」を除去（UUID形式に変換）
    const cleanPageId = pageId.replace(/-/g, '');

    // 現在の閲覧数を取得
    const page = await notion.pages.retrieve({ page_id: cleanPageId });

    // @ts-ignore
    const currentViews = page.properties['閲覧数']?.number || 0;

    // 閲覧数を+1して更新
    await notion.pages.update({
      page_id: cleanPageId,
      properties: {
        閲覧数: {
          number: currentViews + 1,
        },
      },
    });

    return NextResponse.json({
      success: true,
      views: currentViews + 1,
    });
  } catch (error) {
    console.error('Error incrementing view count:', error);
    return NextResponse.json(
      { error: 'Failed to increment view count' },
      { status: 500 }
    );
  }
}