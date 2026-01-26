'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function Home() {
  const [people, setPeople] = useState<any[]>([]);
  const [contents, setContents] = useState<any[]>([]);
  const [categoryImages, setCategoryImages] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [peopleRes, contentsRes, categoryImagesRes] = await Promise.all([
          fetch('/api/people'),
          fetch('/api/contents'),
          fetch('/api/genres'),
        ]);
        const peopleData = await peopleRes.json();
        const contentsData = await contentsRes.json();
        const categoryImagesData = await categoryImagesRes.json();

        setPeople(peopleData);
        setContents(contentsData);
        setCategoryImages(categoryImagesData);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching data:', error);
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const extractCategories = () => {
    const categorySet = new Set<string>();

    people.forEach((person: any) => {
      const categories = person.properties?.['カテゴリ']?.multi_select || [];
      categories.forEach((cat: any) => categorySet.add(cat.name));
    });

    contents.forEach((content: any) => {
      const categories = content.properties?.['カテゴリ']?.multi_select || [];
      categories.forEach((cat: any) => categorySet.add(cat.name));
    });

    return Array.from(categorySet).sort();
  };

  const categories = extractCategories();

  const filteredPeople = selectedCategory
    ? people.filter((person: any) => {
        const personCategories = person.properties?.['カテゴリ']?.multi_select || [];
        return personCategories.some((cat: any) => cat.name === selectedCategory);
      })
    : people;

  const filteredContents = selectedCategory
    ? contents.filter((content: any) => {
        const contentCategories = content.properties?.['カテゴリ']?.multi_select || [];
        return contentCategories.some((cat: any) => cat.name === selectedCategory);
      })
    : contents;

  const getCategoryImage = (category: string) => {
    const categoryData = categoryImages.find(
      (cat: any) => cat.properties['ジャンル名']?.title[0]?.plain_text === category
    );
    
    if (categoryData) {
      const imageProperty = categoryData.properties['イメージ画像'];
      return imageProperty?.files[0]?.file?.url || 
             imageProperty?.files[0]?.external?.url || '';
    }
    
    return '';
  };

  const publishedContents = filteredContents.filter(
    (content: any) => content.properties?.['公開']?.checkbox === true
  );

  if (loading) {
    return (
      <div style=
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        fontSize: '18px',
        color: '#666'
      >
        読み込み中...
      </div>
    );
  }

  return (
    <div style=
      maxWidth: '1200px',
      margin: '0 auto',
      padding: '40px 20px',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    >
      <h1 style=
        fontSize: '42px',
        fontWeight: 'bold',
        marginBottom: '12px',
        color: '#1a1a1a'
      >
        押入れの暮らし
      </h1>
      <p style=
        fontSize: '16px',
        color: '#666',
        marginBottom: '40px'
      >
        あなたの性癖を叶える場所
      </p>

      {/* カテゴリフィルター */}
      <div style= marginBottom: '40px' >
        <h2 style=
          fontSize: '24px',
          fontWeight: 'bold',
          marginBottom: '20px',
          color: '#1a1a1a'
        >
          カテゴリで絞り込み
        </h2>
        <div style=
          display: 'flex',
          gap: '16px',
          flexWrap: 'wrap',
          marginBottom: '20px'
        >
          <button
            onClick={() => setSelectedCategory(null)}
            style=
              padding: '10px 24px',
              borderRadius: '8px',
              border: selectedCategory === null ? '2px solid #FF1493' : '1px solid #ddd',
              background: selectedCategory === null ? '#FF1493' : 'white',
              color: selectedCategory === null ? 'white' : '#333',
              cursor: 'pointer',
              fontSize: '15px',
              fontWeight: selectedCategory === null ? 'bold' : 'normal',
              transition: 'all 0.2s'
            
          >
            すべて
          </button>
          
          {categories.map((category) => {
            const imageUrl = getCategoryImage(category);
            return (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                style={{
                  padding: imageUrl ? '0' : '10px 24px',
                  borderRadius: '8px',
                  border: selectedCategory === category ? '3px solid #FF1493' : '1px solid #ddd',
                  background: imageUrl 
                    ? `linear-gradient(rgba(0,0,0,0.3), rgba(0,0,0,0.3)), url(${imageUrl}) center/cover`
                    : selectedCategory === category ? '#FF1493' : 'white',
                  color: selectedCategory === category && !imageUrl ? 'white' : '#fff',
                  cursor: 'pointer',
                  fontSize: '16px',
                  fontWeight: 'bold',
                  transition: 'all 0.2s',
                  minWidth: imageUrl ? '140px' : 'auto',
                  minHeight: imageUrl ? '80px' : 'auto',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  textShadow: imageUrl ? '0 2px 4px rgba(0,0,0,0.8)' : 'none',
                  position: 'relative',
                  overflow: 'hidden'
                }}
              >
                {imageUrl && (
                  <div style=
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: selectedCategory === category
                      ? 'rgba(255,20,147,0.4)'
                      : 'rgba(0,0,0,0.3)',
                    transition: 'all 0.2s'
                   />
                )}
                <span style= position: 'relative', zIndex: 1 >
                  {category}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 人物セクション */}
      {filteredPeople.length > 0 && (
        <section style= marginBottom: '60px' >
          <h2 style=
            fontSize: '28px',
            fontWeight: 'bold',
            marginBottom: '24px',
            borderBottom: '3px solid #FF1493',
            paddingBottom: '8px',
            color: '#1a1a1a'
          >
            👤 人物
          </h2>
          <div style=
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: '24px'
          >
            {filteredPeople.map((person: any) => {
              const name = person.properties?.['名前']?.title[0]?.plain_text || '名前なし';
              const thumbnail = person.properties?.['サムネイル']?.files[0]?.file?.url || 
                              person.properties?.['サムネイル']?.files[0]?.external?.url;
              const personCategories = person.properties?.['カテゴリ']?.multi_select || [];

              return (
                <Link 
                  key={person.id} 
                  href={`/person/${person.id}`}
                  style= textDecoration: 'none' 
                >
                  <div style=
                    border: '1px solid #e0e0e0',
                    borderRadius: '12px',
                    overflow: 'hidden',
                    transition: 'transform 0.2s, box-shadow 0.2s',
                    cursor: 'pointer',
                    background: 'white',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column'
                  
                  onMouseOver={(e) => {
                    e.currentTarget.style.transform = 'translateY(-4px)';
                    e.currentTarget.style.boxShadow = '0 8px 16px rgba(0,0,0,0.1)';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}>
                    {thumbnail && (
                      <div style={{ 
                        width: '100%', 
                        height: '200px',
                        background: `url(${thumbnail}) center/cover`,
                        backgroundColor: '#f5f5f5'
                      }} />
                    )}
                    <div style= padding: '16px' >
                      <h3 style=
                        fontSize: '18px',
                        fontWeight: 'bold',
                        marginBottom: '8px',
                        color: '#1a1a1a'
                      >
                        {name}
                      </h3>
                      {personCategories.length > 0 && (
                        <div style= display: 'flex', gap: '6px', flexWrap: 'wrap' >
                          {personCategories.map((cat: any) => (
                            <span
                              key={cat.id}
                              style=
                                background: '#FFE4E1',
                                color: '#FF1493',
                                padding: '4px 10px',
                                borderRadius: '12px',
                                fontSize: '12px',
                                fontWeight: '500'
                              
                            >
                              {cat.name}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* コンテンツセクション */}
      {publishedContents.length > 0 && (
        <section>
          <h2 style=
            fontSize: '28px',
            fontWeight: 'bold',
            marginBottom: '24px',
            borderBottom: '3px solid #FF1493',
            paddingBottom: '8px',
            color: '#1a1a1a'
          >
            📝 コンテンツ
          </h2>
          <div style=
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: '24px'
          >
            {publishedContents.map((content: any) => {
              const title = content.properties?.['タイトル']?.title[0]?.plain_text || 'タイトルなし';
              const thumbnail = content.properties?.['サムネイル']?.files[0]?.file?.url || 
                              content.properties?.['サムネイル']?.files[0]?.external?.url;
              const contentCategories = content.properties?.['カテゴリ']?.multi_select || [];

              return (
                <Link 
                  key={content.id} 
                  href={`/content/${content.id}`}
                  style= textDecoration: 'none' 
                >
                  <div style=
                    border: '1px solid #e0e0e0',
                    borderRadius: '12px',
                    overflow: 'hidden',
                    transition: 'transform 0.2s, box-shadow 0.2s',
                    cursor: 'pointer',
                    background: 'white',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column'
                  
                  onMouseOver={(e) => {
                    e.currentTarget.style.transform = 'translateY(-4px)';
                    e.currentTarget.style.boxShadow = '0 8px 16px rgba(0,0,0,0.1)';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}>
                    {thumbnail && (
                      <div style={{ 
                        width: '100%', 
                        height: '200px',
                        background: `url(${thumbnail}) center/cover`,
                        backgroundColor: '#f5f5f5'
                      }} />
                    )}
                    <div style= padding: '16px' >
                      <h3 style=
                        fontSize: '18px',
                        fontWeight: 'bold',
                        marginBottom: '8px',
                        color: '#1a1a1a'
                      >
                        {title}
                      </h3>
                      {contentCategories.length > 0 && (
                        <div style= display: 'flex', gap: '6px', flexWrap: 'wrap' >
                          {contentCategories.map((cat: any) => (
                            <span
                              key={cat.id}
                              style=
                                background: '#FFE4E1',
                                color: '#FF1493',
                                padding: '4px 10px',
                                borderRadius: '12px',
                                fontSize: '12px',
                                fontWeight: '500'
                              
                            >
                              {cat.name}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {filteredPeople.length === 0 && publishedContents.length === 0 && (
        <div style=
          textAlign: 'center',
          padding: '60px 20px',
          color: '#999',
          fontSize: '16px'
        >
          該当するコンテンツがありません
        </div>
      )}
    </div>
  );
}