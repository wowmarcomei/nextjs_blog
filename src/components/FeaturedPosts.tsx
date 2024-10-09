'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';

interface Post {
  id: number;
  title: string;
  excerpt: string;
  slug: string;
  category: string;
  imageUrl: string;
  date: string;
}

const FeaturedPosts: React.FC = () => {
  const [posts, setPosts] = useState<Post[]>([]);

  useEffect(() => {
    // 模拟数据
    setPosts([
      { id: 1, title: "The Future of AI in Web Development", excerpt: "Explore how artificial intelligence is reshaping the landscape of web development.", slug: "ai-in-web-dev", category: "AI", imageUrl: "/images/mock2.jpg", date: "2023-05-15" },
      { id: 2, title: "Mastering React Hooks", excerpt: "Dive deep into React Hooks and learn how to build more efficient components.", slug: "mastering-react-hooks", category: "React", imageUrl: "/images/mock3.jpg", date: "2023-05-10" },
      { id: 3, title: "The Rise of Serverless Architecture", excerpt: "Discover the benefits and challenges of serverless architecture in modern applications.", slug: "serverless-architecture", category: "Cloud", imageUrl: "/images/mock4.jpg", date: "2023-05-05" },
    ]);
  }, []);

  return (
    <div className="bg-gray-100 py-16">
      <div className="w-full px-4">
        <h2 className="text-3xl font-bold mb-8 text-center">Featured Posts</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {posts.map((post) => (
            <div key={post.id} className="bg-white shadow-md overflow-hidden w-full sm:w-auto sm:max-w-[394px] h-auto sm:h-[551px]">
              <div className="p-8 flex flex-col h-full">
                <div className="relative flex-shrink-0 w-full h-[190px]">
                  <Image src={post.imageUrl} alt={post.title} layout="fill" objectFit="cover" />
                </div>
                <div className="flex flex-col flex-grow mt-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-500">{post.date}</span>
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-semibold rounded">{post.category}</span>
                  </div>
                  <Link href={`/posts/${post.slug}`} className="block text-xl font-semibold text-gray-900 hover:text-blue-600 mb-2">{post.title}</Link>
                  <p className="text-gray-600 mb-4 flex-grow line-clamp-3">{post.excerpt}</p>
                  <Link href={`/posts/${post.slug}`} className="text-blue-500 hover:underline font-semibold self-start mt-auto">
                    Read more
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default FeaturedPosts;