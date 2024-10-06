import 'server-only';
import path from 'path';
import matter from 'gray-matter';
import { cache } from 'react';
import fs from 'fs/promises';
import { PostData } from './markdown';

let cachedPosts: PostData[] | null = null;
let cachedViews: Record<string, number> | null = null;
let cachedTags: string[] | null = null;
let cachedCategories: string[] | null = null;

const viewsFile = path.join(process.cwd(), 'data', 'views.json');

const getViews = cache(async (): Promise<Record<string, number>> => {
  if (cachedViews) {
    return cachedViews;
  }

  try {
    const data = await fs.readFile(viewsFile, 'utf-8');
    cachedViews = JSON.parse(data);
  } catch (error) {
    console.error('Error reading views file:', error);
    cachedViews = {};
  }

  return cachedViews || {};
});

function generateDefaultMetadata(fileName: string, content: string): Partial<PostData> {
  const title = fileName.replace(/\.md$/, '').replace(/-/g, ' ');
  const date = new Date().toISOString().split('T')[0]; // 格式：YYYY-MM-DD
  return {
    title,
    date,
    tags: ['common'],
    categories: ['Uncategorized'],
    image: '/images/default-og-image.jpg',
    keywords: '',
    description: content.substring(0, 25),
    pinned: false,
  };
}

export const getSortedPostsData = cache(async (): Promise<PostData[]> => {
  if (cachedPosts) {
    return cachedPosts;
  }

  const postsDirectory = path.join(process.cwd(), 'src/content/posts');
  
  try {
    const fileNames = await fs.readdir(postsDirectory);
    console.log('Files in posts directory:', fileNames);
    
    const allPostsData = await Promise.all(fileNames.map(async (fileName) => {
      const slug = fileName.replace(/\s+/g, '-').replace(/\.md$/, '');
      const fullPath = path.join(postsDirectory, fileName);
      
      try {
        const fileContents = await fs.readFile(fullPath, 'utf8');
        const matterResult = matter(fileContents);

        const defaultMetadata = generateDefaultMetadata(fileName, matterResult.content);
        const postData = { ...defaultMetadata, ...matterResult.data } as PostData;
        
        const updatedPostData: PostData = {
          ...postData,
          slug,
          image: postData.image ? (postData.image.startsWith('/images/') ? postData.image : `/images/${postData.image}`) : null,
          content: matterResult.content,
          keywords: postData.keywords || '',
          categories: Array.isArray(postData.categories) ? postData.categories : [postData.categories || 'Uncategorized'],
          tags: Array.isArray(postData.tags) ? postData.tags : [postData.tags || 'common'],
          description: postData.description || matterResult.content.substring(0, 25),
          pinned: postData.pinned || false,
        };
        return updatedPostData;
      } catch (error) {
        console.error(`Error processing file ${fileName}:`, error);
        return null;
      }
    }));

    cachedPosts = allPostsData.filter((post): post is PostData => post !== null).sort((a, b) => (a.date < b.date ? 1 : -1));
    return cachedPosts;
  } catch (error) {
    console.error('Error reading posts directory:', error);
    return [];
  }
});

export const getPostData = cache(async (slug: string): Promise<PostData> => {
  const posts = await getSortedPostsData();
  const post = posts.find(p => p.slug === slug);
  if (!post) {
    throw new Error(`No matching file found for slug: ${slug}`);
  }
  return post;
});

export const getAllTags = cache(async (): Promise<string[]> => {
  if (cachedTags) {
    return cachedTags;
  }
  const posts = await getSortedPostsData();
  const tags = new Set<string>();
  posts.forEach(post => post.tags?.forEach(tag => tags.add(tag)));
  cachedTags = Array.from(tags);
  return cachedTags;
});

export const getAllCategories = cache(async (): Promise<string[]> => {
  if (cachedCategories) {
    return cachedCategories;
  }
  const posts = await getSortedPostsData();
  const categories = new Set<string>();
  posts.forEach(post => post.categories?.forEach(category => categories.add(category)));
  cachedCategories = Array.from(categories);
  return cachedCategories;
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
    post.categories.some(category => category.toLowerCase().includes(lowercaseQuery)) ||
    post.keywords.toLowerCase().includes(lowercaseQuery) ||
    post.description.toLowerCase().includes(lowercaseQuery) ||
    (post.author && post.author.toLowerCase().includes(lowercaseQuery))
  );
});

function calculateSimilarity(post1: PostData, post2: PostData): number {
  const text1 = `${post1.title} ${post1.content} ${post1.tags.join(' ')} ${post1.categories.join(' ')} ${post1.keywords} ${post1.description}`.toLowerCase();
  const text2 = `${post2.title} ${post2.content} ${post2.tags.join(' ')} ${post2.categories.join(' ')} ${post2.keywords} ${post2.description}`.toLowerCase();

  const words1 = text1.split(/\s+/);
  const words2 = text2.split(/\s+/);

  const uniqueWords = new Set([...words1, ...words2]);
  const vector1 = Array.from(uniqueWords).map(word => words1.filter(w => w === word).length);
  const vector2 = Array.from(uniqueWords).map(word => words2.filter(w => w === word).length);

  const dotProduct = vector1.reduce((sum, val, i) => sum + val * vector2[i], 0);
  const magnitude1 = Math.sqrt(vector1.reduce((sum, val) => sum + val * val, 0));
  const magnitude2 = Math.sqrt(vector2.reduce((sum, val) => sum + val * val, 0));

  return dotProduct / (magnitude1 * magnitude2);
}

export const getRelatedPosts = cache(async (currentPost: PostData, limit: number = 3): Promise<PostData[]> => {
  const allPosts = await getSortedPostsData();
  const views = await getViews();
  
  // Filter out the current post
  const otherPosts = allPosts.filter(post => post.slug !== currentPost.slug);
  
  // Calculate relevance score for each post
  const scoredPosts = otherPosts.map(post => {
    let score = 0;
    
    // Check for matching tags
    currentPost.tags.forEach(tag => {
      if (post.tags.includes(tag)) {
        score += 2;
      }
    });
    
    // Check for matching categories
    currentPost.categories.forEach(category => {
      if (post.categories.includes(category)) {
        score += 3;
      }
    });

    // Calculate content similarity
    const similarity = calculateSimilarity(currentPost, post);
    score += similarity * 5;

    // Consider view count
    const viewCount = views[post.slug] || 0;
    score += Math.log(viewCount + 1) * 2; // Using log to prevent very popular posts from dominating
    
    return { post, score };
  });
  
  // Sort posts by score (descending) and then by date (most recent first)
  scoredPosts.sort((a, b) => {
    if (b.score !== a.score) {
      return b.score - a.score;
    }
    return new Date(b.post.date).getTime() - new Date(a.post.date).getTime();
  });
  
  // Return the top 'limit' posts
  return scoredPosts.slice(0, limit).map(item => item.post);
});