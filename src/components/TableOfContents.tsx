'use client';

import React from 'react';
import { useEffect, useState } from 'react';

interface TOCItem {
  id: string;
  title: string;
  level: number;
}

const TableOfContents: React.FC<{ content: string }> = ({ content }) => {
  const [toc, setToc] = useState<TOCItem[]>([]);

  useEffect(() => {
    const headings = content.match(/^#{1,6}\s.+$/gm) || [];
    const tocItems = headings.map((heading) => {
      const level = heading.match(/^#+/)?.[0].length || 0;
      const title = heading.replace(/^#+\s/, '');
      const id = encodeURIComponent(title.toLowerCase().replace(/\s+/g, '-'));
      return { id, title, level };
    });
    setToc(tocItems);
  }, [content]);

  return (
    <nav className="toc">
      <h2 className="text-xl font-bold mb-4">Table of Contents</h2>
      <ul className="space-y-2">
        {toc.map((item) => (
          <li key={item.id} style={{ marginLeft: `${(item.level - 1) * 1}rem` }}>
            <a
              href={`#${item.id}`}
              className="text-blue-600 hover:text-blue-800 transition-colors duration-200"
            >
              {item.title}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
};

export default TableOfContents;