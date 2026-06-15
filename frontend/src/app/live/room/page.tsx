"use client";

import Link from 'next/link';
import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useUserStore } from "@/store/userStore";
import {
  LiveKitRoom,
  VideoConference,
  RoomAudioRenderer,
  Chat
} from "@livekit/components-react";
import "@livekit/components-styles";

function LiveRoomContent() {
  const searchParams = useSearchParams();
  const roomId = searchParams.get('id'); // this will be 'live-001'
  const user = useUserStore(state => state.user);
  const router = useRouter();

  const [token, setToken] = useState("");
  const [serverUrl, setServerUrl] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!user) {
      alert("請先登入後才能觀看直播！");
      router.push('/login');
      return;
    }

    if (!roomId) return;

    // Fetch buyer token (is_host=false)
    const fetchToken = async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
        const res = await fetch(`${apiUrl}/api/livekit/token?room=${roomId}&participant=${encodeURIComponent(user.name)}&is_host=false`);
        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.detail || "無法取得直播憑證");
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
  }, [roomId, user, router]);

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!roomId) return <div style={{ color: '#fff', padding: '100px', textAlign: 'center' }}>無效的直播連結</div>;

  return (
    <main style={{ height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', backgroundColor: '#000' }}>
      
      {/* Mini Header */}
      <nav className="glass-nav" style={{ padding: '12px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Link href="/" style={{ fontSize: '1.2rem' }}>←</Link>
          <span style={{ fontWeight: 700 }}>🔴 實況觀看中</span>
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <button 
            onClick={copyLink}
            className="btn btn-glass" 
            style={{ padding: '4px 12px', fontSize: '12px', border: '1px solid var(--brand-primary)' }}
          >
            {copied ? '✅ 已複製連結' : '🔗 複製專屬連結'}
          </button>
          <span style={{ background: 'var(--danger)', color: '#fff', padding: '4px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 800 }}>LIVE</span>
        </div>
      </nav>

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        
        {/* Left: Video Player */}
        <div 
          style={{ flex: 1, backgroundColor: '#050505', display: 'flex', flexDirection: 'column', position: 'relative' }}
        >
          {errorMsg ? (
            <div style={{ margin: 'auto', textAlign: 'center', color: 'var(--danger)', padding: '20px', border: '1px solid var(--danger)', borderRadius: '12px', background: 'rgba(239,68,68,0.1)' }}>
              <h3>直播連線失敗</h3>
              <p>{errorMsg}</p>
            </div>
          ) : !token ? (
            <div style={{ margin: 'auto', textAlign: 'center', color: 'var(--text-secondary)' }}>
              <h3>載入連線中...</h3>
            </div>
          ) : (
            <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
              <LiveKitRoom
                video={true}
                audio={true}
                token={token}
                serverUrl={serverUrl}
                connect={true}
                data-lk-theme="default"
                style={{ height: '100%', display: 'flex', flexDirection: 'column' }}
              >
                {/* 買家端：接收賣家的視訊與音訊 */}
                <VideoConference />
                <RoomAudioRenderer />
                
                {/* Overlay Chat Box positioned like a native app */}
                <div style={{ position: 'absolute', bottom: '80px', right: '20px', width: '320px', height: '400px', background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(10px)', borderRadius: '16px', overflow: 'hidden', border: '1px solid var(--glass-border)', display: 'flex', flexDirection: 'column', zIndex: 50 }}>
                   <div style={{ padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.1)', fontWeight: 600, color: 'var(--brand-secondary)' }}>
                     即時聊天室
                   </div>
                   {/* LiveKit 官方聊天元件 */}
                   <div style={{ flex: 1, overflow: 'hidden' }} className="lk-chat-wrapper-custom">
                     <Chat />
                   </div>
                </div>

              </LiveKitRoom>
            </div>
          )}
          
          <div style={{ position: 'absolute', top: '40%', right: '20px', background: 'rgba(0,0,0,0.5)', padding: '10px', borderRadius: '20px', color: 'rgba(255,255,255,0.7)', fontSize: '24px', animation: 'bounce 2s infinite', zIndex: 40, pointerEvents: 'none' }}>
            ↑<br/>↓
          </div>

          <div style={{ position: 'absolute', bottom: '20px', left: '20px', display: 'flex', gap: '12px', zIndex: 60 }}>
            <button className="btn btn-primary animate-hover" onClick={(e) => { e.stopPropagation(); alert("即將導向金流支付！"); }}>💰 立即付訂金</button>
            <button className="btn btn-glass animate-hover" onClick={(e) => { e.stopPropagation(); alert("已發送預約請求！"); }}>📅 預約現場看</button>
          </div>
        </div>

      </div>
      
      <style dangerouslySetInnerHTML={{__html: `
        /* 覆寫 LiveKit Chat 樣式以融入我們的玻璃黑風格 */
        .lk-chat-wrapper-custom .lk-chat {
          height: 100% !important;
          background: transparent !important;
          border: none !important;
        }
        .lk-chat-wrapper-custom .lk-chat-messages {
          padding: 10px;
        }
        .lk-chat-wrapper-custom .lk-chat-entry {
          background: rgba(255,255,255,0.05);
          color: white;
          border: none;
          padding: 8px 12px;
          border-radius: 8px;
        }
      `}} />
    </main>
  );
}

export default function LiveRoom() {
  return (
    <Suspense fallback={<div style={{ padding: '100px', textAlign: 'center' }}>載入中...</div>}>
      <LiveRoomContent />
    </Suspense>
  );
}
