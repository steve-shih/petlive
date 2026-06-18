"use client";
import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useToast } from "../components/Toast";

interface Order {
  id: string;
  total_price: number;
  created_at: string;
  status: string;
}

interface Media {
  id: string;
  type: string;
  url: string;
  created_at: string;
}

interface Product {
  id: string;
  title: string;
  price: number;
  type: string;
  image_url: string;
  views: number;
  status: string;
}

export default function Profile() {
  const router = useRouter();
  const { showToast } = useToast();
  const [user, setUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState("products");
  const [showTestAccounts, setShowTestAccounts] = useState(false);
  const [testAccounts, setTestAccounts] = useState<any[]>([]);

  const deleteMedia = async (mediaId: string) => {
    if (!confirm("確定要刪除這段錄影嗎？")) return;
    try {
      await fetch(`/api/media/${mediaId}`, { method: 'DELETE' });
      fetchLiveRecords(user.id);
    } catch (err) { console.error(err); }
  };

  const generateBanner = () => {
    setShowSocialModal(true);
    setTimeout(() => {
      if (canvasRef.current && user) {
        const ctx = canvasRef.current.getContext('2d');
        if (!ctx) return;
        
        // Background
        ctx.fillStyle = '#1a1a1a';
        ctx.fillRect(0, 0, 1080, 1920); // IG Story size
        
        // Accent Header
        ctx.fillStyle = '#ff4b4b'; // Brand color
        ctx.fillRect(0, 0, 1080, 200);
        
        // Logo Text
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 80px "Microsoft JhengHei", Arial';
        ctx.textAlign = 'center';
        ctx.fillText('寵BAR - 全台最大特寵平台', 540, 130);
        
        // Seller Name
        ctx.font = 'bold 120px "Microsoft JhengHei", Arial';
        ctx.fillStyle = '#ff4b4b';
        ctx.fillText(user.name, 540, 500);
        
        ctx.font = 'bold 80px "Microsoft JhengHei", Arial';
        ctx.fillStyle = '#ffffff';
        ctx.fillText('🔥 今晚準備開播 🔥', 540, 700);
        
        ctx.font = '60px "Microsoft JhengHei", Arial';
        ctx.fillStyle = '#aaaaaa';
        ctx.fillText('稀有活體 / 競標撿漏 / 專業周邊', 540, 900);
        
        // QR Code Background
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(340, 1100, 400, 400);
        
        // Load QR Code from external API
        const ngrokUrl = window.location.origin;
        const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=360x360&data=${encodeURIComponent(ngrokUrl)}`;
        const qrImage = new window.Image();
        qrImage.crossOrigin = 'Anonymous';
        qrImage.onload = () => {
          ctx.drawImage(qrImage, 360, 1120, 360, 360);
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 50px "Microsoft JhengHei", Arial';
          ctx.fillText('掃描加入直播間', 540, 1600);
        };
        qrImage.src = qrUrl;
      }
    }, 100);
  };

  const copyAdText = () => {
    const text = `🔥 【${user?.name}】即將在 寵BAR 開播！\n\n稀有活體即將上架！來看看有沒有你夢寐以求的寶貝！\n點擊下方連結直接進入直播間撿漏 👇\n${window.location.origin}\n\n#寵BAR #特寵交易 #競標`;
    navigator.clipboard.writeText(text);
    showToast('已複製宣傳文案！快去 FB 社團或 Threads 貼文吧！', "success");
  };

  const downloadBanner = () => {
    if (canvasRef.current) {
      const link = document.createElement('a');
      link.download = '寵BAR_IG限動宣傳圖.png';
      link.href = canvasRef.current.toDataURL();
      link.click();
    }
  };

  // Live Records
  const [liveRecords, setLiveRecords] = useState<any[]>([]);

  // Social Media Generator
  const [showSocialModal, setShowSocialModal] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const loadUser = async () => {
    const res = await fetch('/api/user/profile');
    const data = await res.json();
    setUser(data);
  };

  useEffect(() => {
    loadUser();
  }, []);

  const fetchLiveRecords = async (userId: string) => {
    const res = await fetch(`/api/user/${userId}/media`);
    const data = await res.json();
    setLiveRecords(data);
  };

  if (!user) return <div className="p-8 text-center">載入中...</div>;

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Profile Header */}
      <div className="bg-surface rounded-3xl p-8 mb-8 border border-surface/50 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-6">
          <div className="w-20 h-20 bg-brand/20 rounded-full flex items-center justify-center text-3xl font-bold text-brand">
            {user.name.charAt(0)}
          </div>
          <div>
            <h1 className="text-2xl font-bold">{user.name}</h1>
            <p className="text-text-secondary">{user.email}</p>
          </div>
        </div>
        <div className="flex gap-3">
          <button onClick={generateBanner} className="px-6 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold rounded-xl shadow-lg hover:opacity-90">
             ✨ 製作宣傳圖
          </button>
          <Link href="/seller/upload" className="px-6 py-2 bg-brand text-white font-bold rounded-xl shadow-lg hover:opacity-90">
            上架商品
          </Link>
        </div>
      </div>

      {/* Seller Tools Area (Only for Sellers/Admins) */}
      {(user.role === 'SELLER' || user.role === 'ADMIN') && (
        <div className="bg-surface rounded-3xl p-6 mb-8 border border-surface/50 shadow-sm">
          <h2 className="text-xl font-bold mb-4 flex items-center">
            <span className="mr-2">🛠️</span> 賣家專屬小工具
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Tool 1 */}
            <div className="bg-background border border-surface rounded-xl p-5 relative overflow-hidden group">
              <div className="absolute top-0 right-0 bg-brand text-white text-[10px] font-bold px-2 py-1 rounded-bl-xl z-10">開發中</div>
              <div className="text-3xl mb-3 opacity-50 group-hover:opacity-100 transition-opacity">📝</div>
              <h3 className="font-bold text-lg mb-1 text-text-primary">貓狗特寵簽約系統</h3>
              <p className="text-sm text-text-secondary">數位化電子簽約，安全有保障</p>
            </div>
            {/* Tool 2 */}
            <div className="bg-background border border-surface rounded-xl p-5 relative overflow-hidden group">
              <div className="absolute top-0 right-0 bg-brand text-white text-[10px] font-bold px-2 py-1 rounded-bl-xl z-10">開發中</div>
              <div className="text-3xl mb-3 opacity-50 group-hover:opacity-100 transition-opacity">🤝</div>
              <h3 className="font-bold text-lg mb-1 text-text-primary">認養公版合約系統</h3>
              <p className="text-sm text-text-secondary">專為認養設計的標準公版合約</p>
            </div>
            {/* Tool 3 */}
            <div className="bg-background border border-surface rounded-xl p-5 relative overflow-hidden group">
              <div className="absolute top-0 right-0 bg-brand text-white text-[10px] font-bold px-2 py-1 rounded-bl-xl z-10">開發中</div>
              <div className="text-3xl mb-3 opacity-50 group-hover:opacity-100 transition-opacity">🧬</div>
              <h3 className="font-bold text-lg mb-1 text-text-primary">貓狗/爬蟲基因計算機</h3>
              <p className="text-sm text-text-secondary">計算後代基因型與表現型機率</p>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-4 mb-8 border-b border-surface/50 pb-4">
        {["products", "orders", "live"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 font-bold capitalize ${activeTab === tab ? "text-brand border-b-2 border-brand" : "text-text-secondary"}`}
          >
            {tab === 'products' ? '我的商品' : tab === 'orders' ? '購買紀錄' : '直播回顧'}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {/* Products Tab */}
        {activeTab === "products" && (
          <div className="space-y-4">
            {user.my_products?.length === 0 ? (
              <div className="text-center py-20 text-text-secondary bg-surface rounded-2xl border border-surface/50">
                <div className="text-4xl mb-4">📦</div>
                <h3 className="text-lg font-bold">尚無上架商品</h3>
                <Link href="/seller/upload" className="text-brand hover:underline mt-2 inline-block">去上架</Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                {user.my_products?.map((product: Product) => (
                  <Link href={`/product/${product.id}`} key={product.id}>
                    <div className="bg-surface rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow border border-surface/50 group flex flex-col h-full relative">
                      <div className="absolute top-2 left-2 z-10 flex flex-col space-y-1">
                        <span className={`text-xs px-2 py-1 rounded shadow-sm font-bold text-white ${product.type === 'BID' ? 'bg-red-500' : 'bg-brand'}`}>
                          {product.type === 'BID' ? '競標' : '直購'}
                        </span>
                        {product.status === 'ACTIVE' ? (
                          <span className="text-xs px-2 py-1 rounded shadow-sm font-bold bg-green-500 text-white">上架中</span>
                        ) : (
                          <span className="text-xs px-2 py-1 rounded shadow-sm font-bold bg-gray-500 text-white">已結束</span>
                        )}
                      </div>
                      <div className="relative h-40 w-full overflow-hidden bg-background">
                        {product.image_url ? (
                          <Image src={product.image_url} alt={product.title} fill className="object-cover group-hover:scale-105 transition-transform duration-300" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-text-secondary">無圖片</div>
                        )}
                      </div>
                      <div className="p-4 flex-1 flex flex-col">
                        <h3 className="font-bold text-lg mb-1 truncate">{product.title}</h3>
                        <div className="flex justify-between items-end mt-auto">
                          <span className="text-sm text-text-secondary">👀 {product.views} 次瀏覽</span>
                          <span className="font-bold text-brand">NT$ {product.price.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Orders Tab */}
        {activeTab === "orders" && (
          <div className="space-y-4">
            {user.orders?.length === 0 ? (
              <div className="text-center py-20 text-text-secondary bg-surface rounded-2xl border border-surface/50">
                <div className="text-4xl mb-4">🛒</div>
                <h3 className="text-lg font-bold">尚無購買紀錄</h3>
              </div>
            ) : (
              <div className="grid gap-4">
                {user.orders?.map((order: Order) => (
                  <div key={order.id} className="bg-surface rounded-xl p-6 border border-surface/50 flex justify-between items-center shadow-sm">
                    <div>
                      <div className="text-sm text-text-secondary mb-1">
                        訂單編號: {order.id.split('-')[0]}...
                      </div>
                      <div className="font-bold text-lg text-text-primary">
                        NT$ {order.total_price.toLocaleString()}
                      </div>
                      <div className="text-xs text-text-secondary mt-1">
                        {new Date(order.created_at).toLocaleString()}
                      </div>
                    </div>
                    <div className="px-4 py-2 bg-brand/10 text-brand rounded-full font-bold text-sm">
                      {order.status}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </div>
      
      {/* Admin Test Accounts Modal */}
      {showTestAccounts && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-surface w-full max-w-lg rounded-3xl p-6 shadow-2xl flex flex-col max-h-[80vh]">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-red-500">📋 測試帳號與密碼清單</h3>
              <button onClick={() => setShowTestAccounts(false)} className="text-text-secondary hover:text-text-primary text-2xl font-bold">
                ×
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto space-y-4 pr-2">
              {testAccounts.map((acc: any) => (
                <div key={acc.id} className="bg-background border border-surface/50 rounded-xl p-4 flex flex-col">
                  <div className="flex justify-between items-start mb-2">
                    <span className="font-bold text-lg">{acc.name}</span>
                    <span className="text-xs bg-brand/10 text-brand px-2 py-1 rounded font-bold">{acc.role}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="text-text-secondary">登入帳號/手機:</div>
                    <div className="font-mono text-text-primary">{acc.phone}</div>
                    <div className="text-text-secondary">密碼:</div>
                    <div className="font-mono text-text-primary">{acc.password}</div>
                  </div>
                </div>
              ))}
              {testAccounts.length === 0 && (
                <div className="text-center py-8 text-text-secondary">目前沒有設定任何測試帳號</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Social Media Generator Modal */}
      {showSocialModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-surface w-full max-w-4xl rounded-3xl p-6 shadow-2xl flex flex-col md:flex-row gap-8">
            {/* Left: Canvas Preview */}
            <div className="flex-1 flex flex-col items-center">
              <h3 className="text-xl font-bold mb-4">📱 IG 限時動態預覽</h3>
              <div className="bg-black p-2 rounded-xl shadow-inner border border-surface/50 w-full max-w-[300px] aspect-[9/16]">
                <canvas ref={canvasRef} width={1080} height={1920} className="w-full h-full object-contain bg-[#1a1a1a] rounded-lg"></canvas>
              </div>
              <button 
                onClick={downloadBanner}
                className="mt-4 w-full max-w-[300px] py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold rounded-xl shadow-lg hover:scale-105 transition-transform"
              >
                ⬇️ 下載圖卡 (發至 IG/FB)
              </button>
            </div>
            
            {/* Right: Ad Text */}
            <div className="flex-1 flex flex-col justify-center">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500">
                  ✨ 社群引流神器
                </h3>
                <button onClick={() => setShowSocialModal(false)} className="text-text-secondary hover:text-text-primary text-3xl font-bold">
                  ×
                </button>
              </div>
              
              <div className="bg-background border border-surface/50 rounded-xl p-6 relative">
                <h4 className="font-bold text-lg mb-4">推薦發文文案</h4>
                <div className="text-text-secondary text-sm space-y-4 font-mono bg-black/20 p-4 rounded-lg">
                  <p>🔥 【{user?.name}】即將在 寵BAR 開播！</p>
                  <p>稀有活體即將上架！來看看有沒有你夢寐以求的寶貝！</p>
                  <p>點擊下方連結直接進入直播間撿漏 👇</p>
                  <p className="text-brand break-all">{typeof window !== 'undefined' ? window.location.origin : ''}</p>
                  <p>#寵BAR #特寵交易 #競標</p>
                </div>
                <button 
                  onClick={copyAdText}
                  className="mt-6 w-full py-3 bg-brand text-white font-bold rounded-xl shadow-lg hover:bg-brand/90 transition-colors"
                >
                  📋 一鍵複製文案
                </button>
              </div>
              
              <div className="mt-6 text-sm text-text-secondary">
                <p className="font-bold mb-2">💡 引流小技巧：</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>先點擊「下載圖卡」，並上傳至 IG 限時動態。</li>
                  <li>在 IG 限動加入「連結貼紙」，並貼上專屬網址。</li>
                  <li>將文案複製並貼到 Threads 或 FB 的爬蟲交易社團。</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
