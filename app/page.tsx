'use client';
import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Loading from '@/components/Loading';

type Person = any;
type Content = any;
type SortOption = 'newest' | 'popular' | 'sales' | 'name';

export default function Home() {
  const [people, setPeople] = useState<Person[]>([]);
  const [contents, setContents] = useState<Content[]>([]);

  const [filteredPeople, setFilteredPeople] = useState<Person[]>([]);
  const [filteredContents, setFilteredContents] = useState<Content[]>([]);

  const [selectedCategory, setSelectedCategory] = useState<string>('全て');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const [contentSort, setContentSort] = useState<SortOption>('newest');
  const [peopleSort, setPeopleSort] = useState<SortOption>('name');
  const [loading, setLoading] = useState(true);

  // カテゴリ一覧を抽出（PeopleとContents両方から）
  const categories = useMemo(() => {
    const categorySet = new Set<string>();
    
    people.forEach((person: Person) => {
      const personCategories = person.properties['カテゴリ']?.multi_select || [];
      personCategories.forEach((cat: any) => {
        categorySet.add(cat.name);
      });
    });
    
    contents.forEach((content: Content) => {
      const contentCategories = content.properties['カテゴリ']?.multi_select || [];
      contentCategories.forEach((cat: any) => {
        categorySet.add(cat.name);
      });
    });
    
    return Array.from(categorySet).sort();
  }, [people, contents]);

  useEffect(() => {
    async function fetchData() {
      try {
        const [peopleRes, contentsRes] = await Promise.all([
          fetch('/api/people'),
          fetch('/api/contents'),
        ]);
        const peopleData = await peopleRes.json();
        const contentsData = await contentsRes.json();

        setPeople(peopleData);
        setContents(contentsData);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching data:', error);
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  useEffect(() => {
    filterAndSortData(selectedCategory, searchQuery, peopleSort, contentSort);
  }, [selectedCategory, searchQuery, peopleSort, contentSort, people, contents]);

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
    category: string,
    query: string,
    peopleSortOption: SortOption,
    contentSortOption: SortOption
  ) => {
    let filteredP = people;
    let filteredC = contents;

    // カテゴリで絞り込み
    if (category !== '全て') {
      filteredP = filteredP.filter((person: Person) => {
        const personCategories = person.properties['カテゴリ']?.multi_select || [];
        return personCategories.some((cat: any) => cat.name === category);
      });
      filteredC = filteredC.filter((content: Content) => {
        const contentCategories = content.properties['カテゴリ']?.multi_select || [];
        return contentCategories.some((cat: any) => cat.name === category);
      });
    }

    // 検索クエリで絞り込み
    if (query.trim() !== '') {
      const lowerQuery = query.toLowerCase();
      filteredP = filteredP.filter((person: Person) => {
        const name = person.properties['人名']?.title[0]?.plain_text || '';
        const description = person.properties['説明文']?.rich_text?.[0]?.plain_text || '';
        return name.toLowerCase().includes(lowerQuery) ||
          description.toLowerCase().includes(lowerQuery);
      });
      filteredC = filteredC.filter((content: Content) => {
        const title = content.properties['タイトル']?.title[0]?.plain_text || '';
        const description = content.properties['説明文']?.rich_text?.[0]?.plain_text || '';
        return title.toLowerCase().includes(lowerQuery) ||
          description.toLowerCase().includes(lowerQuery);
      });
    }

    filteredP = sortPeople(filteredP, peopleSortOption);
    filteredC = sortContents(filteredC, contentSortOption);

    setFilteredPeople(filteredP);
    setFilteredContents(filteredC);
  };

  const handleCategoryClick = (category: string) => {
    setSelectedCategory(category);
    // カテゴリをクリックしたら人物一覧までスクロール
    setTimeout(() => {
      document.getElementById('people')?.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    }, 100);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const clearSearch = () => {
    setSearchQuery('');
  };

  // カテゴリごとの画像マッピング（デフォルト画像）
  const getCategoryImage = (category: string) => {
    // ここに各カテゴリのデフォルト画像URLを設定できます
    const images: { [key: string]: string } = {
      '制服': '',
      'セーラー服': '',
      'ブレザー': '',
      '体操服': '',
      'スクール水着': '',
      'ブルマ': '',
      '美少女': '',
      // 必要に応じて追加
    };
    return images[category] || '';
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
                className="w-full px-6 py-4 text-lg rounded-full border-2 border-gray-300 focus:border-pink-500 focus:outline-none shadow-md pl-12 text-black placeholder-gray-400"
              />
              {searchQuery && (
                <button
                  onClick={clearSearch}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-black hover:text-gray-700 text-xl"
                >
                  ✕
                </button>
              )}
              <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-black text-xl">
                🔍
              </div>
            </div>
            {searchQuery && (
              <p className="text-center text-black mt-2">
                「{searchQuery}」の検索結果
              </p>
            )}
          </div>

          {/* カテゴリ別検索（画像付き） */}
          <section className="mb-12">
            <h2 className="text-3xl font-bold text-center mb-6 text-black">カテゴリから探す</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {/* 「全て」ボタン */}
              <button
                onClick={() => handleCategoryClick('全て')}
                className={`relative overflow-hidden rounded-lg shadow-md hover:shadow-xl transition-all ${
                  selectedCategory === '全て' ? 'ring-4 ring-pink-500 scale-105' : ''
                }`}
              >
                <div className="w-full h-32 bg-gradient-to-br from-pink-400 to-purple-500 flex items-center justify-center">
                  <span className="text-white font-bold text-2xl">全て</span>
                </div>
              </button>

              {/* カテゴリボタン */}
              {categories.map((category) => {
                const categoryImage = getCategoryImage(category);
                const isSelected = selectedCategory === category;

                return (
                  <button
                    key={category}
                    onClick={() => handleCategoryClick(category)}
                    className={`relative overflow-hidden rounded-lg shadow-md hover:shadow-xl transition-all ${
                      isSelected ? 'ring-4 ring-pink-500 scale-105' : ''
                    }`}
                  >
                    {categoryImage ? (
                      <img
                        src={categoryImage}
                        alt={category}
                        className="w-full h-32 object-cover"
                      />
                    ) : (
                      <div className="w-full h-32 bg-gradient-to-br from-blue-400 to-purple-400 flex items-center justify-center">
                        <span className="text-white font-bold text-xl">{category}</span>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex items-end justify-center pb-3">
                      <span className="text-white font-bold text-lg">{category}</span>
                    </div>
                  </button>
                );
              })}
            </div>
            {selectedCategory !== '全て' && (
              <p className="text-center text-black mt-4">
                カテゴリ「{selectedCategory}」で絞り込み中
              </p>
            )}
          </section>

          {/* 人物一覧 */}
          <section id="people" className="mb-12 scroll-mt-24">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-black">
                人物一覧 ({filteredPeople.length}件)
              </h2>
              <div className="flex items-center gap-2">
                <span className="text-sm text-black">並び替え:</span>
                <select
                  value={peopleSort}
                  onChange={(e) => setPeopleSort(e.target.value as SortOption)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-pink-500 text-black bg-white"
                >
                  <option value="name">名前順</option>
                  <option value="newest">生年月日（新しい順）</option>
                </select>
              </div>
            </div>
            {filteredPeople.length === 0 ? (
              <p className="text-black text-center py-8">該当する人物が見つかりませんでした</p>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
                {filteredPeople.map((person: Person) => {
                  const personId = person.id;
                  const name = person.properties['人名']?.title[0]?.plain_text || '名前なし';
                  const profileImage = person.properties['プロフィール画像']?.files[0]?.file?.url || person.properties['プロフィール画像']?.files[0]?.external?.url || '';
                  const personCategories = person.properties['カテゴリ']?.multi_select || [];
                  const fanzaLink = person.properties['FANZAリンク']?.url || null;

                  return (
                    <div key={personId} className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow p-4">
                      <Link href={`/person/${personId}`}>
                        {profileImage && (
                          <img
                            src={profileImage}
                            alt={name}
                            className="w-full h-48 object-cover rounded-lg mb-3"
                          />
                        )}
                        <h3 className="font-bold text-lg mb-2 text-black">{name}</h3>
                        <div className="flex flex-wrap gap-1 mb-3">
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

                      {/* FANZAリンクボタン */}
                      {fanzaLink && (
                        <a
                          href={fanzaLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block text-center bg-red-600 hover:bg-red-700 text-white text-sm font-bold py-2 px-3 rounded-lg transition-colors duration-200"
                        >
                          動画を見る
                        </a>
                      )}
                    </div>
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
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-pink-500 text-black bg-white"
                >
                  <option value="newest">新着順</option>
                  <option value="popular">人気順（閲覧数）</option>
                  <option value="sales">売上順</option>
                  <option value="name">タイトル順</option>
                </select>
              </div>
            </div>
            {filteredContents.length === 0 ? (
              <p className="text-black text-center py-8">該当するコンテンツが見つかりませんでした</p>
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
                        <p className="text-black text-sm">👁 {views.toLocaleString()} views</p>
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