import Link from 'next/link';
import { posts } from '../data/posts';

export default function Home() {
  return (
    <div className="flex gap-8">
      <div className="w-2/3">
        <h1 className="text-3xl font-bold mb-8">Latest Posts</h1>
        <div className="space-y-8">
          {posts.map((post) => (
            <div key={post.id} className="bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow">
              <h2 className="text-2xl font-bold mb-2">
                <Link href={`/${post.slug}`} className="text-gray-900 hover:text-gray-700">
                  {post.title}
                </Link>
              </h2>
              <p className="text-gray-600 mb-4">{post.excerpt}</p>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">
                  {new Date(post.date).toLocaleDateString()}
                </span>
                <Link href={`/${post.slug}`} className="text-blue-600 hover:text-blue-800 font-semibold">
                  Read more →
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="w-1/3 space-y-8">
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
