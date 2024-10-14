'use client';

import React, { useState, useMemo, useCallback, Suspense, lazy, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Hero from '@/components/Hero';
import FeaturedPosts from '@/components/FeaturedPosts';
import PostFilter from '@/components/PostFilter';
import { PostData } from '@/utils/markdown';

const PostGrid = lazy(() => import('@/components/PostGrid'));
const PostList = lazy(() => import('@/components/PostList'));

interface HomepageClientProps {
  initialPosts: PostData[];
  initialCategories: string[];
  initialTags: string[];
}

const MemoizedHero = React.memo(Hero);
const MemoizedFeaturedPosts = React.memo(FeaturedPosts);
const MemoizedPostFilter = React.memo(PostFilter);

function ErrorBoundary({ children }: { children: React.ReactNode }) {
  const [hasError] = React.useState(false);

  React.useEffect(() => {
    if (hasError) {
      console.error('Error occurred in HomepageClient');
    }
  }, [hasError]);

  if (hasError) {
    return <h1>Something went wrong. Please try refreshing the page.</h1>;
  }

  return <>{children}</>;
}

export default function HomepageClient({ initialPosts, initialCategories, initialTags }: HomepageClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || 'ALL');
  const [selectedTag, setSelectedTag] = useState(searchParams.get('tag') || 'ALL');
  const [posts] = useState<PostData[]>(initialPosts);
  const [categories] = useState<string[]>(initialCategories.filter(cat => cat.toLowerCase() !== 'all'));
  const [tags] = useState<string[]>(initialTags.filter(tag => tag.toLowerCase() !== 'all'));

  const filteredPosts = useMemo(() => 
    posts.filter(post => 
      (selectedCategory === 'ALL' || post.categories.includes(selectedCategory)) &&
      (selectedTag === 'ALL' || post.tags.includes(selectedTag))
    ),
    [posts, selectedCategory, selectedTag]
  );

  const updateURL = useCallback((params: URLSearchParams) => {
    const newURL = `/?${params.toString()}`;
    router.push(newURL, { scroll: false });
  }, [router]);

  const handleCategoryChange = useCallback((category: string) => {
    setSelectedCategory(category);
    const params = new URLSearchParams(searchParams);
    if (category === 'ALL') {
      params.delete('category');
    } else {
      params.set('category', category);
    }
    updateURL(params);
  }, [searchParams, updateURL]);

  const handleTagChange = useCallback((tag: string) => {
    setSelectedTag(tag);
    const params = new URLSearchParams(searchParams);
    if (tag === 'ALL') {
      params.delete('tag');
    } else {
      params.set('tag', tag);
    }
    updateURL(params);
  }, [searchParams, updateURL]);

  const handleViewModeChange = useCallback((mode: 'grid' | 'list') => {
    setViewMode(mode);
  }, []);

  useEffect(() => {
    const category = searchParams.get('category');
    const tag = searchParams.get('tag');
    if (category) setSelectedCategory(category);
    if (tag) setSelectedTag(tag);
  }, [searchParams]);

  return (
    <ErrorBoundary>
      <MemoizedHero />
      <div className="w-full px-4 md:px-0 md:w-[95%] lg:w-[64%] mx-auto py-12">
        <MemoizedFeaturedPosts posts={posts.slice(0, 3)} />
        <div className="mt-16">
          <h2 className="text-3xl font-bold mb-8 text-center">Latest Articles</h2>
          <div className="mb-8">
            <MemoizedPostFilter 
              categories={categories}
              tags={tags}
              onCategoryChange={handleCategoryChange}
              onTagChange={handleTagChange}
              onViewModeChange={handleViewModeChange}
              currentViewMode={viewMode}
              selectedCategory={selectedCategory}
              selectedTag={selectedTag}
            />
          </div>
          <div className="mt-8">
            <Suspense fallback={<div>Loading posts...</div>}>
              {viewMode === 'grid' ? (
                <PostGrid posts={filteredPosts} />
              ) : (
                <PostList posts={filteredPosts} />
              )}
            </Suspense>
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
}
