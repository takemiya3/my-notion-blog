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

  const dynamicPages: MetadataRoute.Sitemap = [];

  try {
    // 人物ページを取得（✅ スラッグ対応）
    if (process.env.NOTION_PEOPLE_DB_ID) {
      const peopleResponse = await notion.databases.query({
        database_id: process.env.NOTION_PEOPLE_DB_ID,
        filter: {
          property: '公開ステータス',
          checkbox: {
            equals: true,
          },
        },
      });

      peopleResponse.results.forEach((person: any) => {
        // ✅ スラッグがあればスラッグを使用、なければIDを使用
        const slug = person.properties['スラッグ']?.rich_text?.[0]?.plain_text || person.id;
        
        dynamicPages.push({
          url: `${baseUrl}/person/${slug}`,
          lastModified: new Date(person.last_edited_time),
          changeFrequency: 'weekly',
          priority: 0.8, // ✅ 0.7 → 0.8 に変更（女優ページは重要）
        });
      });

      console.log(`✅ 人物ページ: ${peopleResponse.results.length}件`);
    }
  } catch (error) {
    console.error('❌ 人物ページ取得エラー:', error);
  }

  try {
    // コンテンツページを取得（✅ 優先度アップ）
    if (process.env.NOTION_CONTENT_DB_ID) {
      const contentsResponse = await notion.databases.query({
        database_id: process.env.NOTION_CONTENT_DB_ID,
        filter: {
          property: '公開ステータス',
          checkbox: {
            equals: true,
          },
        },
      });

      contentsResponse.results.forEach((content: any) => {
        dynamicPages.push({
          url: `${baseUrl}/content/${content.id}`,
          lastModified: new Date(content.last_edited_time),
          changeFrequency: 'daily', // ✅ weekly → daily（コンテンツは頻繁に更新）
          priority: 0.9, // ✅ 0.6 → 0.9（動画コンテンツは最重要）
        });
      });

      console.log(`✅ コンテンツページ: ${contentsResponse.results.length}件`);
    }
  } catch (error) {
    console.error('❌ コンテンツページ取得エラー:', error);
  }

  try {
    // ジャンルページを取得
    if (process.env.NOTION_GENRE_DB_ID) {
      const genresResponse = await notion.databases.query({
        database_id: process.env.NOTION_GENRE_DB_ID,
        filter: {
          property: '公開ステータス',
          checkbox: {
            equals: true,
          },
        },
      });

      genresResponse.results.forEach((genre: any) => {
        dynamicPages.push({
          url: `${baseUrl}/genre/${genre.id}`,
          lastModified: new Date(genre.last_edited_time),
          changeFrequency: 'weekly',
          priority: 0.7, // ✅ 0.6 → 0.7（ジャンルページも重要）
        });
      });

      console.log(`✅ ジャンルページ: ${genresResponse.results.length}件`);
    }
  } catch (error) {
    console.error('❌ ジャンルページ取得エラー:', error);
  }

  try {
    // ランキングページを取得
    if (process.env.NOTION_RANKING_DB_ID) {
      const rankingsResponse = await notion.databases.query({
        database_id: process.env.NOTION_RANKING_DB_ID,
        filter: {
          property: '公開ステータス',
          checkbox: {
            equals: true,
          },
        },
      });

      rankingsResponse.results.forEach((ranking: any) => {
        dynamicPages.push({
          url: `${baseUrl}/ranking/${ranking.id}`,
          lastModified: new Date(ranking.last_edited_time),
          changeFrequency: 'weekly',
          priority: 0.8, // ✅ 0.7 → 0.8（ランキングも重要）
        });
      });

      console.log(`✅ ランキングページ: ${rankingsResponse.results.length}件`);
    }
  } catch (error) {
    console.error('❌ ランキングページ取得エラー:', error);
  }

  console.log(`📊 合計: ${staticPages.length + dynamicPages.length}ページ`);

  return [...staticPages, ...dynamicPages];
}