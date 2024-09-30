'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { PostData } from '../utils/markdown';
import Sidebar from './Sidebar';

interface BlogPostsProps {
  initialPosts: PostData[];
  allTags: string[];
  allCategories: string[];
  searchParams: { [key: string]: string | string[] | undefined };
  searchPosts: (query: string) => Promise<PostData[]>;
}

export default function BlogPosts({ initialPosts, allTags, allCategories, searchParams, searchPosts }: BlogPostsProps) {
  const [posts, setPosts] = useState<PostData[]>(initialPosts);

  const selectedTag = typeof searchParams.tag === 'string' ? searchParams.tag : null;
  const selectedCategory = typeof searchParams.category === 'string' ? searchParams.category : null;
  const page = typeof searchParams.page === 'string' ? parseInt(searchParams.page, 10) : 1;
  const searchQuery = typeof searchParams.search === 'string' ? searchParams.search : '';

  useEffect(() => {
    async function performSearch() {
      if (searchQuery) {
        const searchResults = await searchPosts(searchQuery);
        setPosts(searchResults);
      } else {
        setPosts(initialPosts);
      }
    }
    performSearch();
  }, [searchQuery, initialPosts, searchPosts]);

  const filteredPosts = posts.filter(post => 
    (!selectedTag || post.tags.includes(selectedTag)) &&
    (!selectedCategory || post.category === selectedCategory)
  );

  const postsPerPage = 10;
  const totalPages = Math.ceil(filteredPosts.length / postsPerPage);
  const paginatedPosts = filteredPosts.slice((page - 1) * postsPerPage, page * postsPerPage);

  return (
    <div className="flex flex-col lg:flex-row gap-12">
      <div className="w-full lg:w-2/3">
        {selectedTag && (
          <p className="mb-6 text-lg text-gray-600">Filtered by tag: <span className="font-semibold text-indigo-600">{selectedTag}</span></p>
        )}
        {selectedCategory && (
          <p className="mb-6 text-lg text-gray-600">Filtered by category: <span className="font-semibold text-indigo-600">{selectedCategory}</span></p>
        )}
        <div className="space-y-10">
          {paginatedPosts.map((post) => (
            <div key={post.slug} className="bg-white p-8 rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300 flex items-center">
              <div className="flex-shrink-0 mr-6 flex items-center">
                {post.image ? (
                  <Image
                    src={post.image}
                    alt={post.title}
                    width={200}
                    height={150}
                    className="rounded-lg object-cover"
                    priority
                  />
                ) : (
                  <div className="w-[200px] h-[150px] bg-gray-200 rounded-lg flex items-center justify-center">
                    <span className="text-gray-400">No image</span>
                  </div>
                )}
              </div>
              <div className="flex-grow">
                <h2 className="text-3xl font-bold mb-4">
                  <Link href={`/${post.slug}`} className="text-gray-900 hover:text-indigo-600 transition-colors duration-300">
                    {post.title}
                  </Link>
                </h2>
                <p className="text-gray-600 mb-6 text-lg">{post.content.substring(0, 150)}...</p>
                <div className="flex flex-wrap gap-2 mb-6">
                  {post.tags.map(tag => (
                    <Link key={tag} href={`/?tag=${tag}`} className="text-sm bg-indigo-100 text-indigo-800 rounded-full px-3 py-1 font-medium hover:bg-indigo-200 transition-colors duration-300">
                      {tag}
                    </Link>
                  ))}
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">
                    {new Date(post.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })} | {post.category}
                  </span>
                  <Link href={`/${post.slug}`} className="text-indigo-600 hover:text-indigo-800 font-semibold flex items-center">
                    Read more <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-1" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
        {totalPages > 1 && (
          <div className="mt-10 flex justify-center">
            <nav className="inline-flex rounded-md shadow">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                <Link
                  key={pageNum}
                  href={{
                    pathname: '/',
                    query: {
                      ...(selectedTag && { tag: selectedTag }),
                      ...(selectedCategory && { category: selectedCategory }),
                      ...(searchQuery && { search: searchQuery }),
                      page: pageNum,
                    },
                  }}
                  className={`px-4 py-2 border ${
                    pageNum === page
                      ? 'bg-indigo-600 text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-50'
                  } ${pageNum === 1 ? 'rounded-l-md' : ''} ${
                    pageNum === totalPages ? 'rounded-r-md' : ''
                  }`}
                >
                  {pageNum}
                </Link>
              ))}
            </nav>
          </div>
        )}
      </div>
      <Sidebar allTags={allTags} allCategories={allCategories} />
    </div>
  );
}