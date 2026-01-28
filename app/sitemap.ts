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
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/uniform`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
  ];

  // 人物ページ
  const peopleResponse = await notion.databases.query({
    database_id: process.env.NOTION_PEOPLE_DB_ID!,
    filter: {
      property: '公開ステータス',
      checkbox: { equals: true },
    },
  });

  const peoplePages: MetadataRoute.Sitemap = peopleResponse.results.map((page: any) => ({
    url: `${baseUrl}/person/${page.id}`,
    lastModified: new Date(page.last_edited_time),
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }));

  // ジャンルページ
  const genresResponse = await notion.databases.query({
    database_id: process.env.NOTION_GENRE_DB_ID!,
    filter: {
      property: '公開',
      checkbox: { equals: true },
    },
  });

  const genrePages: MetadataRoute.Sitemap = genresResponse.results.map((page: any) => ({
    url: `${baseUrl}/genre/${page.id}`,
    lastModified: new Date(page.last_edited_time),
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }));

  // 制服カテゴリページ
  const uniformResponse = await notion.databases.query({
    database_id: process.env.NOTION_UNIFORM_CATEGORY_DB_ID!,
    filter: {
      property: '公開ステータス',
      checkbox: { equals: true },
    },
  });

  const uniformPages: MetadataRoute.Sitemap = uniformResponse.results.map((page: any) => {
    const slug = page.properties['スラッグ']?.rich_text?.[0]?.plain_text || page.id;
    return {
      url: `${baseUrl}/uniform/${slug}`,
      lastModified: new Date(page.last_edited_time),
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    };
  });

  return [...staticPages, ...peoplePages, ...genrePages, ...uniformPages];
}