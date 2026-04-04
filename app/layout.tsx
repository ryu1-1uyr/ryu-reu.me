import type { Metadata } from "next";
import { Yusei_Magic } from "next/font/google";
import IconImage from "@/public/me.png";
import Footer from "@/app/components/Footer";
import { PostsCacheProvider } from "@/app/contexts/PostsCache";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "./globals.css";

import { WeatherOverrideProvider } from "@/app/contexts/WeatherOverride";
import { SkyDrawingsProvider } from "@/app/contexts/SkyDrawings";
import { SkyBackgroundWrapper } from "@/app/components/SkyBackground";

const yuseiMagic = Yusei_Magic({ weight: "400", subsets: ["latin"] });

const siteUrl = "https://www.ryu-reu.me";
const siteName = "りゆうの実験場";
const siteDescription = "なんかブログとか";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: siteName,
    template: `%s | ${siteName}`,
  },
  description: siteDescription,
  icons: {
    icon: IconImage.src,
  },
  openGraph: {
    type: "website",
    siteName,
    title: siteName,
    description: siteDescription,
    url: siteUrl,
    images: [{ url: IconImage.src, width: 400, height: 400, alt: siteName }],
    locale: "ja_JP",
  },
  twitter: {
    card: "summary",
    site: "@reu_00_00",
    creator: "@reu_00_00",
    title: siteName,
    description: siteDescription,
    images: [IconImage.src],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <SpeedInsights />
      <body
        className={`${yuseiMagic.className} flex flex-col min-h-screen bg-elements-background`}
      >
        <WeatherOverrideProvider>
          <SkyDrawingsProvider>
            <SkyBackgroundWrapper />
            <PostsCacheProvider>
              <div className="flex-1">{children}</div>
              <Footer />
            </PostsCacheProvider>
          </SkyDrawingsProvider>
        </WeatherOverrideProvider>
      </body>
    </html>
  );
}
