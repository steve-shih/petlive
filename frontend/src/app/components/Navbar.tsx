"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "./ThemeContext";

export default function Navbar() {
  const { theme, setTheme } = useTheme();
  const [isScrolled, setIsScrolled] = useState(false);
  const [users, setUsers] = useState<any[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [adminUserId, setAdminUserId] = useState<string | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    fetch("/api/users", { headers: { "ngrok-skip-browser-warning": "69420" } })
      .then(res => {
        if (!res.ok) throw new Error("Network response was not ok");
        return res.json();
      })
      .then(data => {
        setUsers(data);
        const savedId = localStorage.getItem("current_user_id");
        const savedAdminId = localStorage.getItem("admin_user_id");
        if (savedAdminId) setAdminUserId(savedAdminId);
        
        if (savedId) {
          const u = data.find((user: any) => user.id === savedId);
          if (u) setCurrentUser(u);
          else {
            localStorage.removeItem("current_user_id");
            setCurrentUser(null);
          }
        } else {
          setCurrentUser(null);
        }
      })
      .catch(err => {
        console.error("Failed to fetch users:", err);
      });
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("current_user_id");
    localStorage.removeItem("admin_user_id");
    setCurrentUser(null);
    setShowDropdown(false);
    window.location.reload();
  };

  const impersonateUser = (testUser: any) => {
    if (!adminUserId) {
      localStorage.setItem("admin_user_id", currentUser.id);
    }
    localStorage.setItem("current_user_id", testUser.id);
    setShowDropdown(false);
    window.location.reload();
  };

  const exitImpersonation = () => {
    if (adminUserId) {
      localStorage.setItem("current_user_id", adminUserId);
      localStorage.removeItem("admin_user_id");
      setShowDropdown(false);
      window.location.reload();
    }
  };

  const onUserClick = () => {
    if (!currentUser) {
      router.push('/login');
    } else {
      setShowDropdown(!showDropdown);
    }
  };

  return (
    <>
    {adminUserId && (
      <div className="fixed top-0 w-full z-[60] bg-red-600 text-white text-center py-1 font-bold text-sm flex justify-center items-center space-x-4 shadow-md">
        <span>🛠️ 管理員模式下切入 {currentUser?.name} 帳號</span>
        <button onClick={exitImpersonation} className="bg-white text-red-600 px-3 py-0.5 rounded-full text-xs hover:bg-gray-100 transition-colors">
          返回管理員
        </button>
      </div>
    )}
    <nav className={`fixed ${adminUserId ? 'top-8' : 'top-0'} w-full z-50 transition-all duration-300 ${isScrolled ? 'bg-background/80 backdrop-blur-md shadow-sm border-b border-surface' : 'bg-transparent'}`}>
      <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
        <div className="flex items-center space-x-12">
          <Link href="/" className="text-3xl font-extrabold tracking-tighter text-brand">
            寵BAR
          </Link>
          {/* Desktop Links - Hidden on Mobile */}
          <div className="hidden md:flex space-x-6">
            <Link href="/" className="text-text-secondary hover:text-brand transition-colors font-medium">首頁</Link>
            <Link href="/live" className="text-red-500 hover:text-red-600 transition-colors font-bold flex items-center space-x-1">
              <span className="animate-pulse">●</span>
              <span>LIVE直播</span>
            </Link>
            {currentUser && (
              <>
                <Link href="/chat" className="text-text-secondary hover:text-brand transition-colors font-medium">聊天室</Link>
                <Link href="/cart" className="text-text-secondary hover:text-brand transition-colors font-medium">購物車</Link>
              </>
            )}
            {currentUser?.role === 'SELLER' && (
              <Link href="/seller/upload" className="text-brand font-bold">上架商品</Link>
            )}
          </div>
        </div>

        {/* Right side icons & Search */}
        <div className="flex items-center space-x-4 md:space-x-6">
          
          {/* Theme Toggle Dropdown */}
          <div className="relative group">
            <button className="flex items-center justify-center w-10 h-10 rounded-full bg-surface hover:bg-surface-hover transition-colors">
              {theme === 'dark' ? '🌙' : theme === 'light' ? '☀️' : '🌫️'}
            </button>
            <div className="absolute right-0 mt-2 w-32 bg-background border border-surface/50 rounded-2xl shadow-xl overflow-hidden py-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
              <button onClick={() => setTheme('dark')} className={`w-full text-left px-4 py-2 text-sm hover:bg-surface/50 ${theme === 'dark' ? 'text-brand' : ''}`}>🌙 深色系</button>
              <button onClick={() => setTheme('light')} className={`w-full text-left px-4 py-2 text-sm hover:bg-surface/50 ${theme === 'light' ? 'text-brand' : ''}`}>☀️ 淡色系</button>
              <button onClick={() => setTheme('gray')} className={`w-full text-left px-4 py-2 text-sm hover:bg-surface/50 ${theme === 'gray' ? 'text-brand' : ''}`}>🌫️ 灰色系</button>
            </div>
          </div>

          {/* User Dropdown */}
          <div className="relative">
            <button 
              onClick={onUserClick}
              className={`flex items-center space-x-2 bg-surface hover:bg-surface/80 border px-4 py-2 rounded-full transition-colors ${!currentUser ? 'border-brand/50 shadow-sm' : 'border-surface/50'}`}
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${!currentUser ? 'bg-brand text-white' : 'bg-brand/10 text-brand'}`}>
                {currentUser ? (currentUser.name?.charAt(0) || '?') : '登入'}
              </div>
              <div className="flex flex-col items-start text-xs text-left">
                <span className="font-bold text-text-primary">{currentUser?.name || '訪客模式'}</span>
                <span className="text-text-secondary">{currentUser?.role || '點此登入 / 註冊'}</span>
              </div>
              {currentUser && <span className="text-text-secondary ml-2">▼</span>}
            </button>

            {showDropdown && currentUser && (
              <div className="absolute right-0 mt-2 w-64 bg-background border border-surface/50 rounded-2xl shadow-xl overflow-hidden py-2">
                
                {(currentUser.role === 'ADMIN' || adminUserId) && (
                  <>
                    <div className="px-4 py-2 text-xs font-bold text-red-500 uppercase tracking-wider bg-red-500/10">
                      🛠️ 切換測試帳號 (ADMIN)
                    </div>
                    {users.filter(u => u.is_test).map(user => (
                      <button
                        key={user.id}
                        onClick={() => impersonateUser(user)}
                        className={`w-full text-left px-4 py-3 flex items-center justify-between hover:bg-surface/50 transition-colors ${currentUser.id === user.id ? 'bg-brand/5' : ''}`}
                      >
                        <div>
                          <div className="font-bold text-text-primary text-sm">{user.name}</div>
                          <div className="text-xs text-text-secondary">{user.role} - 信用: {user.credit_score}</div>
                        </div>
                        {currentUser.id === user.id && <span className="text-brand text-xl">✓</span>}
                      </button>
                    ))}
                  </>
                )}
                
                <div className="py-2 border-t border-surface/50 mt-2">
                  <Link href="/profile?tab=bids" onClick={() => setShowDropdown(false)} className="w-full px-6 py-2.5 flex items-center gap-3 text-sm text-text-secondary hover:text-brand hover:bg-surface/50 transition-colors">
                    <span>🔨</span> 我的出價
                  </Link>
                  <Link href="/profile?tab=winnings" onClick={() => setShowDropdown(false)} className="w-full px-6 py-2.5 flex items-center gap-3 text-sm text-text-secondary hover:text-brand hover:bg-surface/50 transition-colors">
                    <span>🏆</span> 我的得標
                  </Link>
                  <Link href="/profile?tab=orders" onClick={() => setShowDropdown(false)} className="w-full px-6 py-2.5 flex items-center gap-3 text-sm text-text-secondary hover:text-brand hover:bg-surface/50 transition-colors">
                    <span>📦</span> 買到的訂單
                  </Link>
                  <Link href="/profile?tab=wishlist" onClick={() => setShowDropdown(false)} className="w-full px-6 py-2.5 flex items-center gap-3 text-sm text-text-secondary hover:text-brand hover:bg-surface/50 transition-colors">
                    <span>🤍</span> 關注清單
                  </Link>
                  <Link href="/profile?tab=notifications" onClick={() => setShowDropdown(false)} className="w-full px-6 py-2.5 flex items-center gap-3 text-sm text-text-secondary hover:text-brand hover:bg-surface/50 transition-colors">
                    <span>🔔</span> 通知
                  </Link>
                  <Link href="/settings" onClick={() => setShowDropdown(false)} className="w-full px-6 py-2.5 flex items-center gap-3 text-sm text-text-secondary hover:text-brand hover:bg-surface/50 transition-colors">
                    <span>⚙️</span> 帳號設定
                  </Link>
                  <Link href="/profile?tab=credit" onClick={() => setShowDropdown(false)} className="w-full px-6 py-2.5 flex items-center gap-3 text-sm text-text-secondary hover:text-brand hover:bg-surface/50 transition-colors">
                    <span>📊</span> 信用資訊
                  </Link>
                  <div className="h-px bg-surface/50 my-1 mx-4"></div>
                  <button onClick={handleLogout} className="w-full px-6 py-2.5 flex items-center gap-3 text-sm text-red-500 hover:text-red-600 hover:bg-red-500/10 transition-colors">
                    <span>🚪</span> 登出
                  </button>
                </div>
              </div>
            )}
          </div>
          
        </div>
      </div>
    </nav>
    </>
  );
}
