/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['localhost', '43.133.42.66'],
  },
  webpack: (config) => {
    config.module.rules.push({
      test: /\.md$/,
      use: 'raw-loader',
    });
    return config;
  },
};

export default nextConfig;
