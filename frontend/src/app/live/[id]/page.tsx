"use client";
import { useEffect, useState, useRef, use } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "../../components/Toast";

interface LiveMessage {
  id: string;
  sender_id: string;
  sender_name: string;
  message_text: string;
  created_at: string;
}

interface FloatingEmojiData {
  id: string;
  emoji: string;
  x: number;
}

export default function LiveRoom({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const { id } = resolvedParams;
  const router = useRouter();
  const { showToast } = useToast();
  
  const [messages, setMessages] = useState<LiveMessage[]>([]);
  const [inputText, setInputText] = useState("");
  const [currentUser, setCurrentUser] = useState<string | null>(null);
  const [roomInfo, setRoomInfo] = useState<any>(null);
  const [isStreamer, setIsStreamer] = useState(false);
  const isStreamerRef = useRef(false);
  const [cameraError, setCameraError] = useState("");
  const [viewerStatus, setViewerStatus] = useState("等待串流訊號接通...");
  
  const [activeRooms, setActiveRooms] = useState<any[]>([]);
  
  const [videoTrack, setVideoTrack] = useState<MediaStreamTrack | null>(null);
  const [zoomCapabilities, setZoomCapabilities] = useState<{ min: number; max: number; step: number } | null>(null);
  const [zoomValue, setZoomValue] = useState<number>(1);
  const [floatingEmojis, setFloatingEmojis] = useState<FloatingEmojiData[]>([]);
  
  // New state for camera switch
  const [facingMode, setFacingMode] = useState<"user" | "environment">("user");
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const peerInstance = useRef<any>(null);
  const viewerInitializedRef = useRef<boolean>(false);
  const roomInfoRef = useRef<any>(null);
  
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);
  const isSwiping = useRef(false);

  const broadcastData = (data: any) => {
    if (peerInstance.current && peerInstance.current.connections) {
      Object.values(peerInstance.current.connections).forEach((conns: any) => {
        conns.forEach((conn: any) => {
          if (conn.open) {
             conn.send(data);
          }
        });
      });
    }
  };

  const showEmojiLocally = (emoji: string) => {
    const emojiId = Math.random().toString(36).substr(2, 9);
    const x = Math.random() * 80 + 10;
    setFloatingEmojis(prev => [...prev, { id: emojiId, emoji, x }]);
    setTimeout(() => {
      setFloatingEmojis(prev => prev.filter(e => e.id !== emojiId));
    }, 3000);
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const loadMessages = () => {
    fetch(`/api/live/messages?room_id=${id}`, { 
      cache: 'no-store',
      headers: { "ngrok-skip-browser-warning": "69420" } 
    })
      .then(res => res.json())
      .then(data => setMessages(data))
      .catch(err => console.error(err));
  };

  useEffect(() => {
    const userId = localStorage.getItem("current_user_id");
    setCurrentUser(userId);
    
    fetch("/api/live/rooms", { headers: { "ngrok-skip-browser-warning": "69420" } })
      .then(res => res.json())
      .then((rooms: any[]) => {
        const active = rooms.filter(r => r.status !== 'ENDED');
        setActiveRooms(active);
        const room = active.find(r => r.id === id);
        if (room) {
          setRoomInfo(room);
          roomInfoRef.current = room;
          if (room.streamer_id === userId) {
            setIsStreamer(true);
            isStreamerRef.current = true;
            startCameraAndPeerJS("user");
          }
        } else {
          showToast("直播間不存在或已結束", "error");
          router.push("/live");
        }
      });

    loadMessages();

    const pollRoomInfo = () => {
      loadMessages();
      if (isStreamerRef.current) return;
      fetch("/api/live/rooms", { cache: 'no-store', headers: { "ngrok-skip-browser-warning": "69420" } })
        .then(res => res.json())
        .then((rooms: any[]) => {
          const room = rooms.find(r => r.id === id);
          if (!room || room.status === 'ENDED') {
             showToast("直播間已結束！", "info");
             router.push("/live");
             return;
          }
          if (room && room.streamer_peer_id && !viewerInitializedRef.current) {
            viewerInitializedRef.current = true;
            startViewerPeerJS();
          }
        });
    };

    const intervalId = setInterval(pollRoomInfo, 2000);

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '確定要離開直播間嗎？';
    };
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      clearInterval(intervalId);
      
      if (videoRef.current && videoRef.current.srcObject) {
        const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
        tracks.forEach(track => track.stop());
      }
      if (peerInstance.current) {
        peerInstance.current.destroy();
      }
      // 移除 sendBeacon(/end)，避免 React StrictMode 觸發 unmount 時誤關房間
      // 依賴 beforeunload 與 explicit 結束按鈕來處理
    };
  }, [id]);

  // Handle Swipe Navigation (only on mobile)
  const handleTouchStart = (e: React.TouchEvent) => {
    if (window.innerWidth >= 768) return; // Disable swipe on desktop
    if ((e.target as HTMLElement).tagName !== 'VIDEO' && !(e.target as HTMLElement).classList.contains('swipe-layer')) return;
    touchStartX.current = e.targetTouches[0].clientX;
    isSwiping.current = true;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isSwiping.current) return;
    touchEndX.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (!isSwiping.current) return;
    isSwiping.current = false;
    if (!touchStartX.current || !touchEndX.current) return;
    
    const distance = touchStartX.current - touchEndX.current;
    const isLeftSwipe = distance > 80;
    const isRightSwipe = distance < -80;
    
    if (isLeftSwipe || isRightSwipe) {
      if (activeRooms.length === 0) return;
      const currentIndex = activeRooms.findIndex(r => r.id === id);
      if (currentIndex === -1) return;
      
      let nextIndex = currentIndex;
      if (isLeftSwipe) {
        nextIndex = currentIndex + 1;
      } else {
        nextIndex = currentIndex - 1;
      }
      
      if (nextIndex >= 0 && nextIndex < activeRooms.length) {
        const nextRoomId = activeRooms[nextIndex].id;
        router.push(`/live/${nextRoomId}`);
      } else {
        showToast("沒有更多直播囉！", "info");
      }
    }
    
    touchStartX.current = null;
    touchEndX.current = null;
  };

  const startCameraAndPeerJS = async (mode: "user" | "environment") => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("SECURE_CONTEXT_REQUIRED");
      }
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: mode },
        audio: true 
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      
      const track = stream.getVideoTracks()[0];
      setVideoTrack(track);
      
      setTimeout(() => {
        const caps = track.getCapabilities && track.getCapabilities() as any;
        if (caps && caps.zoom) {
           setZoomCapabilities({ min: caps.zoom.min, max: caps.zoom.max, step: caps.zoom.step });
           setZoomValue(track.getSettings().zoom || caps.zoom.min);
        }
      }, 1000);

      // If already initialized, just replace track and return
      if (peerInstance.current) {
        Object.values(peerInstance.current.connections).forEach((conns: any) => {
          conns.forEach((conn: any) => {
            const peerConnection = conn.peerConnection;
            if (peerConnection) {
              const sender = peerConnection.getSenders().find((s: any) => s.track?.kind === "video");
              if (sender) sender.replaceTrack(track);
            }
          });
        });
        return;
      }

      const Peer = (await import('peerjs')).default;
      const peerOptions = {
        host: window.location.hostname,
        port: window.location.port ? Number(window.location.port) : (window.location.protocol === 'https:' ? 443 : 80),
        path: '/myapp',
        secure: window.location.protocol === 'https:',
        config: {
          iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' },
            { urls: 'stun:global.stun.twilio.com:3478' }
          ]
        }
      };
      const peer = new Peer(peerOptions);
      peerInstance.current = peer;

      peer.on('open', (peerId) => {
        console.log("Streamer Peer ID:", peerId);
        showToast("伺服器連線成功，準備廣播", "success");
        fetch(`/api/live/rooms/${id}/peer`, {
          method: "PUT",
          headers: { "Content-Type": "application/json", "ngrok-skip-browser-warning": "69420" },
          body: JSON.stringify({ peer_id: peerId })
        }).catch(err => {
            console.error(err);
            showToast("無法更新直播間 Peer ID", "error");
        });
      });

      peer.on('error', (err) => {
        console.error("Streamer PeerJS Error:", err);
        showToast(`PeerJS 發生錯誤: ${err.type}`, "error");
        setCameraError(`伺服器連線錯誤: ${err.type}。請重新整理。`);
      });

      peer.on('disconnected', () => {
        showToast("已從信號伺服器斷線，嘗試重連...", "info");
        peer.reconnect();
      });

      const activeCalls: Record<string, any> = {};

      peer.on('connection', (conn) => {
        conn.on('data', (data: any) => {
            if (data === 'VIEWER_READY') {
            const capacity = roomInfoRef.current?.layer_0_capacity || 4;
            if (Object.keys(activeCalls).length < capacity) {
                // Ensure we call with the LATEST stream
                const currentStream = videoRef.current?.srcObject as MediaStream || stream;
                const call = peer.call(conn.peer, currentStream);
                activeCalls[conn.peer] = call;
            } else {
                conn.send({ type: 'REJECT_FULL' });
            }
          } else if (data && data.type === 'EMOJI') {
            showEmojiLocally(data.emoji);
            broadcastData({ type: 'EMOJI', emoji: data.emoji });
          }
        });
        const handleChildDisconnect = () => {
          if (activeCalls[conn.peer]) {
            activeCalls[conn.peer].close();
            delete activeCalls[conn.peer];
          }
          fetch(`/api/live/rooms/${id}/report_dead`, {
              method: "POST",
              headers: { "Content-Type": "application/json", "ngrok-skip-browser-warning": "69420" },
              body: JSON.stringify({ dead_peer_id: conn.peer })
          }).catch(() => {});
        };
        conn.on('close', handleChildDisconnect);
        conn.on('error', handleChildDisconnect);
      });

    } catch (err: any) {
      console.error("Camera error:", err);
      if (err.message === "SECURE_CONTEXT_REQUIRED") {
        setCameraError("環境不安全：必須使用 localhost 或 HTTPS 才能啟動相機。");
      } else if (err.name === "NotAllowedError") {
        setCameraError("權限遭拒：請點擊網址列左側的鎖頭 🔒，將「相機」與「麥克風」設為允許，並重新整理。");
      } else if (err.name === "NotFoundError") {
        setCameraError("找不到裝置：請確認你的電腦/手機有成功接上或內建相機鏡頭！");
      } else if (err.name === "NotReadableError") {
        setCameraError("裝置被佔用：你的相機或麥克風可能正在被其他軟體 (如 LINE, OBS) 使用中，請先關閉它們。");
      } else {
        setCameraError("相機異常 (" + err.name + ")：" + (err.message || "未知錯誤"));
      }
    }
  };

  const switchCamera = () => {
    if (!isStreamer) return;
    const newMode = facingMode === "user" ? "environment" : "user";
    setFacingMode(newMode);
    
    // Stop current track
    if (videoTrack) {
       videoTrack.stop();
    }
    
    startCameraAndPeerJS(newMode);
  };

  const startViewerPeerJS = async () => {
    try {
      const Peer = (await import('peerjs')).default;
      const peerOptions = {
        host: window.location.hostname,
        port: window.location.port ? Number(window.location.port) : (window.location.protocol === 'https:' ? 443 : 80),
        path: '/myapp',
        secure: window.location.protocol === 'https:',
        config: {
          iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' },
            { urls: 'stun:global.stun.twilio.com:3478' }
          ]
        }
      };
      const peer = new Peer(peerOptions);
      peerInstance.current = peer;
      
      let myStream: MediaStream | null = null;
      const activeCalls: Record<string, any> = {};

      const connectToParent = (targetPeerId: string) => {
        setViewerStatus("連線中...");
        const conn = peer.connect(targetPeerId);
        
        conn.on('open', () => {
          conn.send('VIEWER_READY');
        });

        conn.on('data', (data: any) => {
           if (data && data.type === 'EMOJI') {
               showEmojiLocally(data.emoji);
           } else if (data && data.type === 'REJECT_FULL') {
               setViewerStatus("上層節點已滿，尋找新節點...");
               fetch(`/api/live/rooms/${id}/join`, {
                   method: "POST",
                   headers: { "Content-Type": "application/json", "ngrok-skip-browser-warning": "69420" },
                   body: JSON.stringify({ peer_id: peer.id })
               })
               .then(r => r.json())
               .then(resData => {
                   if (resData.parent_peer_id) {
                       connectToParent(resData.parent_peer_id);
                   } else {
                       setViewerStatus("無法重新連線，伺服器可能滿載");
                   }
               }).catch(() => setViewerStatus("無法重新連線"));
           }
        });

        let isReconnecting = false;
        const handleDisconnect = () => {
           if (isReconnecting) return;
           isReconnecting = true;
           setViewerStatus("連線中斷，重新尋找節點...");
           fetch(`/api/live/rooms/${id}/report_dead`, {
               method: "POST",
               headers: { "Content-Type": "application/json", "ngrok-skip-browser-warning": "69420" },
               body: JSON.stringify({ dead_peer_id: targetPeerId })
           }).then(() => {
               fetch(`/api/live/rooms/${id}/join`, {
                   method: "POST",
                   headers: { "Content-Type": "application/json", "ngrok-skip-browser-warning": "69420" },
                   body: JSON.stringify({ peer_id: peer.id })
               })
               .then(r => r.json())
               .then(resData => {
                   if (resData.parent_peer_id) {
                       connectToParent(resData.parent_peer_id);
                   } else {
                       setViewerStatus("無法重新連線");
                   }
               }).catch(() => setViewerStatus("無法重新連線"));
           });
        };
        conn.on('close', handleDisconnect);
        conn.on('error', handleDisconnect);
      };

      peer.on('open', (myPeerId) => {
        setViewerStatus("正在分配節點...");
        fetch(`/api/live/rooms/${id}/join`, {
            method: "POST",
            headers: { "Content-Type": "application/json", "ngrok-skip-browser-warning": "69420" },
            body: JSON.stringify({ peer_id: myPeerId })
        })
        .then(res => res.json())
        .then(joinData => {
             if (joinData.parent_peer_id) {
                 connectToParent(joinData.parent_peer_id);
             } else {
                 setViewerStatus("無法分配節點：" + (joinData.error || "未知錯誤"));
             }
        })
        .catch(err => setViewerStatus("節點分配請求失敗"));
      });

      peer.on('error', (err) => {
        console.error("Viewer PeerJS Error:", err);
        setViewerStatus(`連線錯誤: ${err.type}`);
      });

      peer.on('disconnected', () => {
        setViewerStatus("已斷線，嘗試重連...");
        peer.reconnect();
      });

      peer.on('call', (call) => {
        setViewerStatus("接收影像中...");
        call.answer(); 
        call.on('stream', (remoteStream) => {
          myStream = remoteStream;
          if (videoRef.current) {
            videoRef.current.srcObject = remoteStream;
            setViewerStatus(""); 
            videoRef.current.play().catch(e => {
                console.log("Autoplay blocked:", e);
                setViewerStatus("畫面已暫停 (請點擊畫面播放聲音與影像)");
            });
          }
        });
      });
      
      peer.on('connection', (conn) => {
        conn.on('data', (data: any) => {
          if (data === 'VIEWER_READY' && myStream) {
            const capacity = roomInfoRef.current?.layer_n_capacity || 4;
            if (Object.keys(activeCalls).length < capacity) {
                const call = peer.call(conn.peer, myStream);
                activeCalls[conn.peer] = call;
            } else {
                conn.send({ type: 'REJECT_FULL' });
            }
          } else if (data && data.type === 'EMOJI') {
            showEmojiLocally(data.emoji);
            broadcastData({ type: 'EMOJI', emoji: data.emoji });
          }
        });
        const handleChildDisconnect = () => {
          if (activeCalls[conn.peer]) {
            activeCalls[conn.peer].close();
            delete activeCalls[conn.peer];
          }
          fetch(`/api/live/rooms/${id}/report_dead`, {
              method: "POST",
              headers: { "Content-Type": "application/json", "ngrok-skip-browser-warning": "69420" },
              body: JSON.stringify({ dead_peer_id: conn.peer })
          }).catch(() => {});
        };
        conn.on('close', handleChildDisconnect);
        conn.on('error', handleChildDisconnect);
      });

    } catch (err) {
      console.error("PeerJS viewer error:", err);
      setViewerStatus("連線發生錯誤");
    }
  };

  const endLive = async () => {
    if (confirm("確定要退出直播嗎？")) {
      if (isStreamer) {
        await fetch(`/api/live/rooms/${id}/end`, { headers: { "ngrok-skip-browser-warning": "69420" }, method: "POST" });
      }
      router.push("/live");
    }
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !currentUser) return;
    try {
      await fetch("/api/live/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json", "ngrok-skip-browser-warning": "69420" },
        body: JSON.stringify({ room_id: id, sender_id: currentUser, message_text: inputText })
      });
      setInputText("");
      loadMessages();
    } catch (err) {
      console.error(err);
    }
  };

  const handleVideoClick = () => {
    if (viewerStatus && viewerStatus.includes("請點擊畫面")) {
      videoRef.current?.play().then(() => {
        setViewerStatus("");
      }).catch(console.error);
    }
  };

  if (!roomInfo) return <div className="p-10 text-center w-full h-screen bg-black text-white flex items-center justify-center">載入中...</div>;

  return (
    <>
    <style dangerouslySetInnerHTML={{__html: `
      @keyframes floatUp {
        0% { transform: translateY(0) scale(1); opacity: 1; }
        50% { transform: translateY(-100px) scale(1.5); opacity: 0.8; }
        100% { transform: translateY(-200px) scale(2); opacity: 0; }
      }
      .emoji-float {
        position: absolute;
        bottom: 20%;
        animation: floatUp 3s ease-out forwards;
        font-size: 3rem;
        pointer-events: none;
        z-index: 50;
      }
      .chat-mask {
        mask-image: linear-gradient(to bottom, transparent, black 15%);
        -webkit-mask-image: linear-gradient(to bottom, transparent, black 15%);
      }
    `}} />
    
    <div 
      className="absolute inset-0 w-full h-full bg-black overflow-hidden touch-none swipe-layer flex justify-center"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Phone-sized Container for Desktop & Fullscreen for Mobile */}
      <div 
        className="relative w-full h-full md:max-w-[480px] bg-black z-0 flex flex-col overflow-hidden md:border-x md:border-surface/50 shadow-2xl"
      >
        <div className="absolute inset-0 w-full h-full z-0" onClick={handleVideoClick}>
          {floatingEmojis.map((emojiData) => (
            <div 
              key={emojiData.id} 
              className="emoji-float drop-shadow-lg"
              style={{ left: `${emojiData.x}%` }}
            >
              {emojiData.emoji}
            </div>
          ))}

          {isStreamer ? (
            <>
              {cameraError ? (
                <div className="absolute inset-0 flex items-center justify-center text-white/50 p-6 text-center z-0">
                  {cameraError}
                </div>
              ) : (
                <video 
                  ref={videoRef} 
                  autoPlay 
                  muted 
                  playsInline
                  className={`absolute inset-0 w-full h-full object-cover z-0 pointer-events-none ${facingMode === 'user' ? 'scale-x-[-1]' : ''}`}
                />
              )}
              
              {zoomCapabilities && (
                <div className="absolute left-4 top-1/2 -translate-y-1/2 z-20 bg-black/40 backdrop-blur p-3 rounded-full flex flex-col items-center space-y-2 border border-white/10 hidden md:flex">
                  <span className="text-white text-xs font-bold">🔍</span>
                  <input 
                    type="range" 
                    {...{"orient": "vertical"}}
                    className="h-32 appearance-none bg-white/20 rounded-full w-2"
                    min={zoomCapabilities.min} 
                    max={zoomCapabilities.max} 
                    step={zoomCapabilities.step} 
                    value={zoomValue}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value);
                      setZoomValue(val);
                      if (videoTrack) {
                        videoTrack.applyConstraints({ advanced: [{ zoom: val }] } as any).catch(console.error);
                      }
                    }}
                    style={{ writingMode: 'vertical-lr', direction: 'rtl' }}
                  />
                </div>
              )}
            </>
          ) : (
            <>
              <video 
                ref={videoRef} 
                autoPlay 
                playsInline
                className={`absolute inset-0 w-full h-full object-cover z-0 pointer-events-none ${viewerStatus ? 'hidden' : 'block'}`}
              />
              {viewerStatus && (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-white/50 bg-black z-0">
                  <div className="text-6xl mb-4 animate-bounce">📺</div>
                  <p className="font-bold px-4 text-center">{viewerStatus}</p>
                  <p className="text-xs mt-2 opacity-50 md:hidden">向左/右滑動可切換房間</p>
                </div>
              )}
            </>
          )}
        </div>

        {/* Header Streamer Info & Controls */}
        <div className="absolute top-0 left-0 right-0 flex justify-between items-start p-4 pointer-events-none bg-gradient-to-b from-black/80 via-black/40 to-transparent z-10 pt-safe-top">
          <div className="flex flex-col space-y-1 pointer-events-auto">
            <div className="flex items-center space-x-2">
              <span className="bg-red-500 text-white px-2 py-0.5 rounded text-xs font-bold animate-pulse shadow-lg">LIVE</span>
              <span className="text-white font-bold text-sm md:text-base drop-shadow-md">{roomInfo.title}</span>
            </div>
            <span className="text-white/80 text-xs drop-shadow bg-black/30 rounded-full px-2 py-0.5 self-start">直播主：{roomInfo.streamer_name}</span>
          </div>
          
          <div className="flex items-center space-x-3 pointer-events-auto">
            {isStreamer && (
              <button 
                onClick={switchCamera}
                className="w-10 h-10 bg-black/40 backdrop-blur-md border border-white/20 rounded-full flex items-center justify-center text-white hover:bg-white/20 transition-colors shadow-lg"
                title="切換鏡頭"
              >
                🔄
              </button>
            )}
            <button 
              onClick={endLive}
              className="w-10 h-10 bg-black/40 backdrop-blur-md border border-white/20 rounded-full flex items-center justify-center text-white hover:bg-red-500/80 transition-colors shadow-lg"
              title="離開直播"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Chat Container (Overlay Bottom) */}
        <div className="absolute bottom-0 left-0 right-0 h-[50vh] flex flex-col justify-end z-10 pointer-events-none pb-safe">
          
          {/* Messages List */}
          <div className="overflow-y-auto max-h-[40vh] p-4 pointer-events-auto chat-mask flex flex-col gap-2 pb-2 scrollbar-hide">
            {messages.map(msg => (
              <div key={msg.id} className="text-white text-[13px] leading-snug drop-shadow-md">
                <span className={`font-bold mr-1.5 ${msg.sender_id === roomInfo.streamer_id ? 'text-red-400 drop-shadow-[0_0_2px_rgba(255,0,0,0.8)]' : 'text-brand-light drop-shadow-[0_0_2px_rgba(255,255,255,0.8)]'}`}>
                  {msg.sender_id === roomInfo.streamer_id && "🎤 "}{msg.sender_name}
                </span>
                <span className="text-white/95">{msg.message_text}</span>
              </div>
            ))}
            <div ref={messagesEndRef} className="h-1 flex-shrink-0" />
          </div>

          {/* Input & Emoji Bar */}
          <div className="p-4 pt-1 pointer-events-auto bg-gradient-to-t from-black/80 to-transparent flex items-center gap-3">
            {currentUser ? (
              <form onSubmit={sendMessage} className="flex-1 flex gap-2">
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="參與聊天..."
                  className="flex-1 bg-black/40 backdrop-blur-md border border-white/20 text-white rounded-full px-4 py-2 text-sm focus:outline-none focus:border-brand shadow-lg"
                />
                <button 
                  type="submit"
                  disabled={!inputText.trim()}
                  className="bg-brand text-white px-4 py-2 rounded-full text-sm font-bold disabled:opacity-50 shadow-lg hover:bg-brand-hover transition-colors"
                >
                  送出
                </button>
              </form>
            ) : (
              <div className="flex-1 bg-black/40 border border-white/20 rounded-full px-4 py-2 text-sm text-white/50 text-center shadow-lg">
                請登入後參與聊天
              </div>
            )}

            {/* Emoji Button */}
            {(!viewerStatus || isStreamer) && currentUser && (
              <button 
                onClick={() => {
                   showEmojiLocally('❤️');
                   broadcastData({ type: 'EMOJI', emoji: '❤️' });
                }}
                className="w-10 h-10 flex-shrink-0 bg-black/40 backdrop-blur-md border border-white/20 rounded-full flex items-center justify-center text-xl hover:scale-110 active:scale-90 transition-all shadow-lg"
                title="發送愛心"
              >
                ❤️
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
    </>
  );
}
