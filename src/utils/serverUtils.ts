import 'server-only';
import path from 'path';
import matter from 'gray-matter';
import { cache } from 'react';
import fs from 'fs/promises';
import { PostData } from './markdown';

let cachedPosts: PostData[] | null = null;

export const getSortedPostsData = cache(async (): Promise<PostData[]> => {
  if (cachedPosts) {
    return cachedPosts;
  }

  const postsDirectory = path.join(process.cwd(), 'src/content/posts');
  const fileNames = await fs.readdir(postsDirectory);
  
  const allPostsData = await Promise.all(fileNames.map(async (fileName) => {
    const slug = fileName.replace(/\s+/g, '-').replace(/\.md$/, '');
    const fullPath = path.join(postsDirectory, fileName);
    const fileContents = await fs.readFile(fullPath, 'utf8');
    const matterResult = matter(fileContents);

    const postData = matterResult.data as { title: string; date: string; tags: string[]; category: string; image?: string };
    
    const updatedPostData: PostData = {
      slug,
      ...postData,
      image: postData.image ? (postData.image.startsWith('/images/') ? postData.image : `/images/${postData.image}`) : null,
      content: matterResult.content,
    };
    return updatedPostData;
  }));

  cachedPosts = allPostsData.sort((a, b) => (a.date < b.date ? 1 : -1));
  return cachedPosts;
});

export const getPostData = cache(async (slug: string): Promise<PostData> => {
  const postsDirectory = path.join(process.cwd(), 'src/content/posts');
  
  const files = await fs.readdir(postsDirectory);
  
  const matchingFile = files.find(file => file.replace(/\s+/g, '-').replace(/\.md$/, '') === slug);
  
  if (!matchingFile) {
    throw new Error(`No matching file found for slug: ${slug}`);
  }
  
  const fullPath = path.join(postsDirectory, matchingFile);
  const fileContents = await fs.readFile(fullPath, 'utf8');
  const matterResult = matter(fileContents);

  const postData = matterResult.data as { title: string; date: string; tags: string[]; category: string; image?: string };
  
  const updatedPostData: PostData = {
    slug,
    ...postData,
    image: postData.image ? (postData.image.startsWith('/images/') ? postData.image : `/images/${postData.image}`) : null,
    content: matterResult.content,
  };

  return updatedPostData;
});

export const getAllTags = cache(async (): Promise<string[]> => {
  const posts = await getSortedPostsData();
  const tags = new Set<string>();
  posts.forEach(post => post.tags?.forEach(tag => tags.add(tag)));
  return Array.from(tags);
});

export const getAllCategories = cache(async (): Promise<string[]> => {
  const posts = await getSortedPostsData();
  const categories = new Set<string>();
  posts.forEach(post => post.category && categories.add(post.category));
  return Array.from(categories);
});

export const getPostsByYear = cache(async (): Promise<Record<string, PostData[]>> => {
  const posts = await getSortedPostsData();
  const postsByYear: Record<string, PostData[]> = {};

  posts.forEach(post => {
    const year = new Date(post.date).getFullYear().toString();
    if (!postsByYear[year]) {
      postsByYear[year] = [];
    }
    postsByYear[year].push(post);
  });

  Object.values(postsByYear).forEach(yearPosts => {
    yearPosts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  });

  return postsByYear;
});

export const searchPosts = cache(async (query: string): Promise<PostData[]> => {
  const posts = await getSortedPostsData();
  const lowercaseQuery = query.toLowerCase();

  return posts.filter(post => 
    post.title.toLowerCase().includes(lowercaseQuery) ||
    post.content.toLowerCase().includes(lowercaseQuery) ||
    post.tags.some(tag => tag.toLowerCase().includes(lowercaseQuery)) ||
    post.category.toLowerCase().includes(lowercaseQuery)
  );
});