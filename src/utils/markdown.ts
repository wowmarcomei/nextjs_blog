import path from 'path';
import matter from 'gray-matter';

export interface PostData {
  slug: string;
  title: string;
  date: string;
  content: string;
  tags: string[];
  category: string;
  image: string;
}

let cachedPosts: PostData[] | null = null;

export async function getSortedPostsData(): Promise<PostData[]> {
  if (cachedPosts) {
    return cachedPosts;
  }

  const postsDirectory = path.join(process.cwd(), 'src/content/posts');
  const fs = await import('fs');
  const fileNames = fs.readdirSync(postsDirectory);
  
  const allPostsData = await Promise.all(fileNames.map(async (fileName) => {
    const slug = fileName.replace(/\.md$/, '');
    const fullPath = path.join(postsDirectory, fileName);
    const fileContents = fs.readFileSync(fullPath, 'utf8');
    const matterResult = matter(fileContents);

    const postData = matterResult.data as { title: string; date: string; tags: string[]; category: string; image: string };
    
    // Update the image path to use the correct directory
    const updatedPostData = {
      ...postData,
      image: postData.image ? `/images/${postData.image}` : null,
    };
    return {
      slug,
      ...updatedPostData,
      content: matterResult.content,
    };
  }));

  cachedPosts = allPostsData.sort((a, b) => (a.date < b.date ? 1 : -1));
  return cachedPosts;
}

export async function getPostData(slug: string): Promise<PostData> {
  const postsDirectory = path.join(process.cwd(), 'src/content/posts');
  const fullPath = path.join(postsDirectory, `${slug}.md`);
  const fs = await import('fs');
  const fileContents = fs.readFileSync(fullPath, 'utf8');
  const matterResult = matter(fileContents);

  return {
    slug,
    content: matterResult.content,
    ...(matterResult.data as { title: string; date: string; tags: string[]; category: string }),
  };
}

export async function getAllTags(): Promise<string[]> {
  const posts = await getSortedPostsData();
  const tags = new Set<string>();
  posts.forEach(post => post.tags?.forEach(tag => tags.add(tag)));
  return Array.from(tags);
}

export async function getAllCategories(): Promise<string[]> {
  const posts = await getSortedPostsData();
  const categories = new Set<string>();
  posts.forEach(post => post.category && categories.add(post.category));
  return Array.from(categories);
}
