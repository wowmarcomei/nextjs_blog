/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: process.env.SITE_URL || 'https://laomeinote.com',
  generateRobotsTxt: true,
  robotsTxtOptions: {
    policies: [
      {
        userAgent: '*',
        allow: '/',
      },
    ],
  },
  changefreq: 'daily',
  priority: 0.7,
  sitemapSize: 5000,
  exclude: ['/server-sitemap.xml', '/admin/*'],
  generateIndexSitemap: false,
}
