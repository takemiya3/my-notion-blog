import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { 
  getGenreBySlug, 
  getAllGenreSlugs 
} from '@/lib/notion/genres';
import { getContentsByGenre } from '@/lib/notion/contents';
import { getPeopleByGenre } from '@/lib/notion/people';
import ContentCard from '@/components/ContentCard';
import PersonCard from '@/components/PersonCard';

interface PageProps {
  params: { slug: string };
}

export async function generateStaticParams() {
  const slugs = await getAllGenreSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const genre = await getGenreBySlug(params.slug);
  
  if (!genre) {
    return { title: 'ページが見つかりません' };
  }

  return {
    title: `${genre.name} | 放課後制服動画ナビ`,
    description: genre.description || `${genre.name}のコンテンツ一覧`,
    openGraph: genre.image ? {
      images: [genre.image],
    } : undefined,
  };
}

export const revalidate = 3600;

export default async function GenrePage({ params }: PageProps) {
  const genre = await getGenreBySlug(params.slug);
  
  if (!genre) {
    notFound();
  }

  const contents = await getContentsByGenre(genre.name);
  const people = await getPeopleByGenre(genre.name);

  return (
    <div className="container mx-auto px-4 py-8">
      {/* パンくずリスト */}
      <nav className="mb-6 text-sm text-gray-600">
        <Link href="/" className="hover:text-blue-600">ホーム</Link>
        <span className="mx-2">/</span>
        <Link href="/genres" className="hover:text-blue-600">ジャンル一覧</Link>
        <span className="mx-2">/</span>
        <span className="text-gray-900">{genre.name}</span>
      </nav>

      {/* ヘッダー */}
      <div className="mb-12">
        {genre.image && (
          <div className="relative aspect-[21/9] w-full overflow-hidden rounded-lg mb-6">
            <Image
              src={genre.image}
              alt={genre.name}
              fill
              className="object-cover"
              sizes="100vw"
              priority
            />
          </div>
        )}
        <h1 className="text-4xl font-bold mb-4">{genre.name}</h1>
        {genre.description && (
          <p className="text-gray-600 text-lg">{genre.description}</p>
        )}
      </div>

      {/* 人物セクション */}
      {people.length > 0 && (
        <div className="mb-12">
          <h2 className="text-2xl font-bold mb-6">
            {genre.name}が得意な女優 <span className="text-gray-500 text-lg">({people.length}人)</span>
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {people.slice(0, 10).map((person) => (
              <PersonCard key={person.id} person={person} />
            ))}
          </div>
          {people.length > 10 && (
            <div className="mt-6 text-center">
              <Link 
                href={`/people?genre=${genre.name}`}
                className="text-blue-600 hover:underline"
              >
                もっと見る ({people.length - 10}人) →
              </Link>
            </div>
          )}
        </div>
      )}

      {/* コンテンツセクション */}
      <div>
        <h2 className="text-2xl font-bold mb-6">
          {genre.name}の作品 <span className="text-gray-500 text-lg">({contents.length}件)</span>
        </h2>
        
        {contents.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {contents.map((content) => (
              <ContentCard key={content.id} content={content} />
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-center py-12">
            現在、このジャンルのコンテンツはありません。
          </p>
        )}
      </div>
    </div>
  );
}