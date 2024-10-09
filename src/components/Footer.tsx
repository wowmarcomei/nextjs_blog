'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';
import { FaTwitter, FaFacebook, FaInstagram, FaGithub } from 'react-icons/fa';

interface SocialLink {
  icon: React.ElementType;
  url: string;
}

interface FooterProps {
  siteName?: string;
  description?: string;
  quickLinks?: Array<{ label: string; href: string }>;
  socialLinks?: SocialLink[];
}

const Footer: React.FC<FooterProps> = React.memo(({
  siteName = "TechBlog",
  description = "Exploring the latest in technology, programming, and digital innovation.",
  quickLinks = [
    { label: "Home", href: "/" },
    { label: "Archive", href: "/archive" },
    { label: "About", href: "/about" },
    { label: "Contact", href: "/contact" },
  ],
  socialLinks = [
    { icon: FaTwitter, url: "#" },
    { icon: FaFacebook, url: "#" },
    { icon: FaInstagram, url: "#" },
    { icon: FaGithub, url: "#" },
  ]
}) => {
  const currentYear = useMemo(() => new Date().getFullYear(), []);

  return (
    <footer className="bg-gray-800 text-white py-12">
      <div className="w-full px-4 md:px-0 md:w-[64%] mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="text-2xl font-bold mb-4">{siteName}</h3>
            <p className="text-gray-400">{description}</p>
          </div>
          <div>
            <h4 className="text-xl font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2">
              {quickLinks.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="hover:text-blue-400 transition duration-300">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="text-xl font-semibold mb-4">Follow Us</h4>
            <div className="flex space-x-4">
              {socialLinks.map((link, index) => {
                const Icon = link.icon;
                return (
                  <a key={index} href={link.url} className="text-2xl hover:text-blue-400 transition duration-300">
                    <Icon />
                  </a>
                );
              })}
            </div>
          </div>
        </div>
        <div className="mt-8 pt-8 border-t border-gray-700 text-center text-gray-400">
          <p>&copy; {currentYear} {siteName}. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
});

Footer.displayName = 'Footer';

export default Footer;