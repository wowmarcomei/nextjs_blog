'use client';

import React from 'react';
import { FaThLarge, FaList } from 'react-icons/fa';

interface PostFilterProps {
  onCategoryChange: (category: string) => void;
  onViewModeChange: (mode: 'grid' | 'list') => void;
  currentViewMode: 'grid' | 'list';
}

const PostFilter: React.FC<PostFilterProps> = ({ onCategoryChange, onViewModeChange, currentViewMode }) => {
  return (
    <div className="flex flex-col sm:flex-row justify-between items-center mb-8 space-y-4 sm:space-y-0">
      <div className="w-full sm:w-auto">
        <select
          onChange={(e) => onCategoryChange(e.target.value)}
          className="w-full sm:w-auto appearance-none bg-white border border-gray-300 text-gray-700 py-2 px-4 pr-8 rounded-lg leading-tight focus:outline-none focus:bg-white focus:border-blue-500 transition duration-300"
        >
          <option value="all">All Categories</option>
          <option value="programming">Programming</option>
          <option value="web-design">Web Design</option>
          <option value="devops">DevOps</option>
          <option value="ai">AI</option>
        </select>
      </div>
      <div className="flex space-x-2">
        <button
          onClick={() => onViewModeChange('grid')}
          className={`p-2 rounded-lg ${currentViewMode === 'grid' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-600'} hover:bg-blue-600 hover:text-white transition duration-300`}
          aria-label="Grid view"
        >
          <FaThLarge size={20} />
        </button>
        <button
          onClick={() => onViewModeChange('list')}
          className={`p-2 rounded-lg ${currentViewMode === 'list' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-600'} hover:bg-blue-600 hover:text-white transition duration-300`}
          aria-label="List view"
        >
          <FaList size={20} />
        </button>
      </div>
    </div>
  );
};

export default PostFilter;