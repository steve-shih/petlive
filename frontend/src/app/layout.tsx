import type { Metadata } from "next";
import Navbar from "./components/Navbar";
import BottomNav from "./components/BottomNav";
import NgrokBypass from "./components/NgrokBypass";
import { ToastProvider } from "./components/Toast";
import { ThemeProvider } from "./components/ThemeContext";
import "./globals.css";

export const metadata: Metadata = {
  title: "寵BAR - PetLive",
  description: "全台最大的特殊寵物即時競標與直播平台",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-TW" data-theme="dark">
      <body className="antialiased min-h-screen flex flex-col bg-background text-text-primary">
        <ThemeProvider>
          <ToastProvider>
          <NgrokBypass />
          <Navbar />
          <main className="flex-1 flex flex-col items-center pt-24 pb-20 md:pb-0">
            {children}
          </main>
          <BottomNav />
        </ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
