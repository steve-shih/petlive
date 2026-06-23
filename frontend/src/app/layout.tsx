import type { Metadata } from "next";
import { ToastProvider } from "./components/Toast";
import { ThemeProvider } from "./components/ThemeContext";
import { GoogleOAuthProvider } from "@react-oauth/google";
import LayoutWrapper from "./components/LayoutWrapper";
import "./globals.css";

export const metadata: Metadata = {
  title: "寵BAR - PetBar",
  description: "全台最大的特殊寵物即時競標與直播平台",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Use env variable or fallback to a placeholder for testing
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "788146443516-97ieiv3lpoauiehkpk7cnqnv82tqgh0v.apps.googleusercontent.com";

  return (
    <html lang="zh-TW" data-theme="dark">
      <body className="antialiased min-h-screen flex flex-col bg-background text-text-primary" suppressHydrationWarning>
        <GoogleOAuthProvider clientId={clientId}>
          <ThemeProvider>
            <ToastProvider>
              <LayoutWrapper>
                {children}
              </LayoutWrapper>
            </ToastProvider>
          </ThemeProvider>
        </GoogleOAuthProvider>
      </body>
    </html>
  );
}
