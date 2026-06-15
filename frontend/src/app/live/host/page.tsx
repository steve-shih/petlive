"use client";

import { useEffect, useState } from "react";
import { useUserStore } from "@/store/userStore";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  LiveKitRoom,
  VideoConference,
  RoomAudioRenderer,
} from "@livekit/components-react";
import "@livekit/components-styles";

export default function HostScreen() {
  const user = useUserStore((state) => state.user);
  const router = useRouter();

  const [token, setToken] = useState("");
  const [serverUrl, setServerUrl] = useState("wss://livekit.io");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (!user || user.role !== "SELLER") {
      alert("請先以賣家身分登入！");
      router.push("/login");
      return;
    }
    
    // Fetch real token from FastAPI backend
    const fetchToken = async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
        const res = await fetch(`${apiUrl}/api/livekit/token?room=live-001&participant=${encodeURIComponent(user.name)}&is_host=true`);
        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.detail || "無法取得憑證");
        }
        const data = await res.json();
        setToken(data.token);
        setServerUrl(data.url);
      } catch (err: any) {
        console.error(err);
        setErrorMsg(err.message);
      }
    };
    
    fetchToken();
  }, [user, router]);

  if (!user || user.role !== "SELLER") return null;

  return (
    <main style={{ height: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: '#000' }}>
      {/* Header */}
      <nav className="glass-nav" style={{ padding: '12px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Link href="/" style={{ fontSize: '1.2rem' }}>←</Link>
          <span style={{ fontWeight: 800 }}>🔴 開播控場大廳</span>
        </div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>店鋪：{user.name}</span>
        </div>
      </nav>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '20px', gap: '20px' }}>
        
        {/* Connection Status Alert */}
        {errorMsg ? (
           <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid var(--danger)', padding: '16px', borderRadius: '12px', textAlign: 'center' }}>
             <h3 style={{ color: 'var(--danger)', marginBottom: '8px' }}>連線失敗</h3>
             <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
               {errorMsg} (請確認 FastAPI 後端與 .env 金鑰設定正確)
             </p>
           </div>
        ) : !token ? (
           <div style={{ background: 'rgba(249, 115, 22, 0.1)', border: '1px solid var(--brand-primary)', padding: '16px', borderRadius: '12px', textAlign: 'center' }}>
             <h3 style={{ color: 'var(--brand-primary)', marginBottom: '8px' }}>正在向伺服器請求推流憑證...</h3>
           </div>
        ) : (
           <div style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid var(--success)', padding: '16px', borderRadius: '12px', textAlign: 'center' }}>
             <h3 style={{ color: 'var(--success)', marginBottom: '8px' }}>連線成功，正在開啟攝影機</h3>
             <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>請允許瀏覽器使用您的相機與麥克風權限。</p>
           </div>
        )}

        {/* LiveKit Room Component */}
        <div style={{ flex: 1, border: '1px solid var(--glass-border)', borderRadius: '20px', overflow: 'hidden', background: '#111', position: 'relative' }}>
          
          <LiveKitRoom
            video={true}
            audio={true}
            token={token}
            serverUrl={serverUrl}
            connect={!!token} 
            data-lk-theme="default"
            style={{ height: '100%', display: 'flex', flexDirection: 'column' }}
          >
            {/* The standard VideoConference UI from LiveKit handles camera toggle and participant grids */}
            <VideoConference />
            
            {/* Renders audio of other participants (if any) */}
            <RoomAudioRenderer />
            
            {/* Custom Overlay for Chat (Mock) */}
            <div style={{ position: 'absolute', bottom: '80px', right: '20px', width: '300px', background: 'rgba(0,0,0,0.6)', borderRadius: '12px', padding: '12px', border: '1px solid var(--glass-border)', zIndex: 10 }}>
               <h4 style={{ fontSize: '14px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '8px', marginBottom: '8px' }}>聊天室即時動態</h4>
               <div style={{ fontSize: '12px', color: '#ccc', marginBottom: '4px' }}>[系統] 直播元件已就緒...</div>
               <div style={{ fontSize: '12px', color: '#ccc', marginBottom: '4px' }}>[等待連線] 尚未取得後端推流 Token...</div>
            </div>

          </LiveKitRoom>
        </div>

      </div>
    </main>
  );
}
