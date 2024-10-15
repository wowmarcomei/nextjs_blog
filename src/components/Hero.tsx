import React from 'react';
import Link from 'next/link';
import Image from 'next/image';

interface HeroProps {
  title?: string;
  subtitle?: string;
  ctaText?: string;
  ctaLink?: string;
  backgroundImage?: string;
}

const Hero: React.FC<HeroProps> = React.memo(({
  title = "Welcome to TechBlog",
  subtitle = "Discover the latest in technology, programming, and digital innovation.",
  ctaText = "Explore Articles",
  ctaLink = "/archive",
  backgroundImage
}) => {
  return (
    <div className="w-full bg-gray relative">
      {backgroundImage && (
        <Image
          src={backgroundImage}
          alt="Hero background"
          layout="fill"
          objectFit="cover"
          className="absolute inset-0 z-0"
        />
      )}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="my-8 shadow-lg overflow-hidden">
          <div className="bg-gradient-to-r from-[#F8CF6A] to-[#2178DD] py-16 px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h1 className="text-4xl md:text-5xl font-bold mb-4 text-white">{title}</h1>
              <p className="text-xl mb-8 text-gray-100">{subtitle}</p>
              <Link href={ctaLink} className="inline-block bg-white text-blue-600 px-6 py-3 rounded-full font-semibold hover:bg-gray-100 transition duration-300">
                {ctaText}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

Hero.displayName = 'Hero';

export default Hero;