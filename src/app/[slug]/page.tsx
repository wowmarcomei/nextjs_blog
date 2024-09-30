import Link from 'next/link';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import rehypeSanitize from 'rehype-sanitize';
import rehypeHighlight from 'rehype-highlight';
import { PostData } from '../../utils/markdown';
import { getPostData, getSortedPostsData, getAllTags, getAllCategories, getRelatedPosts } from '../../utils/serverUtils';
import SocialShareButtons from '../../components/SocialShareButtons';
import SearchBar from '../../components/SearchBar';
import RelatedPosts from '../../components/RelatedPosts';
import ViewCounter from '../../components/ViewCounter';
import { Metadata } from 'next';

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const post = await getPostData(params.slug);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  const imageUrl = post.image ? `${siteUrl}${post.image}` : `${siteUrl}/default-og-image.jpg`;

  return {
    title: post.title,
    description: post.content.substring(0, 200),
    openGraph: {
      title: post.title,
      description: post.content.substring(0, 200),
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
      publishedTime: post.date,
      authors: ['Your Name'],
      tags: post.tags,
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description: post.content.substring(0, 200),
      images: [imageUrl],
      creator: '@YourTwitterHandle',
      site: '@YourSiteTwitterHandle',
    },
    other: {
      'twitter:label1': 'Written by',
      'twitter:data1': 'Your Name',
      'twitter:label2': 'Category',
      'twitter:data2': post.category,
    }
  };
}

export default async function ArticlePage({ params }: { params: { slug: string } }) {
  const post = await getPostData(params.slug);
  const allTags = await getAllTags();
  const allCategories = await getAllCategories();
  const relatedPosts = await getRelatedPosts(post, 9);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex flex-col lg:flex-row gap-12">
        <article className="w-full lg:w-2/3 bg-white p-8 rounded-xl shadow-md">
          <h1 className="text-4xl font-extrabold text-gray-900 mb-6">{post.title}</h1>
          <div className="text-gray-600 mb-6 text-lg flex justify-between items-center">
            <span>Published on {new Date(post.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
            <ViewCounter slug={post.slug} />
          </div>
          <div className="mb-6">
            <span className="font-semibold text-gray-700">Category: </span>
            <span className="bg-indigo-100 text-indigo-800 px-3 py-1 rounded-full text-sm font-medium">{post.category}</span>
          </div>
          <div className="mb-8">
            <span className="font-semibold text-gray-700">Tags: </span>
            {post.tags.map((tag: string) => (
              <span key={tag} className="inline-block bg-gray-200 rounded-full px-3 py-1 text-sm font-medium text-gray-700 mr-2 mb-2">
                {tag}
              </span>
            ))}
          </div>
          <div className="markdown-body prose lg:prose-lg xl:prose-xl mb-8">
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
          <div className="mt-8">
            <Link href="/" className="inline-flex items-center text-indigo-600 hover:text-indigo-800 font-semibold transition-colors duration-300">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
              </svg>
              Back to Home
            </Link>
          </div>
          <RelatedPosts posts={relatedPosts} initialLimit={3} />
        </article>
        <div className="w-full lg:w-1/3 space-y-8">
          <div className="bg-white p-6 rounded-xl shadow-md">
            <h2 className="text-2xl font-bold mb-4 text-gray-900">Search</h2>
            <SearchBar />
          </div>
          <div className="bg-white p-6 rounded-xl shadow-md">
            <h2 className="text-2xl font-bold mb-4 text-gray-900">Profile</h2>
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-indigo-500 rounded-full flex items-center justify-center text-white text-2xl font-bold">JD</div>
              <div>
                <h3 className="font-semibold text-lg">John Doe</h3>
                <p className="text-gray-600">Web Developer</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-md">
            <h2 className="text-2xl font-bold mb-4 text-gray-900">Tags</h2>
            <div className="flex flex-wrap gap-2">
              {allTags.map((tag: string) => (
                <Link key={tag} href={`/?tag=${tag}`} className="px-3 py-1 bg-indigo-100 text-indigo-800 rounded-full text-sm font-medium hover:bg-indigo-200 transition-colors duration-300">
                  {tag}
                </Link>
              ))}
            </div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-md">
            <h2 className="text-2xl font-bold mb-4 text-gray-900">Categories</h2>
            <ul className="space-y-2">
              {allCategories.map((category: string) => (
                <li key={category}>
                  <Link href={`/?category=${category}`} className="block py-2 px-3 rounded-md text-gray-600 hover:bg-gray-100 transition-colors duration-300">
                    {category}
                  </Link>
                </li>
              ))}
            </ul>
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
