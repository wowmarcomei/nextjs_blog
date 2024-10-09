'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ClockIcon } from '@heroicons/react/20/solid';
import { PostData } from '@/utils/markdown';

interface PostGridProps {
  posts: PostData[];
}

const PostGrid: React.FC<PostGridProps> = ({ posts }) => {
  const [displayCount, setDisplayCount] = useState(6);

  const loadMore = () => {
    setDisplayCount(prevCount => prevCount + 6);
  };

  return (
    <div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {posts.slice(0, displayCount).map(post => (
          <div key={post.slug} className="bg-white shadow-md overflow-hidden w-full sm:w-auto sm:max-w-[394px] h-auto sm:h-[551px]">
            <div className="flex flex-col h-full p-8">
              <div className="relative flex-shrink-0 w-full h-[190px] mb-4">
                <Image src={post.image || '/images/default-post-image.jpg'} alt={post.title} layout="fill" objectFit="cover" />
              </div>
              <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-semibold rounded self-start mb-2">{post.categories[0]}</span>
              <Link href={`/${post.slug}`} className="block text-xl font-semibold text-gray-900 hover:text-blue-600 mb-2">{post.title}</Link>
              <div className="flex items-center space-x-4 text-sm text-gray-500 mb-2">
                <span className="flex items-center">
                  <ClockIcon className="h-4 w-4 mr-1" />
                  {/* Assuming we don't have reading time, we'll just show the date */}
                  {new Date(post.date).toLocaleDateString()}
                </span>
              </div>
              <p className="text-gray-600 mb-4 flex-grow line-clamp-3">{post.description}</p>
              <div className="flex justify-between items-center mt-auto">
                <span className="text-sm text-gray-500">{new Date(post.date).toLocaleDateString()}</span>
                <Image src="/images/logo.png" alt="Author" width={32} height={32} className="rounded-full" />
              </div>
            </div>
          </div>
        ))}
      </div>
      {displayCount < posts.length && (
        <div className="mt-8 text-center">
          <button
            onClick={loadMore}
            className="px-6 py-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition duration-300"
          >
            Load More
          </button>
        </div>
      )}
    </div>
  );
};

export default PostGrid;