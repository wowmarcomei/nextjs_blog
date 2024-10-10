'use client';

import React, { useState } from 'react';
import Image from 'next/image';

interface ImageWithZoomProps {
  src: string;
  alt: string;
  width: number;
  height: number;
}

const ImageWithZoom: React.FC<ImageWithZoomProps> = ({ src, alt, width, height }) => {
  const [isZoomed, setIsZoomed] = useState(false);

  const toggleZoom = () => {
    setIsZoomed(!isZoomed);
  };

  return (
    <>
      <Image
        src={src}
        alt={alt}
        width={width}
        height={height}
        onClick={toggleZoom}
        className="cursor-pointer transition-transform duration-300 hover:scale-105"
      />
      {isZoomed && (
        <div
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50"
          onClick={toggleZoom}
        >
          <div className="relative">
            <Image
              src={src}
              alt={alt}
              width={width * 2}
              height={height * 2}
              className="max-w-[90vw] max-h-[90vh] object-contain"
            />
            <button
              className="absolute top-4 right-4 text-white text-2xl"
              onClick={toggleZoom}
            >
              &times;
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default ImageWithZoom;
