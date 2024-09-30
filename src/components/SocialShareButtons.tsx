'use client';

import React from 'react';
import { FaFacebook, FaTwitter, FaLinkedin, FaWhatsapp } from 'react-icons/fa';

interface SocialShareButtonsProps {
  url: string;
  title: string;
  tags?: string[];
}

const SocialShareButtons: React.FC<SocialShareButtonsProps> = ({ url, title, tags = [] }) => {
  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);
  const hashtags = tags.map(tag => tag.replace(/\s+/g, '')).join(',');

  const shareLinks = {
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
    twitter: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}&via=YourTwitterHandle&hashtags=${hashtags}`,
    linkedin: `https://www.linkedin.com/shareArticle?mini=true&url=${encodedUrl}&title=${encodedTitle}`,
    whatsapp: `https://wa.me/?text=${encodedTitle}%20${encodedUrl}`
  };

  return (
    <div className="flex justify-center items-center space-x-6 mt-8 mb-6">
      <a href={shareLinks.facebook} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 transition-colors duration-300">
        <FaFacebook size={28} />
      </a>
      <a href={shareLinks.twitter} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-600 transition-colors duration-300">
        <FaTwitter size={28} />
      </a>
      <a href={shareLinks.linkedin} target="_blank" rel="noopener noreferrer" className="text-blue-700 hover:text-blue-900 transition-colors duration-300">
        <FaLinkedin size={28} />
      </a>
      <a href={shareLinks.whatsapp} target="_blank" rel="noopener noreferrer" className="text-green-500 hover:text-green-700 transition-colors duration-300">
        <FaWhatsapp size={28} />
      </a>
    </div>
  );
};

export default SocialShareButtons;