import { NextRequest, NextResponse } from 'next/server';
import { Client } from '@notionhq/client';

const notion = new Client({ auth: process.env.NOTION_API_KEY });
const peopleDatabaseId = process.env.NOTION_PEOPLE_DB_ID!;

export async function GET(request: NextRequest) {
  try {
    if (!process.env.NOTION_API_KEY) {
      throw new Error('NOTION_API_KEY is not set');
    }
    if (!peopleDatabaseId) {
      throw new Error('NOTION_PEOPLE_DB_ID is not set');
    }

    // データベースのスキーマを取得
    const database = await notion.databases.retrieve({ database_id: peopleDatabaseId });

    // カテゴリプロパティのオプションを取得
    const categoryProperty = database.properties['カテゴリ'];
    
    if (categoryProperty && categoryProperty.type === 'multi_select') {
      const categories = categoryProperty.multi_select.options.map((option: any) => ({
        name: option.name,
        color: option.color,
      }));
      
      return NextResponse.json(categories);
    }

    return NextResponse.json([]);
  } catch (error) {
    console.error('Error fetching categories:', error);
    return NextResponse.json(
      { error: 'Failed to fetch categories', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}