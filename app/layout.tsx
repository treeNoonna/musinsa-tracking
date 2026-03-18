import type { Metadata } from "next";
import { Black_Han_Sans, Fira_Code, Noto_Sans_KR } from "next/font/google";
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

export const metadata: Metadata = {
  title: "무신사가격 트래킹",
  description: "무신사 상품 가격을 추적하고 저장하는 대시보드",
  applicationName: "Musinsa Tracking",
  icons: {
    icon: [
      { url: "/branding/musinsa-mark.svg", type: "image/svg+xml" },
      { url: "/branding/favicon-512.png", sizes: "512x512", type: "image/png" },
      { url: "/branding/favicon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/branding/favicon-32.png", sizes: "32x32", type: "image/png" },
    ],
    shortcut: [{ url: "/branding/favicon-32.png", type: "image/png" }],
    apple: [{ url: "/branding/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className={`${notoSansKr.variable} ${blackHanSans.variable} ${firaCode.variable}`}>
        {children}
      </body>
    </html>
  );
}
