import { Client } from '@notionhq/client';

const notion = new Client({ auth: process.env.NOTION_API_KEY });

const UNIFORM_CATEGORY_DB_ID = 'collection://96906ac8-2a35-4104-aad8-e59b8bf92dde';

export interface UniformCategory {
  id: string;
  name: string;
  slug: string;
  description: string;
  image: string | null;
  order: number;
  contentCount?: number;
}

/**
 * 公開中の制服カテゴリ一覧を取得
 */
export async function getUniformCategories(): Promise<UniformCategory[]> {
  const response = await notion.databases.query({
    database_id: UNIFORM_CATEGORY_DB_ID,
    filter: {
      property: '公開ステータス',
      checkbox: { equals: true },
    },
    sorts: [
      {
        property: '表示順',
        direction: 'ascending',
      },
    ],
  });

  return response.results.map((page: any) => ({
    id: page.id,
    name: page.properties['カテゴリ名'].title[0]?.plain_text || '',
    slug: page.properties['スラッグ'].rich_text[0]?.plain_text || '',
    description: page.properties['説明文'].rich_text[0]?.plain_text || '',
    image: page.properties['カテゴリ画像'].files[0]?.file?.url || 
           page.properties['カテゴリ画像'].files[0]?.external?.url || 
           null,
    order: page.properties['表示順'].number || 999,
  }));
}

/**
 * スラッグから特定の制服カテゴリを取得
 * ⚠️ text型プロパティはNotion APIでフィルタできないため、全件取得後にJSでフィルタ
 */
export async function getUniformCategoryBySlug(
  slug: string
): Promise<UniformCategory | null> {
  // 全カテゴリを取得
  const categories = await getUniformCategories();
  
  // JavaScriptでフィルタ
  const category = categories.find(cat => cat.slug === slug);
  
  return category || null;
}

/**
 * 全ての制服カテゴリのスラッグを取得（静的生成用）
 */
export async function getAllUniformCategorySlugs(): Promise<string[]> {
  const categories = await getUniformCategories();
  return categories.map(cat => cat.slug);
}