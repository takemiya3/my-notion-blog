import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import {
  getPersonBySlug,
  getAllPersonSlugs
} from '@/lib/notion/people';
import { getContentsByPerson } from '@/lib/notion/contents';
import ContentCard from '@/components/ContentCard';

interface PageProps {
  params: { slug: string };
}

// ✅ ISR設定
export const revalidate = 3600;
export const dynamicParams = true; // 追加

// ✅ 空配列に変更（ビルド時は生成しない）
export async function generateStaticParams() {
  return []; // これだけでOK！
}

// 以下は既存のコードをそのまま維持
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const person = await getPersonBySlug(params.slug);

  if (!person) {
    return { title: 'ページが見つかりません' };
  }

  return {
    title: `${person.name} | 放課後制服動画ナビ`,
    description: person.description || `${person.name}のプロフィールと出演作品一覧`,
    openGraph: person.image ? {
      images: [person.image],
    } : undefined,
  };
}

export const revalidate = 3600;

export default async function PersonPage({ params }: PageProps) {
  const person = await getPersonBySlug(params.slug);
  
  if (!person) {
    notFound();
  }

  const contents = await getContentsByPerson(person.id);

  const age = person.birthDate 
    ? Math.floor((Date.now() - new Date(person.birthDate).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
    : null;

  return (
    <div className="container mx-auto px-4 py-8">
      {/* パンくずリスト */}
      <nav className="mb-6 text-sm text-gray-600">
        <Link href="/" className="hover:text-blue-600">ホーム</Link>
        <span className="mx-2">/</span>
        <Link href="/people" className="hover:text-blue-600">女優一覧</Link>
        <span className="mx-2">/</span>
        <span className="text-gray-900">{person.name}</span>
      </nav>

      {/* プロフィールセクション */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
        {/* プロフィール画像 */}
        <div className="md:col-span-1">
          <div className="relative aspect-[3/4] overflow-hidden rounded-lg bg-gray-100">
            {person.image ? (
              <Image
                src={person.image}
                alt={person.name}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 33vw"
                priority
              />
            ) : (
              <div className="flex items-center justify-center h-full text-gray-400">
                <span className="text-6xl">👤</span>
              </div>
            )}
          </div>
        </div>

        {/* プロフィール情報 */}
        <div className="md:col-span-2">
          <h1 className="text-4xl font-bold mb-4">{person.name}</h1>
          
          {person.description && (
            <p className="text-gray-700 mb-6 leading-relaxed">{person.description}</p>
          )}

          {/* プロフィール詳細 */}
          <div className="bg-gray-50 p-6 rounded-lg mb-6">
            <h2 className="text-xl font-bold mb-4">プロフィール</h2>
            <dl className="grid grid-cols-2 gap-4">
              {person.birthDate && (
                <>
                  <dt className="text-gray-600">生年月日</dt>
                  <dd className="font-medium">
                    {new Date(person.birthDate).toLocaleDateString('ja-JP')}
                    {age && ` (${age}歳)`}
                  </dd>
                </>
              )}
              {person.height && (
                <>
                  <dt className="text-gray-600">身長</dt>
                  <dd className="font-medium">{person.height}cm</dd>
                </>
              )}
              {person.measurements && (
                <>
                  <dt className="text-gray-600">スリーサイズ</dt>
                  <dd className="font-medium">{person.measurements}</dd>
                </>
              )}
              {person.cupSize && (
                <>
                  <dt className="text-gray-600">カップ数</dt>
                  <dd className="font-medium">{person.cupSize}カップ</dd>
                </>
              )}
              {person.origin && (
                <>
                  <dt className="text-gray-600">出身</dt>
                  <dd className="font-medium">{person.origin}</dd>
                </>
              )}
            </dl>
          </div>

          {/* カテゴリタグ */}
          {person.categories.length > 0 && (
            <div className="mb-6">
              <h3 className="text-sm font-medium text-gray-600 mb-2">カテゴリ</h3>
              <div className="flex flex-wrap gap-2">
                {person.categories.map((cat, idx) => (
                  <Link
                    key={idx}
                    href={`/categories/${cat}`}
                    className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm
                             hover:bg-blue-200 transition-colors"
                  >
                    {cat}
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* ジャンルタグ */}
          {person.genres.length > 0 && (
            <div className="mb-6">
              <h3 className="text-sm font-medium text-gray-600 mb-2">ジャンル</h3>
              <div className="flex flex-wrap gap-2">
                {person.genres.map((genre, idx) => (
                  <span
                    key={idx}
                    className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-sm"
                  >
                    {genre}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* FANZAリンク */}
          {person.fanzaLink && (
            <a
              href={person.fanzaLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block bg-pink-600 text-white px-6 py-3 rounded-lg
                       hover:bg-pink-700 transition-colors font-medium"
            >
              FANZAで作品を見る →
            </a>
          )}
        </div>
      </div>

      {/* 出演コンテンツ */}
      <div>
        <h2 className="text-2xl font-bold mb-6">
          出演作品 <span className="text-gray-500 text-lg">({contents.length}件)</span>
        </h2>
        
        {contents.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {contents.map((content) => (
              <ContentCard key={content.id} content={content} />
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-center py-12">
            現在、登録されている出演作品はありません。
          </p>
        )}
      </div>
    </div>
  );
}