import React from 'react';
import Link from 'next/link';

const Hero: React.FC = () => {
  return (
    <div className="bg-gradient-to-r from-blue-100 to-purple-100 text-gray-800 py-12 sm:py-16 md:py-24 mb-8 sm:mb-12">
      <div className="container mx-auto px-4 text-center">
        <h1 className="text-4xl sm:text-5xl md:text-7xl font-bold mb-4 sm:mb-6 animate-fade-in-down">
          欢迎来到我的博客
        </h1>
        <p className="text-lg sm:text-xl md:text-2xl mb-8 sm:mb-12 animate-fade-in-up max-w-3xl mx-auto">
          探索技术、创意和见解的世界
        </p>
        <Link href="/archive" 
          className="bg-blue-500 text-white py-2 px-6 sm:py-3 sm:px-8 rounded-full font-semibold 
                     hover:bg-blue-600 transition duration-300 animate-fade-in-up inline-block
                     text-sm sm:text-base">
          浏览文章
        </Link>
      </div>
    </div>
  );
};

export default Hero;