import Link from 'next/link';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import rehypeSanitize from 'rehype-sanitize';
import rehypeHighlight from 'rehype-highlight';
import { PostData } from '../../utils/markdown';
import { getPostData, getSortedPostsData, getAllTags, getAllCategories } from '../../utils/serverUtils';
import SocialShareButtons from '../../components/SocialShareButtons';

export default async function ArticlePage({ params }: { params: { slug: string } }) {
  const post = await getPostData(params.slug);
  const allTags = await getAllTags();
  const allCategories = await getAllCategories();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex flex-col lg:flex-row gap-12">
        <article className="w-full lg:w-2/3 bg-white p-8 rounded-xl shadow-md">
          <h1 className="text-4xl font-extrabold text-gray-900 mb-6">{post.title}</h1>
          <div className="text-gray-600 mb-6 text-lg">
            Published on {new Date(post.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
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
          />
          <div className="mt-8">
            <Link href="/" className="inline-flex items-center text-indigo-600 hover:text-indigo-800 font-semibold transition-colors duration-300">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
              </svg>
              Back to Home
            </Link>
          </div>
        </article>
        <div className="w-full lg:w-1/3 space-y-8">
          <div className="bg-white p-6 rounded-xl shadow-md">
            <h2 className="text-2xl font-bold mb-4 text-gray-900">Search</h2>
            <input
              type="text"
              placeholder="Search..."
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
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
