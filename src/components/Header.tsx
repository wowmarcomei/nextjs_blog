'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import SearchBar from './SearchBar';
import { FaBars, FaTimes } from 'react-icons/fa';

const Header: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <>
      <header className="fixed top-0 left-0 right-0 bg-white shadow-md z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="text-2xl font-bold text-blue-600">
              TechBlog
            </Link>
            <div className="hidden md:flex items-center space-x-4">
              <nav>
                <ul className="flex space-x-4">
                  <li><Link href="/" className="hover:text-blue-600 transition duration-300">Home</Link></li>
                  <li><Link href="/archive" className="hover:text-blue-600 transition duration-300">Archive</Link></li>
                  <li><Link href="/about" className="hover:text-blue-600 transition duration-300">About</Link></li>
                </ul>
              </nav>
              <SearchBar />
            </div>
            <button
              className="md:hidden text-gray-600 focus:outline-none"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <FaTimes size={24} /> : <FaBars size={24} />}
            </button>
          </div>
        </div>
      </header>
      {isMenuOpen && (
        <div className="fixed top-[73px] left-0 right-0 bg-white shadow-md md:hidden z-40">
          <nav className="px-4 pt-2 pb-4">
            <ul className="space-y-2">
              <li><Link href="/" className="block hover:text-blue-600 transition duration-300">Home</Link></li>
              <li><Link href="/archive" className="block hover:text-blue-600 transition duration-300">Archive</Link></li>
              <li><Link href="/about" className="block hover:text-blue-600 transition duration-300">About</Link></li>
            </ul>
          </nav>
          <div className="px-4 pb-4">
            <SearchBar />
          </div>
        </div>
      )}
      <div className="h-[73px]"></div> {/* 添加一个占位符 div */}
    </>
  );
};

export default Header;