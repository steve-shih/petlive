"use client";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import Navbar from "./Navbar";
import BottomNav from "./BottomNav";
import Footer from "./Footer";
import NgrokBypass from "./NgrokBypass";

export default function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLiveRoomPage = pathname.startsWith("/live/") && pathname.length > 6;
  
  const [isMobile, setIsMobile] = useState(true);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  if (isLiveRoomPage) {
    return (
      <>
        <NgrokBypass />
        <main className="fixed inset-0 overflow-hidden bg-black text-white z-[9999] touch-none flex items-center justify-center">
          {children}
        </main>
      </>
    );
  }

  return (
    <>
      <NgrokBypass />
      <Navbar />
      <main className={`flex-1 flex flex-col items-center ${isLiveRoomPage && !isMobile ? 'pt-20 h-screen overflow-hidden bg-background' : 'pt-24 pb-20 md:pb-0'}`}>
        {children}
      </main>
      <BottomNav />
      <Footer />
    </>
  );
}
