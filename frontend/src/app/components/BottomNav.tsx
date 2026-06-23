"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Radio, MessageCircle, User } from "lucide-react";
import { useEffect, useState } from "react";

export default function BottomNav() {
  const pathname = usePathname();
  const [isGuest, setIsGuest] = useState(true);

  useEffect(() => {
    setIsGuest(!localStorage.getItem("current_user_id"));
  }, [pathname]);

  const navItems = [
    { name: "首頁", href: "/", icon: <Home size={24} strokeWidth={2.5} />, show: true },
    { name: "直播", href: "/live", icon: <Radio size={24} strokeWidth={2.5} />, show: true },
    { name: "聊天", href: "/chat", icon: <MessageCircle size={24} strokeWidth={2.5} />, show: !isGuest },
    { name: "我的", href: "/profile", icon: <User size={24} strokeWidth={2.5} />, show: true },
  ].filter(item => item.show);

  return (
    <div className="md:hidden fixed bottom-0 w-full bg-surface/90 backdrop-blur-lg border-t border-white/5 z-50 px-6 py-3 pb-safe">
      <div className="flex justify-between items-center max-w-md mx-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
          return (
            <Link 
              key={item.href} 
              href={item.href}
              className={`flex flex-col items-center space-y-1 transition-all duration-300 ${isActive ? 'text-brand scale-110' : 'text-text-secondary hover:text-white'}`}
            >
              <div className={`relative ${isActive && item.name === '直播' ? 'text-red-500 animate-pulse' : ''}`}>
                {item.icon}
                {isActive && (
                  <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-1 h-1 bg-current rounded-full" />
                )}
              </div>
              <span className={`text-[10px] font-bold ${isActive ? 'opacity-100' : 'opacity-70'}`}>{item.name}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
