"use client";
import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function LineCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState("");

  useEffect(() => {
    const code = searchParams.get("code");
    const errorParam = searchParams.get("error");

    if (errorParam) {
      setError("使用者拒絕授權或發生錯誤：" + errorParam);
      return;
    }

    if (code) {
      // Send code to backend
      const verifyCode = async () => {
        try {
          const res = await fetch("/api/auth/line", {
            method: "POST",
            headers: { "Content-Type": "application/json", "ngrok-skip-browser-warning": "69420" },
            body: JSON.stringify({ 
              code, 
              redirect_uri: window.location.origin + "/login/line/callback" 
            })
          });
          
          const data = await res.json();
          if (res.ok) {
            localStorage.setItem("current_user_id", data.user.id);
            window.location.href = "/";
          } else {
            setError(data.error || "LINE 登入失敗");
          }
        } catch (err) {
          setError("連線錯誤，請稍後再試");
        }
      };
      
      verifyCode();
    } else {
      setError("無效的授權碼");
    }
  }, [searchParams]);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="bg-red-500/10 border border-red-500/50 text-red-500 p-6 rounded-xl max-w-md text-center">
          <h2 className="text-xl font-bold mb-2">登入失敗</h2>
          <p>{error}</p>
          <button 
            onClick={() => router.push("/login")}
            className="mt-6 bg-surface px-4 py-2 rounded-lg text-text-primary hover:bg-surface/80"
          >
            回登入頁
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
      <div className="w-12 h-12 border-4 border-[#00C300] border-t-transparent rounded-full animate-spin"></div>
      <p className="text-text-secondary font-bold">正在處理 LINE 登入，請稍候...</p>
    </div>
  );
}

export default function LineCallbackPage() {
  return (
    <Suspense fallback={<div className="text-center p-10">Loading...</div>}>
      <LineCallbackContent />
    </Suspense>
  );
}
