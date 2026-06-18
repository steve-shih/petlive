"use client";
import { useEffect, useState, useRef, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
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
  const [debugInfo, setDebugInfo] = useState<string>("");
  const [currentUserRole, setCurrentUserRole] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState("");
  const [streamerPeerId, setStreamerPeerId] = useState<string | null>(null);
  const [viewerStatus, setViewerStatus] = useState("等待串流訊號接通...");
  
  // New states for Zoom and Emojis
  const [videoTrack, setVideoTrack] = useState<MediaStreamTrack | null>(null);
  const [zoomCapabilities, setZoomCapabilities] = useState<{ min: number; max: number; step: number } | null>(null);
  const [zoomValue, setZoomValue] = useState<number>(1);
  const [floatingEmojis, setFloatingEmojis] = useState<FloatingEmojiData[]>([]);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const peerInstance = useRef<any>(null);
  const viewerInitializedRef = useRef<boolean>(false);
  const roomInfoRef = useRef<any>(null); // Use ref to hold roomInfo for cleanup function
  const debugLogsRef = useRef<string[]>([]); // Store debug logs to send to new viewers
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const captureIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const recordIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Helper to add debug info and broadcast
  const addDebug = (msg: string) => {
    setDebugInfo(prev => prev + '\n' + msg);
    debugLogsRef.current.push(msg);
    broadcastData({ type: 'DEBUG', text: msg });
  };

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
    const x = Math.random() * 80 + 10; // 10% to 90%
    setFloatingEmojis(prev => [...prev, { id: emojiId, emoji, x }]);
    setTimeout(() => {
      setFloatingEmojis(prev => prev.filter(e => e.id !== emojiId));
    }, 3000);
  };

  useEffect(() => {
    const userId = localStorage.getItem("current_user_id");
    setCurrentUser(userId);
    
    if (userId) {
      fetch(`/api/users/${userId}`, { headers: { "ngrok-skip-browser-warning": "69420" } })
        .then(res => res.json())
        .then(data => setCurrentUserRole(data.role))
        .catch(console.error);
    }
    
    // Fetch room info
    fetch("/api/live/rooms", { headers: { "ngrok-skip-browser-warning": "69420" } })
      .then(res => res.json())
      .then((rooms: any[]) => {
        const room = rooms.find(r => r.id === id);
        if (room) {
          setRoomInfo(room);
          roomInfoRef.current = room;
          if (room.streamer_peer_id) {
            setStreamerPeerId(room.streamer_peer_id);
          }
          if (room.streamer_id === userId) {
            setIsStreamer(true);
            startCameraAndPeerJS();
          } else {
            // viewer logic handled below
          }
        } else {
          showToast("直播間不存在或已結束", "error");
          router.push("/live");
        }
      });

    const loadMessages = () => {
      // 傳遞 user_id 以便後端檢查是否被踢除
      fetch(`/api/live/messages?room_id=${id}&user_id=${userId || ''}`, { 
        cache: 'no-store',
        headers: { "ngrok-skip-browser-warning": "69420" } 
      })
        .then(async (res) => {
          if (res.status === 403) {
            if (intervalRef.current) clearInterval(intervalRef.current);
            showToast("您已被直播主請出房間！", "error");
            router.push("/live");
            return;
          }
          const data = await res.json();
          setMessages(data);
        })
        .catch(err => console.error(err));
    };

    const pollRoomInfo = () => {
      fetch("/api/live/rooms", { 
        cache: 'no-store',
        headers: { "ngrok-skip-browser-warning": "69420" } 
      })
        .then(res => res.json())
        .then((rooms: any[]) => {
          const room = rooms.find(r => r.id === id);
          if (!room || room.status === 'ENDED') {
             if (intervalRef.current) clearInterval(intervalRef.current);
             showToast("直播間已結束！", "info");
             router.push("/live");
             return;
          }
          if (room) {
            // 若之前還沒有 peerId，現在抓到了，就啟動 ViewerPeerJS
            if (room.streamer_peer_id && !viewerInitializedRef.current && room.streamer_id !== userId) {
              viewerInitializedRef.current = true;
              setStreamerPeerId(room.streamer_peer_id);
              startViewerPeerJS(room.streamer_peer_id);
            }
          }
        });
    };

    loadMessages();
    intervalRef.current = setInterval(() => {
      loadMessages();
      pollRoomInfo();
    }, 2000);

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      // 網頁重新整理或關閉分頁時跳出警告
      e.preventDefault();
      e.returnValue = '確定要離開直播間嗎？';
    };
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (captureIntervalRef.current) clearInterval(captureIntervalRef.current);
      if (recordIntervalRef.current) clearInterval(recordIntervalRef.current);
      
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop();
      }

      if (videoRef.current && videoRef.current.srcObject) {
        const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
        tracks.forEach(track => track.stop());
      }
      if (peerInstance.current) {
        peerInstance.current.destroy();
      }
      // 如果是直播主離開 (上一頁、切換頁面等)，自動結束直播間，避免產生幽靈房間
      if (userId && roomInfoRef.current?.streamer_id === userId) {
        // 使用 sendBeacon 確保在網頁關閉時也能送出請求
        navigator.sendBeacon(`/api/live/rooms/${id}/end`);
      }
    };
  }, [id]);

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

  const startCameraAndPeerJS = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: "user" },
        audio: true 
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      
      const track = stream.getVideoTracks()[0];
      setVideoTrack(track);
      
      // Delay checking capabilities as it might not be available immediately on some devices
      setTimeout(() => {
        const caps = track.getCapabilities && track.getCapabilities() as any;
        if (caps && caps.zoom) {
           setZoomCapabilities({ min: caps.zoom.min, max: caps.zoom.max, step: caps.zoom.step });
           setZoomValue(track.getSettings().zoom || caps.zoom.min);
        }
      }, 1000);

      const Peer = (await import('peerjs')).default;
      const explicitPeerId = `${id}-streamer`;
      const peer = new Peer(explicitPeerId);
      peerInstance.current = peer;
      addDebug("[Streamer] Peer instance created");

      peer.on('open', (peerId) => {
        addDebug(`[Streamer] Peer opened with ID: ${peerId}`);
        // Send peerId to backend so viewers can find it
        fetch(`/api/live/rooms/${id}/peer`, {
          method: "PUT",
          headers: { "Content-Type": "application/json", "ngrok-skip-browser-warning": "69420" },
          body: JSON.stringify({ peer_id: peerId })
        }).then(async res => {
          if (!res.ok) {
             const errorText = await res.text();
             addDebug(`[Streamer] Fetch failed: ${errorText}`);
          } else {
             addDebug(`[Streamer] Backend updated successfully`);
          }
        }).catch(err => {
          addDebug(`[Streamer] Fetch Network Error: ${err.message}`);
        });
      });

      peer.on('error', (err) => {
        addDebug(`[Streamer] Peer Error: ${err.type} - ${err.message}`);
      });
      
      // Thumbnail Capture Logic (every 1 minute for demo)
      captureIntervalRef.current = setInterval(() => {
        if (videoRef.current) {
          const canvas = document.createElement("canvas");
          canvas.width = 640;
          canvas.height = 480;
          const ctx = canvas.getContext("2d");
          if (ctx) {
             ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
             const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
             fetch(`/api/live/rooms/${id}/thumbnail`, {
               method: "POST",
               headers: { "Content-Type": "application/json" },
               body: JSON.stringify({ thumbnail: dataUrl })
             }).catch(err => console.error("Thumbnail update failed", err));
          }
        }
      }, 60000);

      // MediaRecorder Logic
      let chunks: Blob[] = [];
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'video/webm' });
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) chunks.push(e.data);
      };

      mediaRecorder.onstop = () => {
        if (chunks.length > 0) {
          const blob = new Blob(chunks, { type: 'video/webm' });
          chunks = [];
          
          const formData = new FormData();
          formData.append('video', blob, 'record.webm');
          formData.append('room_id', id);
          formData.append('user_id', currentUser || localStorage.getItem('current_user_id') || '');
          
          fetch('/api/live/upload-record', {
            method: 'POST',
            body: formData
          }).then(res => res.json()).then(data => {
            addDebug(`[Streamer] Record uploaded: ${data.message || data.error}`);
          }).catch(err => {
            addDebug(`[Streamer] Record upload failed: ${err.message}`);
          });
          
          // Restart recording if stream is still active
          if (videoRef.current && videoRef.current.srcObject) {
            mediaRecorder.start();
          }
        }
      };

      mediaRecorder.start();
      
      // Stop and restart recording every 30 minutes to split files
      recordIntervalRef.current = setInterval(() => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
          mediaRecorderRef.current.stop(); // This triggers onstop, which handles upload and restart
        }
      }, 30 * 60 * 1000);

      const activeCalls: Record<string, any> = {};

      // When viewer connects, call them with the stream
      peer.on('connection', (conn) => {
        addDebug(`[Streamer] Viewer connected: ${conn.peer}`);
        conn.on('open', () => {
           // Send past debug logs to the newly connected viewer
           conn.send({ type: 'DEBUG_HISTORY', logs: debugLogsRef.current });
        });
        conn.on('data', (data: any) => {
          if (data === 'VIEWER_READY') {
            addDebug(`[Streamer] Viewer Ready. Calling viewer...`);
            const call = peer.call(conn.peer, stream);
            activeCalls[conn.peer] = call;
          } else if (data && data.type === 'EMOJI') {
            showEmojiLocally(data.emoji);
            // Broadcast to other viewers
            broadcastData({ type: 'EMOJI', emoji: data.emoji });
          }
        });
        conn.on('close', () => {
          addDebug(`[Streamer] Viewer disconnected: ${conn.peer}`);
          if (activeCalls[conn.peer]) {
            activeCalls[conn.peer].close();
            delete activeCalls[conn.peer];
          }
        });
      });

    } catch (err: any) {
      console.error("Camera error:", err);
      setCameraError("無法取得相機權限，請確認瀏覽器授權。");
      addDebug(`[Streamer] Fatal Error: ${err.message}`);
    }
  };

  const startViewerPeerJS = async (hostPeerId: string | undefined) => {
    if (!hostPeerId) {
      setViewerStatus("直播主準備中，請稍候再重新整理...");
      return;
    }
    try {
      const Peer = (await import('peerjs')).default;
      const explicitPeerId = `${id}-viewer-${currentUser || Math.random().toString(36).substring(2, 9)}`;
      const peer = new Peer(explicitPeerId);
      peerInstance.current = peer;

      peer.on('open', () => {
        setViewerStatus("連線中...");
        addDebug("[Viewer] Peer opened");
        // Signal streamer to call us back robustly via data channel
        const conn = peer.connect(hostPeerId);
        conn.on('open', () => {
          addDebug("[Viewer] DataChannel open, sending VIEWER_READY");
          conn.send('VIEWER_READY');
        });
        conn.on('data', (data: any) => {
          if (data && data.type === 'DEBUG') {
            setDebugInfo(prev => prev + '\n' + data.text);
          } else if (data && data.type === 'DEBUG_HISTORY') {
             setDebugInfo(prev => prev + '\n' + data.logs.join('\n'));
          }
        });
      });

      peer.on('call', (call) => {
        setViewerStatus("接收影像中...");
        addDebug("[Viewer] Receiving call from streamer");
        call.answer(); // Answer without sending our own stream
        call.on('stream', (remoteStream) => {
          addDebug("[Viewer] Stream received");
          if (videoRef.current) {
            videoRef.current.srcObject = remoteStream;
            setViewerStatus(""); // Clear status when stream arrives
            videoRef.current.play().catch(e => console.log("Autoplay blocked:", e));
          }
        });
      });
    } catch (err) {
      console.error("PeerJS viewer error:", err);
      setViewerStatus("連線發生錯誤");
    }
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !currentUser) return;

    try {
      await fetch("/api/live/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json", "ngrok-skip-browser-warning": "69420" },
        body: JSON.stringify({
          room_id: id,
          sender_id: currentUser,
          message_text: inputText
        })
      });
      setInputText("");
      loadMessages();
    } catch (err) {
      console.error(err);
    }
  };

  const endLive = async () => {
    if (confirm("確定要結束直播嗎？")) {
      await fetch(`/api/live/rooms/${id}/end`, { headers: { "ngrok-skip-browser-warning": "69420" }, method: "POST" });
      router.push("/live");
    }
  };

  const kickUser = async (targetUserId: string, targetName: string) => {
    if (confirm(`確定要將「${targetName}」踢出直播間嗎？踢出後該買家將無法再次進入。`)) {
      try {
        await fetch(`/api/live/rooms/${id}/kick`, {
          method: "POST",
          headers: { "Content-Type": "application/json", "ngrok-skip-browser-warning": "69420" },
          body: JSON.stringify({ user_id: targetUserId })
        });
      } catch (err) {
        console.error("Kick failed:", err);
      }
    }
  };

  if (!roomInfo) return <div className="p-10 text-center">載入中...</div>;

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
        font-size: 2rem;
        pointer-events: none;
        z-index: 40;
      }
    `}} />
    <div className="w-full h-[calc(100dvh-5rem)] md:max-w-7xl mx-auto flex flex-col md:flex-row md:gap-6 md:p-4">
      
      {/* Left: Video Stream - Fixed height on mobile */}
      <div className="w-full h-[40vh] md:h-full md:flex-1 flex flex-col bg-black md:rounded-2xl overflow-hidden shadow-lg relative flex-shrink-0">
        <div className="absolute top-4 left-4 z-10 flex flex-col space-y-2">
          <div className="flex items-center space-x-2">
            <span className="bg-red-500 text-white px-3 py-1 rounded text-sm font-bold animate-pulse">LIVE</span>
            <span className="bg-black/50 text-white px-3 py-1 rounded text-sm truncate max-w-[200px]">{roomInfo.title}</span>
          </div>
          <div className="bg-black/50 text-white px-3 py-1 rounded text-xs w-fit">
            直播主：<span className="font-bold text-red-400">{roomInfo.streamer_name}</span>
          </div>
          {debugInfo && currentUserRole === 'ADMIN' && (
             <div className="bg-black/80 text-green-400 p-2 rounded text-xs w-fit whitespace-pre-wrap max-h-32 overflow-y-auto z-50 pointer-events-auto">
               <div className="font-bold text-yellow-400 mb-1">🛠️ ADMIN DEBUG MODE</div>
               {debugInfo}
             </div>
          )}
        </div>

        {/* Floating Emojis Layer */}
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
              <div className="flex-1 flex items-center justify-center text-white/50 p-6 text-center">
                {cameraError}
              </div>
            ) : (
              <video 
                ref={videoRef} 
                autoPlay 
                muted // Mute self to prevent feedback loop
                playsInline
                className="w-full h-full object-cover"
              />
            )}
            
            {/* Streamer Camera Zoom Slider */}
            {zoomCapabilities && (
              <div className="absolute left-4 top-1/2 -translate-y-1/2 z-20 bg-black/60 p-3 rounded-2xl flex flex-col items-center space-y-2">
                <span className="text-white text-xs font-bold">🔍 縮放</span>
                <input 
                  type="range" 
                  orient="vertical"
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

            <button 
              onClick={endLive}
              className="absolute bottom-6 right-6 bg-red-500 text-white px-6 py-2 rounded-full font-bold shadow-lg hover:bg-red-600 transition-colors z-20"
            >
              結束直播
            </button>
          </>
        ) : (
          <>
            <video 
              ref={videoRef} 
              autoPlay 
              playsInline
              controls // Allow viewer to control volume or fullscreen
              className={`w-full h-full object-cover ${viewerStatus ? 'hidden' : 'block'}`}
            />
            {viewerStatus && (
              <div className="w-full h-full flex flex-col items-center justify-center text-white/50 bg-surface/10">
                <div className="text-6xl mb-4 animate-bounce">📺</div>
                <p>{viewerStatus}</p>
                <p className="text-sm mt-2">（WebRTC 點對點連線中）</p>
              </div>
            )}

            {/* Viewer Emoji Buttons */}
            {!viewerStatus && currentUser && (
              <div className="absolute bottom-6 right-4 z-20 flex flex-col space-y-3">
                {['❤️', '👍', '😂', '😲'].map(emoji => (
                  <button 
                    key={emoji}
                    onClick={() => {
                       showEmojiLocally(emoji);
                       broadcastData({ type: 'EMOJI', emoji });
                    }}
                    className="w-12 h-12 bg-black/50 backdrop-blur-sm rounded-full flex items-center justify-center text-2xl hover:bg-black/70 hover:scale-110 active:scale-90 transition-all shadow-lg border border-white/10"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Right: Group Chat - Takes remaining height on mobile */}
      <div className="flex-1 w-full md:w-[350px] bg-surface flex flex-col border-t md:border border-surface/50 shadow-sm md:rounded-2xl overflow-hidden mb-16 md:mb-0">
        <div className="p-4 border-b border-surface/50 font-bold bg-background/50 flex justify-between items-center flex-shrink-0">
          <span>百人群組聊天室</span>
          <span className="text-xs bg-brand/10 text-brand px-2 py-1 rounded-full">即時更新</span>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-3 pb-24 md:pb-4">
          {messages.map(msg => (
            <div key={msg.id} className="text-sm flex items-start group">
              <div className="flex-1">
                <span className={`font-bold mr-2 ${msg.sender_id === roomInfo.streamer_id ? 'text-red-500' : 'text-brand'}`}>
                  {msg.sender_id === roomInfo.streamer_id && "🎤 "}{msg.sender_name}
                  {msg.sender_id === roomInfo.streamer_id && <span className="ml-1 text-[10px] bg-red-100 text-red-600 px-1 py-0.5 rounded border border-red-200">直播主</span>}:
                </span>
                <span className="text-text-primary break-all">{msg.message_text}</span>
              </div>
              {isStreamer && msg.sender_id !== currentUser && (
                <button 
                  onClick={() => kickUser(msg.sender_id, msg.sender_name)}
                  className="opacity-0 group-hover:opacity-100 ml-2 text-xs bg-red-500 text-white px-2 py-1 rounded shadow hover:bg-red-600 transition-opacity flex-shrink-0"
                >
                  踢出
                </button>
              )}
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
        
        <form onSubmit={sendMessage} className="p-3 border-t border-surface/50 bg-background/50 flex gap-2 flex-shrink-0 absolute bottom-16 md:static w-full">
          {currentUser ? (
            <>
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="參與討論..."
                className="flex-1 bg-background border border-surface/50 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand"
              />
              <button 
                type="submit"
                disabled={!inputText.trim()}
                className="bg-brand text-white px-4 py-2 rounded-lg text-sm font-bold disabled:opacity-50"
              >
                發送
              </button>
            </>
          ) : (
            <div className="w-full text-center text-sm text-text-secondary py-2">
              請先登入才能參與聊天
            </div>
          )}
        </form>
      </div>

    </div>
    </>
  );
}
