'use client';

import { notFound, useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import ReviewSection from '@/components/ReviewSection';
import AffiliateWidget from '@/components/AffiliateWidget';
import { useEffect, useState } from 'react';

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

export default function PersonPage() {
  const params = useParams();
  const slug = params.slug as string;
  
  const [person, setPerson] = useState<PersonData | null>(null);
  const [contents, setContents] = useState<ContentData[]>([]);
  const [relatedContents, setRelatedContents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const personRes = await fetch(`/api/person-data/${slug}`);
        if (!personRes.ok) {
          notFound();
        }
        const data = await personRes.json();
        setPerson(data.person);
        setContents(data.contents);
        setRelatedContents(data.relatedContents);
      } catch (error) {
        console.error('Error fetching person data:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [slug]);

  const calculateAge = (birthDate: string) => {
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

  const age = person ? calculateAge(person.birthDate) : null;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-5xl mx-auto px-4">
        <nav className="mb-6 text-sm text-gray-600">
          <Link href="/" className="hover:text-pink-500">ホーム</Link>
          <span className="mx-2">/</span>
          <Link href="/people" className="hover:text-pink-500">女優一覧</Link>
          <span className="mx-2">/</span>
          <span className="text-black">{person?.name || 'Loading...'}</span>
        </nav>

        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          {loading ? (
            <div className="flex flex-col md:flex-row gap-8 animate-pulse">
              <div className="w-64 h-80 bg-gray-200 rounded-lg"></div>
              <div className="flex-1 space-y-4">
                <div className="h-10 bg-gray-200 rounded w-1/2"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-4 bg-gray-200 rounded w-2/3"></div>
              </div>
            </div>
          ) : person ? (
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

                {person.description && (
                  <p className="text-gray-700 leading-relaxed mb-6 whitespace-pre-wrap">
                    {person.description}
                  </p>
                )}

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
          ) : null}
        </div>

        <section className="mb-12">
          <h2 className="text-3xl font-bold mb-6 text-black">
            出演コンテンツ ({contents.length}件)
          </h2>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-white rounded-lg shadow animate-pulse">
                  <div className="w-full h-48 bg-gray-200"></div>
                  <div className="p-4 space-y-2">
                    <div className="h-4 bg-gray-200 rounded"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : contents.length === 0 ? (
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

        <section className="mb-12">
          <h2 className="text-3xl font-bold mb-6 text-black">🔥 人気の作品</h2>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="bg-white rounded-lg shadow animate-pulse">
                  <div className="w-full h-32 bg-gray-200"></div>
                  <div className="p-3 space-y-2">
                    <div className="h-3 bg-gray-200 rounded"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : relatedContents.length === 0 ? (
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

        {person && <ReviewSection pageId={person.id} pageType="人物" />}
      </div>
    </div>
  );
}