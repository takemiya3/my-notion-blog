import { MetadataRoute } from 'next';
import { Client } from '@notionhq/client';

const notion = new Client({ auth: process.env.NOTION_API_KEY });

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://www.seifuku-jk.com';

  // 静的ページ
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${baseUrl}/people`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/genres`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/uniform`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.8,
    },
  ];

  try {
    // 人物ページを取得
    const peopleResponse = await notion.databases.query({
      database_id: process.env.NOTION_PEOPLE_DB_ID!,
      filter: {
        property: '公開ステータス',
        checkbox: {
          equals: true,
        },
      },
    });

    const peoplePages: MetadataRoute.Sitemap = peopleResponse.results.map((person: any) => ({
      url: `${baseUrl}/person/${person.id}`,
      lastModified: new Date(person.last_edited_time),
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    }));

    // コンテンツページを取得
    const contentsResponse = await notion.databases.query({
      database_id: process.env.NOTION_CONTENT_DB_ID!,
      filter: {
        property: '公開ステータス',
        checkbox: {
          equals: true,
        },
      },
    });

    const contentPages: MetadataRoute.Sitemap = contentsResponse.results.map((content: any) => ({
      url: `${baseUrl}/content/${content.id}`,
      lastModified: new Date(content.last_edited_time),
      changeFrequency: 'weekly' as const,
      priority: 0.6,
    }));

    // ジャンルページを取得
    const genresResponse = await notion.databases.query({
      database_id: process.env.NOTION_GENRE_DB_ID!,
      filter: {
        property: '公開ステータス',
        checkbox: {
          equals: true,
        },
      },
    });

    const genrePages: MetadataRoute.Sitemap = genresResponse.results.map((genre: any) => ({
      url: `${baseUrl}/genre/${genre.id}`,
      lastModified: new Date(genre.last_edited_time),
      changeFrequency: 'weekly' as const,
      priority: 0.6,
    }));

    // ランキングページを取得
    const rankingsResponse = await notion.databases.query({
      database_id: process.env.NOTION_RANKING_DB_ID!,
      filter: {
        property: '公開ステータス',
        checkbox: {
          equals: true,
        },
      },
    });

    const rankingPages: MetadataRoute.Sitemap = rankingsResponse.results.map((ranking: any) => ({
      url: `${baseUrl}/ranking/${ranking.id}`,
      lastModified: new Date(ranking.last_edited_time),
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    }));

    // すべてのページを結合
    return [
      ...staticPages,
      ...peoplePages,
      ...contentPages,
      ...genrePages,
      ...rankingPages,
    ];
  } catch (error) {
    console.error('Error generating sitemap:', error);
    // エラー時は静的ページのみ返す
    return staticPages;
  }
}