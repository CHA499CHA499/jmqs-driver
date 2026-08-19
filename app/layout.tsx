import type { Metadata } from "next";
import { headers } from "next/headers";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const requestHeaders = await headers();
  const host = requestHeaders.get("host") ?? "persona-atlas-public-demo.chatgpt.site";
  const protocol = host.startsWith("localhost") ? "http" : "https";
  const imageUrl = `${protocol}://${host}/og.png`;
  return {
    title: "假面骑事 | 公开测试版",
    description: "体验特摄收藏卡风格的人物故事收录交互。",
    icons: { icon: "/favicon.svg" },
    openGraph: {
      title: "假面骑事",
      description: "公开测试版，打开链接即可体验人物卡收录、翻面与证据查看。",
      images: [{ url: imageUrl, width: 1200, height: 630, alt: "假面骑事公开测试版" }],
    },
    twitter: {
      card: "summary_large_image",
      title: "假面骑事",
      description: "公开测试版，打开链接即可体验人物卡收录、翻面与证据查看。",
      images: [imageUrl],
    },
  };
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
