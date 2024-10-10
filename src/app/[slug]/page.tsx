import Link from 'next/link';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import rehypeSanitize from 'rehype-sanitize';
import rehypeHighlight from 'rehype-highlight';
import remarkGfm from 'remark-gfm';
import 'highlight.js/styles/github.css';
import { PostData } from '../../utils/markdown';
import { getPostData, getSortedPostsData, getAllTags, getAllCategories, getRelatedPosts } from '../../utils/serverUtils';
import SocialShareButtons from '../../components/SocialShareButtons';
import RelatedPosts from '../../components/RelatedPosts';
import ViewCounter from '../../components/ViewCounter';
import Sidebar from '../../components/Sidebar';
import dynamic from 'next/dynamic';
import { Metadata } from 'next';
import { Node, Element, Text } from 'hast';
import Script from 'next/script';
import { ReactNode } from 'react';
const ImageWithZoom = dynamic(() => import('../../components/ImageWithZoom'), { ssr: false });

declare module 'remark-gfm';

const TableOfContents = dynamic(() => import('../../components/TableOfContents'), { ssr: false });
const Comments = dynamic(() => import('../../components/Comments'), { ssr: false });

const addIdsToHeadings = () => {
  return (tree: Node) => {
    const visit = (node: Node) => {
      if (
        node.type === 'element' &&
        /^h[1-6]$/.test((node as Element).tagName) &&
        (node as Element).children[0] &&
        (node as Element).children[0].type === 'text'
      ) {
        const textNode = (node as Element).children[0] as Text;
        const title = textNode.value;
        (node as Element).properties = (node as Element).properties || {};
        (node as Element).properties.id = encodeURIComponent(title.toLowerCase().replace(/\s+/g, '-'));
      }
      if ('children' in node && Array.isArray(node.children)) {
        node.children.forEach(visit);
      }
    };
    visit(tree);
  };
};

interface MarkdownComponentProps {
  children: ReactNode;
  className?: string;
  inline?: boolean;
  src?: string;
  alt?: string;
  [key: string]: unknown;
}

const MarkdownComponents: Record<string, React.FC<MarkdownComponentProps>> = {
  table: ({ children }: MarkdownComponentProps) => (
    <div className="overflow-x-auto my-8">
      <table className="min-w-full divide-y divide-gray-200">{children}</table>
    </div>
  ),
  thead: ({ children }: MarkdownComponentProps) => <thead className="bg-gray-50">{children}</thead>,
  th: ({ children }: MarkdownComponentProps) => (
    <th
      scope="col"
      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
    >
      {children}
    </th>
  ),
  td: ({ children }: MarkdownComponentProps) => <td className="px-6 py-4 whitespace-nowrap">{children}</td>,
  tr: ({ children }: MarkdownComponentProps) => <tr className="bg-white even:bg-gray-50">{children}</tr>,
  pre: ({ children }: MarkdownComponentProps) => (
    <pre className="!bg-gray-100 !p-0 !m-0 !rounded-none overflow-x-auto">{children}</pre>
  ),
  code: ({ inline, className, children, ...props }: MarkdownComponentProps) => {
    const match = /language-(\w+)/.exec(className || '');
    return !inline && match ? (
      <code className={`${className} !bg-gray-100 !p-4 block`} {...props}>
        {children}
      </code>
    ) : (
      <code className="!bg-gray-100 !px-1 !py-0.5 !rounded" {...props}>
        {children}
      </code>
    );
  },
  img: ({ src, alt, ...props }: MarkdownComponentProps) => {
    if (typeof src === 'string' && typeof alt === 'string') {
      return <ImageWithZoom src={src} alt={alt} width={800} height={600} />;
    }
    return <img src={src} alt={alt} {...props} />;
  },
};

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const post = await getPostData(params.slug);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  const imageUrl = post.image ? `${siteUrl}${post.image}` : `${siteUrl}/images/default-og-image.jpg`;

  return {
    title: post.title,
    description: post.description,
    keywords: post.keywords,
    openGraph: {
      title: post.title,
      description: post.description,
      url: `${siteUrl}/blog/${post.slug}`,
      siteName: 'Your Blog Name',
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: post.title,
        },
      ],
      locale: 'en_US',
      type: 'article',
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description: post.description,
      images: [imageUrl],
      creator: '@YourTwitterHandle',
      site: '@YourSiteTwitterHandle',
    },
  };
}

export default async function ArticlePage({ params }: { params: { slug: string } }) {
  const post = await getPostData(params.slug);
  const allTags = await getAllTags();
  const allCategories = await getAllCategories();
  const relatedPosts = await getRelatedPosts(post, 4);  // Changed from 9 to 4

  return (
    <>
      <Script id="adjust-scroll">{`
        function adjustScroll() {
          const menuHeight = document.querySelector('header').offsetHeight;
          if (window.location.hash) {
            const id = window.location.hash.substring(1);
            const element = document.getElementById(id);
            if (element) {
              const y = element.getBoundingClientRect().top + window.pageYOffset - menuHeight - 20;
              window.scrollTo({top: y, behavior: 'smooth'});
            }
          }
        }
        window.addEventListener('load', adjustScroll);
        window.addEventListener('hashchange', adjustScroll);
      `}</Script>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex flex-col lg:flex-row gap-8">
          <article className="w-full lg:w-2/3 bg-white p-6 lg:p-8 shadow-md">
          <h1 className="text-3xl lg:text-4xl font-extrabold text-gray-900 mb-4 lg:mb-6">{post.title}</h1>
            <div className="text-gray-600 mb-4 lg:mb-6 text-base lg:text-lg flex justify-between items-center">
              <span>Published on {new Date(post.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
              <ViewCounter slug={post.slug} />
            </div>
            {post.author && (
              <div className="mb-4 lg:mb-6">
                <span className="font-semibold text-gray-700">Author: </span>
                <span className="text-gray-600">{post.author}</span>
              </div>
            )}
            <div className="mb-4 lg:mb-6">
              <span className="font-semibold text-gray-700">Categories: </span>
              {post.categories.map((category: string) => (
                <span key={category} className="bg-indigo-100 text-indigo-800 px-2 py-1 rounded-full text-sm font-medium mr-2">
                  {category}
                </span>
              ))}
            </div>
            <div className="mb-6 lg:mb-8">
              <span className="font-semibold text-gray-700">Tags: </span>
              {post.tags.map((tag: string) => (
                <span key={tag} className="inline-block bg-gray-200 rounded-full px-2 py-1 text-sm font-medium text-gray-700 mr-2 mb-2">
                  {tag}
                </span>
              ))}
            </div>
            <div className="bg-gray-100 p-4 mb-6">
              <TableOfContents content={post.content} />
            </div>
            <div className="markdown-body prose prose-sm sm:prose lg:prose-lg xl:prose-xl max-w-none mb-6 lg:mb-8">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                rehypePlugins={[rehypeRaw, rehypeSanitize, [rehypeHighlight, { ignoreMissing: true }], addIdsToHeadings]}
                components={MarkdownComponents}
              >
                {post.content}
              </ReactMarkdown>
            </div>
            <SocialShareButtons 
              url={`${process.env.NEXT_PUBLIC_SITE_URL}/blog/${post.slug}`} 
              title={post.title}
              tags={post.tags}
            />
            <div className="mt-6 lg:mt-8">
              <Link href="/" className="inline-flex items-center text-indigo-600 hover:text-indigo-800 font-semibold transition-colors duration-300">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
                </svg>
                Back to Home
              </Link>
            </div>
            <RelatedPosts posts={relatedPosts} />
            <div className="mt-8">
              <h2 className="text-2xl font-bold mb-4">Comments</h2>
              <Comments 
                repo={process.env.NEXT_PUBLIC_GISCUS_REPO || ''}
                repoId={process.env.NEXT_PUBLIC_GISCUS_REPO_ID || ''}
                category={process.env.NEXT_PUBLIC_GISCUS_CATEGORY || ''}
                categoryId={process.env.NEXT_PUBLIC_GISCUS_CATEGORY_ID || ''}
              />
            </div>
          </article>
          <div className="w-full lg:w-1/3">
            <div className="sticky top-20">
              <Sidebar allTags={allTags} allCategories={allCategories} />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export async function generateStaticParams() {
  const posts = await getSortedPostsData();
  return posts.map((post: PostData) => ({
    slug: post.slug,
  }));
}