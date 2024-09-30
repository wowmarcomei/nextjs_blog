export interface PostData {
  slug: string;
  title: string;
  date: string;
  content: string;
  tags: string[];
  category: string;
  image?: string | null;
}

// This function is now just a type definition, not an actual implementation
export type SearchPostsFunction = (query: string) => Promise<PostData[]>;

// These are just type definitions for the server functions
export type GetSortedPostsDataFunction = () => Promise<PostData[]>;
export type GetAllTagsFunction = () => Promise<string[]>;
export type GetAllCategoriesFunction = () => Promise<string[]>;
export type GetPostsByYearFunction = () => Promise<Record<string, PostData[]>>;
