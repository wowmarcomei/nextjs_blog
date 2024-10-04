'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { PostData } from '../utils/markdown';
import Sidebar from './Sidebar';
import LoadingSpinner from './LoadingSpinner';
import ScrollToTopButton from './ScrollToTopButton';
import { useRouter } from 'next/navigation';

interface BlogPostsProps {
  initialPosts: PostData[];
  allTags: string[];
  allCategories: string[];
  searchParams: { [key: string]: string | string[] | undefined };
  searchPosts: (query: string) => Promise<PostData[]>;
}

export default function BlogPosts({ initialPosts, allTags, allCategories, searchParams, searchPosts }: BlogPostsProps) {
  const [posts, setPosts] = useState<PostData[]>(initialPosts);
  const [displayedPosts, setDisplayedPosts] = useState<PostData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const router = useRouter();
  const observerTarget = useRef(null);

  const selectedTag = typeof searchParams.tag === 'string' ? searchParams.tag : null;
  const selectedCategory = typeof searchParams.category === 'string' ? searchParams.category : null;
  const searchQuery = typeof searchParams.search === 'string' ? searchParams.search : '';

  const postsPerPage = 10;

  useEffect(() => {
    async function performSearch() {
      if (searchQuery) {
        setIsLoading(true);
        try {
          const searchResults = await searchPosts(searchQuery);
          setPosts(searchResults);
          setDisplayedPosts(searchResults.slice(0, postsPerPage));
          setPage(1);
        } catch (error) {
          console.error('Error searching posts:', error);
        } finally {
          setIsLoading(false);
        }
      } else {
        setPosts(initialPosts);
        setDisplayedPosts(initialPosts.slice(0, postsPerPage));
        setPage(1);
      }
    }
    performSearch();
  }, [searchQuery, initialPosts, searchPosts]);

  const filteredPosts = posts.filter(post => 
    (!selectedTag || post.tags.includes(selectedTag)) &&
    (!selectedCategory || post.categories.includes(selectedCategory))
  );

  const loadMorePosts = useCallback(async () => {
    if (isLoadingMore) return;
    setIsLoadingMore(true);
    const nextPage = page + 1;
    const startIndex = (nextPage - 1) * postsPerPage;
    const endIndex = startIndex + postsPerPage;
    const newPosts = filteredPosts.slice(startIndex, endIndex);
    
    // Simulate a delay to show loading state (remove in production)
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    setDisplayedPosts(prevPosts => [...prevPosts, ...newPosts]);
    setPage(nextPage);
    setIsLoadingMore(false);
  }, [filteredPosts, isLoadingMore, page, postsPerPage]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && displayedPosts.length < filteredPosts.length) {
          loadMorePosts();
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
  }, [displayedPosts.length, filteredPosts.length, loadMorePosts]);

  const clearSearch = () => {
    router.push('/');
  };

  return (
    <div className="flex flex-col lg:flex-row gap-8">
      <div className="w-full lg:w-2/3">
        {searchQuery && (
          <div className="mb-6">
            <p className="text-base lg:text-lg text-gray-600">
              Search results for: <span className="font-semibold text-indigo-600">{searchQuery}</span>
            </p>
            <p className="text-sm text-gray-500 mt-1">
              Found {filteredPosts.length} {filteredPosts.length === 1 ? 'result' : 'results'}
            </p>
            <button
              onClick={clearSearch}
              className="mt-2 text-sm text-indigo-600 hover:text-indigo-800 transition-colors duration-300"
            >
              Clear search
            </button>
          </div>
        )}
        {selectedTag && (
          <p className="mb-4 text-base lg:text-lg text-gray-600">Filtered by tag: <span className="font-semibold text-indigo-600">{selectedTag}</span></p>
        )}
        {selectedCategory && (
          <p className="mb-4 text-base lg:text-lg text-gray-600">Filtered by category: <span className="font-semibold text-indigo-600">{selectedCategory}</span></p>
        )}
        {isLoading ? (
          <LoadingSpinner />
        ) : (
          <div className="space-y-6 lg:space-y-10">
            {displayedPosts.map((post) => (
              <div key={post.slug} className="bg-white p-4 lg:p-8 rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300 flex flex-col lg:flex-row items-start lg:items-center">
                <div className="w-full lg:w-[200px] h-[150px] mb-4 lg:mb-0 lg:mr-6 flex-shrink-0">
                  {post.image ? (
                    <Image
                      src={post.image}
                      alt={post.title}
                      width={200}
                      height={150}
                      className="rounded-lg object-cover w-full h-full"
                      priority
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-200 rounded-lg flex items-center justify-center">
                      <span className="text-gray-400">No image</span>
                    </div>
                  )}
                </div>
                <div className="flex-grow">
                  <h2 className="text-2xl lg:text-3xl font-bold mb-2 lg:mb-4">
                    <Link href={`/${post.slug}`} className="text-gray-900 hover:text-indigo-600 transition-colors duration-300">
                      {post.title}
                    </Link>
                  </h2>
                  <p className="text-gray-600 mb-4 lg:mb-6 text-base lg:text-lg">{post.description}</p>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {post.tags.map(tag => (
                      <Link key={tag} href={`/?tag=${tag}`} className="text-xs lg:text-sm bg-indigo-100 text-indigo-800 rounded-full px-2 py-1 lg:px-3 lg:py-1 font-medium hover:bg-indigo-200 transition-colors duration-300">
                        {tag}
                      </Link>
                    ))}
                  </div>
                  <div className="flex flex-wrap gap-2 mb-4 lg:mb-6">
                    {post.categories.map(category => (
                      <Link key={category} href={`/?category=${category}`} className="text-xs lg:text-sm bg-green-100 text-green-800 rounded-full px-2 py-1 lg:px-3 lg:py-1 font-medium hover:bg-green-200 transition-colors duration-300">
                        {category}
                      </Link>
                    ))}
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs lg:text-sm text-gray-500">
                      {new Date(post.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                      {post.author && ` | By ${post.author}`}
                    </span>
                    <Link href={`/${post.slug}`} className="text-indigo-600 hover:text-indigo-800 font-semibold flex items-center text-sm lg:text-base">
                      Read more <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 lg:h-5 lg:w-5 ml-1" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        {isLoadingMore && (
          <div className="mt-8 text-center">
            <LoadingSpinner />
          </div>
        )}
        {displayedPosts.length < filteredPosts.length && (
          <div ref={observerTarget} className="h-10 mt-8" />
        )}
      </div>
      <div className="w-full lg:w-1/3">
        <div className="sticky top-4">
          <Sidebar allTags={allTags} allCategories={allCategories} />
        </div>
      </div>
      <ScrollToTopButton />
    </div>
  );
}