"use client";
import { useEffect, useState, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useToast } from "../components/Toast";

interface Product {
  id: string;
  title: string;
  price: number;
  type: string;
  image_url: string;
  views: number;
  status: string;
}

function ProfileContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { showToast } = useToast();
  const [user, setUser] = useState<any>(null);
  const [pricing, setPricing] = useState<any>(null);
  const [notifications, setNotifications] = useState<any[]>([]);
  
  // Tab Management
  const initialTab = searchParams.get('tab') || 'dashboard';
  const [activeMenu, setActiveMenu] = useState(initialTab);
  
  // Specific Tab States
  const [orderFilter, setOrderFilter] = useState('ALL'); // ALL, UNPAID, TOSHIP, SHIPPED, COMPLETED
  const [bidFilter, setBidFilter] = useState('ACTIVE'); // ACTIVE, WON, LOST
  
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const loadUser = async () => {
    const userId = localStorage.getItem("current_user_id");
    if (!userId) {
      window.location.href = '/';
      return;
    }
    const res = await fetch(`/api/users/${userId}`, { headers: { "ngrok-skip-browser-warning": "69420" } });
    const data = await res.json();
    setUser(data);
    
    // 載入通知
    const notifRes = await fetch(`/api/notifications/${userId}`, { headers: { "ngrok-skip-browser-warning": "69420" } });
    if (notifRes.ok) {
      const notifs = await notifRes.json();
      setNotifications(notifs);
    }
  };

  const loadPricing = async () => {
    const res = await fetch('/api/pricing', { headers: { "ngrok-skip-browser-warning": "69420" } });
    const data = await res.json();
    setPricing(data);
  };

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/orders/${orderId}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        showToast("訂單狀態已更新！", "success");
        loadUser();
      } else {
        showToast("更新失敗", "error");
      }
    } catch (err) {
      console.error(err);
      showToast("更新發生錯誤", "error");
    }
  };

  const handleUpgrade = async (type: 'TIER' | 'ADDON', target_tier?: number, addon_name?: string) => {
    if (!confirm('確認進行虛擬扣款並升級嗎？')) return;
    try {
      const res = await fetch(`/api/users/${user.id}/upgrade`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, target_tier, addon_name })
      });
      if (res.ok) {
        showToast("升級成功！請盡情享受新功能🚀", "success");
        loadUser();
      } else {
        showToast("升級失敗", "error");
      }
    } catch (err) {
      showToast("發生錯誤", "error");
    }
  };

  const savePricing = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = {
      admin_id: user.id,
      tier_1_price: Number(formData.get('tier_1_price')),
      tier_2_price: Number(formData.get('tier_2_price')),
      tier_3_price: Number(formData.get('tier_3_price')),
      high_traffic_price: Number(formData.get('high_traffic_price'))
    };
    try {
      const res = await fetch('/api/pricing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (res.ok) {
        showToast("定價更新成功", "success");
        loadPricing();
      }
    } catch (err) {
      showToast("更新失敗", "error");
    }
  };

  const saveSettings = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = {
      name: formData.get('name') as string,
      phone: formData.get('phone') as string,
    };
    try {
      const res = await fetch(`/api/users/${user.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (res.ok) {
        showToast("帳號設定更新成功！", "success");
        loadUser();
      } else {
        showToast("更新失敗", "error");
      }
    } catch (err) {
      showToast("發生錯誤", "error");
    }
  };

  useEffect(() => {
    loadUser();
    loadPricing();
  }, []);

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab) setActiveMenu(tab);
  }, [searchParams]);

  const generateBanner = () => {
    // Generate IG Banner logic
    if (canvasRef.current && user) {
      const ctx = canvasRef.current.getContext('2d');
      if (!ctx) return;
      
      ctx.fillStyle = '#1a1a1a';
      ctx.fillRect(0, 0, 1080, 1920);
      ctx.fillStyle = '#ff4b4b';
      ctx.fillRect(0, 0, 1080, 200);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 80px "Microsoft JhengHei", Arial';
      ctx.textAlign = 'center';
      ctx.fillText('寵BAR - 全台最大特寵平台', 540, 130);
      ctx.font = 'bold 120px "Microsoft JhengHei", Arial';
      ctx.fillStyle = '#ff4b4b';
      ctx.fillText(user.name, 540, 500);
      ctx.font = 'bold 80px "Microsoft JhengHei", Arial';
      ctx.fillStyle = '#ffffff';
      ctx.fillText('🔥 今晚準備開播 🔥', 540, 700);
      
      const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=360x360&data=${encodeURIComponent(window.location.origin)}`;
      const qrImage = new window.Image();
      qrImage.crossOrigin = 'Anonymous';
      qrImage.onload = () => {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(340, 1100, 400, 400);
        ctx.drawImage(qrImage, 360, 1120, 360, 360);
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 50px "Microsoft JhengHei", Arial';
        ctx.fillText('掃描加入直播間', 540, 1600);
        
        // Trigger download
        const link = document.createElement('a');
        link.download = '寵BAR_IG限動宣傳圖.png';
        link.href = canvasRef.current!.toDataURL();
        link.click();
        showToast('IG 宣傳圖已下載！', 'success');
      };
      qrImage.src = qrUrl;
    }
  };

  if (!user) return <div className="p-8 text-center min-h-screen flex items-center justify-center"><div className="animate-pulse text-brand font-bold text-xl">載入中...</div></div>;

  const MENU_ITEMS = [
    { id: 'dashboard', label: '個人首頁', icon: '👤' },
    { id: 'bids', label: '我的出價', icon: '🔨' },
    { id: 'winnings', label: '我的得標', icon: '🏆' },
    { id: 'orders', label: '買到的訂單', icon: '📦' },
    { id: 'watchlist', label: '關注清單', icon: '🤍' },
    { id: 'notifications', label: '通知', icon: '🔔' },
    { id: 'settings', label: '帳號設定', icon: '⚙️' },
    { id: 'credit', label: '信用資訊', icon: '📊' },
  ];

  if (user.role === 'SELLER' || user.role === 'ADMIN') {
    MENU_ITEMS.push({ id: 'seller', label: '賣家管理', icon: '🛠️' });
  }
  MENU_ITEMS.push({ id: 'upgrade', label: '升級中心', icon: '🚀' });

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="flex flex-col md:flex-row gap-8">
        
        {/* Sidebar */}
        <div className="w-full md:w-64 flex-shrink-0">
          <div className="bg-surface border border-surface/50 rounded-2xl p-6 sticky top-28 shadow-sm">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-14 h-14 bg-brand/20 rounded-full flex items-center justify-center text-2xl font-bold text-brand">
                {user.name.charAt(0)}
              </div>
              <div className="overflow-hidden">
                <h2 className="font-bold text-lg truncate">{user.name}</h2>
                <div className="text-xs text-text-secondary mt-1">
                  會員級別：{user.role} 
                  {user.tier === 0 && <span className="ml-2 bg-gray-500 text-white px-2 py-0.5 rounded text-[10px]">純買家</span>}
                  {user.tier === 1 && <span className="ml-2 bg-blue-500 text-white px-2 py-0.5 rounded text-[10px]">買賣</span>}
                  {user.tier === 2 && <span className="ml-2 bg-purple-500 text-white px-2 py-0.5 rounded text-[10px]">買賣競標</span>}
                  {user.tier === 3 && <span className="ml-2 bg-orange-500 text-white px-2 py-0.5 rounded text-[10px]">買賣競標直播</span>}
                </div>
              </div>
            </div>
            
            <nav className="flex flex-col space-y-2">
              {MENU_ITEMS.map(item => (
                <button
                  key={item.id}
                  onClick={() => setActiveMenu(item.id)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-bold text-left ${
                    activeMenu === item.id 
                      ? 'bg-brand/10 text-brand border-l-4 border-brand shadow-sm' 
                      : 'text-text-secondary hover:bg-surface-hover hover:text-text-primary border-l-4 border-transparent'
                  }`}
                >
                  <span className="text-xl">{item.icon}</span>
                  {item.label}
                </button>
              ))}
              
              <div className="my-4 border-t border-surface/50"></div>

            </nav>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 min-w-0">
          
          {/* Dashboard Tab */}
          {activeMenu === 'dashboard' && (
            <div className="space-y-6 animate-fade-in">
              <h1 className="text-3xl font-extrabold mb-6">歡迎回來，{user.name}</h1>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-surface border border-surface/50 rounded-2xl p-6 shadow-sm">
                  <div className="text-text-secondary mb-2">待處理訂單</div>
                  <div className="text-4xl font-black text-brand">
                    {user.orders?.filter((o: any) => o.status === 'NEGOTIATING').length || 0}
                  </div>
                </div>
                <div className="bg-surface border border-surface/50 rounded-2xl p-6 shadow-sm">
                  <div className="text-text-secondary mb-2">最高出價領先中</div>
                  <div className="text-4xl font-black text-green-500">0</div>
                </div>
              </div>
              <canvas ref={canvasRef} width="1080" height="1920" style={{ display: 'none' }}></canvas>
            </div>
          )}

          {/* Orders Tab */}
          {activeMenu === 'winnings' && (
            <div className="animate-fade-in">
              <h2 className="text-2xl font-bold mb-6">🏆 我的得標</h2>
              <div className="bg-surface-hover p-8 rounded-xl text-center text-text-secondary border border-surface/50">
                <span className="text-4xl block mb-2">🏅</span>
                目前沒有得標紀錄。快去拍賣場大展身手吧！
              </div>
            </div>
          )}

          {activeMenu === 'notifications' && (
            <div className="animate-fade-in">
              <h2 className="text-2xl font-bold mb-6">🔔 通知中心</h2>
              <div className="space-y-4">
                {notifications.length === 0 ? (
                  <div className="text-center py-12 text-text-secondary bg-surface rounded-xl border border-surface/50">
                    目前沒有任何通知
                  </div>
                ) : (
                  notifications.map(notif => (
                    <div key={notif.id} className={`p-4 border rounded-xl flex gap-4 ${notif.read ? 'bg-surface border-surface/50 opacity-70' : 'bg-brand/10 border-brand/30'}`}>
                      <div className="text-2xl">{notif.title.includes('歡迎') ? '🎉' : '🔔'}</div>
                      <div>
                        <h4 className={`font-bold ${notif.read ? 'text-text-primary' : 'text-brand'}`}>{notif.title}</h4>
                        <p className="text-sm text-text-secondary">{notif.content}</p>
                        <span className="text-xs text-text-secondary mt-1 block">
                          {new Date(notif.created_at).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {activeMenu === 'settings' && (
            <div className="animate-fade-in">
              <h2 className="text-2xl font-bold mb-6">⚙️ 帳號設定</h2>
              <form onSubmit={saveSettings} className="space-y-6 max-w-2xl">
                <div className="bg-surface border border-surface/50 p-6 rounded-xl">
                  <h3 className="font-bold mb-4 border-b border-surface/50 pb-2">個人檔案</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm text-text-secondary block mb-1">顯示名稱</label>
                      <input name="name" type="text" defaultValue={user.name} className="w-full bg-background border border-surface-hover rounded-lg px-4 py-2" required />
                    </div>
                    <div>
                      <label className="text-sm text-text-secondary block mb-1">手機號碼</label>
                      <input name="phone" type="text" defaultValue={user.phone} className="w-full bg-background border border-surface-hover rounded-lg px-4 py-2" />
                    </div>
                  </div>
                </div>
                <button type="submit" className="bg-brand text-white px-6 py-2 rounded-lg font-bold hover:bg-brand/90 transition-colors">儲存設定</button>
              </form>
            </div>
          )}

          {activeMenu === 'credit' && (
            <div className="animate-fade-in">
              <h2 className="text-2xl font-bold mb-6">📊 信用資訊</h2>
              <div className="bg-surface border border-surface/50 p-8 rounded-xl flex flex-col md:flex-row gap-8 items-center">
                <div className="relative w-32 h-32 flex items-center justify-center">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                    <path className="text-surface-hover" strokeWidth="3" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                    <path className="text-green-500" strokeWidth="3" strokeDasharray={`${(user.credit_score / 200) * 100}, 100`} strokeLinecap="round" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                  </svg>
                  <div className="absolute flex flex-col items-center">
                    <span className="text-3xl font-black text-green-500">{user.credit_score}</span>
                    <span className="text-xs text-text-secondary">分</span>
                  </div>
                </div>
                <div>
                  <h3 className="text-xl font-bold mb-2 text-white">信用評分優良</h3>
                  <p className="text-text-secondary mb-4">您的信用評分高於 80% 的用戶。保持良好的交易與按時取件習慣，能讓您享有更多專屬權限（例如免運費優惠）。</p>
                  <ul className="text-sm space-y-2 text-text-secondary">
                    <li>✅ 過去 90 天無棄標紀錄</li>
                    <li>✅ 身分實名認證通過</li>
                    <li>✅ 完成 0 筆交易爭議</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {activeMenu === 'upgrade' && pricing && (
            <div className="animate-fade-in space-y-8">
              <h1 className="text-3xl font-extrabold mb-6">🚀 升級中心</h1>
              
              <div className="bg-gradient-to-r from-brand/20 to-purple-500/20 border border-brand/30 p-8 rounded-2xl relative overflow-hidden">
                <div className="absolute -right-10 -top-10 text-9xl opacity-10">🚀</div>
                <h2 className="text-2xl font-bold mb-2">解鎖更多賣家強大功能</h2>
                <p className="text-text-secondary mb-6 max-w-lg">
                  提升您的帳號等級，解鎖商品上架、競標系統甚至是萬人直播間。打造您的專屬寵物商業帝國！
                </p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Tier 1 */}
                  <div className={`p-6 rounded-xl border ${user.tier >= 1 ? 'bg-surface/50 border-green-500/50' : 'bg-surface border-surface/50'} flex flex-col`}>
                    <h3 className="font-bold text-lg mb-1">一般買賣</h3>
                    <div className="text-xs text-text-secondary mb-4">解鎖直購商品上架權限</div>
                    <div className="text-2xl font-bold text-brand mb-4">NT$ {pricing.tier_1_price}</div>
                    <ul className="text-sm space-y-2 mb-6 flex-1 text-text-secondary">
                      <li>✅ 無限上架一般商品</li>
                      <li>✅ 專屬賣家儀表板</li>
                      <li>✅ 買賣留言管理</li>
                    </ul>
                    {user.tier >= 1 ? (
                      <button disabled className="w-full py-2 bg-green-500/20 text-green-500 rounded font-bold">已解鎖</button>
                    ) : user.tier === 0 ? (
                      <button onClick={() => handleUpgrade('TIER', 1)} className="w-full py-2 bg-brand text-white rounded font-bold hover:bg-brand/90 transition-colors">立即升級</button>
                    ) : (
                      <button disabled className="w-full py-2 bg-surface-hover text-text-secondary rounded font-bold">需先解鎖前置等級</button>
                    )}
                  </div>

                  {/* Tier 2 */}
                  <div className={`p-6 rounded-xl border ${user.tier >= 2 ? 'bg-surface/50 border-green-500/50' : 'bg-surface border-surface/50'} flex flex-col`}>
                    <h3 className="font-bold text-lg mb-1">買賣競標</h3>
                    <div className="text-xs text-text-secondary mb-4">解鎖拍賣系統權限</div>
                    <div className="text-2xl font-bold text-brand mb-4">NT$ {pricing.tier_2_price}</div>
                    <ul className="text-sm space-y-2 mb-6 flex-1 text-text-secondary">
                      <li>✅ 包含「一般買賣」權限</li>
                      <li>✅ 建立競標拍賣商品</li>
                      <li>✅ 代理出價與防狙擊功能</li>
                    </ul>
                    {user.tier >= 2 ? (
                      <button disabled className="w-full py-2 bg-green-500/20 text-green-500 rounded font-bold">已解鎖</button>
                    ) : user.tier === 1 ? (
                      <button onClick={() => handleUpgrade('TIER', 2)} className="w-full py-2 bg-brand text-white rounded font-bold hover:bg-brand/90 transition-colors">立即升級</button>
                    ) : (
                      <button disabled className="w-full py-2 bg-surface-hover text-text-secondary rounded font-bold">需先解鎖前置等級</button>
                    )}
                  </div>

                  {/* Tier 3 */}
                  <div className={`p-6 rounded-xl border ${user.tier >= 3 ? 'bg-surface/50 border-green-500/50' : 'bg-surface border-purple-500/50 relative'} flex flex-col`}>
                    {user.tier < 3 && <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-purple-500 text-white text-[10px] px-2 py-0.5 rounded-full font-bold">最高階</div>}
                    <h3 className="font-bold text-lg mb-1">直播帶貨</h3>
                    <div className="text-xs text-text-secondary mb-4">解鎖萬人直播間權限</div>
                    <div className="text-2xl font-bold text-purple-500 mb-4">NT$ {pricing.tier_3_price}</div>
                    <ul className="text-sm space-y-2 mb-6 flex-1 text-text-secondary">
                      <li>✅ 包含前階所有權限</li>
                      <li>✅ 開啟即時直播間</li>
                      <li>✅ 直播間互動抽獎</li>
                    </ul>
                    {user.tier >= 3 ? (
                      <button disabled className="w-full py-2 bg-green-500/20 text-green-500 rounded font-bold">已解鎖</button>
                    ) : user.tier === 2 ? (
                      <button onClick={() => handleUpgrade('TIER', 3)} className="w-full py-2 bg-purple-500 text-white rounded font-bold hover:bg-purple-600 transition-colors">立即升級</button>
                    ) : (
                      <button disabled className="w-full py-2 bg-surface-hover text-text-secondary rounded font-bold">需先解鎖前置等級</button>
                    )}
                  </div>
                </div>
              </div>

              {/* Add-on Features (Only visible to Tier 3) */}
              {user.tier >= 3 && (
                <div className="bg-surface border border-surface/50 p-6 rounded-xl flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-xl text-yellow-500 flex items-center gap-2">⭐ 高流量直播解鎖</h3>
                    <p className="text-sm text-text-secondary mt-1 max-w-xl">
                      直播將會在直播大廳置頂排序，並享有專屬金色特效外框，大幅提升點擊率與銷售轉換！
                    </p>
                    <div className="font-bold text-brand mt-2">加購價 NT$ {pricing.high_traffic_price}</div>
                  </div>
                  <div>
                    {user.addons?.includes('HIGH_TRAFFIC_LIVE') ? (
                      <button disabled className="px-6 py-3 bg-green-500/20 text-green-500 rounded-xl font-bold">已啟用</button>
                    ) : (
                      <button onClick={() => handleUpgrade('ADDON', undefined, 'HIGH_TRAFFIC_LIVE')} className="px-6 py-3 bg-yellow-500 text-black hover:bg-yellow-400 rounded-xl font-bold transition-all shadow-lg shadow-yellow-500/20">立即解鎖</button>
                    )}
                  </div>
                </div>
              )}

              {/* Admin Pricing Panel */}
              {user.role === 'ADMIN' && (
                <div className="mt-12 bg-red-500/10 border border-red-500/30 p-6 rounded-xl">
                  <h3 className="font-bold text-red-500 mb-4 flex items-center gap-2">⚙️ [管理員] 定價設定</h3>
                  <form onSubmit={savePricing} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs text-text-secondary block mb-1">一般買賣定價</label>
                      <input name="tier_1_price" type="number" defaultValue={pricing.tier_1_price} className="w-full bg-background border border-surface rounded px-3 py-2" required />
                    </div>
                    <div>
                      <label className="text-xs text-text-secondary block mb-1">買賣競標定價</label>
                      <input name="tier_2_price" type="number" defaultValue={pricing.tier_2_price} className="w-full bg-background border border-surface rounded px-3 py-2" required />
                    </div>
                    <div>
                      <label className="text-xs text-text-secondary block mb-1">直播帶貨定價</label>
                      <input name="tier_3_price" type="number" defaultValue={pricing.tier_3_price} className="w-full bg-background border border-surface rounded px-3 py-2" required />
                    </div>
                    <div>
                      <label className="text-xs text-text-secondary block mb-1">高流量加值定價</label>
                      <input name="high_traffic_price" type="number" defaultValue={pricing.high_traffic_price} className="w-full bg-background border border-surface rounded px-3 py-2" required />
                    </div>
                    <div className="md:col-span-2 mt-2">
                      <button type="submit" className="bg-red-500 hover:bg-red-600 text-white px-6 py-2 rounded font-bold transition-colors">儲存新定價</button>
                    </div>
                  </form>
                </div>
              )}
            </div>
          )}

          {activeMenu === 'orders' && (
            <div className="animate-fade-in">
              <h1 className="text-2xl font-extrabold mb-6">訂單查詢</h1>
              
              <div className="flex gap-2 overflow-x-auto pb-4 mb-6 scrollbar-hide">
                {['ALL', 'UNPAID', 'TOSHIP', 'SHIPPED', 'COMPLETED'].map(status => {
                  const label = status === 'ALL' ? '全部訂單' : 
                                status === 'UNPAID' ? '未付款' : 
                                status === 'TOSHIP' ? '待出貨' : 
                                status === 'SHIPPED' ? '已出貨' : '已完成';
                  return (
                    <button
                      key={status}
                      onClick={() => setOrderFilter(status)}
                      className={`px-5 py-2 rounded-full font-bold whitespace-nowrap transition-colors ${
                        orderFilter === status ? 'bg-brand text-white shadow-md' : 'bg-surface border border-surface/50 text-text-secondary hover:bg-surface-hover'
                      }`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>

              <div className="space-y-4">
                {user.orders?.length === 0 ? (
                  <div className="text-center py-20 bg-surface rounded-2xl border border-surface/50 text-text-secondary">
                    <div className="text-5xl mb-4">📦</div>
                    <div>目前沒有訂單紀錄</div>
                  </div>
                ) : (
                  user.orders?.map((order: any) => (
                    <div key={order.id} className="bg-surface border border-surface/50 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row gap-6">
                      <div className="flex-1">
                        <div className="flex justify-between items-center mb-4">
                          <div className="font-bold text-lg text-brand">訂單編號 #{order.id.substring(0,8).toUpperCase()}</div>
                          <div className={`px-3 py-1 rounded-full text-xs font-bold ${
                            order.status === 'NEGOTIATING' ? 'bg-yellow-500/20 text-yellow-500' : 'bg-gray-500/20 text-gray-500'
                          }`}>
                            {order.status === 'NEGOTIATING' ? '處理中' : order.status}
                          </div>
                        </div>
                        <div className="space-y-2">
                          {order.items?.map((item: any, idx: number) => (
                            <div key={idx} className="flex justify-between text-sm">
                              <span className="truncate pr-4">{item.title || '商品'}</span>
                              <span className="text-text-secondary flex-shrink-0">x{item.quantity}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="md:w-48 flex flex-col justify-end items-end border-t md:border-t-0 md:border-l border-surface/50 pt-4 md:pt-0 md:pl-6">
                        <div className="text-text-secondary text-sm mb-1">訂單總計</div>
                        <div className="text-2xl font-black text-brand mb-4">NT$ {order.total_amount?.toLocaleString() || 0}</div>
                        
                        <div className="flex flex-col gap-2 w-full">
                          {(user.role === 'SELLER' || user.role === 'ADMIN') && order.status === 'NEGOTIATING' && (
                            <button 
                              onClick={() => updateOrderStatus(order.id, 'SHIPPED')}
                              className="w-full bg-brand text-white py-2 rounded-lg font-bold transition-colors shadow-lg shadow-brand/30 hover:bg-brand/90"
                            >
                              確認出貨
                            </button>
                          )}
                          {user.id === order.buyer_id && order.status === 'SHIPPED' && (
                            <button 
                              onClick={() => updateOrderStatus(order.id, 'COMPLETED')}
                              className="w-full bg-green-500 text-white py-2 rounded-lg font-bold transition-colors shadow-lg shadow-green-500/30 hover:bg-green-600"
                            >
                              確認收貨 (完成訂單)
                            </button>
                          )}
                          <button className="w-full bg-surface-hover hover:bg-surface border border-surface/50 text-text-primary py-2 rounded-lg font-bold transition-colors">
                            聯絡對手方
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Bids Tab */}
          {activeMenu === 'bids' && (
            <div className="animate-fade-in">
              <h1 className="text-2xl font-extrabold mb-6">我的競標</h1>
              <div className="flex gap-2 mb-6">
                {['ACTIVE', 'WON', 'LOST'].map(status => {
                  const label = status === 'ACTIVE' ? '進行中' : status === 'WON' ? '已得標' : '未得標';
                  return (
                    <button
                      key={status}
                      onClick={() => setBidFilter(status)}
                      className={`px-5 py-2 rounded-full font-bold transition-colors ${
                        bidFilter === status ? 'bg-brand text-white' : 'bg-surface border border-surface/50 text-text-secondary hover:bg-surface-hover'
                      }`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
              <div className="text-center py-20 bg-surface rounded-2xl border border-surface/50 text-text-secondary">
                <div className="text-5xl mb-4">🔨</div>
                <div>尚無競標紀錄</div>
                <div className="text-sm mt-2 opacity-50">快去競標專區尋寶吧！</div>
              </div>
            </div>
          )}

          {/* Watchlist Tab */}
          {activeMenu === 'watchlist' && (
            <div className="animate-fade-in">
              <h1 className="text-2xl font-extrabold mb-6">關注清單</h1>
              <div className="text-center py-20 bg-surface rounded-2xl border border-surface/50 text-text-secondary">
                <div className="text-5xl mb-4">❤️</div>
                <div>尚未追蹤任何賣家或商品</div>
              </div>
            </div>
          )}

          {/* Seller Tools Tab */}
          {activeMenu === 'seller' && (
            <div className="animate-fade-in">
              <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-extrabold">賣家管理</h1>
                <div className="flex gap-3">
                  <button onClick={generateBanner} className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold rounded-lg shadow-sm hover:opacity-90 text-sm">
                    ✨ 製作宣傳圖
                  </button>
                  <Link href="/seller/upload">
                    <button className="px-4 py-2 bg-brand text-white font-bold rounded-lg shadow-sm hover:opacity-90 text-sm">
                      ＋ 上架商品
                    </button>
                  </Link>
                </div>
              </div>

              {/* Tools Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                <div className="bg-surface border border-surface/50 rounded-xl p-5 relative overflow-hidden group hover:border-brand transition-colors cursor-pointer">
                  <div className="absolute top-0 right-0 bg-brand text-white text-[10px] font-bold px-2 py-1 rounded-bl-xl">專屬</div>
                  <div className="text-3xl mb-3">📝</div>
                  <h3 className="font-bold text-lg mb-1">貓狗特寵簽約系統</h3>
                  <p className="text-sm text-text-secondary">數位化電子簽約，安全有保障</p>
                </div>
                <div className="bg-surface border border-surface/50 rounded-xl p-5 relative overflow-hidden group hover:border-brand transition-colors cursor-pointer">
                  <div className="absolute top-0 right-0 bg-brand text-white text-[10px] font-bold px-2 py-1 rounded-bl-xl">專屬</div>
                  <div className="text-3xl mb-3">🤝</div>
                  <h3 className="font-bold text-lg mb-1">認養公版合約系統</h3>
                  <p className="text-sm text-text-secondary">專為認養設計的標準公版合約</p>
                </div>
                <div className="bg-surface border border-surface/50 rounded-xl p-5 relative overflow-hidden group hover:border-brand transition-colors cursor-pointer">
                  <div className="absolute top-0 right-0 bg-brand text-white text-[10px] font-bold px-2 py-1 rounded-bl-xl">專屬</div>
                  <div className="text-3xl mb-3">🧬</div>
                  <h3 className="font-bold text-lg mb-1">貓狗/爬蟲基因計算機</h3>
                  <p className="text-sm text-text-secondary">計算後代基因型與表現型</p>
                </div>
              </div>
              
              {/* Profile Link Banner */}
              <div className="bg-gradient-to-r from-brand/10 to-purple-500/10 border border-brand/20 rounded-xl p-6 mb-8 flex flex-col md:flex-row justify-between items-center gap-4">
                <div>
                  <h3 className="font-bold text-lg mb-1">📸 我的專屬公開主頁與動態牆</h3>
                  <p className="text-sm text-text-secondary">在您的公開主頁上傳最新飼養紀錄、管理 IG 同步與直播重播 (VOD)。</p>
                </div>
                <Link href={`/seller/${user.id}?tab=POSTS`}>
                  <button className="whitespace-nowrap px-6 py-2 bg-brand text-white font-bold rounded-lg hover:bg-brand/90 transition-colors shadow-md">
                    前往管理動態牆 ➔
                  </button>
                </Link>
              </div>

              <h2 className="text-xl font-bold mb-4">📦 商品管理</h2>
              {user.my_products?.length === 0 ? (
                <div className="text-center py-12 text-text-secondary bg-surface rounded-2xl border border-surface/50">
                  <div className="text-4xl mb-4">📦</div>
                  <h3 className="text-lg font-bold">尚無上架商品</h3>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                  {user.my_products?.map((product: any) => {
                    const isDeleted = product.status === 'DELETED';
                    
                    const CardContent = (
                      <div className={`bg-surface rounded-xl overflow-hidden shadow-sm transition-all border border-surface/50 flex flex-col h-full relative ${isDeleted ? 'cursor-not-allowed' : 'hover:shadow-md hover:border-brand'}`}>
                        {/* Tags */}
                        <div className="absolute top-2 left-2 z-10 flex flex-col space-y-1">
                          <span className={`text-[10px] px-2 py-0.5 rounded shadow-sm font-bold text-white ${product.type === 'BID' ? 'bg-red-500' : 'bg-brand'}`}>
                            {product.type === 'BID' ? '競標' : '直購'}
                          </span>
                          {!isDeleted && (
                            <span className={`text-[10px] px-2 py-0.5 rounded shadow-sm font-bold text-white ${product.status === 'ACTIVE' ? 'bg-green-500' : 'bg-gray-500'}`}>
                              {product.status === 'ACTIVE' ? '上架中' : '已下架'}
                            </span>
                          )}
                        </div>
                        
                        {/* Top Right "Already Ended" Tag for Deleted */}
                        {isDeleted && (
                          <div className="absolute top-2 right-2 z-10">
                            <span className="text-xs px-2 py-1 rounded bg-black/70 backdrop-blur-sm text-white font-bold border border-white/20">
                              已經結束
                            </span>
                          </div>
                        )}

                        <div className="relative h-40 w-full overflow-hidden bg-background">
                          {product.image_url ? (
                            <Image src={product.image_url} alt={product.title} fill className="object-cover group-hover:scale-105 transition-transform duration-300" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-text-secondary text-xs">無圖</div>
                          )}
                        </div>
                        <div className="p-4 flex-1 flex flex-col">
                          <h3 className="font-bold text-sm mb-1 truncate">{product.title}</h3>
                          <div className="flex justify-between items-end mt-auto pt-2">
                            <span className="text-xs text-text-secondary">👀 {product.views} 次觀看</span>
                            <span className="font-bold text-brand">NT$ {(product.price || product.current_price || 0).toLocaleString()} {product.type === 'BID' ? '起' : ''}</span>
                          </div>
                        </div>
                      </div>
                    );

                    return (
                      <div key={product.id} className={`relative group ${isDeleted ? 'grayscale opacity-60' : ''}`}>
                        {isDeleted ? CardContent : <Link href={`/product/${product.id}`}>{CardContent}</Link>}
                        
                      {!isDeleted && (
                        <div className="absolute top-2 right-2 flex flex-col gap-2 z-20 opacity-0 group-hover:opacity-100 transition-opacity">
                          {/* Toggle Status Button */}
                          <button
                            onClick={async (e) => {
                              e.preventDefault();
                              const newStatus = product.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
                              try {
                                const res = await fetch(`/api/products/${product.id}/status`, { 
                                  method: 'POST',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({ status: newStatus })
                                });
                                if (res.ok) {
                                  showToast(newStatus === 'ACTIVE' ? "商品已重新上架" : "商品已下架", "success");
                                  loadUser();
                                }
                              } catch (err) {
                                showToast("操作失敗", "error");
                              }
                            }}
                            className={`w-8 h-8 flex items-center justify-center rounded-full shadow-md text-white ${product.status === 'ACTIVE' ? 'bg-orange-500 hover:bg-orange-600' : 'bg-green-500 hover:bg-green-600'}`}
                            title={product.status === 'ACTIVE' ? "下架商品" : "重新上架"}
                          >
                            {product.status === 'ACTIVE' ? '⬇️' : '⬆️'}
                          </button>

                          {/* Delete Product Button */}
                          <button
                            onClick={async (e) => {
                              e.preventDefault();
                              if (confirm("確定要刪除這項商品嗎？")) {
                                try {
                                  const res = await fetch(`/api/products/${product.id}`, { method: 'DELETE' });
                                  if (res.ok) {
                                    showToast("商品已刪除", "success");
                                    loadUser();
                                  }
                                } catch (err) {
                                  showToast("刪除失敗", "error");
                                }
                              }
                            }}
                            className="bg-red-500/90 text-white w-8 h-8 flex items-center justify-center rounded-full shadow-md hover:bg-red-600"
                            title="刪除商品"
                          >
                            ✕
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

export default function Profile() {
  return (
    <Suspense fallback={<div className="p-8 text-center min-h-screen flex items-center justify-center"><div className="animate-pulse text-brand font-bold text-xl">載入中...</div></div>}>
      <ProfileContent />
    </Suspense>
  );
}
