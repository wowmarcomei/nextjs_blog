import { Suspense } from 'react';
import { getSortedPostsData, getAllTags, getAllCategories, searchPosts } from '../utils/serverUtils';
import BlogPosts from '../components/BlogPosts';
import Hero from '../components/Hero';

export const revalidate = 3600; // revalidate every hour

async function getData() {
  const posts = await getSortedPostsData();
  const allTags = await getAllTags();
  const allCategories = await getAllCategories();
  return { posts, allTags, allCategories };
}

async function searchPostsWrapper(query: string) {
  'use server';
  return searchPosts(query);
}

export default async function Home({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined }
}) {
  const { posts, allTags, allCategories } = await getData();

  return (
    <>
      <Hero />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 mt-16">
        <Suspense fallback={<div>Loading...</div>}>
          <BlogPosts 
            initialPosts={posts} 
            allTags={allTags} 
            allCategories={allCategories} 
            searchParams={searchParams} 
            searchPosts={searchPostsWrapper}
          />
        </Suspense>
      </div>
    </>
  );
}
