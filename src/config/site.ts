export const siteConfig = {
  name: "TechBlog",
  description: "Explore the latest in technology, programming, and digital innovation with TechBlog.",
  url: process.env.NEXT_PUBLIC_SITE_URL || "https://laomeinote.com",
  ogImage: "/og-image.jpg",
  links: {
    twitter: "https://twitter.com/wowmarcomei",
    github: "https://github.com/wowmarcomei",
  },
  author: {
    name: "Marco",
    website: "https://laomeinote.com",
  },
  keywords: [
    "technology",
    "programming",
    "web development",
    "artificial intelligence",
    "software engineering",
  ],
};

export const twitterConfig = {
  handle: "@wowmarcomei",
  cardType: "summary_large_image" as const,
};

export const faviconConfig = {
  icon: '/favicon.ico',
  shortcut: '/images/favicon-16x16.png',
  apple: '/apple-touch-icon.png',
};

export const manifestConfig = {
  path: '/images/site.webmanifest',
};

export const themeConfig = {
  color: '#ffffff',
};