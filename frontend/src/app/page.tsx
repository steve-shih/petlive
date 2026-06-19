"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";

interface Product {
  id: string;
  title: string;
  price: number;
  type: string;
  main_category: string;
  sub_category: string;
  image_url: string;
  seller_name: string;
  views: number;
}

interface ProductResponse {
  hot_products: Product[];
  latest_products: Product[];
}

export default function Home() {
  const [hotProducts, setHotProducts] = useState<Product[]>([]);
  const [latestProducts, setLatestProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [mainCategory, setMainCategory] = useState<string>("ALL");
  const [subCategory, setSubCategory] = useState<string>("ALL");
  const [filterFollowed, setFilterFollowed] = useState<boolean>(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const loadProducts = () => {
    setLoading(true);
    const userId = localStorage.getItem("current_user_id");
    setCurrentUserId(userId);
    
    let url = "/api/products?";
    if (mainCategory !== "ALL") url += `main_category=${mainCategory}&`;
    if (subCategory !== "ALL") url += `sub_category=${subCategory}&`;
    url += `filter_followed=${filterFollowed}&`;
    if (userId) url += `user_id=${userId}`;

    fetch(url, { headers: { "ngrok-skip-browser-warning": "69420" } })
      .then((res) => res.json())
      .then((data: ProductResponse) => {
        setHotProducts(data.hot_products || []);
        setLatestProducts(data.latest_products || []);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to fetch products:", err);
        setLoading(false);
      });
  };

  useEffect(() => {
    loadProducts();
  }, [mainCategory, subCategory, filterFollowed]);

  const handleMainCategoryClick = (cat: string) => {
    setMainCategory(cat);
    setSubCategory("ALL"); // Reset subcategory when main changes
  };

  const renderProductCard = (product: Product, isHot: boolean = false) => (
    <Link href={`/product/${product.id}`} key={product.id}>
      <div className={`bg-surface rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow cursor-pointer border ${isHot ? 'border-red-500/50 shadow-red-500/10' : 'border-surface/50'} group flex flex-col h-full relative`}>
        
        {/* Type Badge & Views */}
        <div className="absolute top-2 left-2 z-10 flex flex-col space-y-1">
          <span className={`text-xs px-2 py-1 rounded shadow-sm font-bold text-white ${product.type === 'BID' ? 'bg-red-500' : 'bg-brand'}`}>
            {product.type === 'BID' ? '競標' : '直購'}
          </span>
          {isHot && (
            <span className="text-xs px-2 py-1 rounded shadow-sm font-bold bg-orange-500 text-white flex items-center space-x-1">
              <span>🔥</span>
              <span>{product.views?.toLocaleString() || 0}</span>
            </span>
          )}
        </div>

        <div className="relative h-48 w-full overflow-hidden bg-background">
          {product.image_url ? (
            <Image
              src={product.image_url}
              alt={product.title}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-text-secondary">無圖片</div>
          )}
        </div>
        <div className="p-4 flex-1 flex flex-col">
          <div className="text-xs text-text-secondary mb-1 flex space-x-1">
            <span>{product.main_category}</span>
            <span>&gt;</span>
            <span>{product.sub_category}</span>
          </div>
          <h3 className="font-semibold text-lg text-text-primary mb-1 line-clamp-2">{product.title}</h3>
          <p className="text-sm text-text-secondary mb-3 flex-1">{product.seller_name}</p>
          
          <div className="mt-auto">
            <div className="text-xs text-text-secondary mb-1">
              {product.type === 'BID' ? '當前最高價' : '價格'}
            </div>
            <span className="font-bold text-brand text-xl">NT$ {product.price.toLocaleString()}</span>
          </div>
        </div>
      </div>
    </Link>
  );

  return (
    <div className="w-full max-w-6xl p-4 md:p-6">
      {/* Hero Banner */}
      <div className="w-full h-64 bg-gradient-to-r from-brand to-brand/70 rounded-2xl flex items-center justify-center mb-8 shadow-lg relative overflow-hidden">
        <div className="relative z-10 text-center text-white">
          <h1 className="text-4xl font-bold mb-4 tracking-wider">歡迎來到 寵BAR</h1>
          <p className="text-lg opacity-90">尋找屬於你的特殊寵物夥伴</p>
        </div>
      </div>

      {/* Top Bar: Categories & Filter Toggle */}
      <div className="mb-8">
        <div className="flex flex-col md:flex-row justify-between md:items-end border-b border-surface/50 pb-2 mb-4 gap-4">
          <div className="flex space-x-4">
            {["ALL", "活體", "相關產品"].map(cat => (
              <button
                key={cat}
                onClick={() => handleMainCategoryClick(cat)}
                className={`text-lg font-bold pb-2 border-b-2 transition-colors ${mainCategory === cat ? 'border-brand text-brand' : 'border-transparent text-text-secondary hover:text-text-primary'}`}
              >
                {cat === "ALL" ? "全部商品" : cat}
              </button>
            ))}
          </div>
          
          {/* Personalized Feed Toggle */}
          {currentUserId && (
            <label className="flex items-center space-x-2 cursor-pointer pb-2 group">
              <span className={`text-sm font-medium ${filterFollowed ? 'text-brand' : 'text-text-secondary'}`}>
                只看追蹤與熱門店家
              </span>
              <div className="relative">
                <input 
                  type="checkbox" 
                  className="sr-only" 
                  checked={filterFollowed}
                  onChange={() => setFilterFollowed(!filterFollowed)}
                />
                <div className={`block w-10 h-6 rounded-full transition-colors ${filterFollowed ? 'bg-brand' : 'bg-surface border border-surface/50'}`}></div>
                <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${filterFollowed ? 'transform translate-x-4' : ''}`}></div>
              </div>
            </label>
          )}
        </div>
        
        {mainCategory === "活體" && (
          <div className="flex flex-wrap gap-2">
            {["ALL", "貓狗", "爬蟲", "甲蟲", "其他"].map(sub => (
              <button
                key={sub}
                onClick={() => setSubCategory(sub)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors border ${subCategory === sub ? 'bg-brand text-white border-brand' : 'bg-surface text-text-secondary border-surface/50 hover:border-brand/50'}`}
              >
                {sub === "ALL" ? "全部" : sub}
              </button>
            ))}
          </div>
        )}

        {mainCategory === "相關產品" && (
          <div className="flex flex-wrap gap-2">
            {["ALL", "耗材", "用品", "用具", "其他"].map(sub => (
              <button
                key={sub}
                onClick={() => setSubCategory(sub)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors border ${subCategory === sub ? 'bg-brand text-white border-brand' : 'bg-surface text-text-secondary border-surface/50 hover:border-brand/50'}`}
              >
                {sub === "ALL" ? "全部" : sub}
              </button>
            ))}
          </div>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-40">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand"></div>
        </div>
      ) : (
        <div className="space-y-12">
          {/* Hot Products */}
          {hotProducts.length > 0 && (
            <div>
              <h2 className="text-2xl font-bold mb-6 flex items-center space-x-2">
                <span>🔥</span>
                <span>熱門商品</span>
                {filterFollowed && <span className="text-xs bg-brand/10 text-brand px-2 py-1 rounded-full font-normal ml-2">從熱門店家推薦</span>}
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {hotProducts.map(p => renderProductCard(p, true))}
              </div>
            </div>
          )}

          {/* Latest Products */}
          <div>
            <h2 className="text-2xl font-bold mb-6 flex items-center space-x-2">
              <span>✨</span>
              <span>最新上架</span>
              {filterFollowed && <span className="text-xs bg-brand/10 text-brand px-2 py-1 rounded-full font-normal ml-2">你追蹤的賣家</span>}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {latestProducts.map(p => renderProductCard(p, false))}
              {latestProducts.length === 0 && hotProducts.length === 0 && (
                <div className="col-span-full text-center py-12 text-text-secondary bg-surface rounded-2xl border border-surface/50">
                  <div className="text-4xl mb-4">😿</div>
                  <h3 className="text-lg font-bold mb-2">找不到任何商品</h3>
                  <p className="text-sm">試著關閉「只看追蹤與熱門店家」過濾器，或清除分類條件。</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
