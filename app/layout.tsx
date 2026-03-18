import type { Metadata, Viewport } from "next";
import { Black_Han_Sans, Fira_Code, Noto_Sans_KR } from "next/font/google";

import {
  SITE_DESCRIPTION,
  SITE_KEYWORDS,
  SITE_NAME,
  SITE_OG_IMAGE_PATH,
  SITE_TITLE,
  getAbsoluteUrl,
  getSiteUrl,
} from "@/lib/site";

import "./globals.css";

const notoSansKr = Noto_Sans_KR({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "500", "700", "800", "900"],
});

const blackHanSans = Black_Han_Sans({
  variable: "--font-display",
  subsets: ["latin"],
  weight: "400",
});

const firaCode = Fira_Code({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const siteUrl = getSiteUrl();
const socialImageUrl = getAbsoluteUrl(SITE_OG_IMAGE_PATH);
const iconVersion = "20260319b";

export const viewport: Viewport = {
  themeColor: "#050505",
  colorScheme: "dark",
};

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: SITE_TITLE,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  keywords: [...SITE_KEYWORDS],
  category: "shopping",
  classification: "price tracking dashboard",
  referrer: "origin-when-cross-origin",
  formatDetection: {
    telephone: false,
    address: false,
    email: false,
  },
  alternates: {
    canonical: "/",
  },
  manifest: "/manifest.webmanifest",
  openGraph: {
    type: "website",
    url: siteUrl,
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    siteName: SITE_NAME,
    locale: "ko_KR",
    images: [
      {
        url: socialImageUrl,
        width: 1200,
        height: 630,
        alt: `${SITE_NAME} open graph image`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    images: [socialImageUrl],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  icons: {
    icon: [
      { url: `/branding/favicon-32.png?v=${iconVersion}`, sizes: "32x32", type: "image/png" },
      { url: `/branding/favicon-192.png?v=${iconVersion}`, sizes: "192x192", type: "image/png" },
      { url: `/branding/favicon-512.png?v=${iconVersion}`, sizes: "512x512", type: "image/png" },
      { url: `/favicon.ico?v=${iconVersion}`, sizes: "any", type: "image/x-icon" },
      { url: `/branding/musinsa-mark.svg?v=${iconVersion}`, type: "image/svg+xml" },
    ],
    shortcut: [{ url: `/favicon.ico?v=${iconVersion}`, sizes: "any", type: "image/x-icon" }],
    apple: [
      {
        url: `/branding/apple-touch-icon.png?v=${iconVersion}`,
        sizes: "180x180",
        type: "image/png",
      },
    ],
  },
};

const structuredData = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: SITE_NAME,
  applicationCategory: "ShoppingApplication",
  operatingSystem: "Web Browser",
  inLanguage: "ko-KR",
  url: siteUrl,
  description: SITE_DESCRIPTION,
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "KRW",
  },
  publisher: {
    "@type": "Organization",
    name: SITE_NAME,
    url: siteUrl,
  },
  featureList: [
    "무신사 상품 URL 등록",
    "가격 이력 차트 확인",
    "Google 로그인 기반 저장 상품 관리",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className={`${notoSansKr.variable} ${blackHanSans.variable} ${firaCode.variable}`}>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
        {children}
      </body>
    </html>
  );
}
