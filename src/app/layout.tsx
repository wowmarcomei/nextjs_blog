import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { siteConfig, twitterConfig, faviconConfig, manifestConfig, themeConfig } from "@/config/site";

const inter = Inter({
  subsets: ["latin"],
  display: 'swap',
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: `${siteConfig.name} - Your Source for Tech Insights`,
  description: siteConfig.description,
  keywords: siteConfig.keywords,
  authors: [{ name: siteConfig.author.name, url: siteConfig.author.website }],
  openGraph: {
    type: "website",
    locale: "en_US",
    url: siteConfig.url,
    siteName: siteConfig.name,
    title: `${siteConfig.name} - Your Source for Tech Insights`,
    description: siteConfig.description,
    images: [
      {
        url: `${siteConfig.url}${siteConfig.ogImage}`,
        width: 1200,
        height: 630,
        alt: `${siteConfig.name} - Your Source for Tech Insights`,
      },
    ],
  },
  twitter: {
    card: twitterConfig.cardType,
    site: twitterConfig.handle,
    creator: twitterConfig.handle,
    title: `${siteConfig.name} - Your Source for Tech Insights`,
    description: siteConfig.description,
    images: [`${siteConfig.url}${siteConfig.ogImage}`],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: faviconConfig,
};

export const viewport: Viewport = {
  themeColor: themeConfig.color,
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} font-sans`}>
      <head>
        <link rel="manifest" href={manifestConfig.path} />
        <link rel="apple-touch-icon" href={faviconConfig.apple} />
      </head>
      <body>
        <main>
          {children}
        </main>
      </body>
    </html>
  );
}
