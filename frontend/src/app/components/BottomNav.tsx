"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { useEffect, useState } from "react";

export default function BottomNav() {
  const pathname = usePathname();
  const [isGuest, setIsGuest] = useState(true);

  useEffect(() => {
    setIsGuest(!localStorage.getItem("current_user_id"));
  }, [pathname]);

  const navItems = [
    { name: "首頁", href: "/", icon: "🏠", show: true },
    { name: "直播", href: "/live", icon: "📺", show: true },
    { name: "聊天室", href: "/chat", icon: "💬", show: !isGuest },
    { name: "個人", href: "/profile", icon: "👤", show: true },
  ].filter(item => item.show);

  return (
    <div className="md:hidden fixed bottom-0 w-full bg-surface/90 backdrop-blur-lg border-t border-surface/50 z-50 px-6 py-3 pb-safe">
      <div className="flex justify-between items-center max-w-md mx-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
          return (
            <Link 
              key={item.href} 
              href={item.href}
              className={`flex flex-col items-center space-y-1 transition-colors ${isActive ? 'text-brand' : 'text-text-secondary'}`}
            >
              <span className={`text-2xl ${isActive && item.name === '直播' ? 'animate-pulse text-red-500' : ''}`}>
                {item.icon}
              </span>
              <span className="text-[10px] font-bold">{item.name}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
