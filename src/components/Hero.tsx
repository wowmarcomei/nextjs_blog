import React from 'react';
import Link from 'next/link';

const Hero: React.FC = () => {
  return (
    <div className="relative bg-cover bg-center py-24" style={{ backgroundImage: "url('/images/mock1.jpg')" }}>
      <div className="absolute inset-0 bg-black opacity-50"></div>
      <div className="w-full px-4 md:px-0 md:w-[64%] mx-auto relative z-10">
        <div className="text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 text-white">Welcome to TechBlog</h1>
          <p className="text-xl mb-8 text-gray-200">Discover the latest in technology, programming, and digital innovation.</p>
          <Link href="/posts" className="bg-blue-500 text-white px-6 py-3 rounded-full font-semibold hover:bg-blue-600 transition duration-300">
            Explore Articles
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Hero;