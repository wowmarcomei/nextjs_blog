'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ClockIcon, ChatBubbleLeftIcon } from '@heroicons/react/20/solid';

interface Post {
  id: number;
  title: string;
  excerpt: string;
  slug: string;
  category: string;
  imageUrl: string;
  date: string;
  readTime: string;
  commentCount: number;
}

interface PostListProps {
  category: string;
}

const PostList: React.FC<PostListProps> = ({ category }) => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadPosts();
  }, [category]);

  const loadPosts = async () => {
    setLoading(true);
    // 模拟从API获取文章
    const newPosts = [
      { id: 1, title: "Introduction to TypeScript", excerpt: "Learn the basics of TypeScript and how it improves your JavaScript code.", slug: "intro-typescript", category: "programming", imageUrl: "/images/mock5.jpg", date: "2023-05-01", readTime: "5 min read", commentCount: 10 },
      { id: 2, title: "Responsive Web Design Techniques", excerpt: "Explore modern techniques for creating responsive and mobile-friendly websites.", slug: "responsive-design", category: "web-design", imageUrl: "/images/mock6.jpg", date: "2023-05-02", readTime: "7 min read", commentCount: 15 },
      { id: 3, title: "Getting Started with Docker", excerpt: "A beginner's guide to containerization with Docker.", slug: "docker-basics", category: "devops", imageUrl: "/images/mock7.jpg", date: "2023-05-03", readTime: "6 min read", commentCount: 8 },
      { id: 4, title: "Machine Learning Fundamentals", excerpt: "An introduction to key concepts in machine learning and AI.", slug: "ml-fundamentals", category: "ai", imageUrl: "/images/mock8.jpg", date: "2023-05-04", readTime: "8 min read", commentCount: 12 },
      { id: 5, title: "Advanced CSS Techniques", excerpt: "Dive into advanced CSS features and methodologies.", slug: "advanced-css", category: "web-design", imageUrl: "/images/mock9.jpg", date: "2023-05-05", readTime: "5 min read", commentCount: 7 },
      { id: 6, title: "Node.js Best Practices", excerpt: "Learn the best practices for building scalable Node.js applications.", slug: "nodejs-best-practices", category: "programming", imageUrl: "/images/mock10.jpg", date: "2023-05-06", readTime: "6 min read", commentCount: 9 },
    ].filter(post => category === 'all' || post.category === category);

    setPosts(prevPosts => [...prevPosts, ...newPosts]);
    setPage(prevPage => prevPage + 1);
    setLoading(false);
  };

  return (
    <div>
      <ul className="space-y-6">
        {posts.map(post => (
          <li key={post.id} className="bg-white shadow-md overflow-hidden rounded-lg">
            <div className="flex flex-col sm:flex-row h-auto sm:h-[268px]">
              <div className="sm:flex-shrink-0 p-4 sm:p-8">
                <div className="relative w-full sm:w-[296px] h-[200px]">
                  <Image src={post.imageUrl} alt={post.title} layout="fill" objectFit="cover" />
                </div>
              </div>
              <div className="flex flex-col justify-between p-4 sm:p-8 flex-grow">
                <div>
                  <span className="inline-block px-2 py-1 bg-blue-100 text-blue-800 text-xs font-semibold rounded mb-2">
                    {post.category}
                  </span>
                  <Link href={`/posts/${post.slug}`} className="block text-xl font-semibold text-gray-900 hover:text-blue-600 mb-2">{post.title}</Link>
                  <div className="flex items-center space-x-4 text-sm text-gray-500 mb-2">
                    <span className="flex items-center">
                      <ClockIcon className="h-4 w-4 mr-1" />
                      {post.readTime}
                    </span>
                    <span className="flex items-center">
                      <ChatBubbleLeftIcon className="h-4 w-4 mr-1" />
                      {post.commentCount} comments
                    </span>
                  </div>
                  <p className="text-gray-600 mb-4 line-clamp-2">{post.excerpt}</p>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">{post.date}</span>
                  <Image src="/images/logo.png" alt="Author" width={32} height={32} className="rounded-full" />
                </div>
              </div>
            </div>
          </li>
        ))}
      </ul>
      {!loading && posts.length > 0 && (
        <div className="mt-8 text-center">
          <button
            onClick={loadPosts}
            className="px-6 py-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition duration-300"
          >
            Load More
          </button>
        </div>
      )}
      {loading && <p className="mt-8 text-center">Loading...</p>}
    </div>
  );
};

export default PostList;