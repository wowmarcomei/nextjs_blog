import Link from 'next/link';
import Image from 'next/image';
import { getSortedPostsData, getAllTags, getAllCategories, PostData } from '../utils/markdown';

export default async function Home({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined }
}) {
  const posts = await getSortedPostsData();
  const allTags = await getAllTags();
  const allCategories = await getAllCategories();

  const selectedTag = typeof searchParams.tag === 'string' ? searchParams.tag : null;
  const selectedCategory = typeof searchParams.category === 'string' ? searchParams.category : null;

  const filteredPosts = posts.filter(post => 
    (!selectedTag || post.tags.includes(selectedTag)) &&
    (!selectedCategory || post.category === selectedCategory)
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex flex-col lg:flex-row gap-12">
        <div className="w-full lg:w-2/3">
          <h1 className="text-4xl font-extrabold text-gray-900 mb-8">Latest Posts</h1>
          {selectedTag && (
            <p className="mb-6 text-lg text-gray-600">Filtered by tag: <span className="font-semibold text-indigo-600">{selectedTag}</span></p>
          )}
          {selectedCategory && (
            <p className="mb-6 text-lg text-gray-600">Filtered by category: <span className="font-semibold text-indigo-600">{selectedCategory}</span></p>
          )}
          <div className="space-y-10">
            {filteredPosts.map((post) => (
              <div key={post.slug} className="bg-white p-8 rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300 flex items-center">
                <div className="flex-shrink-0 mr-6 flex items-center">
                  {post.image ? (
                    <Image
                      src={post.image}
                      alt={post.title}
                      width={200}
                      height={150}
                      className="rounded-lg object-cover"
                      priority
                    />
                  ) : (
                    <div className="w-[200px] h-[150px] bg-gray-200 rounded-lg flex items-center justify-center">
                      <span className="text-gray-400">No image</span>
                    </div>
                  )}
                </div>
                <div className="flex-grow">
                  <h2 className="text-3xl font-bold mb-4">
                    <Link href={`/${post.slug}`} className="text-gray-900 hover:text-indigo-600 transition-colors duration-300">
                      {post.title}
                    </Link>
                  </h2>
                  <p className="text-gray-600 mb-6 text-lg">{post.content.substring(0, 150)}...</p>
                  <div className="flex flex-wrap gap-2 mb-6">
                    {post.tags.map(tag => (
                      <Link key={tag} href={`/?tag=${tag}`} className="text-sm bg-indigo-100 text-indigo-800 rounded-full px-3 py-1 font-medium hover:bg-indigo-200 transition-colors duration-300">
                        {tag}
                      </Link>
                    ))}
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500">
                      {new Date(post.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })} | {post.category}
                    </span>
                    <Link href={`/${post.slug}`} className="text-indigo-600 hover:text-indigo-800 font-semibold flex items-center">
                      Read more <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-1" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
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
              {allTags.slice(0, 10).map(tag => (
                <Link
                  key={tag}
                  href={selectedTag === tag ? '/' : `/?tag=${tag}`}
                  className={`px-3 py-1 rounded-full text-sm font-medium ${
                    selectedTag === tag ? 'bg-indigo-600 text-white' : 'bg-indigo-100 text-indigo-800 hover:bg-indigo-200'
                  } transition-colors duration-300`}
                >
                  {tag}
                </Link>
              ))}
            </div>
            <Link href="/tags" className="block mt-4 text-indigo-600 hover:text-indigo-800">View all tags</Link>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-md">
            <h2 className="text-2xl font-bold mb-4 text-gray-900">Categories</h2>
            <ul className="space-y-2">
              {allCategories.slice(0, 5).map(category => (
                <li key={category}>
                  <Link
                    href={selectedCategory === category ? '/' : `/?category=${category}`}
                    className={`block py-2 px-3 rounded-md transition-colors duration-300 ${
                      selectedCategory === category ? 'bg-indigo-100 text-indigo-800 font-semibold' : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    {category}
                  </Link>
                </li>
              ))}
            </ul>
            <Link href="/categories" className="block mt-4 text-indigo-600 hover:text-indigo-800">View all categories</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
