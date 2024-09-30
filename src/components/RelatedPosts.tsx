'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { PostData } from '../utils/markdown';

interface RelatedPostsProps {
  posts: PostData[];
  initialLimit?: number;
}

const RelatedPosts: React.FC<RelatedPostsProps> = ({ posts, initialLimit = 3 }) => {
  const [limit, setLimit] = useState(initialLimit);
  const [loading, setLoading] = useState(false);
  const observerTarget = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !loading && limit < posts.length) {
          setLoading(true);
          setTimeout(() => {
            setLimit(prevLimit => Math.min(prevLimit + 3, posts.length));
            setLoading(false);
          }, 1000); // Simulate loading delay
        }
      },
      { threshold: 1.0 }
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => {
      if (observerTarget.current) {
        observer.unobserve(observerTarget.current);
      }
    };
  }, [limit, loading, posts.length]);

  return (
    <div className="mt-12">
      <h2 className="text-2xl font-bold mb-6">Related Posts</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {posts.slice(0, limit).map((post, index) => (
          <div key={post.slug} className="bg-white rounded-lg shadow-md overflow-hidden">
            {post.image && (
              <Image
                src={post.image}
                alt={post.title}
                width={400}
                height={200}
                className="w-full h-48 object-cover"
              />
            )}
            <div className="p-4">
              <h3 className="text-xl font-semibold mb-2">
                <Link href={`/${post.slug}`} className="text-gray-900 hover:text-indigo-600 transition-colors duration-300">
                  {post.title}
                </Link>
              </h3>
              <p className="text-gray-600 text-sm mb-4">
                {new Date(post.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
              <div className="flex flex-wrap gap-2">
                {post.tags.slice(0, 3).map((tag) => (
                  <span key={tag} className="bg-gray-200 text-gray-700 px-2 py-1 rounded-full text-xs">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
            {index === limit - 1 && <div ref={observerTarget} />}
          </div>
        ))}
      </div>
      {loading && (
        <div className="mt-6 text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-600"></div>
        </div>
      )}
    </div>
  );
};

export default RelatedPosts;