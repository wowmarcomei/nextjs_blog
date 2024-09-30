'use client';

import { useState, useEffect } from 'react';

export default function ViewCounter({ slug }: { slug: string }) {
  const [views, setViews] = useState<number | null>(null);

  useEffect(() => {
    const incrementViews = async () => {
      try {
        const response = await fetch(`/api/views/${slug}`, { method: 'POST' });
        const data = await response.json();
        setViews(data.views);
      } catch (error) {
        console.error('Failed to increment view count:', error);
      }
    };

    incrementViews();
  }, [slug]);

  if (views === null) {
    return null; // Or a loading spinner
  }

  return <span>{views} view{views === 1 ? '' : 's'}</span>;
}