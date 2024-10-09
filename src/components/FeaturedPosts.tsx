'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { FaStar, FaChevronLeft, FaChevronRight } from 'react-icons/fa';

interface Post {
  id: number;
  title: string;
  slug: string;
  category: string;
  imageUrl: string;
}

const FeaturedPosts: React.FC = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    // 模拟数据
    setPosts([
      { id: 1, title: "The Future of AI in Web Development", slug: "ai-in-web-dev", category: "AI", imageUrl: "/images/mock2.jpg" },
      { id: 2, title: "Mastering React Hooks", slug: "mastering-react-hooks", category: "React", imageUrl: "/images/mock3.jpg" },
      { id: 3, title: "The Rise of Serverless Architecture", slug: "serverless-architecture", category: "Cloud", imageUrl: "/images/mock4.jpg" },
      { id: 4, title: "Advanced TypeScript Techniques", slug: "advanced-typescript", category: "TypeScript", imageUrl: "/images/mock5.jpg" },
      { id: 5, title: "Building Scalable Microservices", slug: "scalable-microservices", category: "Architecture", imageUrl: "/images/mock6.jpg" },
    ]);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % posts.length);
    }, 5000);

    return () => clearInterval(timer);
  }, [posts.length]);

  const handlePrev = () => {
    setCurrentIndex((prevIndex) => (prevIndex - 1 + posts.length) % posts.length);
  };

  const handleNext = () => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % posts.length);
  };

  const getPostsToShow = (): Post[] => {
    if (posts.length === 0) return [];
    const postsToShow = [];
    for (let i = 0; i < 3; i++) {
      const index = (currentIndex + i) % posts.length;
      postsToShow.push(posts[index]);
    }
    return postsToShow;
  };

  return (
    <div className="w-full bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-3xl font-bold flex items-center">
            Featured Posts
            <span className="ml-2 flex">
              <FaStar className="text-yellow-400" />
              <FaStar className="text-yellow-400" />
              <FaStar className="text-yellow-400" />
            </span>
          </h2>
          <div className="flex space-x-4">
            <button onClick={handlePrev} className="p-2 bg-gray-200 rounded-full hover:bg-gray-300 transition duration-300">
              <FaChevronLeft />
            </button>
            <button onClick={handleNext} className="p-2 bg-gray-200 rounded-full hover:bg-gray-300 transition duration-300">
              <FaChevronRight />
            </button>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {getPostsToShow().map((post) => (
            <div key={post.id} className="bg-white shadow-md overflow-hidden w-full sm:w-auto sm:max-w-[394px]">
              <div className="flex flex-col h-full p-8">
                <div className="relative flex-shrink-0 w-full h-[190px] mb-4">
                  <Image src={post.imageUrl} alt={post.title} layout="fill" objectFit="cover" />
                </div>
                <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-semibold rounded self-start mb-2">{post.category}</span>
                <Link href={`/posts/${post.slug}`} className="block text-xl font-semibold text-gray-900 hover:text-blue-600 mb-2">
                  <h3 className="line-clamp-2">{post.title}</h3>
                </Link>
                {/* 如果需要，这里可以添加更多内容 */}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default FeaturedPosts;
