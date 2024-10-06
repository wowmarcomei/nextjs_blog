import { Suspense } from 'react';
import dynamic from 'next/dynamic';
import { getSortedPostsData, getAllTags, getAllCategories, searchPosts } from '../utils/serverUtils';
import Hero from '../components/Hero';
import LoadingSpinner from '../components/LoadingSpinner';

const BlogPosts = dynamic(() => import('../components/BlogPosts'), {
  loading: () => <LoadingSpinner />,
});

export const revalidate = 3600; // revalidate every hour

async function getPosts() {
  const posts = await getSortedPostsData();
  return { posts, total: posts.length };
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
  const page = typeof searchParams.page === 'string' ? parseInt(searchParams.page) : 1;
  const { posts, total } = await getPosts();
  const allTags = await getAllTags();
  const allCategories = await getAllCategories();

  console.log(`Home page rendered with ${posts.length} posts, total: ${total}`);

  return (
    <>
      <Hero />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 mt-16">
        <Suspense fallback={<LoadingSpinner />}>
          <BlogPosts 
            initialPosts={posts} 
            totalPosts={total}
            currentPage={page}
            searchParams={searchParams} 
            searchPosts={searchPostsWrapper}
            allTags={allTags}
            allCategories={allCategories}
          />
        </Suspense>
      </div>
    </>
  );
}
