'use client';

import React, { useEffect, useRef, useState } from 'react';

interface CommentsProps {
  repo: string;
  repoId: string;
  category: string;
  categoryId: string;
}

const Comments: React.FC<CommentsProps> = ({ repo, repoId, category, categoryId }) => {
  const commentsRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://giscus.app/client.js';
    script.setAttribute('data-repo', repo);
    script.setAttribute('data-repo-id', repoId);
    script.setAttribute('data-category', category);
    script.setAttribute('data-category-id', categoryId);
    script.setAttribute('data-mapping', 'pathname');
    script.setAttribute('data-strict', '0');
    script.setAttribute('data-reactions-enabled', '1');
    script.setAttribute('data-emit-metadata', '0');
    script.setAttribute('data-input-position', 'bottom');
    script.setAttribute('data-theme', 'preferred_color_scheme');
    script.setAttribute('data-lang', 'en');
    script.setAttribute('crossorigin', 'anonymous');
    script.async = true;

    script.onerror = () => {
      setError('Failed to load Giscus script');
    };

    if (commentsRef.current) {
      commentsRef.current.appendChild(script);
    }

    console.log('Giscus config:', { repo, repoId, category, categoryId });

    return () => {
      if (commentsRef.current) {
        commentsRef.current.innerHTML = '';
      }
    };
  }, [repo, repoId, category, categoryId]);

  if (error) {
    return <div>Error: {error}</div>;
  }

  return <div ref={commentsRef} />;
};

export default Comments;
