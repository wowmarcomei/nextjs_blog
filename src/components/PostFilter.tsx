'use client';

import React, { Fragment } from 'react';
import { Menu, Transition } from '@headlessui/react';
import { ChevronDownIcon, FunnelIcon, Squares2X2Icon, ListBulletIcon } from '@heroicons/react/20/solid';

interface PostFilterProps {
  categories: string[];
  tags: string[];
  onCategoryChange: (category: string) => void;
  onTagChange: (tag: string) => void;
  onViewModeChange: (mode: 'grid' | 'list') => void;
  currentViewMode: 'grid' | 'list';
}

const PostFilter: React.FC<PostFilterProps> = ({ 
  categories, 
  tags, 
  onCategoryChange, 
  onTagChange, 
  onViewModeChange, 
  currentViewMode 
}) => {
  return (
    <div className="flex flex-col sm:flex-row justify-between items-center mb-8 space-y-4 sm:space-y-0">
      <div className="flex space-x-4">
        <Menu as="div" className="relative inline-block text-left">
          <div>
            <Menu.Button className="inline-flex w-full justify-center gap-x-1.5 rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50">
              <FunnelIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
              Categories
              <ChevronDownIcon className="-mr-1 h-5 w-5 text-gray-400" aria-hidden="true" />
            </Menu.Button>
          </div>

          <Transition
            as={Fragment}
            enter="transition ease-out duration-100"
            enterFrom="transform opacity-0 scale-95"
            enterTo="transform opacity-100 scale-100"
            leave="transition ease-in duration-75"
            leaveFrom="transform opacity-100 scale-100"
            leaveTo="transform opacity-0 scale-95"
          >
            <Menu.Items className="absolute right-0 z-10 mt-2 w-56 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
              <div className="py-1">
                {categories.map((category) => (
                  <Menu.Item key={category}>
                    {({ active }) => (
                      <a
                        href="#"
                        className={`${
                          active ? 'bg-gray-100 text-gray-900' : 'text-gray-700'
                        } block px-4 py-2 text-sm`}
                        onClick={() => onCategoryChange(category)}
                      >
                        {category}
                      </a>
                    )}
                  </Menu.Item>
                ))}
              </div>
            </Menu.Items>
          </Transition>
        </Menu>

        <Menu as="div" className="relative inline-block text-left">
          <div>
            <Menu.Button className="inline-flex w-full justify-center gap-x-1.5 rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50">
              <FunnelIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
              Tags
              <ChevronDownIcon className="-mr-1 h-5 w-5 text-gray-400" aria-hidden="true" />
            </Menu.Button>
          </div>

          <Transition
            as={Fragment}
            enter="transition ease-out duration-100"
            enterFrom="transform opacity-0 scale-95"
            enterTo="transform opacity-100 scale-100"
            leave="transition ease-in duration-75"
            leaveFrom="transform opacity-100 scale-100"
            leaveTo="transform opacity-0 scale-95"
          >
            <Menu.Items className="absolute right-0 z-10 mt-2 w-56 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
              <div className="py-1">
                {tags.map((tag) => (
                  <Menu.Item key={tag}>
                    {({ active }) => (
                      <a
                        href="#"
                        className={`${
                          active ? 'bg-gray-100 text-gray-900' : 'text-gray-700'
                        } block px-4 py-2 text-sm`}
                        onClick={() => onTagChange(tag)}
                      >
                        {tag}
                      </a>
                    )}
                  </Menu.Item>
                ))}
              </div>
            </Menu.Items>
          </Transition>
        </Menu>
      </div>

      <div className="flex space-x-2">
        <button
          onClick={() => onViewModeChange('grid')}
          className={`p-2 rounded-lg ${
            currentViewMode === 'grid' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-600'
          } hover:bg-blue-600 hover:text-white transition duration-300`}
          aria-label="Grid view"
        >
          <Squares2X2Icon className="h-5 w-5" />
        </button>
        <button
          onClick={() => onViewModeChange('list')}
          className={`p-2 rounded-lg ${
            currentViewMode === 'list' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-600'
          } hover:bg-blue-600 hover:text-white transition duration-300`}
          aria-label="List view"
        >
          <ListBulletIcon className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
};

export default PostFilter;