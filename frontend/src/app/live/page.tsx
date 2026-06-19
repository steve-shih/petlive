"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useToast } from "../components/Toast";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

interface LiveRoom {
  id: string;
  streamer_id: string;
  streamer_name: string;
  title: string;
  created_at: string;
  high_traffic?: boolean;
  thumbnail_url?: string;
}

export default function LiveLobby() {
  const router = useRouter();
  const [rooms, setRooms] = useState<LiveRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<string | null>(null);
  const [isSeller, setIsSeller] = useState(false);
  const [userTier, setUserTier] = useState(0);
  const [isAdmin, setIsAdmin] = useState(false);
  const [monitorRoom, setMonitorRoom] = useState<LiveRoom | null>(null);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [liveConfig, setLiveConfig] = useState({
    title: '我的寵物直播',
    max_layers: 3,
    layer_0_capacity: 4,
    layer_n_capacity: 4
  });
  const { showToast } = useToast();

  const mockChartData = [
    { time: '10:00', viewers: 12 },
    { time: '10:05', viewers: 25 },
    { time: '10:10', viewers: 68 },
    { time: '10:15', viewers: 104 },
    { time: '10:20', viewers: 96 },
    { time: '10:25', viewers: 140 },
    { time: '10:30', viewers: 135 },
  ];

  useEffect(() => {
    const userId = localStorage.getItem("current_user_id");
    setCurrentUser(userId);
    if (userId) {
      fetch(`/api/users/${userId}`, { headers: { "ngrok-skip-browser-warning": "69420" } })
        .then(res => res.json())
        .then(data => {
          if (data.role === 'SELLER' || data.role === 'ADMIN') {
            setIsSeller(true);
            setUserTier(data.tier || 0);
          }
          if (data.role === 'ADMIN') setIsAdmin(true);
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
        // Sort rooms: High traffic first, then recent
        const sortedRooms = data.sort((a: LiveRoom, b: LiveRoom) => {
          if (a.high_traffic && !b.high_traffic) return -1;
          if (!a.high_traffic && b.high_traffic) return 1;
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        });
        setRooms(sortedRooms);
        setLoading(false);
      })
      .catch(err => {
        console.error("Failed to load rooms:", err);
        setLoading(false);
      });
  };

  const prepareLive = async (useDefault = true) => {
    if (!currentUser) return;

    if (userTier < 3 && !isAdmin) {
      showToast("需要解鎖「直播帶貨」權限才能開播", "error");
      router.push("/profile?tab=upgrade");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      stream.getTracks().forEach(track => track.stop());
    } catch (err) {
      console.error("Camera check failed:", err);
      showToast("⚠️ 無法取得相機權限！", "error");
      return; 
    }

    if (useDefault) {
      submitLiveConfig(liveConfig);
    } else {
      setShowConfigModal(true);
    }
  };

  const submitLiveConfig = async (configOverride?: any) => {
    const config = configOverride || { ...liveConfig };
    if (!config.title) config.title = "我的寵物直播";
    if (config.layer_0_capacity < 4) config.layer_0_capacity = 4;
    if (config.layer_n_capacity < 1) config.layer_n_capacity = 1;
    if (config.layer_n_capacity > 4) config.layer_n_capacity = 4;
    
    setShowConfigModal(false);

    try {
      const res = await fetch("/api/live/rooms", {
        method: "POST",
        headers: { "Content-Type": "application/json", "ngrok-skip-browser-warning": "69420" },
        body: JSON.stringify({ 
           streamer_id: currentUser, 
           title: config.title,
           max_layers: config.max_layers,
           layer_0_capacity: config.layer_0_capacity,
           layer_n_capacity: config.layer_n_capacity
        })
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
          <div className="flex gap-2">
            <button 
              onClick={() => prepareLive(true)}
              className="bg-brand text-white px-6 py-2 rounded-full font-bold shadow-lg hover:bg-brand/90 transition-colors"
            >
              🎥 開始直播
            </button>
            <button 
              onClick={() => prepareLive(false)}
              className="bg-surface border border-surface-hover text-white px-4 py-2 rounded-full font-bold shadow-lg hover:bg-surface-hover transition-colors"
              title="進階網路設定"
            >
              ⚙️
            </button>
          </div>
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
              <div className={`bg-surface rounded-2xl overflow-hidden transition-all group cursor-pointer shadow-sm relative ${room.high_traffic ? 'border-2 border-yellow-400 shadow-yellow-500/20 shadow-xl' : 'border border-surface/50 hover:border-brand/50'}`}>
                {room.high_traffic && (
                  <div className="absolute top-0 right-0 bg-yellow-400 text-black text-[10px] font-black px-3 py-1 rounded-bl-xl z-20 shadow-md">
                    ⭐ 置頂推薦
                  </div>
                )}
                <div className="relative">
                  {room.thumbnail_url ? (
                    <img src={room.thumbnail_url} alt="Cover" className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-500" />
                  ) : (
                    <div className="w-full h-48 bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center group-hover:scale-105 transition-transform duration-500">
                      <span className="text-4xl">🦎</span>
                    </div>
                  )}
                  <div className="absolute top-3 left-3 bg-red-600 animate-pulse text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg border border-white/20 backdrop-blur-sm z-10">
                    LIVE
                  </div>
                </div>
                <div className="p-4 flex flex-col justify-between">
                  <div>
                    <h3 className="font-bold text-lg mb-1 truncate">{room.title}</h3>
                    <div className="text-sm text-text-secondary">主播：{room.streamer_name}</div>
                  </div>
                  
                  {isAdmin && (
                    <button 
                      onClick={(e) => {
                        e.preventDefault();
                        setMonitorRoom(room);
                      }}
                      className="mt-4 w-full bg-surface-hover hover:bg-surface border border-surface/50 text-brand py-2 rounded-lg font-bold transition-colors text-sm flex items-center justify-center gap-2"
                    >
                      <span>📊</span> 監控數據 (Admin)
                    </button>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Start Live Configuration Modal */}
      {showConfigModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="bg-surface border border-surface-hover rounded-3xl p-6 md:p-8 w-full max-w-md shadow-2xl relative">
            <h2 className="text-2xl font-extrabold mb-4">⚙️ 進階 P2P 直播設定</h2>
            
            <div className="bg-brand/10 border border-brand/30 p-4 rounded-xl mb-6 text-center">
              <div className="text-sm text-text-secondary mb-1">根據目前設定，此直播間最大乘載人數</div>
              <div className="text-4xl font-black text-brand">
                {(() => {
                  let total = liveConfig.layer_0_capacity;
                  let currentLayer = liveConfig.layer_0_capacity;
                  for (let i = 1; i < liveConfig.max_layers; i++) {
                      currentLayer = currentLayer * liveConfig.layer_n_capacity;
                      total += currentLayer;
                  }
                  return total;
                })()} <span className="text-lg">人</span>
              </div>
            </div>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm text-text-secondary mb-1">直播間標題</label>
                <input 
                  type="text" 
                  value={liveConfig.title} 
                  onChange={e => setLiveConfig({...liveConfig, title: e.target.value})}
                  className="w-full bg-background border border-surface-hover rounded-lg px-4 py-2 text-sm focus:border-brand outline-none"
                />
              </div>
              <div>
                <label className="block text-sm text-text-secondary mb-1">總層數限制 (max_layers)</label>
                <input 
                  type="number" min="1" max="10"
                  value={liveConfig.max_layers} 
                  onChange={e => setLiveConfig({...liveConfig, max_layers: parseInt(e.target.value)})}
                  className="w-full bg-background border border-surface-hover rounded-lg px-4 py-2 text-sm focus:border-brand outline-none"
                />
              </div>
              <div>
                <label className="block text-sm text-text-secondary mb-1">直播主自身乘載人數 (至少 4 人)</label>
                <input 
                  type="number" min="4" max="20"
                  value={liveConfig.layer_0_capacity} 
                  onChange={e => setLiveConfig({...liveConfig, layer_0_capacity: Math.max(4, parseInt(e.target.value) || 4)})}
                  className="w-full bg-background border border-surface-hover rounded-lg px-4 py-2 text-sm focus:border-brand outline-none"
                />
              </div>
              <div>
                <label className="block text-sm text-text-secondary mb-1">觀眾轉發乘載人數 (1~4 人)</label>
                <input 
                  type="number" min="1" max="4"
                  value={liveConfig.layer_n_capacity} 
                  onChange={e => {
                     let val = parseInt(e.target.value) || 1;
                     if (val < 1) val = 1;
                     if (val > 4) val = 4;
                     setLiveConfig({...liveConfig, layer_n_capacity: val});
                  }}
                  className="w-full bg-background border border-surface-hover rounded-lg px-4 py-2 text-sm focus:border-brand outline-none"
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button 
                onClick={() => setShowConfigModal(false)}
                className="flex-1 border border-surface-hover hover:bg-surface py-2 rounded-xl font-bold transition-colors"
              >
                取消
              </button>
              <button 
                onClick={() => submitLiveConfig()}
                className="flex-1 bg-brand hover:bg-brand/90 text-white py-2 rounded-xl font-bold shadow-lg shadow-brand/20 transition-colors"
              >
                確認並開播
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Admin Monitor Modal */}
      {monitorRoom && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="bg-surface border border-surface-hover rounded-3xl p-6 md:p-8 w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl relative">
            <button 
              onClick={() => setMonitorRoom(null)}
              className="absolute top-6 right-6 text-text-secondary hover:text-white transition-colors text-2xl"
            >
              ✕
            </button>
            
            <h2 className="text-2xl font-extrabold mb-2 flex items-center gap-2">
              📊 系統監控面板 (Admin)
            </h2>
            <div className="text-text-secondary mb-8">正在監控：{monitorRoom.title} ({monitorRoom.streamer_name})</div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-background border border-surface/50 rounded-2xl p-5 shadow-sm">
                <div className="text-sm text-text-secondary mb-1">即時在線人數</div>
                <div className="text-4xl font-black text-brand">135</div>
                <div className="text-xs text-green-500 mt-2">↑ 5.2% vs 上一分鐘</div>
              </div>
              <div className="bg-background border border-surface/50 rounded-2xl p-5 shadow-sm">
                <div className="text-sm text-text-secondary mb-1">WebRTC 引擎穩定度</div>
                <div className="text-4xl font-black text-green-500">99.8%</div>
                <div className="text-xs text-text-secondary mt-2">封包成功率正常</div>
              </div>
              <div className="bg-background border border-surface/50 rounded-2xl p-5 shadow-sm">
                <div className="text-sm text-text-secondary mb-1">累計連線次數</div>
                <div className="text-4xl font-black text-white">412</div>
                <div className="text-xs text-text-secondary mt-2">自開播以來</div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Timeline Chart */}
              <div>
                <h3 className="font-bold text-lg mb-4">📈 觀看人數時間軸</h3>
                <div className="bg-background border border-surface/50 rounded-2xl p-4 h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={mockChartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                      <XAxis dataKey="time" stroke="#888" fontSize={12} />
                      <YAxis stroke="#888" fontSize={12} />
                      <Tooltip contentStyle={{ backgroundColor: '#1E1E1E', borderColor: '#333' }} />
                      <Line type="monotone" dataKey="viewers" stroke="#F5A623" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Topology Mesh */}
              <div>
                <h3 className="font-bold text-lg mb-4">🌳 樹狀 P2P 引擎結構 (深度: 3層)</h3>
                <div className="bg-background border border-surface/50 rounded-2xl p-5 space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-red-500/20 text-red-500 flex items-center justify-center font-bold">L0</div>
                    <div>
                      <div className="font-bold text-white">直播主節點 (Broadcaster)</div>
                      <div className="text-xs text-text-secondary">負責原始串流採集</div>
                    </div>
                  </div>
                  <div className="pl-6 border-l-2 border-surface/50">
                    <div className="flex items-center gap-4 relative -left-[25px]">
                      <div className="w-12 h-12 rounded-full bg-brand/20 text-brand flex items-center justify-center font-bold">L1</div>
                      <div>
                        <div className="font-bold text-white">4 個節點 (滿載)</div>
                        <div className="text-xs text-text-secondary">第一層轉發 (延遲 ~80ms)</div>
                      </div>
                    </div>
                  </div>
                  <div className="pl-12 border-l-2 border-surface/50">
                    <div className="flex items-center gap-4 relative -left-[49px]">
                      <div className="w-12 h-12 rounded-full bg-blue-500/20 text-blue-500 flex items-center justify-center font-bold">L2</div>
                      <div>
                        <div className="font-bold text-white">16 個節點 (滿載)</div>
                        <div className="text-xs text-text-secondary">第二層轉發 (延遲 ~150ms)</div>
                      </div>
                    </div>
                  </div>
                  <div className="pl-16 border-l-2 border-transparent">
                    <div className="flex items-center gap-4 relative -left-[41px]">
                      <div className="w-12 h-12 rounded-full bg-gray-500/20 text-gray-400 flex items-center justify-center font-bold">L3</div>
                      <div>
                        <div className="font-bold text-white">114 個節點 (擴展中)</div>
                        <div className="text-xs text-text-secondary">第三層葉節點 (延遲 ~250ms)</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
          </div>
        </div>
      )}
    </div>
  );
}
