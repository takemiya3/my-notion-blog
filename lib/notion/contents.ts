export interface Content {
  id: string;
  title: string;
  thumbnail: string | null;
  affiliateUrl: string;
  publishedDate: string | null;
  categories: string[];
  performers?: string[];
}

/**
 * 特定の制服カテゴリに紐づくコンテンツを取得
 */
export async function getContentsByUniformCategory(
  categoryId: string
): Promise<Content[]> {
  const response = await notion.databases.query({
    database_id: CONTENT_DB_ID,
    filter: {
      and: [
        {
          property: '制服カテゴリ',
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