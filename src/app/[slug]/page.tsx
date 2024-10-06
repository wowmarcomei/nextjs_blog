import Link from 'next/link';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import rehypeSanitize from 'rehype-sanitize';
import rehypeHighlight from 'rehype-highlight';
import { PostData } from '../../utils/markdown';
import { getPostData, getSortedPostsData, getAllTags, getAllCategories, getRelatedPosts } from '../../utils/serverUtils';
import SocialShareButtons from '../../components/SocialShareButtons';
import RelatedPosts from '../../components/RelatedPosts';
import ViewCounter from '../../components/ViewCounter';
import Sidebar from '../../components/Sidebar';
import { Metadata } from 'next';

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
  const relatedPosts = await getRelatedPosts(post, 9);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 mt-16">
      <div className="flex flex-col lg:flex-row gap-8">
        <article className="w-full lg:w-2/3 bg-white p-6 lg:p-8 rounded-xl shadow-md">
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
          <div className="markdown-body prose lg:prose-lg xl:prose-xl mb-6 lg:mb-8">
            <ReactMarkdown
              rehypePlugins={[rehypeRaw, rehypeSanitize, rehypeHighlight]}
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
          <RelatedPosts posts={relatedPosts} initialLimit={3} />
        </article>
        <div className="w-full lg:w-1/3">
          <div className="sticky top-20">
            <Sidebar allTags={allTags} allCategories={allCategories} />
          </div>
        </div>
      </div>
    </div>
  );
}

export async function generateStaticParams() {
  const posts = await getSortedPostsData();
  return posts.map((post: PostData) => ({
    slug: post.slug,
  }));
}
