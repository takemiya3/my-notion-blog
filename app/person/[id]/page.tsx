'use client';

import { useState, useEffect } from 'react';
import { notFound } from 'next/navigation';
import Link from 'next/link';

type SortOption = 'newest' | 'popular' | 'sales';

export default function PersonPage({ params }: { params: Promise<{ id: string }> }) {
  const [id, setId] = useState<string>('');
  const [person, setPerson] = useState<any>(null);
  const [contents, setContents] = useState<any[]>([]);
  const [sortedContents, setSortedContents] = useState<any[]>([]);
  const [sortOption, setSortOption] = useState<SortOption>('newest');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadParams() {
      const resolvedParams = await params;
      setId(resolvedParams.id);
    }
    loadParams();
  }, [params]);

  useEffect(() => {
    if (!id) return;

    async function fetchData() {
      try {
        const personRes = await fetch(`/api/person/${id}`);
        if (!personRes.ok) {
          notFound();
        }
        const personData = await personRes.json();
        setPerson(personData.person);
        setContents(personData.contents);
        setSortedContents(personData.contents);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching person:', error);
        notFound();
      }
    }

    fetchData();
  }, [id]);

  useEffect(() => {
    if (contents.length > 0) {
      const sorted = sortContents(contents, sortOption);
      setSortedContents(sorted);
    }
  }, [sortOption, contents]);

  const sortContents = (contentsList: any[], option: SortOption): any[] => {
    const sorted = [...contentsList];
    
    switch (option) {
      case 'newest':
        return sorted.sort((a, b) => {
          const dateA = a.properties['公開日']?.date?.start || '0000-00-00';
          const dateB = b.properties['公開日']?.date?.start || '0000-00-00';
          return dateB.localeCompare(dateA);
        });
      case 'popular':
        return sorted.sort((a, b) => {
          const viewsA = a.properties['閲覧数']?.number || 0;
          const viewsB = b.properties['閲覧数']?.number || 0;
          return viewsB - viewsA;
        });
      case 'sales':
        return sorted.sort((a, b) => {
          const salesA = a.properties['売上']?.number || 0;
          const salesB = b.properties['売上']?.number || 0;
          return salesB - salesA;
        });
      default:
        return sorted;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-xl">読み込み中...</div>
      </div>
    );
  }

  if (!person) {
    notFound();
  }

  const name = person.properties['人名']?.title[0]?.plain_text || '名前なし';
  const description = person.properties['説明文']?.rich_text[0]?.plain_text || '';
  const categories = person.properties['カテゴリ']?.multi_select || [];
  const birthday = person.properties['生年月日']?.date?.start || '';
  const profileImage = person.properties['プロフィール画像']?.files[0]?.file?.url || person.properties['プロフィール画像']?.files[0]?.external?.url || '';

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <Link href="/" className="text-blue-600 hover:underline mb-4 inline-block">
          ← ホームに戻る
        </Link>

        <div className="bg-white rounded-lg shadow-md p-8 mb-8">
          <div className="flex items-start gap-6">
            {profileImage && (
              <img
                src={profileImage}
                alt={name}
                className="w-32 h-32 rounded-full object-cover"
              />
            )}
            <div className="flex-1">
              <h1 className="text-3xl font-bold mb-2">{name}</h1>
              <div className="flex gap-2 mb-4">
                {categories.map((cat: any) => (
                  <span
                    key={cat.name}
                    className="px-3 py-1 bg-pink-100 text-pink-600 rounded-full text-sm"
                  >
                    {cat.name}
                  </span>
                ))}
              </div>
              {birthday && (
                <p className="text-gray-600 mb-2">生年月日: {birthday}</p>
              )}
              {description && (
                <p className="text-gray-700 mt-4">{description}</p>
              )}
            </div>
          </div>
        </div>

        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold">出演コンテンツ ({sortedContents.length}件)</h2>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">並び替え:</span>
              <select
                value={sortOption}
                onChange={(e) => setSortOption(e.target.value as SortOption)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-pink-500"
              >
                <option value="newest">新着順</option>
                <option value="popular">人気順（閲覧数）</option>
                <option value="sales">売上順</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sortedContents.map((content: any) => {
              const contentId = content.id;
              const title = content.properties['タイトル']?.title[0]?.plain_text || '無題';
              const thumbnail = content.properties['サムネイル']?.files[0]?.file?.url || content.properties['サムネイル']?.files[0]?.external?.url || '';
              const views = content.properties['閲覧数']?.number || 0;
              const publishDate = content.properties['公開日']?.date?.start || '';

              return (
                <Link
                  key={contentId}
                  href={`/content/${contentId}`}
                  className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow overflow-hidden"
                >
                  {thumbnail && (
                    <img
                      src={thumbnail}
                      alt={title}
                      className="w-full h-48 object-cover"
                    />
                  )}
                  <div className="p-4">
                    <h3 className="font-bold text-lg mb-2 line-clamp-2">{title}</h3>
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>👁 {views.toLocaleString()}</span>
                      <span>{publishDate}</span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}