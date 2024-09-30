import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

export interface PostData {
  slug: string;
  title: string;
  date: string;
  content: string;
  tags: string[];
  categories: string[];
  image?: string | null;
  keywords: string;
  description: string;
  author?: string;
  pinned: boolean;
}

export type SearchPostsFunction = (query: string) => Promise<PostData[]>;
export type GetSortedPostsDataFunction = () => Promise<PostData[]>;
export type GetAllTagsFunction = () => Promise<string[]>;
export type GetAllCategoriesFunction = () => Promise<string[]>;
export type GetPostsByYearFunction = () => Promise<Record<string, PostData[]>>;

const postsDirectory = path.join(process.cwd(), 'src/content/posts');

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

export async function getSortedPostsData(): Promise<PostData[]> {
  const fileNames = fs.readdirSync(postsDirectory);
  const allPostsData = fileNames.map((fileName) => {
    const slug = fileName.replace(/\.md$/, '');
    const fullPath = path.join(postsDirectory, fileName);
    const fileContents = fs.readFileSync(fullPath, 'utf8');
    const matterResult = matter(fileContents);

    const defaultMetadata = generateDefaultMetadata(fileName, matterResult.content);
    const combinedData = {
      ...defaultMetadata,
      ...matterResult.data,
      slug,
      content: matterResult.content,
    };

    // Ensure tags and categories are always non-empty string arrays
    combinedData.tags = (Array.isArray(combinedData.tags) ? combinedData.tags : [combinedData.tags])
      .filter((tag): tag is string => typeof tag === 'string' && tag !== '');
    if (combinedData.tags.length === 0) combinedData.tags = ['common'];

    combinedData.categories = (Array.isArray(combinedData.categories) ? combinedData.categories : [combinedData.categories])
      .filter((category): category is string => typeof category === 'string' && category !== '');
    if (combinedData.categories.length === 0) combinedData.categories = ['Uncategorized'];

    // If description is not provided, use the first 25 characters of the content
    if (!combinedData.description) {
      combinedData.description = matterResult.content.substring(0, 25);
    }

    // Ensure other fields are present
    combinedData.keywords = combinedData.keywords || '';
    combinedData.pinned = combinedData.pinned || false;

    return combinedData as PostData;
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
    post.categories.forEach((category) => categoriesSet.add(category));
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
    const categoryMatch = post.categories.some((category) => category.toLowerCase().includes(lowercaseQuery));
    const keywordsMatch = post.keywords.toLowerCase().includes(lowercaseQuery);
    const descriptionMatch = post.description.toLowerCase().includes(lowercaseQuery);
    const authorMatch = post.author?.toLowerCase().includes(lowercaseQuery);

    return titleMatch || contentMatch || tagMatch || categoryMatch || keywordsMatch || descriptionMatch || authorMatch;
  });
}
