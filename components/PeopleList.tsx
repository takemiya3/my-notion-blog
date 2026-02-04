'use client';

import { useState, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';

interface PeopleListProps {
  initialPeople: any[];
}

export default function PeopleList({ initialPeople }: PeopleListProps) {
  const [searchTerm, setSearchTerm] = useState('');

  // ✅ 検索フィルタリング
  const filteredPeople = useMemo(() => {
    if (!searchTerm) return initialPeople;

    return initialPeople.filter((person: any) => {
      const name = person.properties['人名']?.title[0]?.plain_text || '';
      const categories = person.properties['カテゴリ']?.multi_select || [];
      const categoryNames = categories.map((cat: any) => cat.name).join(' ');

      return (
        name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        categoryNames.toLowerCase().includes(searchTerm.toLowerCase())
      );
    });
  }, [searchTerm, initialPeople]);

  return (
    <>
      {/* 検索バー */}
      <div className="mb-6">
        <div className="relative">
          <input
            type="text"
            placeholder="名前やカテゴリで検索... (例: 七沢みあ、セーラー服)"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-3 pl-12 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black placeholder-gray-400"
          />
          <svg
            className="absolute left-4 top-3.5 h-5 w-5 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>
        <p className="text-gray-600 mt-2">
          {filteredPeople.length}名の女優が表示されています
          {searchTerm && ` (全${initialPeople.length}名中)`}
        </p>
      </div>

      {/* 女優グリッド */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
        {filteredPeople.map((person: any) => {
          const personId = person.id;
          const name = person.properties['人名']?.title[0]?.plain_text || '名前未設定';
          const image =
            person.properties['プロフィール画像']?.files[0]?.file?.url ||
            person.properties['プロフィール画像']?.files[0]?.external?.url ||
            '';
          const categories = person.properties['カテゴリ']?.multi_select || [];
          const slug = person.properties['スラッグ']?.rich_text?.[0]?.plain_text || '';

          // ✅ スラッグ優先、なければIDを使用
          const personUrl = slug ? `/person/${slug}` : `/person/${personId}`;

          return (
            <Link
              key={personId}
              href={personUrl}
              className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow overflow-hidden"
            >
              <div className="relative aspect-[3/4] bg-gray-100">
                {image ? (
                  <Image
                    src={image}
                    alt={name}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 20vw"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-400">
                    <span className="text-5xl">👤</span>
                  </div>
                )}
              </div>
              <div className="p-3">
                <h3 className="font-bold text-base line-clamp-1 text-black mb-1">
                  {name}
                </h3>
                {categories.length > 0 && (
                  <p className="text-xs text-gray-600">
                    {categories.map((cat: any) => cat.name).join(', ')}
                  </p>
                )}
              </div>
            </Link>
          );
        })}
      </div>

      {/* 検索結果なし */}
      {filteredPeople.length === 0 && (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <p className="text-gray-600 text-lg">
            {searchTerm
              ? `「${searchTerm}」に一致する女優が見つかりませんでした`
              : 'まだ登録されている女優がいません'}
          </p>
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="mt-4 text-blue-600 hover:underline"
            >
              検索をクリア
            </button>
          )}
        </div>
      )}
    </>
  );
}