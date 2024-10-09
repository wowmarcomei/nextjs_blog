import { getSortedPostsData, getAllCategories, getAllTags } from '@/utils/serverUtils';
import dynamic from 'next/dynamic';

const HomepageClient = dynamic(() => import('@/components/HomepageClient'), { ssr: false });

export default async function Home() {
  console.log("Fetching data...");
  const posts = await getSortedPostsData();
  console.log(`Fetched ${posts.length} posts`);
  const categories = await getAllCategories();
  console.log(`Fetched ${categories.length} categories`);
  const tags = await getAllTags();
  console.log(`Fetched ${tags.length} tags`);

  return (
    <HomepageClient 
      initialPosts={posts} 
      initialCategories={['all', ...categories]} 
      initialTags={['all', ...tags]} 
    />
  );
}
