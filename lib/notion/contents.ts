import { Client } from '@notionhq/client';

const notion = new Client({ auth: process.env.NOTION_API_KEY });

const CONTENT_DB_ID = 'f0c63b2acda54155a4110980219c6a2f';

// ✅ Content型を完全版に拡張
export interface Content {
  id: string;
  title: string;
  thumbnail: string | null;
  affiliateUrl: string;
  publishedDate: string | null;
  categories: string[];
  performers?: string;
  sampleImages?: string[];
  sampleVideo?: string;
  affiliateHtml?: string;
  views?: number;
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
 * 全てのコンテンツを取得（ページネーション対応）
 */
export async function getAllContents(): Promise<Content[]> {
  const allContents: Content[] = [];
  let hasMore = true;
  let startCursor: string | undefined = undefined;

  while (hasMore) {
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
      page_size: 100, // 1回のリクエストで最大100件
      start_cursor: startCursor,
    });

    const contents = response.results.map((page: any) => ({
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

    allContents.push(...contents);

    // 次のページがあるかチェック
    hasMore = response.has_more;
    startCursor = response.next_cursor || undefined;
  }

  return allContents;
}

/**
 * IDから個別コンテンツを取得（詳細ページ用）
 */
export async function getContentById(id: string): Promise<Content | null> {
  try {
    const page: any = await notion.pages.retrieve({ page_id: id });
    
    if (!page.properties) {
      return null;
    }

    return {
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
      performers: page.properties['出演者名'].rich_text[0]?.plain_text || '',
      sampleImages: page.properties['サンプル画像'].files?.map((file: any) => 
        file.file?.url || file.external?.url
      ).filter(Boolean) || [],
      sampleVideo: page.properties['サンプル動画'].url || '',
      affiliateHtml: page.properties['アフィリエイトHTML'].rich_text[0]?.plain_text || '',
      views: page.properties['閲覧数'].number || 0,
      genre: page.properties['ジャンル'].select?.name || '',
    };
  } catch (error) {
    console.error('Error fetching content:', error);
    return null;
  }
}