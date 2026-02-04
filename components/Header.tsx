'use client';

import Link from 'next/link';
import { useState } from 'react';

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="bg-white shadow-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <span className="text-2xl">🎬</span>
            <span className="text-xl font-bold text-gray-900">放課後制服動画ナビ</span>
          </Link>

          {/* デスクトップメニュー */}
          <nav className="hidden md:flex gap-6">
            <Link href="/" className="text-gray-600 hover:text-pink-600 transition-colors font-medium">
              ホーム
            </Link>
            <Link href="/contents" className="text-gray-600 hover:text-pink-600 transition-colors font-medium">
              コンテンツ一覧
            </Link>
            <Link href="/uniform" className="text-gray-600 hover:text-pink-600 transition-colors font-medium">
              制服検索
            </Link>
            <Link href="/ranking" className="text-gray-600 hover:text-pink-600 transition-colors font-medium">
              ランキング
            </Link>
            <Link href="/people" className="text-gray-600 hover:text-pink-600 transition-colors font-medium">
              女優一覧
            </Link>
            <Link href="/genres" className="text-gray-600 hover:text-pink-600 transition-colors font-medium">
              ジャンル
            </Link>
          </nav>

          {/* モバイルメニューボタン */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden text-gray-600 hover:text-pink-600 transition-colors"
            aria-label="メニュー"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              {isMenuOpen ? (
                <path d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {/* モバイルメニュー */}
        {isMenuOpen && (
          <nav className="md:hidden mt-4 pt-4 border-t border-gray-200 space-y-2">
            <Link
              href="/"
              className="block py-2 px-4 text-gray-600 hover:bg-pink-50 hover:text-pink-600 rounded transition-colors font-medium"
              onClick={() => setIsMenuOpen(false)}
            >
              ホーム
            </Link>
            <Link
              href="/contents"
              className="block py-2 px-4 text-gray-600 hover:bg-pink-50 hover:text-pink-600 rounded transition-colors font-medium"
              onClick={() => setIsMenuOpen(false)}
            >
              コンテンツ一覧
            </Link>
            <Link
              href="/uniform"
              className="block py-2 px-4 text-gray-600 hover:bg-pink-50 hover:text-pink-600 rounded transition-colors font-medium"
              onClick={() => setIsMenuOpen(false)}
            >
              制服検索
            </Link>
            <Link
              href="/ranking"
              className="block py-2 px-4 text-gray-600 hover:bg-pink-50 hover:text-pink-600 rounded transition-colors font-medium"
              onClick={() => setIsMenuOpen(false)}
            >
              ランキング
            </Link>
            <Link
              href="/people"
              className="block py-2 px-4 text-gray-600 hover:bg-pink-50 hover:text-pink-600 rounded transition-colors font-medium"
              onClick={() => setIsMenuOpen(false)}
            >
              女優一覧
            </Link>
            <Link
              href="/genres"
              className="block py-2 px-4 text-gray-600 hover:bg-pink-50 hover:text-pink-600 rounded transition-colors font-medium"
              onClick={() => setIsMenuOpen(false)}
            >
              ジャンル
            </Link>
          </nav>
        )}
      </div>
    </header>
  );
}