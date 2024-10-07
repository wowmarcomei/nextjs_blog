/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: '*',
      },
      {
        protocol: 'https',
        hostname: '*',
      },
    ],
  },
  webpack: (config) => {
    config.module.rules.push({
      test: /\.md$/,
      use: 'raw-loader',
    });
    return config;
  },
  env: {
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
  },
  onBuildStart: () => {
    console.log('Build started');
    console.log('NEXT_PUBLIC_GISCUS_REPO:', process.env.NEXT_PUBLIC_GISCUS_REPO);
    console.log('NEXT_PUBLIC_GISCUS_REPO_ID:', process.env.NEXT_PUBLIC_GISCUS_REPO_ID);
    console.log('NEXT_PUBLIC_GISCUS_CATEGORY:', process.env.NEXT_PUBLIC_GISCUS_CATEGORY);
    console.log('NEXT_PUBLIC_GISCUS_CATEGORY_ID:', process.env.NEXT_PUBLIC_GISCUS_CATEGORY_ID);
  },
};

export default nextConfig;
