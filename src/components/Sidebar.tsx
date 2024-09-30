import Link from 'next/link';
import SearchBar from './SearchBar';

interface SidebarProps {
  allTags: string[];
  allCategories: string[];
}

const Sidebar: React.FC<SidebarProps> = ({ allTags, allCategories }) => {
  return (
    <div className="w-full space-y-6 lg:space-y-8">
      <div className="bg-white p-4 lg:p-6 rounded-xl shadow-md">
        <h2 className="text-xl lg:text-2xl font-bold mb-3 lg:mb-4 text-gray-900">Search</h2>
        <SearchBar />
      </div>
      <div className="bg-white p-4 lg:p-6 rounded-xl shadow-md">
        <h2 className="text-xl lg:text-2xl font-bold mb-3 lg:mb-4 text-gray-900">Profile</h2>
        <div className="flex items-center space-x-3 lg:space-x-4">
          <div className="w-12 h-12 lg:w-16 lg:h-16 bg-indigo-500 rounded-full flex items-center justify-center text-white text-xl lg:text-2xl font-bold">JD</div>
          <div>
            <h3 className="font-semibold text-base lg:text-lg">John Doe</h3>
            <p className="text-gray-600 text-sm lg:text-base">Web Developer</p>
          </div>
        </div>
      </div>
      <div className="bg-white p-4 lg:p-6 rounded-xl shadow-md">
        <Link href="/tags" className="block text-xl lg:text-2xl font-bold mb-3 lg:mb-4 text-gray-900 hover:text-indigo-600 transition-colors duration-300">Tags</Link>
        <div className="flex flex-wrap gap-2">
          {allTags.slice(0, 10).map((tag: string) => (
            <Link key={tag} href={`/?tag=${encodeURIComponent(tag)}`} className="px-2 py-1 bg-indigo-100 text-indigo-800 rounded-full text-xs lg:text-sm font-medium hover:bg-indigo-200 transition-colors duration-300">
              {tag}
            </Link>
          ))}
        </div>
        {allTags.length > 10 && (
          <Link href="/tags" className="block mt-3 lg:mt-4 text-sm lg:text-base text-indigo-600 hover:text-indigo-800 transition-colors duration-300">
            View all tags...
          </Link>
        )}
      </div>
      <div className="bg-white p-4 lg:p-6 rounded-xl shadow-md">
        <Link href="/categories" className="block text-xl lg:text-2xl font-bold mb-3 lg:mb-4 text-gray-900 hover:text-indigo-600 transition-colors duration-300">Categories</Link>
        <ul className="space-y-1 lg:space-y-2">
          {allCategories.slice(0, 5).map((category: string) => (
            <li key={category}>
              <Link href={`/?category=${encodeURIComponent(category)}`} className="block py-1 lg:py-2 px-2 lg:px-3 rounded-md text-sm lg:text-base text-gray-600 hover:bg-gray-100 transition-colors duration-300">
                {category}
              </Link>
            </li>
          ))}
        </ul>
        {allCategories.length > 5 && (
          <Link href="/categories" className="block mt-3 lg:mt-4 text-sm lg:text-base text-indigo-600 hover:text-indigo-800 transition-colors duration-300">
            View all categories...
          </Link>
        )}
      </div>
    </div>
  );
};

export default Sidebar;