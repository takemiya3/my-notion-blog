import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import ReviewSection from '@/components/ReviewSection';
import type { Metadata } from 'next';

// ✅ インターフェース定義
interface PersonData {
  id: string;
  name: string;
  image: string;
  birthDate: string;
  description: string;
  categories: string[];
  origin: string;
  height: number | null;
  cupSize: string;
  measurements: string;
  fanzaLink: string;
}

interface ContentData {
  id: string;
  title: string;
  thumbnail: string;
  releaseDate: string;
  views: number;
}

interface PersonPageData {
  person: PersonData;
  contents: ContentData[];
  relatedContents: any[];
}

// ✅ ISR設定
export const revalidate = 3600; // 1時間ごとに再生成
export const dynamicParams = true; // 動的パラメータを許可

// ✅ サーバー側でデータ取得
async function getPersonData(slug: string): Promise<PersonPageData | null> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://seifuku-jk.com';
    const res = await fetch(`${baseUrl}/api/person-data/${slug}`, {
      next: { revalidate: 3600 }
    });
    
    if (!res.ok) {
      return null;
    }
    
    return res.json();
  } catch (error) {
    console.error('Error fetching person data:', error);
    return null;
  }
}

// ✅ メタデータ生成（SEO対応）
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const resolvedParams = await params;
  const data = await getPersonData(resolvedParams.slug);

  if (!data || !data.person) {
    return {
      title: '女優が見つかりません',
      description: 'お探しの女優ページは見つかりませんでした。',
    };
  }

  const person = data.person;
  const categories = person.categories.join('、');
  
  // ✅ SEO強化版のメタディスクリプション
  const metaDescription = `${person.name}の制服AV動画出演作品一覧。${categories ? `${categories}など` : ''}制服系エロ動画の詳細情報、プロフィール、口コミをご覧いただけます。${person.description ? person.description.slice(0, 60) + '...' : ''}出演作品数：${data.contents.length}件`;

  // ✅ SEO強化版のタイトル
  const seoTitle = `${person.name} - 制服AV動画出演作品${data.contents.length}件 | ${categories || '制服女優'}`;

  return {
    title: seoTitle,
    description: metaDescription.slice(0, 160),
    keywords: [
      person.name,
      ...person.categories,
      '制服AV', '制服エロ動画', 'AV女優', '制服女優', 'FANZA', '制服動画'
    ],
    openGraph: {
      title: seoTitle,
      description: metaDescription.slice(0, 160),
      url: `https://seifuku-jk.com/person/${resolvedParams.slug}`,
      type: 'profile',
      images: person.image ? [
        {
          url: person.image,
          width: 800,
          height: 1000,
          alt: `${person.name}のプロフィール画像`,
        },
      ] : [],
    },
    twitter: {
      card: 'summary_large_image',
      title: seoTitle,
      description: metaDescription.slice(0, 160),
      images: person.image ? [person.image] : [],
    },
  };
}

// ✅ ページコンポーネント（Server Component）
export default async function PersonPage({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = await params;
  const data = await getPersonData(resolvedParams.slug);

  if (!data || !data.person) {
    notFound();
  }

  const person = data.person;
  const contents = data.contents;
  const relatedContents = data.relatedContents;

  // ✅ 年齢計算関数
  const calculateAge = (birthDate: string): number | null => {
    if (!birthDate) return null;
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  const age = calculateAge(person.birthDate);

  // ✅ 構造化データ（JSON-LD）
  const personJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: person.name,
    image: person.image,
    birthDate: person.birthDate,
    description: person.description,
    url: `https://seifuku-jk.com/person/${resolvedParams.slug}`,
  };

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'ホーム',
        item: 'https://seifuku-jk.com',
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: '女優一覧',
        item: 'https://seifuku-jk.com/people',
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: person.name,
        item: `https://seifuku-jk.com/person/${resolvedParams.slug}`,
      },
    ],
  };

  return (
    <>
      {/* ✅ 構造化データを追加 */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{__html: JSON.stringify(personJsonLd)}}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{__html: JSON.stringify(breadcrumbJsonLd)}}
      />

      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-5xl mx-auto px-4">
          {/* パンくずリスト */}
          <nav className="mb-6 text-sm text-gray-600">
            <Link href="/" className="hover:text-pink-500">ホーム</Link>
            <span className="mx-2">/</span>
            <Link href="/people" className="hover:text-pink-500">女優一覧</Link>
            <span className="mx-2">/</span>
            <span className="text-black">{person.name}</span>
          </nav>

          {/* プロフィールセクション */}
          <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
            <div className="flex flex-col md:flex-row gap-8">
              {person.image && (
                <div className="flex-shrink-0">
                  <Image
                    src={person.image}
                    alt={`${person.name}のプロフィール画像`}
                    width={256}
                    height={320}
                    className="w-64 h-80 object-cover rounded-lg shadow-md"
                    priority
                  />
                </div>
              )}

              <div className="flex-1">
                <h1 className="text-4xl font-bold mb-4 text-black">{person.name}</h1>

                {/* カテゴリタグ */}
                <div className="flex flex-wrap gap-2 mb-4">
                  {person.categories.map((cat: string) => (
                    <span
                      key={cat}
                      className="px-3 py-1 bg-pink-100 text-pink-600 rounded-full text-sm font-semibold"
                    >
                      {cat}
                    </span>
                  ))}
                </div>

                {/* プロフィール情報 */}
                <div className="space-y-2 mb-6">
                  {person.birthDate && (
                    <p className="text-gray-700">
                      <span className="font-semibold">生年月日:</span> {person.birthDate}
                    </p>
                  )}
                  {age !== null && (
                    <p className="text-gray-700">
                      <span className="font-semibold">年齢:</span> {age}歳
                    </p>
                  )}
                  {person.origin && (
                    <p className="text-gray-700">
                      <span className="font-semibold">出身:</span> {person.origin}
                    </p>
                  )}
                  {person.height && (
                    <p className="text-gray-700">
                      <span className="font-semibold">身長:</span> {person.height}cm
                    </p>
                  )}
                  {person.cupSize && (
                    <p className="text-gray-700">
                      <span className="font-semibold">カップ数:</span> {person.cupSize}カップ
                    </p>
                  )}
                  {person.measurements && (
                    <p className="text-gray-700">
                      <span className="font-semibold">スリーサイズ:</span> {person.measurements}
                    </p>
                  )}
                </div>

                {/* 説明文 */}
                {person.description && (
                  <p className="text-gray-700 leading-relaxed mb-6 whitespace-pre-wrap">
                    {person.description}
                  </p>
                )}

                {/* FANZAリンク */}
                {person.fanzaLink && (
                  <div className="mt-6">
                    <a
                      href={person.fanzaLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-8 rounded-lg transition-colors duration-200"
                    >
                      🎬 動画はこちらから
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 出演コンテンツ一覧 */}
          <section className="mb-12">
            <h2 className="text-3xl font-bold mb-6 text-black">
              出演コンテンツ ({contents.length}件)
            </h2>

            {contents.length === 0 ? (
              <p className="text-center text-gray-600 py-12">まだコンテンツがありません</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {contents.map((content) => (
                  <Link
                    key={content.id}
                    href={`/content/${content.id}`}
                    className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow overflow-hidden"
                  >
                    {content.thumbnail && (
                      <Image
                        src={content.thumbnail}
                        alt={content.title}
                        width={300}
                        height={200}
                        className="w-full h-48 object-cover"
                      />
                    )}
                    <div className="p-4">
                      <h3 className="font-bold text-lg mb-2 line-clamp-2 text-black">
                        {content.title}
                      </h3>
                      {content.releaseDate && (
                        <p className="text-sm text-gray-600 mb-1">📅 {content.releaseDate}</p>
                      )}
                      <p className="text-sm text-gray-600">
                        👁 {content.views?.toLocaleString() || 0} views
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </section>

          {/* 人気の作品セクション */}
          <section className="mb-12">
            <h2 className="text-3xl font-bold mb-6 text-black">🔥 人気の作品</h2>

            {relatedContents.length === 0 ? (
              <p className="text-center text-gray-600 py-12">関連するコンテンツが見つかりませんでした</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
                {relatedContents.map((content: any) => {
                  const contentId = content.id;
                  const title = content.properties['タイトル']?.title[0]?.plain_text || '無題';
                  const thumbnail = content.properties['サムネイル']?.files[0]?.file?.url ||
                    content.properties['サムネイル']?.files[0]?.external?.url || '';
                  const views = content.properties['閲覧数']?.number || 0;

                  return (
                    <Link
                      key={contentId}
                      href={`/content/${contentId}`}
                      className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow overflow-hidden"
                    >
                      {thumbnail && (
                        <Image
                          src={thumbnail}
                          alt={title}
                          width={200}
                          height={150}
                          className="w-full h-32 object-cover"
                        />
                      )}
                      <div className="p-3">
                        <h3 className="font-bold text-sm mb-1 line-clamp-2 text-black">{title}</h3>
                        <p className="text-xs text-gray-600">👁 {views.toLocaleString()}</p>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </section>

          {/* 口コミセクション */}
          <ReviewSection pageId={person.id} pageType="人物" />
        </div>
      </div>
    </>
  );
}