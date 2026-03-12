import type { Metadata } from "next";
import { Yusei_Magic } from "next/font/google";
import IconImage from "@/public/me.png";
import Footer from "@/app/components/Footer";
import "./globals.css";

const yuseiMagic = Yusei_Magic({ weight: "400", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "りゆうの実験場",
  description: "なんかブログとか",
  icons: {
    icon: IconImage.src,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body className={`${yuseiMagic.className} flex flex-col min-h-screen bg-elements-background`}>
        <div className="flex-1">{children}</div>
        <Footer />
      </body>
    </html>
  );
}
