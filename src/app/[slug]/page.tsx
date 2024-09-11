import Link from 'next/link';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import rehypeSanitize from 'rehype-sanitize';
import rehypeHighlight from 'rehype-highlight';
import { getPostData, getSortedPostsData } from '../../utils/markdown';

export default async function ArticlePage({ params }: { params: { slug: string } }) {
  const post = await getPostData(params.slug);

  return (
    <div className="flex flex-col md:flex-row gap-8">
      <article className="w-full md:w-2/3 bg-white p-8 rounded-lg shadow-sm">
        <h1 className="text-3xl font-bold mb-4">{post.title}</h1>
        <div className="text-gray-600 mb-8">
          Published on {new Date(post.date).toLocaleDateString()}
        </div>
        <div className="markdown-body prose lg:prose-lg mb-8">
          <ReactMarkdown
            rehypePlugins={[rehypeRaw, rehypeSanitize, rehypeHighlight]}
          >
            {post.content}
          </ReactMarkdown>
        </div>
        <Link href="/" className="text-blue-600 hover:text-blue-800 font-semibold">
          ← Back to Home
        </Link>
      </article>
      <div className="w-full md:w-1/3 space-y-8">
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h2 className="text-xl font-bold mb-4">Search</h2>
          <input
            type="text"
            placeholder="Search..."
            className="w-full px-3 py-2 border rounded-md"
          />
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h2 className="text-xl font-bold mb-4">Profile</h2>
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-gray-300 rounded-full"></div>
            <div>
              <h3 className="font-semibold">John Doe</h3>
              <p className="text-sm text-gray-600">Web Developer</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h2 className="text-xl font-bold mb-4">Tags</h2>
          <div className="flex flex-wrap gap-2">
            <span className="px-2 py-1 bg-gray-200 rounded-md text-sm">NextJS</span>
            <span className="px-2 py-1 bg-gray-200 rounded-md text-sm">React</span>
            <span className="px-2 py-1 bg-gray-200 rounded-md text-sm">JavaScript</span>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h2 className="text-xl font-bold mb-4">Categories</h2>
          <ul className="space-y-2">
            <li><Link href="#" className="text-blue-600 hover:text-blue-800">Web Development</Link></li>
            <li><Link href="#" className="text-blue-600 hover:text-blue-800">Design</Link></li>
            <li><Link href="#" className="text-blue-600 hover:text-blue-800">Technology</Link></li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export async function generateStaticParams() {
  const posts = getSortedPostsData();
  return posts.map((post) => ({
    slug: post.slug,
  }));
}