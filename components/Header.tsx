import Link from 'next/link';

export default function Header() {
  return (
    <header className="bg-white shadow-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <span className="text-2xl">🎬</span>
            <span className="text-xl font-bold text-gray-900">放課後制服動画ナビ</span>
          </Link>
          
          <nav className="flex gap-6">
            <Link href="/" className="text-gray-600 hover:text-pink-600 transition-colors font-medium">
              ホーム
            </Link>
          </nav>
        </div>
      </div>
    </header>
  );
}