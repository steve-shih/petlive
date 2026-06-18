"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "../components/Toast";
import Link from "next/link";

export default function RegisterPage() {
  const router = useRouter();
  const [method, setMethod] = useState<'PHONE' | 'EMAIL'>('PHONE');
  const [contact, setContact] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const { showToast } = useToast();
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [codeSent, setCodeSent] = useState(false);

  const handleSendCode = () => {
    if (!contact) {
      setError("請先輸入您的" + (method === 'PHONE' ? "手機號碼" : "Email"));
      return;
    }
    setError("");
    setCodeSent(true);
    showToast(`驗證碼已發送至 ${contact}！\n(測試期間請統一輸入驗證碼：123456)`, "info");
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json", "ngrok-skip-browser-warning": "69420" },
        body: JSON.stringify({ method, contact, password, code, name })
      });
      const data = await res.json();
      
      if (res.ok) {
        setSuccess(true);
        setTimeout(() => {
          router.push("/login");
        }, 2000);
      } else {
        setError(data.error || "註冊失敗");
        setLoading(false);
      }
    } catch (err) {
      console.error(err);
      showToast("發生錯誤，請稍後再試", "error");
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="w-full max-w-md mx-auto p-6 pt-24 text-center">
        <div className="bg-surface rounded-3xl p-12 border border-brand shadow-xl shadow-brand/20">
          <div className="text-6xl mb-6">🎉</div>
          <h2 className="text-2xl font-bold text-brand mb-4">註冊成功！</h2>
          <p className="text-text-secondary">歡迎加入寵BAR，即將為您跳轉至登入頁面...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto p-6 pt-12">
      <div className="bg-surface rounded-3xl p-8 border border-surface/50 shadow-xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold text-brand mb-2">註冊 寵BAR 帳號</h1>
          <p className="text-text-secondary text-sm">快速註冊，立即體驗專屬功能</p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/50 text-red-500 text-sm p-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        <div className="flex bg-background rounded-xl p-1 mb-6 border border-surface/50">
          <button 
            onClick={() => { setMethod('PHONE'); setContact(''); setCodeSent(false); }}
            className={`flex-1 py-2 text-sm font-bold rounded-lg transition-colors ${method === 'PHONE' ? 'bg-brand text-white shadow-md' : 'text-text-secondary hover:text-text-primary'}`}
          >
            手機號碼註冊
          </button>
          <button 
            onClick={() => { setMethod('EMAIL'); setContact(''); setCodeSent(false); }}
            className={`flex-1 py-2 text-sm font-bold rounded-lg transition-colors ${method === 'EMAIL' ? 'bg-brand text-white shadow-md' : 'text-text-secondary hover:text-text-primary'}`}
          >
            Email 註冊
          </button>
        </div>

        <form onSubmit={handleRegister} className="space-y-5">
          <div>
            <label className="block text-sm font-bold mb-2 text-text-primary">
              {method === 'PHONE' ? '手機號碼' : 'Email 信箱'}
            </label>
            <input
              type={method === 'PHONE' ? 'tel' : 'email'}
              required
              value={contact}
              onChange={(e) => setContact(e.target.value)}
              className="w-full bg-background border border-surface/50 rounded-xl px-4 py-3 focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand transition-all"
              placeholder={method === 'PHONE' ? '0912345678' : 'example@mail.com'}
            />
          </div>

          <div>
            <label className="block text-sm font-bold mb-2 text-text-primary">驗證碼</label>
            <div className="flex space-x-2">
              <input
                type="text"
                required
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="flex-1 bg-background border border-surface/50 rounded-xl px-4 py-3 focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand transition-all"
                placeholder="輸入 6 碼驗證碼"
              />
              <button
                type="button"
                onClick={handleSendCode}
                className="bg-brand/10 text-brand font-bold px-4 rounded-xl hover:bg-brand/20 transition-colors whitespace-nowrap"
              >
                {codeSent ? "重新發送" : "發送驗證碼"}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold mb-2 text-text-primary">用戶名稱 (暱稱)</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-background border border-surface/50 rounded-xl px-4 py-3 focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand transition-all"
              placeholder="給自己取個好記的名字"
            />
          </div>

          <div>
            <label className="block text-sm font-bold mb-2 text-text-primary">設定密碼</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-background border border-surface/50 rounded-xl px-4 py-3 focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand transition-all"
              placeholder="至少 6 個字元"
            />
          </div>
          
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-brand text-white font-bold py-3 rounded-xl hover:bg-brand/90 transition-colors shadow-lg shadow-brand/30 disabled:opacity-50 mt-4"
          >
            {loading ? "處理中..." : "完成註冊"}
          </button>
        </form>

        <div className="mt-8 text-center text-sm text-text-secondary">
          已經有帳號了？ 
          <Link href="/login" className="text-brand font-bold ml-1 hover:underline">
            立即登入
          </Link>
        </div>
      </div>
    </div>
  );
}
