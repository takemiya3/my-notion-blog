'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Loading from '@/components/Loading';

type Person = any;
type Content = any;
type Genre = any;
type SortOption = 'newest' | 'popular' | 'sales' | 'name';

export default function Home() {
  const [people, setPeople] = useState<Person[]>([]);
  const [contents, setContents] = useState<Content[]>([]);
  const [genres, setGenres] = useState<Genre[]>([]);
  const [filteredPeople, setFilteredPeople] = useState<Person[]>([]);
  const [filteredContents, setFilteredContents] = useState<Content[]>([]);
  const [selectedGenre, setSelectedGenre] = useState<string | null>(null);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]); // ← 複数選択可能に変更
  const [showDetailSearch, setShowDetailSearch] = useState(false); // ← 詳細検索の表示/非表示
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [contentSort, setContentSort] = useState<SortOption>('newest');
  const [peopleSort, setPeopleSort] = useState<SortOption>('name');
  const [loading, setLoading] = useState(true);

  const peopleListRef = useRef<HTMLElement>(null);

  // 人物マスタのカテゴリ一覧
  const allCategories = [
    '女優', '素人系', 'アイドル系',
    '10代', '20代', '30代', '40代',
    'ロリ', '本物', 'メンヘラ',
    'かわいい', '美人', '痴女',
    '妹', 'お姉さん', '巨乳', '美乳'
  ];

  useEffect(() => {
    async function fetchData() {
      try {
        const [peopleRes, contentsRes, genresRes] = await Promise.all([
          fetch('/api/people'),
          fetch('/api/contents'),
          fetch('/api/genres'),
        ]);

        const peopleData = await peopleRes.json();
        const contentsData = await contentsRes.json();
        const genresData = await genresRes.json();

        setPeople(peopleData);
        setContents(contentsData);
        setGenres(genresData);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching data:', error);
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  useEffect(() => {
    filterAndSortData(selectedCategories, selectedGenre, searchQuery, peopleSort, contentSort);
  }, [selectedCategories, selectedGenre, searchQuery, peopleSort, contentSort, people, contents]);

  const sortPeople = (peopleList: Person[], sortOption: SortOption): Person[] => {
    const sorted = [...peopleList];

    switch (sortOption) {
      case 'name':
        return sorted.sort((a, b) => {
          const nameA = a.properties['人名']?.title[0]?.plain_text || '';
          const nameB = b.properties['人名']?.title[0]?.plain_text || '';
          return nameA.localeCompare(nameB, 'ja');
        });
      case 'newest':
        return sorted.sort((a, b) => {
          const dateA = a.properties['生年月日']?.date?.start || '0000-00-00';
          const dateB = b.properties['生年月日']?.date?.start || '0000-00-00';
          return dateB.localeCompare(dateA);
        });
      default:
        return sorted;
    }
  };

  const sortContents = (contentsList: Content[], sortOption: SortOption): Content[] => {
    const sorted = [...contentsList];

    switch (sortOption) {
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
      case 'name':
        return sorted.sort((a, b) => {
          const nameA = a.properties['タイトル']?.title[0]?.plain_text || '';
          const nameB = b.properties['タイトル']?.title[0]?.plain_text || '';
          return nameA.localeCompare(nameB, 'ja');
        });
      default:
        return sorted;
    }
  };

  const filterAndSortData = (
    categories: string[],
    genre: string | null,
    query: string,
    peopleSortOption: SortOption,
    contentSortOption: SortOption
  ) => {
    let filteredP = people;
    let filteredC = contents;

    // カテゴリフィルター（複数選択対応）
    if (categories.length > 0) {
      filteredP = filteredP.filter((person: Person) => {
        const personCategories = person.properties['カテゴリ']?.multi_select || [];
        return categories.every(selectedCat => 
          personCategories.some((cat: any) => cat.name === selectedCat)
        );
      });

      filteredC = filteredC.filter((content: Content) => {
        const contentCategories = content.properties['カテゴリ']?.multi_select || [];
        return categories.every(selectedCat => 
          contentCategories.some((cat: any) => cat.name === selectedCat)
        );
      });
    }

    // ジャンルフィルター（Multi-select対応）
    if (genre) {
      filteredP = filteredP.filter((person: Person) => {
        const personGenreSelect = person.properties['ジャンル']?.select?.name || '';
        const personGenreMulti = person.properties['ジャンル']?.multi_select || [];

        if (personGenreSelect) {
          return personGenreSelect === genre;
        }

        return personGenreMulti.some((g: any) => g.name === genre);
      });

      filteredC = filteredC.filter((content: Content) => {
        const contentGenreSelect = content.properties['ジャンル']?.select?.name || '';
        const contentGenreMulti = content.properties['ジャンル']?.multi_select || [];

        if (contentGenreSelect) {
          return contentGenreSelect === genre;
        }

        return contentGenreMulti.some((g: any) => g.name === genre);
      });
    }

    // 検索フィルター
    if (query.trim() !== '') {
      const lowerQuery = query.toLowerCase();

      filteredP = filteredP.filter((person: Person) => {
        const name = person.properties['人名']?.title[0]?.plain_text || '';
        const description = person.properties['説明文']?.rich_text[0]?.plain_text || '';
        return name.toLowerCase().includes(lowerQuery) ||
          description.toLowerCase().includes(lowerQuery);
      });

      filteredC = filteredC.filter((content: Content) => {
        const title = content.properties['タイトル']?.title[0]?.plain_text || '';
        const description = content.properties['説明文']?.rich_text[0]?.plain_text || '';
        return title.toLowerCase().includes(lowerQuery) ||
          description.toLowerCase().includes(lowerQuery);
      });
    }

    filteredP = sortPeople(filteredP, peopleSortOption);
    filteredC = sortContents(filteredC, contentSortOption);

    setFilteredPeople(filteredP);
    setFilteredContents(filteredC);
  };

  const handleCategoryToggle = (category: string) => {
    setSelectedCategories(prev => 
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  const handleGenreClick = (genreName: string) => {
    setSelectedGenre(selectedGenre === genreName ? null : genreName);

    setTimeout(() => {
      if (peopleListRef.current) {
        peopleListRef.current.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
      }
    }, 100);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const clearSearch = () => {
    setSearchQuery('');
  };

  const clearAllFilters = () => {
    setSelectedCategories([]);
    setSelectedGenre(null);
    setSearchQuery('');
  };

  const getCategoryColor = (category: string) => {
    const colors: { [key: string]: string } = {
      '女優': 'bg-orange-500',
      '素人系': 'bg-gray-500',
      'アイドル系': 'bg-blue-500',
      '10代': 'bg-red-500',
      '20代': 'bg-pink-500',
      '30代': 'bg-green-500',
      '40代': 'bg-yellow-500',
      'ロリ': 'bg-orange-700',
      '本物': 'bg-purple-500',
      'メンヘラ': 'bg-gray-600',
      'かわいい': 'bg-pink-400',
      '美人': 'bg-blue-400',
      '痴女': 'bg-blue-600',
      '妹': 'bg-orange-400',
      'お姉さん': 'bg-pink-600',
      '巨乳': 'bg-orange-800',
      '美乳': 'bg-gray-400',
    };
    return colors[category] || 'bg-gray-500';
  };

  if (loading) {
    return <Loading />;
  }

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4">
          <h1 className="text-4xl font-bold text-center mb-8 text-black">放課後制服動画ナビ</h1>

          {/* 検索バー */}
          <div className="max-w-2xl mx-auto mb-8">
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={handleSearchChange}
                placeholder="人物名やコンテンツを検索..."
                className="w-full px-6 py-4 text-lg rounded-full border-2 border-gray-300 focus:border-pink-500 focus:outline-none shadow-md pl-12"
              />
              {searchQuery && (
                <button
                  onClick={clearSearch}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-black text-xl"
                >
                  ✕
                </button>
              )}
              <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 text-xl">
                🔍
              </div>
            </div>
            {searchQuery && (
              <p className="text-center text-gray-600 mt-2">
                「{searchQuery}」の検索結果
              </p>
            )}
          </div>

          {/* ジャンルボタン（画像付き） */}
          {genres.length > 0 && (
            <div className="mb-8">
              <h2 className="text-xl font-bold mb-4 text-black">📷 ジャンルで探す</h2>
              <div className="flex justify-center gap-4 flex-wrap">
                {genres.map((genre: Genre) => {
                  const genreName =
                    genre.properties?.['ジャンル名']?.title?.[0]?.plain_text ||
                    genre.properties?.['Name']?.title?.[0]?.plain_text ||
                    genre.properties?.['名前']?.title?.[0]?.plain_text ||
                    '';

                  const imageProperty =
                    genre.properties?.['イメージ画像'] ||
                    genre.properties?.['Image'] ||
                    genre.properties?.['画像'] ||
                    genre.properties?.['サムネイル'];

                  const genreImage =
                    imageProperty?.files?.[0]?.file?.url ||
                    imageProperty?.files?.[0]?.external?.url ||
                    '';

                  const isSelected = selectedGenre === genreName;

                  if (!genreName) return null;

                  return (
                    <button
                      key={genre.id}
                      onClick={() => handleGenreClick(genreName)}
                      className={`relative overflow-hidden rounded-lg shadow-md transition-all ${
                        isSelected ? 'ring-4 ring-pink-500 scale-105' : 'hover:scale-105 hover:shadow-lg'
                      }`}
                      style={{
                        width: '150px',
                        height: '100px',
                        backgroundImage: genreImage
                          ? `linear-gradient(rgba(0,0,0,0.4), rgba(0,0,0,0.4)), url(${genreImage})`
                          : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        backgroundColor: genreImage ? 'transparent' : '#000',
                      }}
                    >
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-white font-bold text-lg drop-shadow-lg">
                          {genreName}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* 詳細検索 */}
          <div className="mb-8">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-black">🔎 詳細検索</h2>
              <button
                onClick={() => setShowDetailSearch(!showDetailSearch)}
                className="px-4 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600 transition-colors"
              >
                {showDetailSearch ? '閉じる' : '開く'}
              </button>
            </div>

            {showDetailSearch && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex justify-between items-center mb-4">
                  <p className="text-sm text-gray-600">
                    選択中: {selectedCategories.length}件
                  </p>
                  {(selectedCategories.length > 0 || selectedGenre || searchQuery) && (
                    <button
                      onClick={clearAllFilters}
                      className="text-sm text-pink-500 hover:text-pink-700 underline"
                    >
                      すべてクリア
                    </button>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  {allCategories.map((category) => {
                    const isSelected = selectedCategories.includes(category);
                    return (
                      <button
                        key={category}
                        onClick={() => handleCategoryToggle(category)}
                        className={`px-4 py-2 rounded-full text-white text-sm transition-all ${
                          isSelected
                            ? `${getCategoryColor(category)} ring-2 ring-pink-500 scale-105`
                            : `${getCategoryColor(category)} opacity-60 hover:opacity-100`
                        }`}
                      >
                        {isSelected && '✓ '}{category}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* 人物一覧 */}
          <section ref={peopleListRef} className="mb-12">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-black">
                人物一覧 ({filteredPeople.length}件)
              </h2>
              <div className="flex items-center gap-2">
                <span className="text-sm text-black">並び替え:</span>
                <select
                  value={peopleSort}
                  onChange={(e) => setPeopleSort(e.target.value as SortOption)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-pink-500"
                >
                  <option value="name">名前順</option>
                  <option value="newest">生年月日（新しい順）</option>
                </select>
              </div>
            </div>
            {filteredPeople.length === 0 ? (
              <p className="text-gray-500 text-center py-8">該当する人物が見つかりませんでした</p>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
                {filteredPeople.map((person: Person) => {
                  const personId = person.id;
                  const name = person.properties['人名']?.title[0]?.plain_text || '名前なし';
                  const profileImage = person.properties['プロフィール画像']?.files[0]?.file?.url || person.properties['プロフィール画像']?.files[0]?.external?.url || '';
                  const personCategories = person.properties['カテゴリ']?.multi_select || [];

                  return (
                    <Link
                      key={personId}
                      href={`/person/${personId}`}
                      className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow p-4"
                    >
                      {profileImage && (
                        <img
                          src={profileImage}
                          alt={name}
                          className="w-full h-48 object-cover rounded-lg mb-3"
                        />
                      )}
                      <h3 className="font-bold text-lg mb-2 text-gray-900">{name}</h3>
                      <div className="flex flex-wrap gap-1">
                        {personCategories.map((cat: any) => (
                          <span
                            key={cat.name}
                            className="px-2 py-1 bg-pink-100 text-pink-600 rounded text-xs"
                          >
                            {cat.name}
                          </span>
                        ))}
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </section>

          {/* コンテンツ一覧 */}
          <section>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-black">
                最新コンテンツ ({filteredContents.length}件)
              </h2>
              <div className="flex items-center gap-2">
                <span className="text-sm text-black">並び替え:</span>
                <select
                  value={contentSort}
                  onChange={(e) => setContentSort(e.target.value as SortOption)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-pink-500"
                >
                  <option value="newest">新着順</option>
                  <option value="popular">人気順（閲覧数）</option>
                  <option value="sales">売上順</option>
                  <option value="name">タイトル順</option>
                </select>
              </div>
            </div>
            {filteredContents.length === 0 ? (
              <p className="text-gray-500 text-center py-8">該当するコンテンツが見つかりませんでした</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {filteredContents.map((content: Content) => {
                  const contentId = content.id;
                  const title = content.properties['タイトル']?.title[0]?.plain_text || '無題';
                  const thumbnail = content.properties['サムネイル']?.files[0]?.file?.url || content.properties['サムネイル']?.files[0]?.external?.url || '';
                  const views = content.properties['閲覧数']?.number || 0;

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
                        <h3 className="font-bold text-lg mb-2 line-clamp-2 text-black">{title}</h3>
                        <p className="text-gray-600 text-sm">👁 {views.toLocaleString()} views</p>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      </div>
      <Footer />
    </>
  );
}