import { MetadataRoute } from 'next';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://www.seifuku-jk.com'; // ← あなたのドメインに変更

  // 静的ページ
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/ranking`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.8,
    },
  ];

  // 人物ページを動的に取得
  let peoplePages: MetadataRoute.Sitemap = [];
  try {
    const peopleRes = await fetch(`${baseUrl}/api/people`, {
      next: { revalidate: 3600 } // 1時間キャッシュ
    });
    const people = await peopleRes.json();

    peoplePages = people.map((person: any) => ({
      url: `${baseUrl}/person/${person.id}`,
      lastModified: new Date(person.last_edited_time || person.created_time),
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    }));
  } catch (error) {
    console.error('Error fetching people for sitemap:', error);
  }

  // コンテンツページを動的に取得
  let contentPages: MetadataRoute.Sitemap = [];
  try {
    const contentsRes = await fetch(`${baseUrl}/api/contents`, {
      next: { revalidate: 3600 }
    });
    const contents = await contentsRes.json();

    contentPages = contents.map((content: any) => ({
      url: `${baseUrl}/content/${content.id}`,
      lastModified: new Date(content.last_edited_time || content.created_time),
      changeFrequency: 'weekly' as const,
      priority: 0.6,
    }));
  } catch (error) {
    console.error('Error fetching contents for sitemap:', error);
  }

  // すべてのページを結合
  return [...staticPages, ...peoplePages, ...contentPages];
}