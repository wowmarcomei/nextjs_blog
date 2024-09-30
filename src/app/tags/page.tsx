import Link from 'next/link';
import { getAllTags, getSortedPostsData } from '../../utils/markdown';

export default async function Tags() {
  const tags = await getAllTags();
  const posts = await getSortedPostsData();

  const tagCounts = tags.reduce((acc, tag) => {
    acc[tag] = posts.filter(post => post.tags.includes(tag)).length;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-4xl font-extrabold text-gray-900 mb-8">Tags</h1>
      <div className="flex flex-wrap gap-4">
        {tags.map(tag => (
          <Link 
            key={tag} 
            href={`/?tag=${tag}`}
            className="bg-white px-4 py-2 rounded-full shadow-md hover:shadow-lg transition-shadow duration-300 flex items-center"
          >
            <span className="text-lg font-semibold text-gray-900 mr-2">{tag}</span>
            <span className="text-sm text-gray-600">({tagCounts[tag]})</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
