'use client';

import React, { useEffect, useState } from 'react';

interface TOCItem {
  id: string;
  title: string;
  level: number;
}

const TableOfContents: React.FC<{ content: string }> = ({ content }) => {
  const [toc, setToc] = useState<TOCItem[]>([]);

  useEffect(() => {
    const headingRegex = /^(#{1,6})\s+(.+)$/gm;
    const codeBlockRegex = /^```[\s\S]*?^```/gm;

    // Remove code blocks
    const contentWithoutCodeBlocks = content.replace(codeBlockRegex, '');

    const tocItems: TOCItem[] = [];
    let match;

    while ((match = headingRegex.exec(contentWithoutCodeBlocks)) !== null) {
      const level = match[1].length;
      const title = match[2].trim();
      const id = encodeURIComponent(title.toLowerCase().replace(/\s+/g, '-'));
      tocItems.push({ id, title, level });
    }

    setToc(tocItems);
  }, [content]);

  if (toc.length === 0) {
    return null;
  }

  return (
    <nav className="toc">
      <h2 className="text-xl font-bold mb-4">Table of Contents</h2>
      <ul className="space-y-2">
        {toc.map((item, index) => (
          <li key={index} style={{ marginLeft: `${(item.level - 1) * 1}rem` }}>
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