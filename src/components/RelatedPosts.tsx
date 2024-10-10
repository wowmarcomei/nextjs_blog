'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ClockIcon } from '@heroicons/react/20/solid';
import { PostData } from '../utils/markdown';

interface RelatedPostsProps {
  posts: PostData[];
}

const RelatedPosts: React.FC<RelatedPostsProps> = ({ posts }) => {
  // 只取前4篇文章
  const relatedPosts = posts.slice(0, 4);

  return (
    <div className="mt-8 lg:mt-12">
      <h2 className="text-xl lg:text-2xl font-bold mb-4 lg:mb-6">Related Posts</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {relatedPosts.map((post, index) => (
          <div key={post.slug} className="bg-white shadow-md overflow-hidden w-full sm:w-auto sm:max-w-[394px] h-auto sm:h-[551px]">
            <div className="flex flex-col h-full p-8">
              <div className="relative flex-shrink-0 w-full h-[190px] mb-4">
                <Image 
                  src={post.image || '/images/default-post-image.jpg'} 
                  alt={`Featured image for ${post.title}`} 
                  fill
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  className="object-cover"
                  priority={index < 2}
                  quality={85}
                  placeholder="blur"
                  blurDataURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mN8/+F9PQAI8wNPvd7POQAAAABJRU5ErkJggg=="
                />
              </div>
              <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-semibold rounded self-start mb-2">{post.categories[0]}</span>
              <Link href={`/${post.slug}`} className="block text-xl font-semibold text-gray-900 hover:text-blue-600 mb-2">{post.title}</Link>
              <div className="flex items-center space-x-4 text-sm text-gray-500 mb-2">
                <span className="flex items-center">
                  <ClockIcon className="h-4 w-4 mr-1" />
                  {new Date(post.date).toLocaleDateString()}
                </span>
              </div>
              <p className="text-gray-600 mb-4 flex-grow line-clamp-3">{post.description}</p>
              <div className="flex justify-between items-center mt-auto">
                <span className="text-sm text-gray-500">{new Date(post.date).toLocaleDateString()}</span>
                <div className="relative w-8 h-8">
                  <Image 
                    src="/images/logo.png" 
                    alt="Author avatar" 
                    fill 
                    className="rounded-full object-cover"
                    sizes="32px"
                    quality={85}
                  />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RelatedPosts;
