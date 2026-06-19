"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useToast } from "../../components/Toast";

export default function UploadProduct() {
  const router = useRouter();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [uploadingIndex, setUploadingIndex] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isSeller, setIsSeller] = useState(false);
  const [userTier, setUserTier] = useState(0);
  
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    main_category: "活體",
    sub_category: "甲蟲",
    type: "BUY_NOW",
    price: 100,
    stock: 1,
    start_price: 100,
    days: 3,
  });
  
  const [mediaUrls, setMediaUrls] = useState<string[]>(["https://picsum.photos/seed/new1/600/400"]);

  useEffect(() => {
    const userId = localStorage.getItem("current_user_id");
    if (!userId) {
      showToast("請先登入", "error");
      router.push("/");
      return;
    }
    
    fetch(`/api/users/${userId}`, { headers: { "ngrok-skip-browser-warning": "69420" } })
      .then(res => res.json())
      .then(data => {
        if (data.role === 'SELLER' || data.role === 'ADMIN') {
          setIsSeller(true);
          setUserTier(data.tier || 0);
          if (data.tier < 1 && data.role !== 'ADMIN') {
            showToast("您需要升級「買賣」帳號才能上架商品", "error");
            router.push("/profile?tab=upgrade");
          }
        } else {
          showToast("您沒有賣家權限", "error");
          router.push("/profile");
        }
      });
  }, [router]);

  const subCategories = formData.main_category === "活體" 
    ? ["貓狗", "爬蟲", "甲蟲", "其他"] 
    : ["耗材", "用品", "用具", "其他"];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => {
      const newData = { ...prev, [name]: value };
      if (name === "main_category") {
        newData.sub_category = value === "活體" ? "甲蟲" : "耗材";
      }
      return newData;
    });
  };

  const handleMediaUrlChange = (index: number, value: string) => {
    const newUrls = [...mediaUrls];
    newUrls[index] = value;
    setMediaUrls(newUrls);
  };
  
  const handleFileUpload = async (index: number, file: File | undefined) => {
    if (!file) return;
    setUploadingIndex(index);
    const form = new FormData();
    form.append('file', file);
    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: form
      });
      if (res.ok) {
        const data = await res.json();
        handleMediaUrlChange(index, data.url);
      } else {
        setError("檔案上傳失敗");
      }
    } catch (err) {
      setError("上傳時發生錯誤");
    }
    setUploadingIndex(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const addMediaUrl = () => {
    if (mediaUrls.length < 10) {
      setMediaUrls([...mediaUrls, ""]);
    } else {
      showToast("最多只能上傳 10 個媒體連結", "error");
    }
  };

  const removeMediaUrl = (index: number) => {
    if (mediaUrls.length > 1) {
      const newUrls = mediaUrls.filter((_, i) => i !== index);
      setMediaUrls(newUrls);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    const userId = localStorage.getItem("current_user_id");
    // Filter empty urls
    const validMediaUrls = mediaUrls.filter(url => url.trim() !== "");
    
    if (validMediaUrls.length === 0) {
      showToast("請至少提供一個圖片或影片網址", "error");
      setLoading(false);
      return;
    }
    
    try {
      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          seller_id: userId,
          price: Number(formData.price),
          stock: Number(formData.stock),
          start_price: Number(formData.start_price),
          days: Number(formData.days),
          media_urls: validMediaUrls
        })
      });
      
      if (!res.ok) throw new Error("Upload failed");
      
      showToast("商品上架成功！", "success");
      router.push("/");
    } catch (err) {
      console.error(err);
      showToast("上架發生錯誤", "error");
      setLoading(false);
    }
  };

  if (!isSeller) return null;

  return (
    <div className="w-full max-w-3xl p-6">
      <div className="flex items-center space-x-4 mb-6">
        <Link href="/profile" className="text-text-secondary hover:text-brand transition-colors text-xl">
          &larr;
        </Link>
        <h1 className="text-3xl font-bold">上架新商品</h1>
      </div>
      
      <form onSubmit={handleSubmit} className="bg-surface rounded-2xl p-8 border border-surface/50 space-y-6">
        
        {/* Basic Info */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold border-b border-surface/50 pb-2">基本資訊</h2>
          
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">商品名稱</label>
            <input 
              required
              name="title"
              value={formData.title}
              onChange={handleChange}
              className="w-full bg-background border border-surface/50 rounded-lg px-4 py-2 focus:outline-none focus:border-brand" 
              placeholder="例如：長戟大兜蟲 150mm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">商品描述</label>
            <textarea 
              required
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={4}
              className="w-full bg-background border border-surface/50 rounded-lg px-4 py-2 focus:outline-none focus:border-brand" 
              placeholder="請詳細描述商品狀態..."
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="block text-sm font-medium text-text-secondary">
                圖片與影片網址 (最多 10 個)
              </label>
              <span className="text-xs text-brand font-medium">支援 .mp4 或圖片</span>
            </div>
            
            <div className="space-y-2">
              {mediaUrls.map((url, index) => (
                <div key={index} className="flex gap-2 items-center">
                  <div className="relative">
                    <input 
                      type="file" 
                      id={`file-${index}`}
                      className="hidden"
                      accept="image/*,video/*"
                      onChange={(e) => handleFileUpload(index, e.target.files?.[0])}
                    />
                    <button
                      type="button"
                      disabled={uploadingIndex === index}
                      onClick={() => document.getElementById(`file-${index}`)?.click()}
                      className="whitespace-nowrap px-4 py-2 bg-surface-hover text-text-primary rounded-lg font-bold text-sm hover:bg-surface-hover/80 transition-colors"
                    >
                      {uploadingIndex === index ? '上傳中...' : '📂 選擇檔案'}
                    </button>
                  </div>
                  <span className="text-text-secondary text-sm">或</span>
                  <input 
                    value={url}
                    onChange={(e) => handleMediaUrlChange(index, e.target.value)}
                    className="flex-1 bg-background border border-surface/50 rounded-lg px-4 py-2 focus:outline-none focus:border-brand" 
                    placeholder="輸入圖片/影片網址"
                  />
                  <button 
                    type="button"
                    onClick={() => removeMediaUrl(index)}
                    disabled={mediaUrls.length <= 1}
                    className="px-3 py-2 bg-red-500/10 text-red-500 rounded-lg hover:bg-red-500 hover:text-white transition-colors disabled:opacity-50 whitespace-nowrap"
                  >
                    刪除
                  </button>
                </div>
              ))}
            </div>
            
            {mediaUrls.length < 10 && (
              <button 
                type="button"
                onClick={addMediaUrl}
                className="mt-2 text-sm text-brand font-bold hover:underline"
              >
                + 新增圖片/影片網址 ({mediaUrls.length}/10)
              </button>
            )}
          </div>
        </div>

        {/* Category */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold border-b border-surface/50 pb-2">分類設定</h2>
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-text-secondary mb-1">主分類</label>
              <select 
                name="main_category"
                value={formData.main_category}
                onChange={handleChange}
                className="w-full bg-background border border-surface/50 rounded-lg px-4 py-2 focus:outline-none focus:border-brand"
              >
                <option value="活體">活體</option>
                <option value="相關產品">相關產品</option>
              </select>
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-text-secondary mb-1">子分類</label>
              <select 
                name="sub_category"
                value={formData.sub_category}
                onChange={handleChange}
                className="w-full bg-background border border-surface/50 rounded-lg px-4 py-2 focus:outline-none focus:border-brand"
              >
                {subCategories.map(sub => (
                  <option key={sub} value={sub}>{sub}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Pricing / Bidding */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold border-b border-surface/50 pb-2">交易模式</h2>
          
          <div className="flex gap-4 mb-4">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input 
                type="radio" 
                name="type" 
                value="BUY_NOW" 
                checked={formData.type === "BUY_NOW"} 
                onChange={handleChange}
                className="w-4 h-4 text-brand bg-background border-surface/50"
              />
              <span>直購模式</span>
            </label>
            <label className={`flex items-center space-x-2 ${userTier >= 2 ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'}`} title={userTier < 2 ? "需要解鎖「買賣競標」權限" : ""}>
              <input 
                type="radio" 
                name="type" 
                value="BID" 
                checked={formData.type === "BID"} 
                onChange={handleChange}
                disabled={userTier < 2}
                className="w-4 h-4 text-brand bg-background border-surface/50"
              />
              <span className="text-red-500 font-medium">競標模式 {userTier < 2 && "(未解鎖)"}</span>
            </label>
          </div>

          {formData.type === "BUY_NOW" ? (
            <div className="flex gap-4 bg-brand/5 p-4 rounded-xl border border-brand/20">
              <div className="flex-1">
                <label className="block text-sm font-medium text-text-secondary mb-1">直購價格 (NT$)</label>
                <input 
                  type="number" 
                  name="price"
                  value={formData.price}
                  onChange={handleChange}
                  min="1"
                  className="w-full bg-background border border-surface/50 rounded-lg px-4 py-2 focus:outline-none focus:border-brand font-bold" 
                />
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium text-text-secondary mb-1">庫存數量</label>
                <input 
                  type="number" 
                  name="stock"
                  value={formData.stock}
                  onChange={handleChange}
                  min="1"
                  className="w-full bg-background border border-surface/50 rounded-lg px-4 py-2 focus:outline-none focus:border-brand" 
                />
              </div>
            </div>
          ) : (
            <div className="flex gap-4 bg-red-500/5 p-4 rounded-xl border border-red-500/20">
              <div className="flex-1">
                <label className="block text-sm font-medium text-text-secondary mb-1">起標價格 (NT$)</label>
                <input 
                  type="number" 
                  name="start_price"
                  value={formData.start_price}
                  onChange={handleChange}
                  min="1"
                  className="w-full bg-background border border-surface/50 rounded-lg px-4 py-2 focus:outline-none focus:border-red-500 font-bold" 
                />
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium text-text-secondary mb-1">競標天數</label>
                <select 
                  name="days"
                  value={formData.days}
                  onChange={handleChange}
                  className="w-full bg-background border border-surface/50 rounded-lg px-4 py-2 focus:outline-none focus:border-red-500"
                >
                  <option value="1">1 天</option>
                  <option value="3">3 天</option>
                  <option value="7">7 天</option>
                </select>
              </div>
            </div>
          )}
        </div>

        <div className="pt-6">
          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-brand text-white py-4 rounded-xl font-bold text-lg shadow-lg hover:bg-brand/90 transition-colors disabled:opacity-50"
          >
            {loading ? "上架處理中..." : "確認上架商品"}
          </button>
        </div>
      </form>
    </div>
  );
}
