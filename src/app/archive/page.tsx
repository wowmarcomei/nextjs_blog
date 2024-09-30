import Link from 'next/link';
import { getPostsByYear } from '../../utils/markdown';

export default async function Archive() {
  const postsByYear = await getPostsByYear();

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-4xl font-extrabold text-gray-900 mb-8">Archive</h1>
      {Object.entries(postsByYear).sort(([a], [b]) => Number(b) - Number(a)).map(([year, posts]) => (
        <div key={year} className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">{year}</h2>
          <ul className="space-y-2">
            {posts.map((post) => (
              <li key={post.slug}>
                <Link href={`/${post.slug}`} className="text-indigo-600 hover:text-indigo-800">
                  {post.title}
                </Link>
                <span className="text-gray-500 ml-2">
                  {new Date(post.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}
                </span>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
