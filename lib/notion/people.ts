import { Client } from '@notionhq/client';

const notion = new Client({ auth: process.env.NOTION_API_KEY });

const PEOPLE_DB_ID = 'b070b2eb8ab24ebead49aeaedebf52e1';

export interface Person {
  id: string;
  name: string;
  slug: string;
  image: string | null;
  description: string;
  birthDate: string | null;
  height: number | null;
  measurements: string;
  cupSize: string;
  origin: string;
  categories: string[];
  genres: string[];
  fanzaLink: string;
  contentUrls: string[];
}

/**
 * 公開中の人物一覧を取得
 */
export async function getAllPeople(): Promise<Person[]> {
  const response = await notion.databases.query({
    database_id: PEOPLE_DB_ID,
    filter: {
      property: '公開ステータス',
      checkbox: { equals: true },
    },
    sorts: [
      {
        property: '人名',
        direction: 'ascending',
      },
    ],
  });

  return response.results.map((page: any) => mapPersonPage(page));
}

/**
 * スラッグから特定の人物を取得
 */
export async function getPersonBySlug(slug: string): Promise<Person | null> {
  const allPeople = await getAllPeople();
  const person = allPeople.find(p => p.slug === slug);
  return person || null;
}

/**
 * 全ての人物のスラッグを取得（静的生成用）
 */
export async function getAllPersonSlugs(): Promise<string[]> {
  const people = await getAllPeople();
  return people.map(p => p.slug);
}

/**
 * カテゴリでフィルタして人物を取得
 */
export async function getPeopleByCategory(category: string): Promise<Person[]> {
  const allPeople = await getAllPeople();
  return allPeople.filter(p => p.categories.includes(category));
}

/**
 * ジャンルでフィルタして人物を取得
 */
export async function getPeopleByGenre(genre: string): Promise<Person[]> {
  const allPeople = await getAllPeople();
  return allPeople.filter(p => p.genres.includes(genre));
}

/**
 * Notionページを人物オブジェクトにマッピング
 */
function mapPersonPage(page: any): Person {
  const name = page.properties['人名'].title[0]?.plain_text || '';
  
  return {
    id: page.id,
    name,
    slug: generateSlug(name, page.id),
    image: page.properties['プロフィール画像'].files[0]?.file?.url || 
           page.properties['プロフィール画像'].files[0]?.external?.url || 
           null,
    description: page.properties['説明文'].rich_text[0]?.plain_text || '',
    birthDate: page.properties['生年月日'].date?.start || null,
    height: page.properties['身長'].number || null,
    measurements: page.properties['スリーサイズ'].rich_text[0]?.plain_text || '',
    cupSize: page.properties['カップ数'].select?.name || '',
    origin: page.properties['出身'].rich_text[0]?.plain_text || '',
    categories: page.properties['カテゴリ'].multi_select?.map(
      (cat: any) => cat.name
    ) || [],
    genres: page.properties['ジャンル'].multi_select?.map(
      (genre: any) => genre.name
    ) || [],
    fanzaLink: page.properties['FANZAリンク'].url || '',
    contentUrls: JSON.parse(page.properties['コンテンツ'].relation || '[]'),
  };
}

/**
 * 名前からスラッグを生成（URLセーフな文字列）
 */
function generateSlug(name: string, id: string): string {
  // 日本語名をローマ字に変換するか、IDベースにするか
  // ここではシンプルにID末尾を使用
  const shortId = id.slice(-8);
  return `${shortId}`;
}