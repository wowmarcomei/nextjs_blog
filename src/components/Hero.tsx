import React from 'react';
import Link from 'next/link';

const Hero: React.FC = () => {
  return (
    <div className="w-full bg-gray">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="my-8  shadow-lg overflow-hidden">
          <div className="bg-gradient-to-r from-[#F8CF6A] to-[#2178DD] py-16 px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h1 className="text-4xl md:text-5xl font-bold mb-4 text-white">Welcome to TechBlog</h1>
              <p className="text-xl mb-8 text-gray-100">Discover the latest in technology, programming, and digital innovation.</p>
              <Link href="/posts" className="inline-block bg-white text-blue-600 px-6 py-3 rounded-full font-semibold hover:bg-gray-100 transition duration-300">
                Explore Articles
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Hero;