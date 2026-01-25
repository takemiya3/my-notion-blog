export default function RankingSlugPage({ params }: { params: { slug: string } }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-pink-500 to-purple-600">
      <div className="bg-white p-12 rounded-2xl shadow-2xl text-center">
        <h1 className="text-5xl font-bold mb-4 text-black">✅ 成功！</h1>
        <p className="text-2xl text-gray-700 mb-2">動的ルーティングは動作しています</p>
        <p className="text-xl text-pink-600 font-bold">スラッグ: {params.slug}</p>
      </div>
    </div>
  );
}