/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['localhost', '43.133.42.66'],
    remotePatterns: [
      {
        protocol: 'http',
        hostname: '43.133.42.66',
        port: '3000',
        pathname: '/images/**',
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
};

// Add a custom server to serve static images
nextConfig.rewrites = async () => {
  return [
    {
      source: '/images/:path*',
      destination: '/src/content/static/images/:path*',
    },
  ];
};

export default nextConfig;
