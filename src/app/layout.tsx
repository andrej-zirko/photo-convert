// src/app/layout.tsx
import type { Metadata } from "next";
// Keep existing font imports if you decide to use them later
// import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ReactNode } from 'react'; // Import ReactNode

// const geistSans = Geist({
//   variable: "--font-geist-sans",
//   subsets: ["latin"],
// });

// const geistMono = Geist_Mono({
//   variable: "--font-geist-mono",
//   subsets: ["latin"],
// });

// --- SEO Metadata Base ---
const siteUrl = "https://b64img.zirko.eu"; // Your canonical URL

export const metadata: Metadata = {
  // metadataBase is used to resolve relative paths for Open Graph images, etc.
  metadataBase: new URL(siteUrl),
  // Default title template - %s will be replaced by page-specific titles
  title: {
    template: '%s | b64img - Image Tools',
    default: 'b64img - Online JPG Compressor, Resizer & Base64 Encoder', // Fallback title
  },
  description: 'Free online tool to compress, resize, and Base64 encode JPG/JPEG images easily.', // Default description
  // --- Icons ---
  // You should create these files and place them in /public
  icons: {
    icon: '/favicon.ico', // Standard favicon
    shortcut: '/favicon-16x16.png', // For older browsers
    apple: '/apple-touch-icon.png', // For Apple devices
    other: { // Example for different sizes if needed
      rel: 'icon',
      url: '/favicon-32x32.png',
      sizes: '32x32',
    },
  },
  // --- Open Graph Defaults (for social sharing) ---
  openGraph: {
    siteName: 'b64img',
    type: 'website',
    locale: 'en_US', // Adjust if your primary audience differs
    url: siteUrl, // Default canonical URL for OG
    // Default OG title and description can be overridden per page
    title: 'b64img - Online JPG Compressor, Resizer & Base64 Encoder',
    description: 'Free online tool to compress, resize, and Base64 encode JPG/JPEG images.',
    // Add a default OG image (create this file in /public, e.g., 1200x630px)
    // images: [
    //   {
    //     url: '/og-image.jpg', // Relative to metadataBase
    //     width: 1200,
    //     height: 630,
    //     alt: 'b64img Online Image Tool',
    //   },
    // ],
  },
   // --- Twitter Card Defaults ---
   twitter: {
    card: 'summary_large_image', // Use 'summary' if you don't have a large image
    title: 'b64img - Online JPG Compressor, Resizer & Base64 Encoder',
    description: 'Free online tool to compress, resize, and Base64 encode JPG/JPEG images.',
    // site: '@yourTwitterHandle', // Optional: Add your Twitter handle
    // creator: '@yourTwitterHandle', // Optional: Add creator's handle
    // images: ['/og-image.jpg'], // Use the same image as Open Graph by default
  },
  // Optional: Robots directives (usually default is fine unless blocking specific pages)
  // robots: {
  //   index: true,
  //   follow: true,
  //   googleBot: {
  //     index: true,
  //     follow: true,
  //     'max-video-preview': -1,
  //     'max-image-preview': 'large',
  //     'max-snippet': -1,
  //   },
  // },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" data-theme="light">
      <head>
        {/* Google tag (gtag.js) */}
        <script async src={`https://www.googletagmanager.com/gtag/js?id=G-NFDLSKGNDX`}></script>
        <script dangerouslySetInnerHTML={{
          __html: `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());

            gtag('config', 'G-NFDLSKGNDX');
          `,
        }} />
      </head>
      {/* Keep the body structure */}
      {/* You can re-add font variables here if you use them */}
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}