import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Global Game Monitor - Tin tức Game Mới Nhất",
  description: "Theo dõi tin tức game thời gian thực từ các nguồn hàng đầu thế giới. Cập nhật liên tục từ Kotaku, IGN, PC Gamer, Polygon, GameSpot và nhiều hơn nữa.",
  keywords: ["game news", "tin tức game", "gaming updates", "RSS feed", "Kotaku", "IGN", "PC Gamer", "Polygon", "GameSpot"],
  authors: [{ name: "Global Game Monitor" }],
  creator: "Global Game Monitor",
  openGraph: {
    title: "Global Game Monitor",
    description: "Tin tức game thời gian thực từ các nguồn hàng đầu thế giới",
    type: "website",
    locale: "vi_VN",
  },
  twitter: {
    card: "summary_large_image",
    title: "Global Game Monitor",
    description: "Tin tức game thời gian thực từ các nguồn hàng đầu thế giới",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" className="scroll-smooth dark">
      <body className={inter.className}>
        {children}
      </body>
    </html>
  );
}
