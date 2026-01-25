'use client';
import { useState, useEffect } from 'react';

interface ReviewSectionProps {
  pageId: string;
  pageType: '人物' | 'コンテンツ';
}

export default function ReviewSection({ pageId, pageType }: ReviewSectionProps) {
  const [reviews, setReviews] = useState<any[]>([]);
  const [userName, setUserName] = useState('');
  const [rating, setRating] = useState(5);
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);

  // 口コミを取得
  useEffect(() => {
    fetchReviews();
  }, [pageId]);

  const fetchReviews = async () => {
  try {
    const res = await fetch(`/api/reviews/${pageId}`);
    const data = await res.json();
    
    // データが配列かチェック
    if (Array.isArray(data)) {
      setReviews(data);
    } else {
      console.error('Invalid data format:', data);
      setReviews([]);
    }
  } catch (error) {
    console.error('口コミの取得に失敗:', error);
    setReviews([]);
  }
};

  // 口コミを投稿
  const submitReview = async () => {
    if (!userName.trim() || !content.trim()) {
      alert('ニックネームと口コミ内容を入力してください');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/reviews/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pageId,
          pageType,
          userName: userName.trim(),
          rating,
          content: content.trim()
        })
      });

      const data = await res.json();

      if (data.success) {
        alert('口コミを投稿しました！');
        // フォームをクリア
        setUserName('');
        setRating(5);
        setContent('');
        setShowForm(false);
        // 口コミを再取得
        await fetchReviews();
      } else {
        alert(data.error || '投稿に失敗しました');
      }
    } catch (error) {
      console.error('投稿エラー:', error);
      alert('投稿に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  // 星を表示
  const renderStars = (ratingText: string) => {
    const match = ratingText.match(/(\d+) Star/);
    const count = match ? parseInt(match[1]) : 5;
    return '⭐'.repeat(count);
  };

  // 平均評価を計算
  const calculateAverageRating = (): string => {
  if (reviews.length === 0) return '0.0';
  const total = reviews.reduce((sum, review) => {
    const ratingText = review.properties['評価']?.select?.name || '5 Stars';
    const match = ratingText.match(/(\d+) Star/);
    const rating = match ? parseInt(match[1]) : 5;
    return sum + rating;
  }, 0);
  return (total / reviews.length).toFixed(1);
};

  return (
    <section className="mt-12">
      {/* ヘッダー */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-3xl font-bold text-black">
            口コミ ({reviews.length}件)
          </h2>
          {reviews.length > 0 && (
            <p className="text-lg text-gray-600 mt-1">
              平均評価: <span className="text-yellow-500 font-bold">{renderStars(`${Math.round(Number(calculateAverageRating()))} Stars`)}</span>
              <span className="ml-2">({calculateAverageRating()})</span>
            </p>
          )}
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-pink-500 text-white px-6 py-2 rounded-lg hover:bg-pink-600 transition"
        >
          {showForm ? '閉じる' : '口コミを投稿'}
        </button>
      </div>

      {/* 口コミ投稿フォーム */}
      {showForm && (
        <div className="bg-white p-6 rounded-lg shadow-lg mb-8">
          <h3 className="text-xl font-bold mb-4 text-black">口コミを投稿する</h3>
          <div className="space-y-4">
            <div>
              <label className="block mb-2 text-black font-semibold">ニックネーム <span className="text-red-500">*</span></label>
              <input
                type="text"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                placeholder="例：映画好き太郎"
                maxLength={20}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-pink-500 text-black"
              />
            </div>
            <div>
              <label className="block mb-2 text-black font-semibold">評価 <span className="text-red-500">*</span></label>
              <select
                value={rating}
                onChange={(e) => setRating(Number(e.target.value))}
                className="px-4 py-2 border rounded-lg focus:outline-none focus:border-pink-500 text-black bg-white"
              >
                <option value={5}>⭐⭐⭐⭐⭐ (5)</option>
                <option value={4}>⭐⭐⭐⭐ (4)</option>
                <option value={3}>⭐⭐⭐ (3)</option>
                <option value={2}>⭐⭐ (2)</option>
                <option value={1}>⭐ (1)</option>
              </select>
            </div>
            <div>
              <label className="block mb-2 text-black font-semibold">口コミ内容 <span className="text-red-500">*</span></label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="感想を入力してください..."
                maxLength={500}
                className="w-full px-4 py-2 border rounded-lg h-32 focus:outline-none focus:border-pink-500 text-black"
              />
              <p className="text-sm text-gray-500 mt-1">{content.length}/500文字</p>
            </div>
            <button
              onClick={submitReview}
              disabled={loading || !userName.trim() || !content.trim()}
              className="w-full bg-pink-500 text-white px-6 py-3 rounded-lg hover:bg-pink-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition font-bold"
            >
              {loading ? '投稿中...' : '投稿する'}
            </button>
          </div>
        </div>
      )}

      {/* 口コミ一覧 */}
      {reviews.length === 0 ? (
        <div className="bg-white p-12 rounded-lg shadow text-center">
          <p className="text-gray-500 text-lg">まだ口コミがありません</p>
          <p className="text-gray-400 mt-2">最初の口コミを投稿してみませんか？</p>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((review: any) => {
            const userName = review.properties['投稿者名']?.rich_text[0]?.plain_text || '匿名';
            const ratingText = review.properties['評価']?.select?.name || '5 Stars';
            const content = review.properties['口コミ内容']?.rich_text[0]?.plain_text || '';
            const createdTime = review.properties['投稿日時']?.created_time || '';

            return (
              <div key={review.id} className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <span className="font-bold text-black text-lg">{userName}</span>
                    <div className="text-yellow-500 text-xl mt-1">{renderStars(ratingText)}</div>
                  </div>
                  <span className="text-sm text-gray-500">
                    {new Date(createdTime).toLocaleDateString('ja-JP', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </span>
                </div>
                <p className="text-black leading-relaxed whitespace-pre-wrap">{content}</p>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}