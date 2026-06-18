"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useToast } from "../components/Toast";

interface LiveRoom {
  id: string;
  streamer_id: string;
  streamer_name: string;
  title: string;
  created_at: string;
}

export default function LiveLobby() {
  const router = useRouter();
  const [rooms, setRooms] = useState<LiveRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<string | null>(null);
  const [isSeller, setIsSeller] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    const userId = localStorage.getItem("current_user_id");
    setCurrentUser(userId);
    if (userId) {
      fetch(`/api/users/${userId}`, { headers: { "ngrok-skip-browser-warning": "69420" } })
        .then(res => res.json())
        .then(data => {
          if (data.role === 'SELLER' || data.role === 'ADMIN') setIsSeller(true);
        });
    }
    loadRooms();
    const interval = setInterval(loadRooms, 5000);
    return () => clearInterval(interval);
  }, []);

  const loadRooms = () => {
    fetch("/api/live/rooms", { headers: { "ngrok-skip-browser-warning": "69420" } })
      .then(res => {
        if (!res.ok) throw new Error("API failed");
        return res.json();
      })
      .then(data => {
        setRooms(data);
        setLoading(false);
      })
      .catch(err => {
        console.error("Failed to load rooms:", err);
        setLoading(false);
      });
  };

  const startLive = async () => {
    if (!currentUser) return;

    // 1. 確認開啟直播
    if (!confirm("確定要建立並進入直播間嗎？")) return;

    // 2. 先驗證是否有相機權限 (若在 HTTP 環境下，手機瀏覽器會直接阻擋)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      // 取得權限後立刻關閉，實際的影像串流由進入房間後再啟動
      stream.getTracks().forEach(track => track.stop());
    } catch (err) {
      console.error("Camera check failed:", err);
      showToast("⚠️ 無法取得相機權限！原因：您的瀏覽器拒絕了相機存取，或者您目前使用的是沒有安全加密的 http 網址。", "error");
      return; // 權限失敗，直接中斷，不產生房間！
    }

    // 3. 輸入標題
    const title = prompt("請輸入直播間標題：", "我的寵物直播");
    if (!title) return;

    try {
      const res = await fetch("/api/live/rooms", {
        method: "POST",
        headers: { "Content-Type": "application/json", "ngrok-skip-browser-warning": "69420" },
        body: JSON.stringify({ streamer_id: currentUser, title })
      });
      const data = await res.json();
      if (res.ok) {
        router.push(`/live/${data.room.id}`);
      }
    } catch (err) {
      console.error(err);
      showToast("開播請求失敗，請檢查網路連線", "error");
    }
  };

  return (
    <div className="w-full max-w-6xl p-6">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold flex items-center space-x-2">
          <span className="text-red-500 animate-pulse">●</span>
          <span>Live 直播大廳</span>
        </h1>
        {isSeller && (
          <button 
            onClick={startLive}
            className="bg-brand text-white px-6 py-2 rounded-full font-bold shadow-lg hover:bg-brand/90 transition-colors"
          >
            🎥 開始直播
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-40">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand"></div>
        </div>
      ) : rooms.length === 0 ? (
        <div className="text-center py-20 bg-surface rounded-2xl border border-surface/50">
          <div className="text-5xl mb-4">💤</div>
          <h3 className="text-xl font-bold text-text-secondary">目前沒有直播進行中</h3>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {rooms.map(room => (
            <Link href={`/live/${room.id}`} key={room.id}>
              <div className="bg-surface rounded-2xl overflow-hidden border border-surface/50 hover:border-brand/50 transition-colors group cursor-pointer shadow-sm">
                <div className="relative">
                  {room.thumbnail_url ? (
                    <img src={room.thumbnail_url} alt="Cover" className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-500" />
                  ) : (
                    <div className="w-full h-48 bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center group-hover:scale-105 transition-transform duration-500">
                      <span className="text-4xl">🦎</span>
                    </div>
                  )}
                  <div className="absolute top-3 left-3 bg-red-600 animate-pulse text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg border border-white/20 backdrop-blur-sm">
                    LIVE
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="font-bold text-lg mb-1 truncate">{room.title}</h3>
                  <div className="text-sm text-text-secondary">主播：{room.streamer_name}</div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
