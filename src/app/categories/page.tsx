import Link from 'next/link';
import { getAllCategories, getSortedPostsData } from '../../utils/markdown';

export default async function Categories() {
  const categories = await getAllCategories();
  const posts = await getSortedPostsData();

  const categoryCounts = categories.reduce((acc, category) => {
    acc[category] = posts.filter(post => post.categories.includes(category)).length;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-4xl font-extrabold text-gray-900 mb-8">Categories</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {categories.map(category => (
          <Link 
            key={category} 
            href={`/?category=${category}`}
            className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300"
          >
            <h2 className="text-2xl font-bold text-gray-900 mb-2">{category}</h2>
            <p className="text-gray-600">{categoryCounts[category]} posts</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
