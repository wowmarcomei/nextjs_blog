import { PostData } from './markdown';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

export async function fetchPosts(): Promise<PostData[]> {
  const res = await fetch(`${API_URL}/posts`, { next: { revalidate: 3600 } });
  if (!res.ok) throw new Error('Failed to fetch posts');
  return res.json();
}

export async function fetchCategories(): Promise<string[]> {
  const res = await fetch(`${API_URL}/categories`, { next: { revalidate: 3600 } });
  if (!res.ok) throw new Error('Failed to fetch categories');
  return res.json();
}

export async function fetchTags(): Promise<string[]> {
  const res = await fetch(`${API_URL}/tags`, { next: { revalidate: 3600 } });
  if (!res.ok) throw new Error('Failed to fetch tags');
  return res.json();
}

export async function fetchPostsByYear(): Promise<Record<string, PostData[]>> {
  const res = await fetch(`${API_URL}/posts-by-year`, { next: { revalidate: 3600 } });
  if (!res.ok) throw new Error('Failed to fetch posts by year');
  return res.json();
}

export async function searchPosts(query: string): Promise<PostData[]> {
  const res = await fetch(`${API_URL}/search?q=${encodeURIComponent(query)}`, { next: { revalidate: 60 } });
  if (!res.ok) throw new Error('Failed to search posts');
  return res.json();
}

export async function fetchRelatedPosts(slug: string, limit: number = 3): Promise<PostData[]> {
  const res = await fetch(`${API_URL}/related-posts?slug=${slug}&limit=${limit}`, { next: { revalidate: 3600 } });
  if (!res.ok) throw new Error('Failed to fetch related posts');
  return res.json();
}