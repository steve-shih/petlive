"use client";
import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useToast } from "../components/Toast";

interface CartItem {
  product_id: string;
  title: string;
  price: number;
  image_url: string;
  seller_name: string;
  quantity: number;
}

export default function Cart() {
  const router = useRouter();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const { showToast } = useToast();

  useEffect(() => {
    const userId = localStorage.getItem("current_user_id");
    setCurrentUserId(userId);
    const items = JSON.parse(localStorage.getItem("cart") || "[]");
    setCartItems(items);
  }, []);

  if (currentUserId === null && typeof window !== "undefined") {
    // Only block if we know we are a guest
    const userId = localStorage.getItem("current_user_id");
    if (!userId) {
      return (
        <div className="w-full flex flex-col items-center justify-center pt-32 p-6 text-center">
          <div className="text-6xl mb-6">🛑</div>
          <h2 className="text-2xl font-bold mb-4">您目前處於訪客模式</h2>
          <p className="text-text-secondary mb-8">請先登入以使用購物車功能</p>
          <div className="animate-pulse text-brand font-bold bg-brand/10 px-6 py-3 rounded-full">
            請點擊上方或下方導覽列進行登入
          </div>
        </div>
      );
    }
  }

  const updateQuantity = (productId: string, delta: number) => {
    const newItems = cartItems.map(item => {
      if (item.product_id === productId) {
        const newQuantity = Math.max(1, item.quantity + delta);
        return { ...item, quantity: newQuantity };
      }
      return item;
    });
    setCartItems(newItems);
    localStorage.setItem("cart", JSON.stringify(newItems));
  };

  const removeItem = (productId: string) => {
    const newItems = cartItems.filter(item => item.product_id !== productId);
    setCartItems(newItems);
    localStorage.setItem("cart", JSON.stringify(newItems));
  };

  const calculateTotal = () => {
    return cartItems.reduce((total, item) => total + item.price * item.quantity, 0);
  };

  const checkout = async () => {
    if (cartItems.length === 0) return;
    setLoading(true);
    
    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          buyer_id: "user_buyer_1", // Hardcoded Mock Buyer
          items: cartItems.map(item => ({
            product_id: item.product_id,
            quantity: item.quantity
          }))
        })
      });

      if (!response.ok) {
        throw new Error("Checkout failed");
      }

      showToast("結帳成功！訂單已建立。", "success");
      localStorage.removeItem("cart");
      setCartItems([]);
      router.push("/profile");
    } catch (err) {
      console.error(err);
      showToast("結帳發生錯誤，請稍後再試。", "error");
    } finally {
      setLoading(false);
    }
  };

  if (cartItems.length === 0) {
    return (
      <div className="w-full max-w-4xl p-6 py-20 text-center">
        <div className="text-6xl mb-6">🛒</div>
        <h2 className="text-2xl font-bold mb-4">你的購物車是空的</h2>
        <p className="text-text-secondary mb-8">快去看看有什麼有趣的特殊寵物吧！</p>
        <Link href="/">
          <button className="bg-brand text-white px-8 py-3 rounded-full font-medium hover:bg-brand/90 transition-colors">
            去逛逛
          </button>
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl p-6">
      <h1 className="text-3xl font-bold mb-8">購物車</h1>
      
      <div className="flex flex-col md:flex-row gap-8">
        {/* Left: Items */}
        <div className="flex-1 space-y-4">
          {cartItems.map((item) => (
            <div key={item.product_id} className="bg-surface border border-surface/50 rounded-xl p-4 flex gap-4 items-center">
              <div className="relative w-24 h-24 rounded-lg overflow-hidden flex-shrink-0 bg-background">
                {item.image_url ? (
                  <Image src={item.image_url} alt={item.title} fill className="object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-xs text-text-secondary">無圖</div>
                )}
              </div>
              
              <div className="flex-1 min-w-0">
                <Link href={`/product/${item.product_id}`} className="font-semibold text-lg hover:text-brand truncate block">
                  {item.title}
                </Link>
                <div className="text-sm text-text-secondary mb-2">賣家：{item.seller_name}</div>
                <div className="text-brand font-bold">NT$ {item.price.toLocaleString()}</div>
              </div>
              
              <div className="flex flex-col items-end gap-2">
                <button 
                  onClick={() => removeItem(item.product_id)}
                  className="text-text-secondary hover:text-red-500 text-sm transition-colors"
                >
                  刪除
                </button>
                <div className="flex items-center bg-background rounded-lg border border-surface/50 overflow-hidden">
                  <button onClick={() => updateQuantity(item.product_id, -1)} className="px-3 py-1 hover:bg-surface">-</button>
                  <span className="px-2 w-8 text-center">{item.quantity}</span>
                  <button onClick={() => updateQuantity(item.product_id, 1)} className="px-3 py-1 hover:bg-surface">+</button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Right: Summary */}
        <div className="md:w-80 flex-shrink-0">
          <div className="bg-surface border border-surface/50 rounded-xl p-6 sticky top-6">
            <h2 className="text-xl font-bold mb-4">訂單摘要</h2>
            
            <div className="flex justify-between mb-2 text-text-secondary">
              <span>商品總計</span>
              <span>NT$ {calculateTotal().toLocaleString()}</span>
            </div>
            <div className="flex justify-between mb-4 text-text-secondary">
              <span>運費</span>
              <span>NT$ 0</span>
            </div>
            
            <div className="border-t border-surface/50 pt-4 mb-6">
              <div className="flex justify-between items-end">
                <span className="font-bold">總付款金額</span>
                <span className="text-2xl font-bold text-brand">
                  NT$ {calculateTotal().toLocaleString()}
                </span>
              </div>
            </div>
            
            <button 
              onClick={checkout}
              disabled={loading}
              className="w-full bg-brand text-white py-3 rounded-lg font-bold hover:bg-brand/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              ) : (
                "確認結帳"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
