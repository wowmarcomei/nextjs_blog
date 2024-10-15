import { Suspense } from 'react';
import { getSortedPostsData, getAllCategories, getAllTags } from '../utils/serverUtils';
import HomepageClient from '../components/HomepageClient';
import { PostData } from '../utils/markdown';

export const revalidate = 3600; // 重新验证时间，单位为秒（这里设置为1小时）

export default async function Home() {
  let posts: PostData[] = [];
  let categories: string[] = [];
  let tags: string[] = [];

  try {
    console.log("Fetching data...");
    posts = await getSortedPostsData();
    console.log(`Fetched ${posts.length} posts`);
    categories = await getAllCategories();
    console.log(`Fetched ${categories.length} categories`);
    tags = await getAllTags();
    console.log(`Fetched ${tags.length} tags`);
  } catch (error) {
    console.error("Error fetching data:", error);
    // 这里可以添加错误处理逻辑，比如显示一个错误消息
    return <div>An error occurred while loading the page. Please try again later.</div>;
  }

  if (posts.length === 0) {
    // 如果没有文章，可以显示一个提示信息
    return <div>No posts found. Check back later for new content!</div>;
  }

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <HomepageClient 
        initialPosts={posts} 
        initialCategories={['all', ...categories]} 
        initialTags={['all', ...tags]} 
      />
    </Suspense>
  );
}
