'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { FaStar, FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import { PostData } from '@/utils/markdown';

interface FeaturedPostsProps {
  posts: PostData[];
}

const FeaturedPostCard: React.FC<{ post: PostData; priority: boolean }> = React.memo(({ post, priority }) => (
  <div className="bg-white shadow-md overflow-hidden w-full sm:w-auto sm:max-w-[394px]">
    <div className="flex flex-col h-full p-8">
      <div className="relative flex-shrink-0 w-full h-[190px] mb-4">
        <Image 
          src={post.image || '/images/default-post-image.jpg'} 
          alt={post.title} 
          layout="fill" 
          objectFit="cover" 
          priority={priority}
        />
      </div>
      <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-semibold rounded self-start mb-2">
        {post.categories[0]}
      </span>
      <Link href={`/${post.slug}`} className="block text-xl font-semibold text-gray-900 hover:text-blue-600 mb-2">
        <h3 className="line-clamp-2">{post.title}</h3>
      </Link>
    </div>
  </div>
));

const FeaturedPosts: React.FC<FeaturedPostsProps> = React.memo(({ posts }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % posts.length);
    }, 5000);

    return () => clearInterval(timer);
  }, [posts.length]);

  const handlePrev = useCallback(() => {
    setCurrentIndex((prevIndex) => (prevIndex - 1 + posts.length) % posts.length);
  }, [posts.length]);

  const handleNext = useCallback(() => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % posts.length);
  }, [posts.length]);

  const postsToShow = useMemo(() => {
    if (posts.length === 0) return [];
    const result = [];
    for (let i = 0; i < 3; i++) {
      const index = (currentIndex + i) % posts.length;
      result.push(posts[index]);
    }
    return result;
  }, [posts, currentIndex]);

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
          {postsToShow.map((post, index) => (
            <FeaturedPostCard key={post.slug} post={post} priority={index === 0} />
          ))}
        </div>
      </div>
    </div>
  );
});

export default FeaturedPosts;
