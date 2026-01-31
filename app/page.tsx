'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Loading from '@/components/Loading';
import Script from 'next/script';

type Person = any;
type Content = any;
type Genre = any;
type Category = {
  name: string;
  color: string;
};
type SortOption = 'newest' | 'popular' | 'sales' | 'name' | 'random';

export default function Home() {
  const [people, setPeople] = useState<Person[]>([]);
  const [contents, setContents] = useState<Content[]>([]);
  const [genres, setGenres] = useState<Genre[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [filteredPeople, setFilteredPeople] = useState<Person[]>([]);
  const [filteredContents, setFilteredContents] = useState<Content[]>([]);
  const [selectedGenre, setSelectedGenre] = useState<string | null>(null);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [showDetailSearchModal, setShowDetailSearchModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [contentSort, setContentSort] = useState<SortOption>('random');
  const [peopleSort, setPeopleSort] = useState<SortOption>('name');
  const [loading, setLoading] = useState(true);
  const [displayedPeopleCount, setDisplayedPeopleCount] = useState(10);

  const peopleListRef = useRef<HTMLElement>(null);

  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: '放課後制服動画ナビ',
    url: 'https://www.seifuku-jk.com',
    description: '制服・セーラー服・ブレザー・体操服・スクール水着などの動画作品と出演者の詳細情報を検索できる専門サイトです。',
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: 'https://www.seifuku-jk.com?q={search_term_string}'
      },
      'query-input': 'required name=search_term_string'
    }
  };

  useEffect(() => {
    async function fetchData() {
      try {
        const [peopleRes, contentsRes, genresRes, categoriesRes] = await Promise.all([
          fetch('/api/people'),
          fetch('/api/contents'),
          fetch('/api/genres'),
          fetch('/api/categories'),
        ]);

        const peopleData = await peopleRes.json();
        const contentsData = await contentsRes.json();
        const genresData = await genresRes.json();
        const categoriesData = await categoriesRes.json();

        setPeople(peopleData);
        setContents(contentsData);
        setGenres(genresData);
        setCategories(categoriesData);
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

  const shuffleArray = <T,>(array: T[]): T[] => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  const sortPeople = (peopleList: Person[], sortOption: SortOption): Person[] => {
    const sorted = [...peopleList];

    switch (sortOption) {
      case 'random':
        return shuffleArray(sorted);
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
      case 'random':
        return shuffleArray(sorted);
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

  const getCategoryColor = (color: string) => {
    const colorMap: { [key: string]: string } = {
      'gray': 'bg-gray-500',
      'brown': 'bg-orange-800',
      'orange': 'bg-orange-500',
      'yellow': 'bg-yellow-500',
      'green': 'bg-green-500',
      'blue': 'bg-blue-500',
      'purple': 'bg-purple-500',
      'pink': 'bg-pink-500',
      'red': 'bg-red-500',
      'default': 'bg-gray-500',
    };
    return colorMap[color] || 'bg-gray-500';
  };

  const handleContentClick = async (contentId: string) => {
    try {
      await fetch('/api/increment-view', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pageId: contentId }),
      });
    } catch (error) {
      console.error('View count error:', error);
    }
  };

  if (loading) {
    return <Loading />;
  }

  return (
    <>
      <Script
        id="structured-data"
        type="application/ld+json"
        dangerouslySetInnerHTML={{__html: JSON.stringify(structuredData)}}
      />

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
                className="w-full px-6 py-4 text-lg rounded-full border-2 border-gray-300 focus:border-pink-500 focus:outline-none shadow-md pl-12 text-black"
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

          {/* ジャンルボタン(画像付き) */}
          {genres.length > 0 && (
            <div className="mb-8">
              <h2 className="text-xl font-bold mb-4 text-black">ジャンルで探す</h2>
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
                        width: '200px',
                        height: '150px',
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

          {/* 詳細検索ボタン */}
          <div className="mb-8 flex justify-center items-center gap-4">
            <button
              onClick={() => setShowDetailSearchModal(true)}
              className="px-8 py-3 bg-pink-500 text-white font-bold rounded-full shadow-lg hover:shadow-xl hover:scale-105 transition-all flex items-center gap-2"
            >
              <span className="text-xl">🔎</span>
              <span>詳細検索</span>
              {selectedCategories.length > 0 && (
                <span className="bg-white text-pink-600 px-2 py-1 rounded-full text-sm font-bold">
                  {selectedCategories.length}
                </span>
              )}
            </button>
            {(selectedCategories.length > 0 || selectedGenre || searchQuery) && (
              <button
                onClick={clearAllFilters}
                className="px-6 py-3 bg-gray-200 text-gray-700 rounded-full hover:bg-gray-300 transition-colors"
              >
                すべてクリア
              </button>
            )}
          </div>

          {/* 選択中のカテゴリ表示 */}
          {selectedCategories.length > 0 && (
            <div className="mb-8 flex justify-center">
              <div className="bg-white rounded-lg shadow-md p-4 flex flex-wrap gap-2 items-center">
                <span className="text-sm text-gray-600 font-bold">選択中:</span>
                {selectedCategories.map((categoryName) => {
                  const category = categories.find(c => c.name === categoryName);
                  return (
                    <span
                      key={categoryName}
                      className={`px-3 py-1 rounded-full text-white text-sm flex items-center gap-1 ${getCategoryColor(category?.color || 'default')}`}
                    >
                      {categoryName}
                      <button
                        onClick={() => handleCategoryToggle(categoryName)}
                        className="ml-1 hover:bg-white hover:bg-opacity-20 rounded-full w-4 h-4 flex items-center justify-center text-xs"
                      >
                        ✕
                      </button>
                    </span>
                  );
                })}
              </div>
            </div>
          )}

          {/* 詳細検索モーダル */}
          {showDetailSearchModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[80vh] overflow-y-auto">
                <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex justify-between items-center rounded-t-2xl">
                  <h2 className="text-2xl font-bold text-black">🔎 詳細検索</h2>
                  <button
                    onClick={() => setShowDetailSearchModal(false)}
                    className="text-gray-400 hover:text-black text-3xl leading-none"
                  >
                    ✕
                  </button>
                </div>
                <div className="p-6">
                  <p className="text-sm text-gray-600 mb-4">
                    選択中: {selectedCategories.length}件
                  </p>
                  <div className="flex flex-wrap gap-3">
                    {categories.map((category) => {
                      const isSelected = selectedCategories.includes(category.name);
                      return (
                        <button
                          key={category.name}
                          onClick={() => handleCategoryToggle(category.name)}
                          className={`px-5 py-3 rounded-full text-white font-bold transition-all ${
                            isSelected
                              ? `${getCategoryColor(category.color)} ring-4 ring-pink-300 scale-110 shadow-lg`
                              : `${getCategoryColor(category.color)} opacity-60 hover:opacity-100 hover:scale-105`
                          }`}
                        >
                          {isSelected && '✓ '}{category.name}
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 p-6 flex justify-end gap-4 rounded-b-2xl">
                  <button
                    onClick={() => {
                      setSelectedCategories([]);
                    }}
                    className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                  >
                    選択をクリア
                  </button>
                  <button
                    onClick={() => setShowDetailSearchModal(false)}
                    className="px-8 py-3 bg-pink-500 text-white font-bold rounded-lg hover:shadow-lg transition-all"
                  >
                    検索する
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 人物一覧 */}
          <section ref={peopleListRef} className="mb-12">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-black">
                女優一覧 ({filteredPeople.length}件)
              </h2>
              <div className="flex items-center gap-2">
                <span className="text-sm text-black">並び替え:</span>
                <select
                  value={peopleSort}
                  onChange={(e) => setPeopleSort(e.target.value as SortOption)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-pink-500 text-black"
                >
                  <option value="name">名前順</option>
                  <option value="newest">生年月日(新しい順)</option>
                  <option value="random">ランダム</option>
                </select>
              </div>
            </div>
            {filteredPeople.length === 0 ? (
              <p className="text-gray-500 text-center py-8">該当する人物が見つかりませんでした</p>
            ) : (
              <>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
                  {filteredPeople.slice(0, displayedPeopleCount).map((person: Person) => {
                    const personId = person.id;
                    const name = person.properties['人名']?.title[0]?.plain_text || '名前なし';
                    const profileImageRaw = person.properties['プロフィール画像']?.files[0]?.file?.url || person.properties['プロフィール画像']?.files[0]?.external?.url || '';
                    const profileImage = profileImageRaw ? profileImageRaw.replace('http://', 'https://') : '';
                    const personCategories = person.properties['カテゴリ']?.multi_select || [];
                    const fanzaLink = person.properties['FANZAリンク']?.url || '';

                    return (
                      <div
                        key={personId}
                        className="bg-white rounded-lg shadow hover:shadow-xl transition-all overflow-hidden group"
                      >
                        <Link href={`/person/${personId}`}>
                          <div className="relative aspect-[3/4] overflow-hidden bg-gray-200">
                            {profileImage ? (
                              <img
                                src={profileImage}
                                alt={name}
                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                              />
                            ) : (
                              <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                                <span className="text-4xl">👤</span>
                              </div>
                            )}
                          </div>

                          <div className="p-4">
                            <h3 className="font-bold text-lg mb-2 text-gray-900 line-clamp-2 min-h-[3.5rem]">{name}</h3>
                            <div className="flex flex-wrap gap-1 mb-3">
                              {personCategories.slice(0, 3).map((cat: any) => (
                                <span
                                  key={cat.name}
                                  className="px-2 py-1 bg-pink-100 text-pink-600 rounded text-xs"
                                >
                                  {cat.name}
                                </span>
                              ))}
                            </div>
                          </div>
                        </Link>

                        {fanzaLink && (
                          <div className="px-4 pb-4">
                            <a
                              href={fanzaLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="block w-full py-2 px-4 bg-gradient-to-r from-pink-500 to-red-500 text-white text-center font-bold rounded-lg hover:from-pink-600 hover:to-red-600 transition-all shadow-md hover:shadow-lg text-sm"
                              onClick={(e) => e.stopPropagation()}
                            >
                              🎬 動画をチェック
                            </a>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {filteredPeople.length > displayedPeopleCount && (
                  <div className="text-center mt-8">
                    <button
                      onClick={() => setDisplayedPeopleCount(prev => prev + 10)}
                      className="px-8 py-3 bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold rounded-lg shadow transition-colors"
                    >
                      続きを見る ({filteredPeople.length - displayedPeopleCount}件)
                    </button>
                  </div>
                )}
              </>
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
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-pink-500 text-black"
                >
                  <option value="random">ランダム</option>
                  <option value="newest">新着順</option>
                  <option value="popular">人気順(閲覧数)</option>
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
                  const thumbnailRaw = content.properties['サムネイル']?.files[0]?.file?.url || content.properties['サムネイル']?.files[0]?.external?.url || '';
                  const thumbnail = thumbnailRaw ? thumbnailRaw.replace('http://', 'https://') : '';
                  const views = content.properties['閲覧数']?.number || 0;

                  return (
                    <Link
                      key={contentId}
                      href={`/content/${contentId}`}
                      onClick={() => handleContentClick(contentId)}
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
    </>
  );
}