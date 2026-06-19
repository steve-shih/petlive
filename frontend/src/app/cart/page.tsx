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
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [shippingMethod, setShippingMethod] = useState<string>("711");
  const [shippingDetails, setShippingDetails] = useState({ name: "", phone: "", address: "" });
  const { showToast } = useToast();

  const SHIPPING_OPTIONS = [
    { id: "711", name: "7-11 店到店", price: 60, icon: "🏪" },
    { id: "blackcat", name: "黑貓宅急便", price: 130, icon: "🐈‍⬛" },
    { id: "airforce", name: "空軍一號", price: 200, icon: "✈️" },
    { id: "inperson", name: "面交自取", price: 0, icon: "🤝" },
  ];

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

  const calculateSubtotal = () => {
    return cartItems.reduce((total, item) => total + item.price * item.quantity, 0);
  };

  const getShippingPrice = () => {
    return SHIPPING_OPTIONS.find(opt => opt.id === shippingMethod)?.price || 0;
  };

  const calculateTotal = () => {
    return calculateSubtotal() + getShippingPrice();
  };

  const handleCheckoutClick = () => {
    if (cartItems.length === 0) return;
    
    // Auto-fill details if user is logged in
    const userId = localStorage.getItem("current_user_id");
    if (userId) {
      fetch(`/api/user/${userId}/settings`)
        .then(res => res.json())
        .then(data => {
          setShippingDetails({
            name: data.name || "",
            phone: data.phone || "",
            address: data.sevenElevenStore || data.addressBook?.[0] || ""
          });
        })
        .catch(() => {});
    }
    setShowCheckoutModal(true);
  };

  const submitOrder = async () => {
    if (!shippingDetails.name || !shippingDetails.phone || !shippingDetails.address) {
      showToast("請填寫完整的收件資訊", "error");
      return;
    }
    
    setLoading(true);
    
    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          buyer_id: currentUserId,
          shipping_method: shippingMethod,
          shipping_fee: getShippingPrice(),
          shipping_details: shippingDetails,
          total_amount: calculateTotal(),
          items: cartItems.map(item => ({
            product_id: item.product_id,
            quantity: item.quantity,
            price: item.price,
            seller_name: item.seller_name
          }))
        })
      });

      if (!response.ok) {
        throw new Error("Checkout failed");
      }

      showToast("結帳成功！訂單已建立。", "success");
      localStorage.removeItem("cart");
      setCartItems([]);
      setShowCheckoutModal(false);
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
              <span>NT$ {calculateSubtotal().toLocaleString()}</span>
            </div>
            
            <div className="border-t border-surface/50 pt-4 mb-6">
              <div className="flex justify-between items-end">
                <span className="font-bold">不含運小計</span>
                <span className="text-2xl font-bold text-brand">
                  NT$ {calculateSubtotal().toLocaleString()}
                </span>
              </div>
            </div>
            
            <button 
              onClick={handleCheckoutClick}
              disabled={loading}
              className="w-full bg-brand text-white py-3 rounded-lg font-bold hover:bg-brand/90 transition-colors flex justify-center items-center shadow-lg hover:shadow-xl hover:-translate-y-0.5"
            >
              選擇物流並結帳
            </button>
          </div>
        </div>
      </div>

      {/* Checkout Modal */}
      {showCheckoutModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-surface border border-surface-hover rounded-3xl p-6 md:p-8 w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl relative">
            <button 
              onClick={() => setShowCheckoutModal(false)}
              className="absolute top-6 right-6 text-text-secondary hover:text-white transition-colors"
            >
              ✕
            </button>
            
            <h2 className="text-2xl font-extrabold mb-6">結帳確認</h2>
            
            {/* Logistics Selection */}
            <div className="mb-8">
              <h3 className="font-bold text-lg mb-4 flex items-center gap-2">📦 選擇配送方式</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {SHIPPING_OPTIONS.map((opt) => (
                  <div 
                    key={opt.id}
                    onClick={() => setShippingMethod(opt.id)}
                    className={`cursor-pointer border rounded-xl p-4 flex flex-col items-center justify-center gap-2 transition-all ${
                      shippingMethod === opt.id 
                        ? 'border-brand bg-brand/10 text-brand shadow-md scale-105' 
                        : 'border-surface-hover bg-background text-text-secondary hover:border-text-secondary'
                    }`}
                  >
                    <span className="text-3xl">{opt.icon}</span>
                    <span className="font-bold text-sm text-center">{opt.name}</span>
                    <span className="text-xs">NT$ {opt.price}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Recipient Details */}
            <div className="mb-8 bg-background p-5 rounded-2xl border border-surface/50">
              <h3 className="font-bold text-lg mb-4 flex items-center gap-2">📝 收件人資訊</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-text-secondary mb-1">姓名</label>
                  <input type="text" value={shippingDetails.name} onChange={e => setShippingDetails({...shippingDetails, name: e.target.value})} className="w-full bg-surface border border-surface-hover rounded-lg px-4 py-2 focus:border-brand outline-none transition-colors" placeholder="請填寫真實姓名" />
                </div>
                <div>
                  <label className="block text-sm text-text-secondary mb-1">聯絡電話</label>
                  <input type="text" value={shippingDetails.phone} onChange={e => setShippingDetails({...shippingDetails, phone: e.target.value})} className="w-full bg-surface border border-surface-hover rounded-lg px-4 py-2 focus:border-brand outline-none transition-colors" placeholder="09xx-xxx-xxx" />
                </div>
                <div>
                  <label className="block text-sm text-text-secondary mb-1">
                    {shippingMethod === '711' ? '7-11 門市店號/店名' : shippingMethod === 'airforce' ? '空軍一號站點' : '詳細地址'}
                  </label>
                  <input type="text" value={shippingDetails.address} onChange={e => setShippingDetails({...shippingDetails, address: e.target.value})} className="w-full bg-surface border border-surface-hover rounded-lg px-4 py-2 focus:border-brand outline-none transition-colors" placeholder="請填寫配送目的地" />
                </div>
              </div>
            </div>

            {/* Final Summary */}
            <div className="border-t border-surface/50 pt-6">
              <div className="flex justify-between text-text-secondary mb-2">
                <span>商品小計</span>
                <span>NT$ {calculateSubtotal().toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-text-secondary mb-4">
                <span>運費 ({SHIPPING_OPTIONS.find(o => o.id === shippingMethod)?.name})</span>
                <span>NT$ {getShippingPrice()}</span>
              </div>
              <div className="flex justify-between items-end mb-6">
                <span className="font-bold text-xl">總付款金額</span>
                <span className="text-3xl font-black text-brand">
                  NT$ {calculateTotal().toLocaleString()}
                </span>
              </div>
              
              <button 
                onClick={submitOrder}
                disabled={loading}
                className="w-full bg-brand text-white py-4 rounded-xl font-bold text-lg hover:bg-brand/90 transition-colors flex justify-center items-center shadow-lg"
              >
                {loading ? <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div> : "確認結帳並建立訂單"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
