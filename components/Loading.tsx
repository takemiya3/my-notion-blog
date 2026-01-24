export default function Loading() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-16 w-16 border-b-4 border-pink-600 mb-4"></div>
        <p className="text-xl text-gray-600">読み込み中...</p>
      </div>
    </div>
  );
}