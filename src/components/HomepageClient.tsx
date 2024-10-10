'use client';

import React, { useState, useMemo, useCallback, Suspense, lazy } from 'react';
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
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedTag, setSelectedTag] = useState('all');
  const [posts] = useState<PostData[]>(initialPosts);
  const [categories] = useState<string[]>(initialCategories);
  const [tags] = useState<string[]>(initialTags);

  const filteredPosts = useMemo(() => 
    posts.filter(post => 
      (selectedCategory === 'all' || post.categories.includes(selectedCategory)) &&
      (selectedTag === 'all' || post.tags.includes(selectedTag))
    ),
    [posts, selectedCategory, selectedTag]
  );

  const handleCategoryChange = useCallback((category: string) => {
    setSelectedCategory(category);
  }, []);

  const handleTagChange = useCallback((tag: string) => {
    setSelectedTag(tag);
  }, []);

  const handleViewModeChange = useCallback((mode: 'grid' | 'list') => {
    setViewMode(mode);
  }, []);

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
