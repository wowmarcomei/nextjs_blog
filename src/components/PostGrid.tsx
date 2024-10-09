'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { FaComment } from 'react-icons/fa';

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

interface PostGridProps {
  category: string;
}

const PostGrid: React.FC<PostGridProps> = ({ category }) => {
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
      { id: 1, title: "Introduction to TypeScript", excerpt: "Learn the basics of TypeScript and how it improves your JavaScript code.", slug: "intro-typescript", category: "Programming", imageUrl: "/images/mock5.jpg", date: "2023-05-01", readTime: "2 min read", commentCount: 5 },
      { id: 2, title: "Responsive Web Design Techniques", excerpt: "Explore modern techniques for creating responsive and mobile-friendly websites.", slug: "responsive-design", category: "Web Design", imageUrl: "/images/mock6.jpg", date: "2023-05-02", readTime: "3 min read", commentCount: 8 },
      { id: 3, title: "Getting Started with Docker", excerpt: "A beginner's guide to containerization with Docker.", slug: "docker-basics", category: "DevOps", imageUrl: "/images/mock7.jpg", date: "2023-05-03", readTime: "4 min read", commentCount: 3 },
      { id: 4, title: "Machine Learning Fundamentals", excerpt: "An introduction to key concepts in machine learning and AI.", slug: "ml-fundamentals", category: "AI", imageUrl: "/images/mock8.jpg", date: "2023-05-04", readTime: "5 min read", commentCount: 10 },
      { id: 5, title: "Advanced CSS Techniques", excerpt: "Dive into advanced CSS features and methodologies.", slug: "advanced-css", category: "Web Design", imageUrl: "/images/mock9.jpg", date: "2023-05-05", readTime: "3 min read", commentCount: 6 },
      { id: 6, title: "Node.js Best Practices", excerpt: "Learn the best practices for building scalable Node.js applications.", slug: "nodejs-best-practices", category: "Programming", imageUrl: "/images/mock10.jpg", date: "2023-05-06", readTime: "4 min read", commentCount: 7 },
    ].filter(post => category === 'all' || post.category.toLowerCase() === category.toLowerCase());

    setPosts(prevPosts => [...prevPosts, ...newPosts]);
    setPage(prevPage => prevPage + 1);
    setLoading(false);
  };

  return (
    <div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {posts.map(post => (
          <div key={post.id} className="bg-white shadow-md overflow-hidden w-full sm:w-auto sm:max-w-[394px] h-auto sm:h-[551px]">
            <div className="flex flex-col h-full p-8">
              <div className="relative flex-shrink-0 w-full h-[190px] mb-4">
                <Image src={post.imageUrl} alt={post.title} layout="fill" objectFit="cover" />
              </div>
              <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-semibold rounded self-start mb-2">{post.category}</span>
              <Link href={`/posts/${post.slug}`} className="block text-xl font-semibold text-gray-900 hover:text-blue-600 mb-2">{post.title}</Link>
              <div className="flex items-center space-x-2 mb-2">
                <span className="text-sm text-gray-500">{post.readTime}</span>
                <span className="text-sm text-gray-500">•</span>
                <div className="flex items-center text-sm text-gray-500">
                  <FaComment className="mr-1" />
                  <span>{post.commentCount}</span>
                </div>
              </div>
              <p className="text-gray-600 mb-4 flex-grow line-clamp-3">{post.excerpt}</p>
              <div className="flex justify-between items-center mt-auto">
                <span className="text-sm text-gray-500">{post.date}</span>
                <Image src="/images/logo.png" alt="Author" width={32} height={32} className="rounded-full" />
              </div>
            </div>
          </div>
        ))}
      </div>
      {!loading && (
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

export default PostGrid;