'use client';

import React from 'react';
import Link from 'next/link';
import { FaTwitter, FaFacebook, FaInstagram, FaGithub } from 'react-icons/fa';

const Footer: React.FC = () => {
  return (
    <footer className="bg-gray-800 text-white py-12">
      <div className="w-full px-4 md:px-0 md:w-[64%] mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="text-2xl font-bold mb-4">TechBlog</h3>
            <p className="text-gray-400">Exploring the latest in technology, programming, and digital innovation.</p>
          </div>
          <div>
            <h4 className="text-xl font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2">
              <li><Link href="/" className="hover:text-blue-400 transition duration-300">Home</Link></li>
              <li><Link href="/archive" className="hover:text-blue-400 transition duration-300">Archive</Link></li>
              <li><Link href="/about" className="hover:text-blue-400 transition duration-300">About</Link></li>
              <li><Link href="/contact" className="hover:text-blue-400 transition duration-300">Contact</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-xl font-semibold mb-4">Follow Us</h4>
            <div className="flex space-x-4">
              <a href="#" className="text-2xl hover:text-blue-400 transition duration-300"><FaTwitter /></a>
              <a href="#" className="text-2xl hover:text-blue-400 transition duration-300"><FaFacebook /></a>
              <a href="#" className="text-2xl hover:text-blue-400 transition duration-300"><FaInstagram /></a>
              <a href="#" className="text-2xl hover:text-blue-400 transition duration-300"><FaGithub /></a>
            </div>
          </div>
        </div>
        <div className="mt-8 pt-8 border-t border-gray-700 text-center text-gray-400">
          <p>&copy; {new Date().getFullYear()} TechBlog. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;