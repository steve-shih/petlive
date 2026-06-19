"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "../components/Toast";
import Link from "next/link";
import { GoogleLogin } from "@react-oauth/google";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { showToast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json", "ngrok-skip-browser-warning": "69420" },
        body: JSON.stringify({ username, password })
      });
      const data = await res.json();
      
      if (res.ok) {
        localStorage.setItem("current_user_id", data.user.id);
        window.location.href = "/"; // Force hard refresh to load Navbar state
      } else {
        setError(data.error || "登入失敗");
        setLoading(false);
      }
    } catch (err) {
      console.error(err);
      setError("連線錯誤，請稍後再試");
      setLoading(false);
    }
  };

  const handleLineLogin = () => {
    const channelId = "2010452149";
    const redirectUri = encodeURIComponent(window.location.origin + "/login/line/callback");
    const state = Math.random().toString(36).substring(7);
    const lineAuthUrl = `https://access.line.me/oauth2/v2.1/authorize?response_type=code&client_id=${channelId}&redirect_uri=${redirectUri}&state=${state}&scope=profile%20openid%20email`;
    window.location.href = lineAuthUrl;
  };

  return (
    <div className="w-full max-w-md mx-auto p-6 pt-12">
      <div className="bg-surface rounded-3xl p-8 border border-surface/50 shadow-xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold text-brand mb-2">寵BAR</h1>
          <p className="text-text-secondary text-sm">全台最大的特殊寵物交易平台</p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/50 text-red-500 text-sm p-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-sm font-bold mb-2 text-text-primary">手機號碼 或 Email 或 用戶名稱</label>
            <input
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-background border border-surface/50 rounded-xl px-4 py-3 focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand transition-all"
              placeholder="請輸入您的帳號"
            />
          </div>
          <div>
            <label className="block text-sm font-bold mb-2 text-text-primary">密碼</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-background border border-surface/50 rounded-xl px-4 py-3 focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand transition-all"
              placeholder="請輸入密碼 (測試請隨意輸入)"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-brand text-white font-bold py-3 rounded-xl hover:bg-brand/90 transition-colors shadow-lg shadow-brand/30 disabled:opacity-50"
          >
            {loading ? "登入中..." : "登入"}
          </button>
        </form>

        <div className="mt-8 flex items-center justify-center space-x-4">
          <div className="h-px bg-surface/50 flex-1"></div>
          <span className="text-xs text-text-secondary">或使用社群帳號登入</span>
          <div className="h-px bg-surface/50 flex-1"></div>
        </div>

        <div className="mt-6 space-y-3">
          <button 
            type="button"
            onClick={handleLineLogin}
            className="w-full flex items-center justify-center space-x-2 bg-[#00C300] hover:bg-[#00B300] text-white font-bold py-3 rounded-xl transition-colors"
          >
            <span>💬 LINE 登入</span>
          </button>
          
          <div className="w-full flex justify-center">
            <GoogleLogin
              onSuccess={async (credentialResponse) => {
                setLoading(true);
                setError("");
                try {
                  const res = await fetch("/api/auth/google", {
                    method: "POST",
                    headers: { "Content-Type": "application/json", "ngrok-skip-browser-warning": "69420" },
                    body: JSON.stringify({ token: credentialResponse.credential })
                  });
                  const data = await res.json();
                  if (res.ok) {
                    localStorage.setItem("current_user_id", data.user.id);
                    window.location.href = "/";
                  } else {
                    setError(data.error || "Google 登入失敗");
                    setLoading(false);
                  }
                } catch (err) {
                  console.error(err);
                  setError("連線錯誤，請稍後再試");
                  setLoading(false);
                }
              }}
              onError={() => {
                setError("Google 登入失敗");
              }}
              useOneTap
            />
          </div>
        </div>

        <div className="mt-8 text-center text-sm text-text-secondary">
          還沒有帳號嗎？ 
          <Link href="/register" className="text-brand font-bold ml-1 hover:underline">
            立即註冊
          </Link>
        </div>
      </div>
    </div>
  );
}
