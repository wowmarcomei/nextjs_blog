'use client';

import { useState } from 'react';
import Header from '@/components/Header';
import Hero from '@/components/Hero';
import FeaturedPosts from '@/components/FeaturedPosts';
import PostFilter from '@/components/PostFilter';
import PostGrid from '@/components/PostGrid';
import PostList from '@/components/PostList';
import Footer from '@/components/Footer';

export default function Home() {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedCategory, setSelectedCategory] = useState('all');

  return (
    <div className="flex flex-col min-h-screen bg-gray-100">
      <Header />
      <main className="flex-grow">
        <Hero />
        <div className="w-full px-4 md:px-0 md:w-[80%] lg:w-[64%] mx-auto py-12">
          <FeaturedPosts />
          <div className="mt-16">
            <h2 className="text-3xl font-bold mb-8 text-center">Latest Articles</h2>
            <div className="mb-8">
              <PostFilter 
                onCategoryChange={setSelectedCategory} 
                onViewModeChange={setViewMode}
                currentViewMode={viewMode}
              />
            </div>
            <div className="mt-8">
              {viewMode === 'grid' ? (
                <PostGrid category={selectedCategory} />
              ) : (
                <PostList category={selectedCategory} />
              )}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
