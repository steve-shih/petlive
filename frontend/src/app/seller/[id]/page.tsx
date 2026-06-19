"use client";
import { useEffect, useState, use, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useToast } from "../../components/Toast";

export default function SellerProfile({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const { id } = resolvedParams;
  const router = useRouter();
  const { showToast } = useToast();
  const [seller, setSeller] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'BUY' | 'BID' | 'POSTS' | 'VODS'>('BUY');
  
  // Gallery Upload State
  const [uploadingPost, setUploadingPost] = useState(false);
  const [postUrl, setPostUrl] = useState('');
  const [postDesc, setPostDesc] = useState('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setUploadingPost(true);
    const formData = new FormData();
    formData.append('file', file);
    
    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });
      if (res.ok) {
        const data = await res.json();
        setPostUrl(data.url);
        showToast("檔案上傳成功", "success");
      } else {
        showToast("檔案上傳失敗", "error");
      }
    } catch (err) {
      showToast("檔案上傳發生錯誤", "error");
    }
    setUploadingPost(false);
  };

  const loadSeller = () => {
    fetch(`/api/users/${id}`)
      .then((res) => {
        if (!res.ok) throw new Error("Seller not found");
        return res.json();
      })
      .then((data) => {
        setSeller(data);
        setLoading(false);
        checkFollowing(data.id);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  };

  const checkFollowing = (sellerId: string) => {
    const userId = localStorage.getItem("current_user_id");
    if (!userId) return;
    fetch(`/api/users/${userId}/following`)
      .then(res => res.json())
      .then((data) => {
        setIsFollowing(data.ids.includes(sellerId));
      });
  };

  useEffect(() => {
    setCurrentUserId(localStorage.getItem("current_user_id"));
    // Add view count logic (backend track daily views)
    fetch(`/api/users/${id}/view`, { method: "POST" }).catch(console.error);
    loadSeller();
  }, [id]);

  const toggleFollow = async () => {
    if (!currentUserId) {
      showToast("請先登入", "error");
      return;
    }
    try {
      const method = isFollowing ? "DELETE" : "POST";
      const res = await fetch(`/api/users/${currentUserId}/following`, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ seller_id: seller.id })
      });
      if (res.ok) {
        setIsFollowing(!isFollowing);
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64 w-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand"></div>
      </div>
    );
  }

  if (!seller) {
    return <div className="p-10 text-center text-xl">找不到該賣家</div>;
  }

  const isOwnProfile = currentUserId === seller.id;

  // Filter products by type
  const displayedProducts = seller.my_products?.filter((p: any) => 
    activeTab === 'BUY' ? p.type !== 'BID' : p.type === 'BID'
  ) || [];

  return (
    <div className="w-full max-w-5xl px-4 py-8 mx-auto animate-fade-in-up">
      {/* Shop Header Banner */}
      <div className="relative bg-gradient-to-r from-surface to-background border border-surface rounded-2xl p-6 md:p-10 shadow-lg flex flex-col md:flex-row gap-8 mb-8 overflow-hidden">
        {/* Glow effect */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-brand/5 rounded-full blur-3xl pointer-events-none"></div>

        <div className="flex flex-col md:flex-row items-center md:items-start gap-6 z-10">
          <div className="w-24 h-24 rounded-full bg-background border-2 border-surface/50 flex items-center justify-center overflow-hidden shrink-0 shadow-md">
            {/* If seller has logo, show it. Else fallback */}
            <div className="text-4xl">🪲</div>
          </div>
          
          <div className="text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start gap-3 mb-2">
              <h1 className="text-3xl font-extrabold text-text-primary">{seller.name}</h1>
              {seller.is_official && (
                <span className="bg-brand text-white text-xs font-bold px-2 py-0.5 rounded-full">
                  ✓ 官方
                </span>
              )}
            </div>
            
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-6 text-sm mb-4">
              <div className="flex flex-col items-center md:items-start">
                <span className="text-text-primary font-bold text-lg">{seller.completed_orders || 42}</span>
                <span className="text-text-secondary">成交</span>
              </div>
              <div className="flex flex-col items-center md:items-start">
                <span className="text-brand font-bold text-lg">⭐ {seller.rating || "5.0"}</span>
                <span className="text-text-secondary text-xs">{seller.rating_count || 6} 評價</span>
              </div>
              <div className="flex flex-col items-center md:items-start">
                <span className="text-text-primary font-bold text-lg">{seller.my_products?.length || 0}</span>
                <span className="text-text-secondary">在售</span>
              </div>
            </div>
            
            <div className="text-xs text-text-secondary flex items-center justify-center md:justify-start gap-1">
              <span>📅 {new Date(seller.created_at || Date.now()).getFullYear()} 加入</span>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="hidden md:block w-px bg-surface/50 my-2 z-10"></div>

        <div className="flex-1 z-10 flex flex-col justify-center text-sm text-text-secondary text-center md:text-left">
          <h3 className="font-bold text-text-primary mb-2">商店簡介</h3>
          <p className="mb-1">{seller.settings?.bio || "這是一個專業的生態館..."}</p>
          <p className="mb-1">營業地址: {seller.settings?.address || "未提供"}</p>
          <p className="mb-4">聯絡電話: {seller.settings?.phone || "未提供"}</p>
          
          {/* Social Media Share Buttons */}
          <div className="flex justify-center md:justify-start gap-3 mt-auto">
            <a href="#" onClick={(e) => { e.preventDefault(); showToast("已開啟 Instagram", "success"); }} className="w-8 h-8 rounded-full bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-500 flex items-center justify-center text-white hover:scale-110 transition-transform">
              <span className="text-sm font-bold">IG</span>
            </a>
            <a href="#" onClick={(e) => { e.preventDefault(); showToast("已開啟 Facebook", "success"); }} className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white hover:scale-110 transition-transform">
              <span className="text-sm font-bold">f</span>
            </a>
            <a href="#" onClick={(e) => { e.preventDefault(); showToast("已開啟 LINE", "success"); }} className="w-8 h-8 rounded-full bg-[#00B900] flex items-center justify-center text-white hover:scale-110 transition-transform">
              <span className="text-sm font-bold">L</span>
            </a>
            <button onClick={() => { navigator.clipboard.writeText(window.location.href); showToast("已複製賣場連結！", "success"); }} className="w-8 h-8 rounded-full bg-surface-hover flex items-center justify-center text-text-primary hover:scale-110 transition-transform">
              <span className="text-sm">🔗</span>
            </button>
          </div>
        </div>

        {!isOwnProfile && (
          <div className="absolute top-6 right-6 flex gap-2 z-10">
            <button 
              onClick={toggleFollow}
              className={`px-4 py-1.5 rounded-full font-bold text-sm transition-colors ${
                isFollowing 
                  ? 'bg-surface text-text-secondary border border-surface-hover hover:text-red-500' 
                  : 'bg-brand text-white hover:opacity-90'
              }`}
            >
              {isFollowing ? '已追蹤' : '+ 追蹤'}
            </button>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-surface/50 pb-2">
        <button
          onClick={() => setActiveTab('BUY')}
          className={`px-5 py-2 rounded-lg font-bold text-sm transition-colors flex items-center gap-2 ${
            activeTab === 'BUY' ? 'bg-brand/10 text-brand' : 'text-text-secondary hover:bg-surface'
          }`}
        >
          <span>📦</span> 商品 {seller.my_products?.filter((p:any) => p.type !== 'BID').length || 0}
        </button>
        <button
          onClick={() => setActiveTab('BID')}
          className={`px-5 py-2 rounded-lg font-bold text-sm transition-colors flex items-center gap-2 ${
            activeTab === 'BID' ? 'bg-red-500/10 text-red-500' : 'text-text-secondary hover:bg-surface'
          }`}
        >
          <span>🔨</span> 競標 {seller.my_products?.filter((p:any) => p.type === 'BID').length || 0}
        </button>
        <button
          onClick={() => setActiveTab('POSTS')}
          className={`px-5 py-2 rounded-lg font-bold text-sm transition-colors flex items-center gap-2 ${
            activeTab === 'POSTS' ? 'bg-purple-500/10 text-purple-500' : 'text-text-secondary hover:bg-surface'
          }`}
        >
          <span>📸</span> 貼文牆 {seller.gallery?.length || 0}
        </button>
        <button
          onClick={() => setActiveTab('VODS')}
          className={`px-5 py-2 rounded-lg font-bold text-sm transition-colors flex items-center gap-2 ${
            activeTab === 'VODS' ? 'bg-blue-500/10 text-blue-500' : 'text-text-secondary hover:bg-surface'
          }`}
        >
          <span>📼</span> 直播存放
        </button>
      </div>

      {/* Product Grid */}
      {(activeTab === 'BUY' || activeTab === 'BID') && (
        displayedProducts.length === 0 ? (
          <div className="text-center py-20 text-text-secondary bg-surface/30 rounded-2xl border border-surface/50">
            <div className="text-4xl mb-4">📦</div>
            <h3 className="text-lg font-bold">目前沒有{activeTab === 'BID' ? '競標' : '上架'}商品</h3>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {displayedProducts.map((product: any) => (
              <Link href={`/product/${product.id}`} key={product.id}>
                <div className="bg-surface rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 border border-surface/50 group flex flex-col h-full hover:-translate-y-1">
                  <div className="relative h-48 md:h-56 w-full overflow-hidden bg-background">
                    {product.image_url ? (
                      <Image src={product.image_url} alt={product.title} fill className="object-cover group-hover:scale-105 transition-transform duration-500" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-text-secondary text-xs">無圖片</div>
                    )}
                    {/* Stock tag */}
                    <div className="absolute bottom-2 left-2 bg-black/60 backdrop-blur-sm text-white text-[10px] font-bold px-2 py-1 rounded-md">
                      剩餘 {product.stock || 1} 件
                    </div>
                  </div>
                  <div className="p-4 flex-1 flex flex-col">
                    <h3 className="font-bold text-sm md:text-base mb-2 line-clamp-2 text-text-primary group-hover:text-brand transition-colors">
                      {product.title}
                    </h3>
                    <div className="mt-auto">
                      <span className={`font-black ${activeTab === 'BID' ? 'text-red-500' : 'text-brand'}`}>
                        NT$ {(product.price || product.current_price || 0).toLocaleString()} {activeTab === 'BID' && '起'}
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )
      )}

      {/* Posts Wall (Gallery) */}
      {activeTab === 'POSTS' && (
        <div className="animate-fade-in">
          {/* If own profile, show upload UI & IG Sync stub */}
          {isOwnProfile && (
            <div className="mb-8 p-6 bg-surface border border-surface/50 rounded-2xl">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4 pb-4 border-b border-surface/50">
                <div>
                  <h3 className="font-bold text-lg">發佈新貼文</h3>
                  <p className="text-xs text-text-secondary">上傳環境照、脫皮紀錄或分享飼養心得</p>
                </div>
                <button 
                  onClick={() => showToast("正在導向 Instagram 綁定頁面...", "success")}
                  className="bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold px-4 py-2 rounded-lg text-sm hover:opacity-90 transition-opacity flex items-center gap-2"
                >
                  <span className="text-lg">🌟</span> 同步 Instagram
                </button>
              </div>
              
              <div className="flex flex-col gap-3">
                <div className="flex gap-2 items-center">
                  <input 
                    type="file" 
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    className="hidden"
                    accept="image/*,video/*"
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingPost}
                    className="bg-surface-hover px-4 py-2 rounded-lg font-bold text-sm text-text-primary hover:bg-surface-hover/80 transition-colors whitespace-nowrap"
                  >
                    📂 選擇檔案
                  </button>
                  <span className="text-text-secondary text-sm">或</span>
                  <input 
                    type="text" 
                    placeholder="圖片/影片網址 (URL)..." 
                    value={postUrl}
                    onChange={(e) => setPostUrl(e.target.value)}
                    className="flex-1 w-full bg-background border border-surface-hover rounded-lg px-4 py-2 text-sm focus:border-brand outline-none transition-colors"
                  />
                </div>
                <textarea 
                  placeholder="寫點什麼..." 
                  value={postDesc}
                  onChange={(e) => setPostDesc(e.target.value)}
                  className="w-full bg-background border border-surface-hover rounded-lg px-4 py-2 text-sm focus:border-brand outline-none transition-colors min-h-[80px]"
                />
                <div className="flex justify-end">
                  <button 
                    disabled={uploadingPost || !postUrl}
                    onClick={async () => {
                      setUploadingPost(true);
                      try {
                        const res = await fetch(`/api/users/${id}/gallery`, {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ url: postUrl, description: postDesc })
                        });
                        if (res.ok) {
                          setPostUrl('');
                          setPostDesc('');
                          showToast("貼文發佈成功！", "success");
                          loadSeller(); // reload
                        }
                      } catch (err) {
                        showToast("發佈失敗", "error");
                      }
                      setUploadingPost(false);
                    }}
                    className="bg-brand text-white font-bold px-6 py-2 rounded-lg hover:bg-brand/90 disabled:opacity-50 transition-colors"
                  >
                    {uploadingPost ? '發佈中...' : '發佈'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {(!seller.gallery || seller.gallery.length === 0) ? (
            <div className="text-center py-20 text-text-secondary bg-surface/30 rounded-2xl border border-surface/50">
              <div className="text-4xl mb-4">📸</div>
              <h3 className="text-lg font-bold">目前沒有任何貼文</h3>
            </div>
          ) : (
            <div className="columns-1 sm:columns-2 lg:columns-3 gap-6 space-y-6">
              {seller.gallery.map((media: any) => (
                <div key={media.id} className="break-inside-avoid bg-surface border border-surface/50 rounded-xl overflow-hidden group">
                  <div className="relative w-full overflow-hidden bg-black">
                    {media.type === 'VIDEO' ? (
                      <video src={media.url} controls className="w-full h-auto object-contain max-h-[500px]" />
                    ) : (
                      <img src={media.url} alt="Gallery" className="w-full h-auto object-cover group-hover:scale-105 transition-transform duration-500" />
                    )}
                    {/* Delete overlay */}
                    {isOwnProfile && (
                      <button 
                        onClick={async () => {
                          if(confirm("確定要刪除這篇貼文嗎？")) {
                            await fetch(`/api/users/${id}/gallery/${media.id}`, { method: 'DELETE' });
                            showToast("貼文已刪除", "success");
                            loadSeller();
                          }
                        }}
                        className="absolute top-2 right-2 bg-red-500/80 text-white w-8 h-8 flex items-center justify-center rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                  {media.description && (
                    <div className="p-4">
                      <p className="text-sm text-text-primary whitespace-pre-wrap">{media.description}</p>
                      <p className="text-xs text-text-secondary mt-2">
                        {new Date(media.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* VODs Tab */}
      {activeTab === 'VODS' && (
        <div className="animate-fade-in text-center py-20 text-text-secondary bg-surface/30 rounded-2xl border border-surface/50">
          <div className="text-4xl mb-4">📼</div>
          <h3 className="text-lg font-bold">目前沒有公開的直播存放影片</h3>
          {isOwnProfile && <p className="text-sm mt-2 opacity-70">您可以從「賣家管理」將過去的直播轉存公開</p>}
        </div>
      )}
    </div>
  );
}
