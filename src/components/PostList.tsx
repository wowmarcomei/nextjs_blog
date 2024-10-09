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
      { id: 1, title: "Introduction to TypeScript", excerpt: "Learn the basics of TypeScript and how it improves your JavaScript code.", slug: "intro-typescript", category: "programming", imageUrl: "/images/mock5.jpg", date: "2023-05-01" },
      { id: 2, title: "Responsive Web Design Techniques", excerpt: "Explore modern techniques for creating responsive and mobile-friendly websites.", slug: "responsive-design", category: "web-design", imageUrl: "/images/mock6.jpg", date: "2023-05-02" },
      { id: 3, title: "Getting Started with Docker", excerpt: "A beginner's guide to containerization with Docker.", slug: "docker-basics", category: "devops", imageUrl: "/images/mock7.jpg", date: "2023-05-03" },
      { id: 4, title: "Machine Learning Fundamentals", excerpt: "An introduction to key concepts in machine learning and AI.", slug: "ml-fundamentals", category: "ai", imageUrl: "/images/mock8.jpg", date: "2023-05-04" },
      { id: 5, title: "Advanced CSS Techniques", excerpt: "Dive into advanced CSS features and methodologies.", slug: "advanced-css", category: "web-design", imageUrl: "/images/mock9.jpg", date: "2023-05-05" },
      { id: 6, title: "Node.js Best Practices", excerpt: "Learn the best practices for building scalable Node.js applications.", slug: "nodejs-best-practices", category: "programming", imageUrl: "/images/mock10.jpg", date: "2023-05-06" },
    ].filter(post => category === 'all' || post.category === category);

    setPosts(prevPosts => [...prevPosts, ...newPosts]);
    setPage(prevPage => prevPage + 1);
    setLoading(false);
  };

  return (
    <div>
      <ul className="space-y-6">
        {posts.map(post => (
          <li key={post.id} className="bg-white shadow-md overflow-hidden">
            <div className="flex flex-col sm:flex-row">
              <div className="sm:flex-shrink-0">
                <div className="relative w-full sm:w-[296px] h-[200px]">
                  <Image src={post.imageUrl} alt={post.title} layout="fill" objectFit="cover" />
                </div>
              </div>
              <div className="flex flex-col justify-between p-6">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-500">{post.date}</span>
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-semibold rounded">{post.category}</span>
                  </div>
                  <Link href={`/posts/${post.slug}`} className="block text-xl font-semibold text-gray-900 hover:text-blue-600 mb-2">{post.title}</Link>
                  <p className="text-gray-600 mb-4 line-clamp-2">{post.excerpt}</p>
                </div>
                <Link href={`/posts/${post.slug}`} className="text-blue-500 hover:underline font-semibold self-start">
                  Read more
                </Link>
              </div>
            </div>
          </li>
        ))}
      </ul>
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

export default PostList;