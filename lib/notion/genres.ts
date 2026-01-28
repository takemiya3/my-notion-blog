import { Client } from '@notionhq/client';

const notion = new Client({ auth: process.env.NOTION_API_KEY });

const GENRE_DB_ID = '985f65bab18142b087d112b0c78658a3';

export interface Genre {
  id: string;
  name: string;
  slug: string;
  description: string;
  image: string | null;
  order: number;
}

/**
 * 公開中のジャンル一覧を取得
 */
export async function getAllGenres(): Promise<Genre[]> {
  const response = await notion.databases.query({
    database_id: GENRE_DB_ID,
    filter: {
      property: '公開',
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
    name: page.properties['ジャンル名'].title[0]?.plain_text || '',
    slug: generateSlugFromName(page.properties['ジャンル名'].title[0]?.plain_text || ''),
    description: page.properties['説明'].rich_text[0]?.plain_text || '',
    image: page.properties['イメージ画像'].files[0]?.file?.url || 
           page.properties['イメージ画像'].files[0]?.external?.url || 
           null,
    order: page.properties['表示順'].number || 999,
  }));
}

/**
 * スラッグから特定のジャンルを取得
 */
export async function getGenreBySlug(slug: string): Promise<Genre | null> {
  const genres = await getAllGenres();
  return genres.find(g => g.slug === slug) || null;
}

/**
 * 全てのジャンルのスラッグを取得（静的生成用）
 */
export async function getAllGenreSlugs(): Promise<string[]> {
  const genres = await getAllGenres();
  return genres.map(g => g.slug);
}

/**
 * ジャンル名からスラッグを生成
 */
function generateSlugFromName(name: string): string {
  const slugMap: { [key: string]: string } = {
    '制服': 'seifuku',
    'セーラー服': 'sailor',
    'ブレザー': 'blazer',
    '体操服': 'gym-uniform',
    'スクール水着': 'school-swimsuit',
    'ブルマ': 'bloomers',
    '美少女': 'bishojo',
    'いじめ': 'ijime',
  };
  
  return slugMap[name] || name.toLowerCase();
}