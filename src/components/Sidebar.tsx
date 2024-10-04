import Link from 'next/link';
import SearchBar from './SearchBar';

interface SidebarProps {
  allTags: string[];
  allCategories: string[];
}

const Sidebar: React.FC<SidebarProps> = ({ allTags, allCategories }) => {
  return (
    <div className="w-full space-y-4 lg:space-y-6">
      <div className="bg-white p-3 lg:p-4 rounded-xl shadow-md">
        <h2 className="text-lg lg:text-xl font-bold mb-2 lg:mb-3 text-gray-900">Search</h2>
        <SearchBar />
      </div>
      <div className="bg-white p-3 lg:p-4 rounded-xl shadow-md">
        <h2 className="text-lg lg:text-xl font-bold mb-2 lg:mb-3 text-gray-900">Profile</h2>
        <div className="flex items-center space-x-2 lg:space-x-3">
          <div className="w-10 h-10 lg:w-12 lg:h-12 bg-indigo-500 rounded-full flex items-center justify-center text-white text-lg lg:text-xl font-bold">JD</div>
          <div>
            <h3 className="font-semibold text-sm lg:text-base">John Doe</h3>
            <p className="text-gray-600 text-xs lg:text-sm">Web Developer</p>
          </div>
        </div>
      </div>
      <div className="bg-white p-3 lg:p-4 rounded-xl shadow-md">
        <Link href="/tags" className="block text-lg lg:text-xl font-bold mb-2 lg:mb-3 text-gray-900 hover:text-indigo-600 transition-colors duration-300">Tags</Link>
        <div className="flex flex-wrap gap-1 lg:gap-2">
          {allTags.slice(0, 8).map((tag: string) => (
            <Link key={tag} href={`/?tag=${encodeURIComponent(tag)}`} className="px-2 py-1 bg-indigo-100 text-indigo-800 rounded-full text-xs lg:text-sm font-medium hover:bg-indigo-200 transition-colors duration-300">
              {tag}
            </Link>
          ))}
        </div>
        {allTags.length > 8 && (
          <Link href="/tags" className="block mt-2 lg:mt-3 text-xs lg:text-sm text-indigo-600 hover:text-indigo-800 transition-colors duration-300">
            View all tags...
          </Link>
        )}
      </div>
      <div className="bg-white p-3 lg:p-4 rounded-xl shadow-md">
        <Link href="/categories" className="block text-lg lg:text-xl font-bold mb-2 lg:mb-3 text-gray-900 hover:text-indigo-600 transition-colors duration-300">Categories</Link>
        <ul className="space-y-1">
          {allCategories.slice(0, 5).map((category: string) => (
            <li key={category}>
              <Link href={`/?category=${encodeURIComponent(category)}`} className="block py-1 px-2 rounded-md text-xs lg:text-sm text-gray-600 hover:bg-gray-100 transition-colors duration-300">
                {category}
              </Link>
            </li>
          ))}
        </ul>
        {allCategories.length > 5 && (
          <Link href="/categories" className="block mt-2 lg:mt-3 text-xs lg:text-sm text-indigo-600 hover:text-indigo-800 transition-colors duration-300">
            View all categories...
          </Link>
        )}
      </div>
    </div>
  );
};

export default Sidebar;