import React from 'react';
import Link from 'next/link';

const Hero: React.FC = () => {
  return (
    <div className="w-full bg-gray">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-br from-blue-900 via-indigo-800 to-purple-800">
          <div className="py-24">
            <div className="text-center">
              <h1 className="text-4xl md:text-5xl font-bold mb-4 text-white">Welcome to TechBlog</h1>
              <p className="text-xl mb-8 text-gray-200">Discover the latest in technology, programming, and digital innovation.</p>
              <Link href="/posts" className="inline-block bg-blue-500 text-white px-6 py-3 rounded-full font-semibold hover:bg-blue-600 transition duration-300">
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