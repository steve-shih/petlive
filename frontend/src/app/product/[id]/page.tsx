"use client";
import { useEffect, useState, use } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useToast } from "../../components/Toast";

interface Bid {
  id: string;
  user_name: string;
  bid_amount: number;
  created_at: string;
}

interface Product {
  id: string;
  title: string;
  description: string;
  type: string;
  main_category: string;
  sub_category: string;
  price: number;
  stock: number;
  start_price: number;
  current_price: number;
  end_time: string;
  media_urls: string[];
  seller_name: string;
  seller_id: string;
  bids: Bid[];
  views?: number;
}

export default function ProductDetail({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const { id } = resolvedParams;
  const router = useRouter();
  const { showToast } = useToast();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [bidAmount, setBidAmount] = useState<number | "">("");
  const [isFollowing, setIsFollowing] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [activeMediaIndex, setActiveMediaIndex] = useState(0);

  const loadProduct = () => {
    fetch(`/api/products/${id}`, { headers: { "ngrok-skip-browser-warning": "69420" } })
      .then((res) => {
        if (!res.ok) throw new Error("Product not found");
        return res.json();
      })
      .then((data) => {
        setProduct(data);
        if (data.type === 'BID' && bidAmount === "") {
          setBidAmount(data.current_price + 50); // suggest +50
        }
        setLoading(false);
        checkFollowing(data.seller_id);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  };
  
  const checkFollowing = (sellerId: string) => {
    const userId = localStorage.getItem("current_user_id");
    if (!userId) return;
    fetch(`/api/users/${userId}/following`, { headers: { "ngrok-skip-browser-warning": "69420" } })
      .then(res => res.json())
      .then((data) => {
        setIsFollowing(data.ids.includes(sellerId));
      });
  };

  const [timeLeft, setTimeLeft] = useState<string>("");

  useEffect(() => {
    setCurrentUserId(localStorage.getItem("current_user_id"));
    fetch(`/api/products/${id}/view`, { headers: { "ngrok-skip-browser-warning": "69420" }, method: "POST" }).catch(console.error);
    
    loadProduct();
    const interval = setInterval(() => {
      if (product?.type === 'BID') loadProduct();
    }, 5000);
    return () => clearInterval(interval);
  }, [id, product?.type]);

  useEffect(() => {
    if (!product || product.type !== 'BID' || !product.end_time) return;

    const calculateTimeLeft = () => {
      const difference = new Date(product.end_time).getTime() - new Date().getTime();
      if (difference > 0) {
        const d = Math.floor(difference / (1000 * 60 * 60 * 24));
        const h = Math.floor((difference / (1000 * 60 * 60)) % 24);
        const m = Math.floor((difference / 1000 / 60) % 60);
        const s = Math.floor((difference / 1000) % 60);
        setTimeLeft(`剩餘 ${d} 天 ${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`);
      } else {
        setTimeLeft("競標已結束");
      }
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);
    return () => clearInterval(timer);
  }, [product?.end_time, product?.type]);

  const toggleFollow = async () => {
    if (!currentUserId) {
      showToast("請先從右上角切換帳號或登入", "error");
      return;
    }
    if (!product) return;
    
    try {
      const res = await fetch(`/api/users/${currentUserId}/follow`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ target_id: product.seller_id })
      });
      const data = await res.json();
      if (res.ok) {
        setIsFollowing(data.action === "followed");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleContactSeller = (e: React.MouseEvent) => {
    if (!isFollowing) {
      e.preventDefault();
      showToast("請先點擊追蹤（加入好友）才能發送私訊喔！", "error");
    }
  };

  const addToCart = () => {
    if (!product) return;
    const currentCart = JSON.parse(localStorage.getItem("cart") || "[]");
    const existingItem = currentCart.find((item: any) => item.product_id === product.id);
    
    if (existingItem) {
      existingItem.quantity += 1;
    } else {
      currentCart.push({
        product_id: product.id,
        title: product.title,
        price: product.price,
        image_url: product.media_urls?.[0] || '',
        seller_name: product.seller_name,
        quantity: 1
      });
    }
    localStorage.setItem("cart", JSON.stringify(currentCart));
    showToast("已加入購物車！", "success");
  };

  const buyNow = () => {
    addToCart();
    router.push("/cart");
  };

  const placeBid = async () => {
    if (!product) return;
    if (!currentUserId) {
      showToast("請先登入 (透過上方切換帳號)", "error");
      return;
    }
    
    if (typeof bidAmount !== 'number' || bidAmount <= product.current_price) {
      showToast("出價必須高於當前最高價", "error");
      return;
    }

    try {
      const res = await fetch("/api/bids", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          product_id: product.id,
          user_id: currentUserId,
          bid_amount: bidAmount
        })
      });
      if (!res.ok) {
        const errorData = await res.json();
        showToast("出價失敗: " + errorData.error, "error");
        return;
      }
      showToast("出價成功！", "success");
      loadProduct(); // reload to get new bids
    } catch (err) {
      console.error(err);
      showToast("出價發生錯誤", "error");
    }
  };

  const renderMedia = (url: string, isMain: boolean = false) => {
    if (!url) return <div className="w-full h-full flex items-center justify-center text-text-secondary">無媒體</div>;
    const isVideo = url.endsWith(".mp4") || url.endsWith(".webm");
    
    if (isVideo) {
      return (
        <video 
          src={url} 
          controls={isMain}
          autoPlay={isMain}
          muted={!isMain}
          loop
          className="w-full h-full object-cover"
        />
      );
    }
    return <Image src={url} alt={product?.title || 'product media'} fill className="object-cover" />;
  };

  if (loading && !product) {
    return (
      <div className="flex justify-center items-center h-64 w-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand"></div>
      </div>
    );
  }

  if (!product) {
    return <div className="p-10 text-center text-xl">找不到該商品</div>;
  }

  const mediaList = product.media_urls && product.media_urls.length > 0 ? product.media_urls : [''];

  return (
    <div className="w-full max-w-5xl p-6">
      {/* Breadcrumb */}
      <div className="text-sm text-text-secondary mb-4 flex items-center space-x-2">
        <Link href="/" className="hover:text-brand transition-colors">寵BAR</Link>
        <span>&gt;</span>
        <span>{product.main_category}</span>
        <span>&gt;</span>
        <span className="font-semibold text-text-primary">{product.sub_category}</span>
      </div>

      <div className="bg-surface rounded-2xl shadow-sm border border-surface/50 overflow-hidden flex flex-col md:flex-row">
        {/* Left: Media Gallery */}
        <div className="md:w-1/2 flex flex-col">
          <div className="relative h-80 md:h-96 bg-background">
            {renderMedia(mediaList[activeMediaIndex], true)}
            <div className="absolute top-4 left-4 z-10 flex space-x-1">
              <span className={`px-3 py-1 rounded shadow text-sm font-bold text-white ${product.type === 'BID' ? 'bg-red-500' : 'bg-brand'}`}>
                {product.type === 'BID' ? '熱烈競標中' : '直購品'}
              </span>
            </div>
          </div>
          
          {/* Thumbnails */}
          {mediaList.length > 1 && (
            <div className="flex p-4 gap-2 overflow-x-auto bg-background/50 border-t border-surface/50">
              {mediaList.map((url, index) => (
                <button 
                  key={index}
                  onClick={() => setActiveMediaIndex(index)}
                  className={`relative w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden border-2 transition-colors ${activeMediaIndex === index ? 'border-brand' : 'border-transparent hover:border-surface/80'}`}
                >
                  {renderMedia(url, false)}
                  {(url.endsWith('.mp4') || url.endsWith('.webm')) && (
                    <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                      <span className="text-white text-xl">▶</span>
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right: Details */}
        <div className="md:w-1/2 p-8 flex flex-col h-full">
          <h1 className="text-3xl font-bold text-text-primary mb-3">{product.title}</h1>
          <div className="flex items-center justify-between mb-6 border-b border-surface/50 pb-4">
            <div className="flex items-center space-x-3 text-sm">
              <span className="text-text-secondary">賣家：</span>
              <Link href={`/seller/${product.seller_id}`} className="text-brand font-bold text-lg hover:underline decoration-2 underline-offset-4">
                {product.seller_name}
              </Link>
              {currentUserId && currentUserId !== product.seller_id && (
                <button 
                  onClick={toggleFollow}
                  className={`px-3 py-1 text-xs rounded-full font-bold border transition-colors ${
                    isFollowing 
                      ? 'bg-surface text-text-secondary border-surface/50 hover:bg-red-500/10 hover:text-red-500 hover:border-red-500/20' 
                      : 'bg-brand/10 text-brand border-brand/20 hover:bg-brand hover:text-white'
                  }`}
                >
                  {isFollowing ? '已追蹤' : '+ 追蹤'}
                </button>
              )}
            </div>
            <Link 
              href={`/chat?to=${product.seller_id}`}
              className={`text-sm px-4 py-1.5 font-medium rounded-full transition-colors ${
                isFollowing 
                  ? 'bg-brand/10 text-brand hover:bg-brand hover:text-white' 
                  : 'bg-surface text-text-secondary border border-surface/50 cursor-not-allowed'
              }`}
            >
              💬 聯絡賣家
            </Link>
          </div>

          <div className="flex items-center text-sm text-text-secondary mb-4 space-x-4 bg-surface p-3 rounded-xl border border-surface/50">
            <div className="flex items-center space-x-1">
              <span className="text-lg">👀</span>
              <span>本商品已被點擊瀏覽 <strong className="text-text-primary text-lg">{product.views?.toLocaleString() || 0}</strong> 次</span>
            </div>
          </div>

          <div className="bg-background/50 p-6 rounded-xl mb-6 shadow-inner">
            {product.type === 'BID' ? (
              <div className="space-y-3">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-text-secondary">結標時間</span>
                  <div className="text-right">
                    <div className="font-bold text-red-500 text-lg">{timeLeft}</div>
                    <div className="text-xs text-text-secondary mt-1">{new Date(product.end_time).toLocaleString()}</div>
                  </div>
                </div>
                <div className="flex justify-between items-end">
                  <span className="text-text-secondary">當前最高價</span>
                  <span className="text-4xl font-bold text-red-500">NT$ {product.current_price.toLocaleString()}</span>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex justify-between items-end">
                  <span className="text-text-secondary">直購價</span>
                  <span className="text-4xl font-bold text-brand">NT$ {product.price.toLocaleString()}</span>
                </div>
                <div className="text-sm text-text-secondary text-right">
                  庫存數量：{product.stock} 件
                </div>
              </div>
            )}
          </div>

          <div className="mb-8 flex-1">
            <h3 className="text-lg font-semibold text-text-primary mb-2">商品說明</h3>
            <p className="text-text-secondary leading-relaxed whitespace-pre-wrap">
              {product.description}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-4 mb-6">
            {!currentUserId ? (
              <div className="w-full bg-surface border border-brand/30 rounded-xl p-4 text-center">
                <p className="text-text-secondary font-medium mb-2">請先登入以解鎖購買與競標</p>
                <div className="text-sm text-brand animate-pulse">請點擊上方或底部選單進行登入</div>
              </div>
            ) : product.type === "BID" ? (
              <div className="space-y-4 w-full">
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary font-bold">NT$</span>
                    <input 
                      type="number" 
                      value={bidAmount} 
                      onChange={(e) => setBidAmount(Number(e.target.value))}
                      className="w-full bg-background border border-surface/50 rounded-lg py-3 pl-12 pr-4 font-bold text-lg focus:outline-none focus:border-red-500"
                    />
                  </div>
                  <button 
                    onClick={placeBid}
                    className="px-8 bg-red-500 text-white font-bold rounded-lg hover:bg-red-600 transition-colors shadow-lg shadow-red-500/30"
                  >
                    確認出價
                  </button>
                </div>
                
                {/* Bid History */}
                {product.bids && product.bids.length > 0 && (
                  <div className="mt-4 border-t border-surface/50 pt-4">
                    <h4 className="text-sm font-bold mb-2">最新出價紀錄</h4>
                    <div className="space-y-2 max-h-32 overflow-y-auto pr-2">
                      {product.bids.map(bid => (
                        <div key={bid.id} className="flex justify-between text-sm p-2 bg-background/50 rounded">
                          <span className="text-text-secondary">{bid.user_name}</span>
                          <span className="font-bold">NT$ {bid.bid_amount.toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex space-x-4">
                <button onClick={addToCart} className="flex-1 py-3 px-4 border-2 border-brand text-brand font-bold rounded-lg hover:bg-brand/10 transition-colors">
                  加入購物車
                </button>
                <button onClick={buyNow} className="flex-1 py-3 px-4 bg-brand text-white font-bold rounded-lg hover:bg-brand/90 transition-colors shadow-lg shadow-brand/30">
                  立即購買
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
