'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import SearchBar from './SearchBar';
import { FaBars, FaTimes } from 'react-icons/fa';

const Header: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="bg-white shadow-md">
      <div className="w-full px-4 md:px-0 md:w-[64%] mx-auto py-4">
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
      {isMenuOpen && (
        <div className="md:hidden">
          <nav className="px-4 pt-2 pb-4 bg-white">
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
    </header>
  );
};

export default Header;