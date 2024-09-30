import type { Metadata } from "next";
import localFont from "next/font/local";
import Link from "next/link";
import "./globals.css";
import "./markdown-styles.css";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "My Next.js Blog",
  description: "A simple blog built with Next.js",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.4.0/styles/github.min.css"
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-gray-100 text-gray-900 min-h-screen flex flex-col`}
      >
        <header className="bg-white shadow-md fixed top-0 left-0 right-0 z-10">
          <nav className="container mx-auto px-4 py-4">
            <ul className="flex space-x-6">
              <li><Link href="/" className="text-gray-800 hover:text-gray-600 font-semibold">Home</Link></li>
              <li><Link href="/archive" className="text-gray-800 hover:text-gray-600 font-semibold">Archive</Link></li>
              <li><Link href="#" className="text-gray-800 hover:text-gray-600 font-semibold">About</Link></li>
              <li><Link href="#" className="text-gray-800 hover:text-gray-600 font-semibold">Contact</Link></li>
            </ul>
          </nav>
        </header>
        <main className="flex-grow container mx-auto px-4 py-8 mt-16">
          {children}
        </main>
        <footer className="bg-white text-gray-600 p-4 text-center">
          © 2024 My Blog. All rights reserved.
        </footer>
      </body>
    </html>
  );
}
