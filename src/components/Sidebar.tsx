import Link from 'next/link';
import SearchBar from './SearchBar';

interface SidebarProps {
  allTags: string[];
  allCategories: string[];
}

const Sidebar: React.FC<SidebarProps> = ({ allTags, allCategories }) => {
  return (
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
        <Link href="/tags" className="block text-2xl font-bold mb-4 text-gray-900 hover:text-indigo-600 transition-colors duration-300">Tags</Link>
        <div className="flex flex-wrap gap-2">
          {allTags.slice(0, 15).map((tag: string) => (
            <Link key={tag} href={`/?tag=${encodeURIComponent(tag)}`} className="px-3 py-1 bg-indigo-100 text-indigo-800 rounded-full text-sm font-medium hover:bg-indigo-200 transition-colors duration-300">
              {tag}
            </Link>
          ))}
        </div>
        {allTags.length > 15 && (
          <Link href="/tags" className="block mt-4 text-indigo-600 hover:text-indigo-800 transition-colors duration-300">
            View all tags...
          </Link>
        )}
      </div>
      <div className="bg-white p-6 rounded-xl shadow-md">
        <Link href="/categories" className="block text-2xl font-bold mb-4 text-gray-900 hover:text-indigo-600 transition-colors duration-300">Categories</Link>
        <ul className="space-y-2">
          {allCategories.slice(0, 10).map((category: string) => (
            <li key={category}>
              <Link href={`/?category=${encodeURIComponent(category)}`} className="block py-2 px-3 rounded-md text-gray-600 hover:bg-gray-100 transition-colors duration-300">
                {category}
              </Link>
            </li>
          ))}
        </ul>
        {allCategories.length > 10 && (
          <Link href="/categories" className="block mt-4 text-indigo-600 hover:text-indigo-800 transition-colors duration-300">
            View all categories...
          </Link>
        )}
      </div>
    </div>
  );
};

export default Sidebar;