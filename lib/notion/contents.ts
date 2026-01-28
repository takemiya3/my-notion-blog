import { Client } from '@notionhq/client';

const notion = new Client({ auth: process.env.NOTION_API_KEY });

const CONTENT_DB_ID = 'f0c63b2acda54155a4110980219c6a2f';

export interface Content {
  id: string;
  title: string;
  thumbnail: string | null;
  affiliateUrl: string;
  publishedDate: string | null;
  categories: string[];
  performers?: string[];
  genre?: string;
}

/**
 * 特定の制服カテゴリに紐づくコンテンツを取得
 * ⚠️ 重要：プロパティ名は「制服カテゴリ 1」（末尾にスペース+1）
 */
export async function getContentsByUniformCategory(
  categoryId: string
): Promise<Content[]> {
  const response = await notion.databases.query({
    database_id: CONTENT_DB_ID,
    filter: {
      and: [
        {
          property: '制服カテゴリ 1',
          relation: { contains: categoryId },
        },
        {
          property: '公開ステータス',
          checkbox: { equals: true },
        },
      ],
    },
    sorts: [
      {
        property: '公開日',
        direction: 'descending',
      },
    ],
  });

  return response.results.map((page: any) => ({
    id: page.id,
    title: page.properties['タイトル'].title[0]?.plain_text || '',
    thumbnail: page.properties['サムネイル'].files[0]?.file?.url || 
               page.properties['サムネイル'].files[0]?.external?.url || 
               null,
    affiliateUrl: page.properties['アフィリエイトURL'].url || '',
    publishedDate: page.properties['公開日'].date?.start || null,
    categories: page.properties['カテゴリ'].multi_select?.map(
      (cat: any) => cat.name
    ) || [],
  }));
}

/**
 * 特定の人物が出演しているコンテンツを取得
 */
export async function getContentsByPerson(personId: string): Promise<Content[]> {
  const response = await notion.databases.query({
    database_id: CONTENT_DB_ID,
    filter: {
      and: [
        {
          property: '出演者',
          relation: { contains: personId },
        },
        {
          property: '公開ステータス',
          checkbox: { equals: true },
        },
      ],
    },
    sorts: [
      {
        property: '公開日',
        direction: 'descending',
      },
    ],
    page_size: 100,
  });

  return response.results.map((page: any) => ({
    id: page.id,
    title: page.properties['タイトル'].title[0]?.plain_text || '',
    thumbnail: page.properties['サムネイル'].files[0]?.file?.url || 
               page.properties['サムネイル'].files[0]?.external?.url || 
               null,
    affiliateUrl: page.properties['アフィリエイトURL'].url || '',
    publishedDate: page.properties['公開日'].date?.start || null,
    categories: page.properties['カテゴリ'].multi_select?.map(
      (cat: any) => cat.name
    ) || [],
    genre: page.properties['ジャンル'].select?.name || undefined,
  }));
}

/**
 * 特定のジャンルのコンテンツを取得
 */
export async function getContentsByGenre(genre: string): Promise<Content[]> {
  const response = await notion.databases.query({
    database_id: CONTENT_DB_ID,
    filter: {
      and: [
        {
          property: 'ジャンル',
          select: { equals: genre },
        },
        {
          property: '公開ステータス',
          checkbox: { equals: true },
        },
      ],
    },
    sorts: [
      {
        property: '公開日',
        direction: 'descending',
      },
    ],
    page_size: 100,
  });

  return response.results.map((page: any) => ({
    id: page.id,
    title: page.properties['タイトル'].title[0]?.plain_text || '',
    thumbnail: page.properties['サムネイル'].files[0]?.file?.url || 
               page.properties['サムネイル'].files[0]?.external?.url || 
               null,
    affiliateUrl: page.properties['アフィリエイトURL'].url || '',
    publishedDate: page.properties['公開日'].date?.start || null,
    categories: page.properties['カテゴリ'].multi_select?.map(
      (cat: any) => cat.name
    ) || [],
    genre: page.properties['ジャンル'].select?.name || undefined,
  }));
}

/**
 * カテゴリでコンテンツを取得
 * ⚠️ カテゴリはmulti_selectなので、Notion APIでフィルタできない
 * 全件取得後にJavaScriptでフィルタする
 */
export async function getContentsByCategory(category: string): Promise<Content[]> {
  const allContents = await getAllContents();
  return allContents.filter(c => c.categories.includes(category));
}

/**
 * 全てのコンテンツを取得
 */
export async function getAllContents(): Promise<Content[]> {
  const response = await notion.databases.query({
    database_id: CONTENT_DB_ID,
    filter: {
      property: '公開ステータス',
      checkbox: { equals: true },
    },
    sorts: [
      {
        property: '公開日',
        direction: 'descending',
      },
    ],
    page_size: 100,
  });

  return response.results.map((page: any) => ({
    id: page.id,
    title: page.properties['タイトル'].title[0]?.plain_text || '',
    thumbnail: page.properties['サムネイル'].files[0]?.file?.url || 
               page.properties['サムネイル'].files[0]?.external?.url || 
               null,
    affiliateUrl: page.properties['アフィリエイトURL'].url || '',
    publishedDate: page.properties['公開日'].date?.start || null,
    categories: page.properties['カテゴリ'].multi_select?.map(
      (cat: any) => cat.name
    ) || [],
    genre: page.properties['ジャンル'].select?.name || undefined,
  }));
}