'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ClockIcon } from '@heroicons/react/20/solid';
import { PostData } from '@/utils/markdown';

interface PostListProps {
  posts: PostData[];
}

const PostItem: React.FC<{ post: PostData; priority: boolean }> = React.memo(({ post, priority }) => (
  <li className="bg-white shadow-md overflow-hidden rounded-lg">
    <div className="flex flex-col sm:flex-row h-auto sm:h-[268px]">
      <div className="sm:flex-shrink-0 p-4 sm:p-8">
        <div className="relative w-full sm:w-[296px] h-[200px]">
          <Image 
            src={post.image || '/images/default-post-image.jpg'} 
            alt={post.title} 
            fill
            className="object-cover"
            priority={priority}
          />
        </div>
      </div>
      <div className="flex flex-col justify-between p-4 sm:p-8 flex-grow">
        <div>
          <span className="inline-block px-2 py-1 bg-blue-100 text-blue-800 text-xs font-semibold rounded mb-2">
            {post.categories[0]}
          </span>
          <Link href={`/${post.slug}`} className="block text-xl font-semibold text-gray-900 hover:text-blue-600 mb-2">{post.title}</Link>
          <div className="flex items-center space-x-4 text-sm text-gray-500 mb-2">
            <span className="flex items-center">
              <ClockIcon className="h-4 w-4 mr-1" />
              {new Date(post.date).toLocaleDateString()}
            </span>
          </div>
          <p className="text-gray-600 mb-4 line-clamp-2">{post.description}</p>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-500">{new Date(post.date).toLocaleDateString()}</span>
          <div className="relative w-8 h-8">
            <Image src="/images/logo.png" alt="Author" fill className="rounded-full object-cover" />
          </div>
        </div>
      </div>
    </div>
  </li>
));

const PostList: React.FC<PostListProps> = React.memo(({ posts }) => {
  const [displayCount, setDisplayCount] = useState(6);
  const loadMoreRef = useRef(null);

  const loadMore = useCallback(() => {
    setDisplayCount(prevCount => Math.min(prevCount + 6, posts.length));
  }, [posts.length]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && displayCount < posts.length) {
          loadMore();
        }
      },
      { threshold: 1.0 }
    );

    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current);
    }

    return () => observer.disconnect();
  }, [displayCount, posts.length, loadMore]);

  return (
    <div>
      <ul className="space-y-6">
        {posts.slice(0, displayCount).map((post, index) => (
          <PostItem key={post.slug} post={post} priority={index < 6} />
        ))}
      </ul>
      {displayCount < posts.length && (
        <div ref={loadMoreRef} className="mt-8 text-center">
          <div className="px-6 py-2 bg-blue-500 text-white rounded-full inline-block">
            Loading more...
          </div>
        </div>
      )}
    </div>
  );
});

export default PostList;