'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { FaStar, FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import { PostData } from '../utils/markdown';

interface FeaturedPostsProps {
  posts: PostData[];
}

const FeaturedPostCard: React.FC<{ post: PostData; priority: boolean }> = React.memo(({ post, priority }) => (
  <div className="bg-white shadow-md overflow-hidden w-full">
    <div className="flex flex-col h-full p-4 sm:p-6">
      <div className="relative flex-shrink-0 w-full h-0 pb-[56.25%] mb-4">
        <Image 
          src={post.image || '/images/default-post-image.jpg'} 
          alt={`Featured image for ${post.title}`} 
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
          className="object-cover"
          priority={priority}
          quality={85}
          placeholder="blur"
          blurDataURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mN8/+F9PQAI8wNPvd7POQAAAABJRU5ErkJggg=="
        />
      </div>
      <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-semibold rounded self-start mb-2">
        {post.categories[0]}
      </span>
      <Link href={`/${post.slug}`} className="block text-base sm:text-lg md:text-xl font-semibold text-gray-900 hover:text-blue-600 mb-2">
        <h4 className="line-clamp-2">{post.title}</h4>
      </Link>
    </div>
  </div>
));

FeaturedPostCard.displayName = 'FeaturedPostCard';

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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="flex items-center justify-between mb-6 sm:mb-8">
          <h2 className="text-2xl sm:text-3xl font-bold flex items-center">
            Featured Posts
            <span className="ml-2 flex">
              <FaStar className="text-yellow-400" />
              <FaStar className="text-yellow-400" />
              <FaStar className="text-yellow-400" />
            </span>
          </h2>
          <div className="flex space-x-4">
            <button onClick={handlePrev} className="p-2 bg-gray-200 rounded-full hover:bg-gray-300 transition duration-300" aria-label="Previous featured post">
              <FaChevronLeft />
            </button>
            <button onClick={handleNext} className="p-2 bg-gray-200 rounded-full hover:bg-gray-300 transition duration-300" aria-label="Next featured post">
              <FaChevronRight />
            </button>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {postsToShow.map((post, index) => (
            <FeaturedPostCard key={post.slug} post={post} priority={index === 0} />
          ))}
        </div>
      </div>
    </div>
  );
});

FeaturedPosts.displayName = 'FeaturedPosts';

export default FeaturedPosts;
