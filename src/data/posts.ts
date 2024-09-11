export interface Post {
  id: number;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  date: string;
}

export const posts: Post[] = [
  {
    id: 1,
    title: "Getting Started with Next.js",
    slug: "getting-started-with-nextjs",
    excerpt: "Learn the basics of Next.js and how to create your first app.",
    content: "This is the full content of the 'Getting Started with Next.js' post...",
    date: "2024-03-15",
  },
  {
    id: 2,
    title: "Mastering Tailwind CSS",
    slug: "mastering-tailwind-css",
    excerpt: "Discover the power of Tailwind CSS and how to use it effectively in your projects.",
    content: "This is the full content of the 'Mastering Tailwind CSS' post...",
    date: "2024-03-18",
  },
  {
    id: 3,
    title: "Server-Side Rendering in Next.js",
    slug: "server-side-rendering-in-nextjs",
    excerpt: "Explore the benefits of server-side rendering and how to implement it in Next.js.",
    content: "This is the full content of the 'Server-Side Rendering in Next.js' post...",
    date: "2024-03-21",
  },
];