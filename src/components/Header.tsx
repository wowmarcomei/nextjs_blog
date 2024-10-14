'use client';

import React, { useState, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { FaBars, FaTimes, FaCaretDown } from 'react-icons/fa';

interface NavItem {
  href: string;
  label: string;
}

interface HeaderProps {
  logo?: string;
  navItems?: NavItem[];
  SearchBar: React.ComponentType;
  categories: string[];
}

const Header: React.FC<HeaderProps> = React.memo(({ 
  logo = "TechBlog", 
  navItems = [
    { href: "/", label: "Home" },
    { href: "/archive", label: "Archive" },
    { href: "/about", label: "About" }
  ],
  SearchBar,
  categories
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isCategoriesOpen, setIsCategoriesOpen] = useState(false);

  const toggleMenu = useCallback(() => {
    setIsMenuOpen(prev => !prev);
  }, []);

  const handleCategoriesMouseEnter = useCallback(() => {
    setIsCategoriesOpen(true);
  }, []);

  const handleCategoriesMouseLeave = useCallback(() => {
    setIsCategoriesOpen(false);
  }, []);

  const memoizedNavItems = useMemo(() => navItems, [navItems]);

  const renderNavItems = (items: NavItem[]) => (
    <ul className="flex flex-col md:flex-row md:space-x-4">
      {items.map((item) => (
        <li key={item.href}>
          <Link href={item.href} className="block md:inline-block hover:text-blue-600 transition duration-300">
            {item.label}
          </Link>
        </li>
      ))}
    </ul>
  );

  const renderCategoriesDropdown = () => (
    <div className="relative" onMouseEnter={handleCategoriesMouseEnter} onMouseLeave={handleCategoriesMouseLeave}>
      <button className="flex items-center hover:text-blue-600 transition duration-300">
        Categories <FaCaretDown className="ml-1" />
      </button>
      {isCategoriesOpen && (
        <ul className="absolute top-full right-0 bg-white shadow-lg rounded-md p-2 space-y-2">
          {categories.map((category) => (
            <li key={category}>
              <Link href={`/?category=${encodeURIComponent(category)}`} className="block hover:text-blue-600">
                {category}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );

  return (
    <>
      <header className="fixed top-0 left-0 right-0 bg-white shadow-md z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="text-2xl font-bold text-blue-600">
              {logo}
            </Link>
            <div className="hidden md:flex items-center space-x-4">
              <nav>{renderNavItems(memoizedNavItems)}</nav>
              {renderCategoriesDropdown()}
              <SearchBar />
            </div>
            <button
              className="md:hidden text-gray-600 focus:outline-none"
              onClick={toggleMenu}
              aria-label={isMenuOpen ? "Close menu" : "Open menu"}
            >
              {isMenuOpen ? <FaTimes size={24} /> : <FaBars size={24} />}
            </button>
          </div>
        </div>
      </header>
      {isMenuOpen && (
        <div className="fixed top-[73px] left-0 right-0 bg-white shadow-md md:hidden z-40">
          <nav className="px-4 pt-2 pb-4">
            {renderNavItems(memoizedNavItems)}
            {renderCategoriesDropdown()}
          </nav>
          <div className="px-4 pb-4">
            <SearchBar />
          </div>
        </div>
      )}
      <div className="h-[73px]"></div> {/* Placeholder div */}
    </>
  );
});

Header.displayName = 'Header';

export default Header;
