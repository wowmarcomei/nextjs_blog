'use client';

import { useState } from 'react';
import Header from '@/components/Header';
import Hero from '@/components/Hero';
import FeaturedPosts from '@/components/FeaturedPosts';
import PostFilter from '@/components/PostFilter';
import PostGrid from '@/components/PostGrid';
import PostList from '@/components/PostList';
import Footer from '@/components/Footer';
import { PostData } from '@/utils/markdown';

interface HomepageClientProps {
  initialPosts: PostData[];
  initialCategories: string[];
  initialTags: string[];
}

export default function HomepageClient({ initialPosts, initialCategories, initialTags }: HomepageClientProps) {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedTag, setSelectedTag] = useState('all');
  const [posts, setPosts] = useState<PostData[]>(initialPosts);
  const [categories] = useState<string[]>(initialCategories);
  const [tags] = useState<string[]>(initialTags);

  const filteredPosts = posts.filter(post => 
    (selectedCategory === 'all' || post.categories.includes(selectedCategory)) &&
    (selectedTag === 'all' || post.tags.includes(selectedTag))
  );

  return (
    <div className="flex flex-col min-h-screen bg-gray-100">
      <Header />
      <main className="flex-grow">
        <Hero />
        <div className="w-full px-4 md:px-0 md:w-[80%] lg:w-[64%] mx-auto py-12">
          <FeaturedPosts posts={posts.slice(0, 3)} />
          <div className="mt-16">
            <h2 className="text-3xl font-bold mb-8 text-center">Latest Articles</h2>
            <div className="mb-8">
              <PostFilter 
                categories={categories}
                tags={tags}
                onCategoryChange={setSelectedCategory} 
                onTagChange={setSelectedTag}
                onViewModeChange={setViewMode}
                currentViewMode={viewMode}
              />
            </div>
            <div className="mt-8">
              {viewMode === 'grid' ? (
                <PostGrid posts={filteredPosts} />
              ) : (
                <PostList posts={filteredPosts} />
              )}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}