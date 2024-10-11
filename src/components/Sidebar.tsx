import Link from 'next/link';
import Image from 'next/image';
import { FaGithub, FaLinkedin, FaTwitter, FaInstagram } from 'react-icons/fa';
import { siteConfig } from '../config/site';

interface SidebarProps {
  allTags: string[];
  allCategories: string[];
}

const Sidebar: React.FC<SidebarProps> = ({ allTags, allCategories }) => {
  return (
    <div className="w-full space-y-6">
      <div className="bg-white p-4 shadow-md">
        <div className="flex flex-col items-center space-y-3">
          <div className="w-[200px] h-[200px] rounded-full overflow-hidden">
            <Image
              src="/images/avatar.jpg"
              alt="wowmarcomei"
              width={200}
              height={200}
              objectFit="cover"
              className="rounded-full"
            />
          </div>
          <h3 className="font-bold text-xl">Marco Mei</h3>
          <p className="text-gray-600 text-sm text-center">A Lifelong Learner</p>
          <div className="flex space-x-5">
            {siteConfig.links.twitter && (
              <Link href={siteConfig.links.twitter} aria-label="Twitter" target="_blank" rel="noopener noreferrer">
                <FaTwitter className="w-6 h-6 text-gray-600 hover:text-gray-800" />
              </Link>
            )}
            {siteConfig.links.instagram && (
              <Link href={siteConfig.links.instagram} aria-label="Instagram" target="_blank" rel="noopener noreferrer">
                <FaInstagram className="w-6 h-6 text-gray-600 hover:text-gray-800" />
              </Link>
            )}
            {siteConfig.links.github && (
              <Link href={siteConfig.links.github} aria-label="GitHub" target="_blank" rel="noopener noreferrer">
                <FaGithub className="w-6 h-6 text-gray-600 hover:text-gray-800" />
              </Link>
            )}
            {siteConfig.links.linkedin && (
              <Link href={siteConfig.links.linkedin} aria-label="LinkedIn" target="_blank" rel="noopener noreferrer">
                <FaLinkedin className="w-6 h-6 text-gray-600 hover:text-gray-800" />
              </Link>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white p-4 shadow-md">
        <Link href="/tags" className="block text-xl font-bold mb-3 text-gray-900 hover:text-indigo-600 transition-colors duration-300">Tags</Link>
        <div className="h-1 w-full" style={{ background: 'linear-gradient(90deg, #F4F5F9 0%, #6F58EB 20%, #DF7038 25%,#E0BDAC 35%,#E3DFDF 45%, #F6F7F9 50%,#F6F7F9 50%, #F6F7F9 100%)' }}></div>

        <div className="flex flex-wrap gap-2 mt-3">
          {allTags.slice(0, 10).map((tag: string) => (
            <Link key={tag} href={`/?tag=${encodeURIComponent(tag)}`} className="px-2 py-1 bg-indigo-100 text-indigo-800 rounded-full text-xs font-medium hover:bg-indigo-200 transition-colors duration-300">
              {tag}
            </Link>
          ))}
        </div>
      </div>
      
      <div className="bg-white p-4 shadow-md">
        <Link href="/categories" className="block text-xl font-bold mb-3 text-gray-900 hover:text-indigo-600 transition-colors duration-300">Categories</Link>
        <div className="h-1 w-full " style={{ background: 'linear-gradient(90deg, #F4F5F9 0%, #6F58EB 20%, #DF7038 25%,#E0BDAC 35%,#E3DFDF 45%, #F6F7F9 50%,#F6F7F9 50%, #F6F7F9 100%)' }}></div>
        
        <ul className="space-y-1 mt-4">
          {allCategories.slice(0, 5).map((category: string) => (
            <li key={category}>
              <Link href={`/?category=${encodeURIComponent(category)}`} className="block py-1 px-2 rounded-md text-sm text-gray-600 hover:bg-gray-100 transition-colors duration-300">
                {category}
              </Link>
            </li>
          ))}
        </ul>

        {allCategories.length > 5 && (
          <Link href="/categories" className="block mt-3 text-sm text-indigo-600 hover:text-indigo-800 transition-colors duration-300">
            View all categories...
          </Link>
        )}
      </div>
    </div>
  );
};

export default Sidebar;
