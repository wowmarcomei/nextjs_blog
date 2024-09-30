import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

export interface PostData {
  slug: string;
  title: string;
  date: string;
  content: string;
  tags: string[];
  category: string;
  image?: string | null;
}

export type SearchPostsFunction = (query: string) => Promise<PostData[]>;
export type GetSortedPostsDataFunction = () => Promise<PostData[]>;
export type GetAllTagsFunction = () => Promise<string[]>;
export type GetAllCategoriesFunction = () => Promise<string[]>;
export type GetPostsByYearFunction = () => Promise<Record<string, PostData[]>>;

const postsDirectory = path.join(process.cwd(), 'src/content/posts');

export async function getSortedPostsData(): Promise<PostData[]> {
  const fileNames = fs.readdirSync(postsDirectory);
  const allPostsData = fileNames.map((fileName) => {
    const slug = fileName.replace(/\.md$/, '');
    const fullPath = path.join(postsDirectory, fileName);
    const fileContents = fs.readFileSync(fullPath, 'utf8');
    const matterResult = matter(fileContents);

    return {
      slug,
      ...(matterResult.data as { title: string; date: string; tags: string[]; category: string; image?: string }),
      content: matterResult.content,
    };
  });

  return allPostsData.sort((a, b) => (a.date < b.date ? 1 : -1));
}

export async function getPostsByYear(): Promise<Record<string, PostData[]>> {
  const posts = await getSortedPostsData();
  const postsByYear: Record<string, PostData[]> = {};

  posts.forEach((post) => {
    const year = new Date(post.date).getFullYear().toString();
    if (!postsByYear[year]) {
      postsByYear[year] = [];
    }
    postsByYear[year].push(post);
  });

  return postsByYear;
}

export async function getAllTags(): Promise<string[]> {
  const posts = await getSortedPostsData();
  const tagsSet = new Set<string>();

  posts.forEach((post) => {
    post.tags.forEach((tag) => tagsSet.add(tag));
  });

  return Array.from(tagsSet);
}

export async function getAllCategories(): Promise<string[]> {
  const posts = await getSortedPostsData();
  const categoriesSet = new Set<string>();

  posts.forEach((post) => {
    categoriesSet.add(post.category);
  });

  return Array.from(categoriesSet);
}

export async function searchPosts(query: string): Promise<PostData[]> {
  const allPosts = await getSortedPostsData();
  const lowercaseQuery = query.toLowerCase();

  return allPosts.filter((post) => {
    const titleMatch = post.title.toLowerCase().includes(lowercaseQuery);
    const contentMatch = post.content.toLowerCase().includes(lowercaseQuery);
    const tagMatch = post.tags.some((tag) => tag.toLowerCase().includes(lowercaseQuery));
    const categoryMatch = post.category.toLowerCase().includes(lowercaseQuery);

    return titleMatch || contentMatch || tagMatch || categoryMatch;
  });
}
