"use client";
import { useEffect, useState, useRef, use } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "../../components/Toast";
import dynamic from 'next/dynamic';
import { io } from 'socket.io-client';
import { RTCTreeClient } from 'webrtc-tree/client';

const MeshTreeVisualizer = dynamic(() => import('@/app/components/MeshTreeVisualizer'), { 
  ssr: false,
  loading: () => <div className="text-white">Loading Visualizer...</div>
});

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
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [isStreamer, setIsStreamer] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showTree, setShowTree] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const isStreamerRef = useRef(false);
  const lastStatsRef = useRef({ bytes: 0, timestamp: 0 });
  const [cameraError, setCameraError] = useState("");
  const [viewerStatus, setViewerStatus] = useState("等待串流訊號接通...");
  
  const [activeRooms, setActiveRooms] = useState<any[]>([]);
  
  const [videoTrack, setVideoTrack] = useState<MediaStreamTrack | null>(null);
  const [zoomCapabilities, setZoomCapabilities] = useState<{ min: number; max: number; step: number } | null>(null);
  const [zoomValue, setZoomValue] = useState<number>(1);
  const [floatingEmojis, setFloatingEmojis] = useState<FloatingEmojiData[]>([]);
  
  // Password & Security State
  const [showPasswordPrompt, setShowPasswordPrompt] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");
  const [isPasswordVerified, setIsPasswordVerified] = useState(false);
  
  // New state for camera switch
  const [facingMode, setFacingMode] = useState<"user" | "environment">("user");
  
  // Follow state
  const [isFollowing, setIsFollowing] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const rawVideoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const processedStreamRef = useRef<MediaStream | null>(null);
  const rawStreamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const peerInstance = useRef<any>(null);
  const viewerInitializedRef = useRef<boolean>(false);
  const roomInfoRef = useRef<any>(null);
  
  // Effect States
  const isBeautyEnabledRef = useRef(false);
  const isBgBlurEnabledRef = useRef(false);
  const isNoiseSuppressionEnabledRef = useRef(true);
  const segmenterRef = useRef<any>(null);
  const processingRef = useRef(false);
  
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);
  const isSwiping = useRef(false);
  const parentCallRef = useRef<any>(null);
  const activeCallsRef = useRef<any>({});
  const layerRef = useRef(0);

  const webrtcClientRef = useRef<any>(null);
  const socketRef = useRef<any>(null);
  const useWebrtcTreeRef = useRef(true); // Hardcoded to Mode 2

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
      .then(data => {
        const chatMessages = data.filter((msg: any) => {
          if (msg.sender_id === 'SYSTEM') {
            try {
              const sys = JSON.parse(msg.content);
              if (sys.type === 'SWAP_PARENT' && sys.target === peerInstance.current?.id) {
                if (sys.new_parent && sys.new_parent !== parentCallRef.current?.peer) {
                  console.log("🔥 Received SWAP_PARENT command. Reconnecting to new parent:", sys.new_parent);
                  showToast("系統已為您重新分配連線節點", "info");
                  
                  if (parentCallRef.current) {
                    parentCallRef.current.close();
                  }
                  
                  // 直接連線到新父母
                  const connectToParent = (parentId: string) => {
                    const peer = peerInstance.current;
                    if (!peer) return;
                    
                    const call = peer.call(parentId, new MediaStream());
                    parentCallRef.current = call;
                    
                    call.on('stream', (remoteStream: any) => {
                      if (videoRef.current && remoteStream.getVideoTracks().length > 0) {
                        videoRef.current.srcObject = remoteStream;
                        setViewerStatus("");
                      }
                      
                      Object.values(activeCallsRef.current).forEach((childCall: any) => {
                        if (childCall.peerConnection) {
                           const sender = childCall.peerConnection.getSenders().find((s: any) => s.track?.kind === 'video');
                           if (sender && remoteStream.getVideoTracks()[0]) {
                               sender.replaceTrack(remoteStream.getVideoTracks()[0]);
                           }
                        }
                      });
                    });
                    
                    call.on('close', () => {
                      if (peerInstance.current && !peerInstance.current.destroyed) {
                         // Fallback to auto join if the assigned parent dies
                         showToast("上游節點已離線，自動重連中...", "info");
                         fetch(`/api/live/rooms/${id}/join`, {
                           method: 'POST',
                           headers: { 'Content-Type': 'application/json', "ngrok-skip-browser-warning": "69420" },
                           body: JSON.stringify({ peer_id: peer.id })
                         }).then(r => r.json()).then(d => {
                           if (d.parent_id) connectToParent(d.parent_id);
                         });
                      }
                    });
                  };
                  
                  connectToParent(sys.new_parent);
                }
              }
            } catch (e) {}
            return false;
          }
          return true;
        });
        setMessages(chatMessages);
      })
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
            setIsPasswordVerified(true);
            if (useWebrtcTreeRef.current) {
              startCameraAndNativeWebRTC("user");
            } else {
              startCameraAndPeerJS("user");
            }
          } else {
            if (room.password) {
              setShowPasswordPrompt(true);
            } else {
              setIsPasswordVerified(true);
            }
          }
        } else {
          showToast("直播間不存在或已結束", "error");
          router.push("/live");
        }
      });
      
    if (userId) {
      fetch(`/api/users/${userId}`, { headers: { "ngrok-skip-browser-warning": "69420" } })
        .then(res => res.json())
        .then(data => {
          if (data.role === 'ADMIN' || localStorage.getItem("admin_user_id")) {
            setIsAdmin(true);
          }
          if (data.following && roomInfoRef.current) {
            setIsFollowing(data.following.includes(roomInfoRef.current.streamer_id));
          }
        }).catch(console.error);
    }

    loadMessages();

    const pollRoomInfo = () => {
      loadMessages();
      fetch("/api/live/rooms", { cache: 'no-store', headers: { "ngrok-skip-browser-warning": "69420" } })
        .then(res => res.json())
        .then((rooms: any[]) => {
          const room = rooms.find(r => r.id === id);
          if (!room || room.status === 'ENDED') {
             if (!isStreamerRef.current) {
                 if (room && room.vod_url) {
                    const now = new Date();
                    const expiresAt = new Date(room.vod_expires_at);
                    if (room.vod_is_permanent || now <= expiresAt) {
                        setViewerStatus("");
                        setRoomInfo(room);
                        if (videoRef.current && videoRef.current.src !== room.vod_url) {
                           videoRef.current.srcObject = null;
                           videoRef.current.src = room.vod_url;
                           videoRef.current.controls = true;
                           videoRef.current.play().catch(e => console.error("VOD play error:", e));
                        }
                        return; // Show VOD
                    }
                 }
                 showToast("直播間已結束！", "info");
                 router.push("/live");
             }
             return;
          }
          if (room && room.streamer_peer_id && !viewerInitializedRef.current && isPasswordVerified && !isStreamerRef.current) {
            viewerInitializedRef.current = true;
            if (useWebrtcTreeRef.current) {
              startViewerNativeWebRTC();
            } else {
              startViewerPeerJS();
            }
          }
          if (room && isStreamerRef.current) {
            // Update effect states
            isBeautyEnabledRef.current = room.beauty_filter;
            if (room.bg_blur && !segmenterRef.current && !processingRef.current) {
               processingRef.current = true; // prevent multiple loads
               loadSegmenter();
            }
            isBgBlurEnabledRef.current = room.bg_blur;
            
            // Handle audio track replacement if noise suppression changes
            if (isNoiseSuppressionEnabledRef.current !== room.noise_suppression) {
               isNoiseSuppressionEnabledRef.current = room.noise_suppression;
               reacquireAudioTrack(room.noise_suppression);
            }
          }
        });
    };

    if (isPasswordVerified) {
        pollRoomInfo();
    }
    const infoInterval = setInterval(() => {
        if (isPasswordVerified) pollRoomInfo();
    }, 2000);
    
    // WebRTC Stats Monitoring
    const statsInterval = setInterval(async () => {
      if (!peerInstance.current) return;
      let bitrate = 0;
      let ping = 0;
      
      // Calculate inbound speed from parent (Download) or outbound speed (Streamer)
      let pc = parentCallRef.current?.peerConnection;
      if (isStreamerRef.current) {
        // Find the first active child connection to measure upload ping
        const firstCall = Object.values(activeCallsRef.current)[0] as any;
        if (firstCall) pc = firstCall.peerConnection;
      }
      
      if (pc) {
        try {
          const stats = await pc.getStats();
          let bytesNow = 0;
          let timestampNow = 0;
          
          stats.forEach((report: any) => {
            if ((report.type === 'inbound-rtp' || report.type === 'outbound-rtp') && report.kind === 'video') {
              bytesNow = report.bytesReceived || report.bytesSent || 0;
              timestampNow = report.timestamp;
            }
            if (report.type === 'candidate-pair' && report.state === 'succeeded') {
              ping = Math.round(report.currentRoundTripTime * 1000) || 0;
            }
          });
          
          if (bytesNow > 0 && lastStatsRef.current.bytes > 0) {
            const bytesDelta = bytesNow - lastStatsRef.current.bytes;
            const timeDelta = timestampNow - lastStatsRef.current.timestamp;
            if (timeDelta > 0) {
              bitrate = Math.round((bytesDelta * 8) / timeDelta); // kbps
            }
          }
          
          lastStatsRef.current = { bytes: bytesNow, timestamp: timestampNow };
          
          // Drop children if network is bad (ping > 300 or bitrate < 100)
          if (ping > 300 && !isStreamerRef.current) {
             Object.values(activeCallsRef.current).forEach((c: any) => {
                 if (c && typeof c.close === 'function') c.close();
             });
          }
          
        } catch (e) {}
      }
      
      fetch(`/api/live/rooms/${id}/report_stats`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', "ngrok-skip-browser-warning": "69420" },
        body: JSON.stringify({
          peer_id: peerInstance.current.id,
          bitrate_kbps: bitrate,
          ping_ms: ping
        })
      }).catch(() => {});
    }, 3000);

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '確定要離開直播間嗎？';
    };
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      clearInterval(infoInterval);
      clearInterval(statsInterval);
      if (rawStreamRef.current) {
        rawStreamRef.current.getTracks().forEach(track => track.stop());
      }
      if (processedStreamRef.current) {
        processedStreamRef.current.getTracks().forEach(track => track.stop());
      }
      if (videoRef.current && videoRef.current.srcObject) {
        const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
        tracks.forEach(track => track.stop());
      }
      if (peerInstance.current) {
        peerInstance.current.destroy();
      }
      if (webrtcClientRef.current) {
        webrtcClientRef.current.destroy();
      }
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [id, isPasswordVerified]);

  const loadScript = (src: string) => {
    return new Promise((resolve, reject) => {
      if (document.querySelector(`script[src="${src}"]`)) {
        resolve(true);
        return;
      }
      const script = document.createElement('script');
      script.src = src;
      script.onload = () => resolve(true);
      script.onerror = () => reject(new Error(`Failed to load ${src}`));
      document.head.appendChild(script);
    });
  };

  const loadSegmenter = async () => {
    try {
        await loadScript("https://cdn.jsdelivr.net/npm/@tensorflow/tfjs-core");
        await loadScript("https://cdn.jsdelivr.net/npm/@tensorflow/tfjs-converter");
        await loadScript("https://cdn.jsdelivr.net/npm/@tensorflow/tfjs-backend-webgl");
        await loadScript("https://cdn.jsdelivr.net/npm/@tensorflow-models/body-segmentation");
        
        const tf = (window as any).tf;
        await tf.ready();
        
        const bodySegmentation = (window as any).bodySegmentation;
        const model = bodySegmentation.SupportedModels.MediaPipeSelfieSegmentation;
        const segmenterConfig = {
            runtime: 'tfjs',
            modelType: 'general'
        };
        segmenterRef.current = await bodySegmentation.createSegmenter(model, segmenterConfig);
        showToast("背景模糊模型載入完成", "success");
    } catch (e) {
        console.error("Failed to load segmenter", e);
        showToast("背景模糊載入失敗，請確認網路連線或使用其他裝置", "error");
    } finally {
        processingRef.current = false;
    }
  };

  const reacquireAudioTrack = async (noiseSuppression: boolean) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          noiseSuppression,
          echoCancellation: true,
          autoGainControl: true
        }
      });
      const newAudioTrack = stream.getAudioTracks()[0];
      
      // Update local processed stream
      if (processedStreamRef.current) {
        const oldAudioTrack = processedStreamRef.current.getAudioTracks()[0];
        if (oldAudioTrack) {
          processedStreamRef.current.removeTrack(oldAudioTrack);
          oldAudioTrack.stop();
        }
        processedStreamRef.current.addTrack(newAudioTrack);
      }
      
      // Update all peer connections
      if (peerInstance.current) {
        Object.values(peerInstance.current.connections).forEach((conns: any) => {
          conns.forEach((conn: any) => {
            const peerConnection = conn.peerConnection;
            if (peerConnection) {
              const sender = peerConnection.getSenders().find((s: any) => s.track?.kind === "audio");
              if (sender) sender.replaceTrack(newAudioTrack);
            }
          });
        });
      }
      showToast(noiseSuppression ? "已開啟環境降噪" : "已關閉環境降噪", "info");
    } catch (e) {
      console.error("Failed to reacquire audio track", e);
    }
  };

  const processVideoFrame = async () => {
    const video = rawVideoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || video.paused || video.ended) {
      requestAnimationFrame(processVideoFrame);
      return;
    }
    
    if (canvas.width !== video.videoWidth && video.videoWidth > 0) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
    }
    
    if (canvas.width === 0) {
      requestAnimationFrame(processVideoFrame);
      return;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Apply Beauty Filter
    if (isBeautyEnabledRef.current) {
      ctx.filter = 'blur(1px) brightness(1.15) contrast(1.05) saturate(1.15)';
    } else {
      ctx.filter = 'none';
    }

    // Apply Background Blur
    if (isBgBlurEnabledRef.current && segmenterRef.current) {
       try {
           const segmentation = await segmenterRef.current.segmentPeople(video);
           const foregroundColor = {r: 0, g: 0, b: 0, a: 0};
           const backgroundColor = {r: 0, g: 0, b: 0, a: 255};
           const bodySegmentation = (window as any).bodySegmentation;
           const backgroundDarkeningMask = await bodySegmentation.toBinaryMask(
               segmentation, foregroundColor, backgroundColor);
           
           ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
           const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
           
           ctx.filter = 'blur(10px)';
           ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
           const blurredData = ctx.getImageData(0, 0, canvas.width, canvas.height);
           
           // Restore filter
           if (isBeautyEnabledRef.current) {
             ctx.filter = 'blur(1px) brightness(1.15) contrast(1.05) saturate(1.15)';
           } else {
             ctx.filter = 'none';
           }
           
           // Blend
           for (let i = 0; i < imageData.data.length; i += 4) {
               const maskVal = backgroundDarkeningMask.data[i + 3];
               if (maskVal > 0) { // It's background
                   imageData.data[i] = blurredData.data[i];
                   imageData.data[i+1] = blurredData.data[i+1];
                   imageData.data[i+2] = blurredData.data[i+2];
               }
           }
           ctx.putImageData(imageData, 0, 0);
       } catch (e) {
           ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
       }
    } else {
       ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    }
    
    requestAnimationFrame(processVideoFrame);
  };

  const verifyPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`/api/live/rooms/${id}/verify_password`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "ngrok-skip-browser-warning": "69420" },
        body: JSON.stringify({ password: passwordInput })
      });
      if (res.ok) {
        setIsPasswordVerified(true);
        setShowPasswordPrompt(false);
        showToast("密碼正確，正在進入直播間", "success");
      } else {
        showToast("密碼錯誤", "error");
      }
    } catch (err) {
      showToast("驗證失敗", "error");
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (window.innerWidth >= 768) return; 
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
    const initPeerJS = async (outputStream: MediaStream) => {
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
                  const currentStream = processedStreamRef.current || outputStream;
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
      };

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("SECURE_CONTEXT_REQUIRED");
      }
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: mode, width: { ideal: 640 }, height: { ideal: 480 } },
        audio: {
          noiseSuppression: isNoiseSuppressionEnabledRef.current,
          echoCancellation: true,
          autoGainControl: true
        }
      });
      
      rawStreamRef.current = stream;
      
      if (rawVideoRef.current) {
        rawVideoRef.current.srcObject = stream;
        rawVideoRef.current.play().catch(e => console.error(e));
      }
      
      // Start processing loop if not already started
      if (!processedStreamRef.current) {
        requestAnimationFrame(processVideoFrame);
      }
      
      // Create output stream
      setTimeout(() => {
        let videoTrack;
        if (canvasRef.current && (canvasRef.current as any).captureStream) {
            videoTrack = (canvasRef.current as any).captureStream(30).getVideoTracks()[0];
        } else if (canvasRef.current && (canvasRef.current as any).mozCaptureStream) {
            videoTrack = (canvasRef.current as any).mozCaptureStream(30).getVideoTracks()[0];
        } else {
            videoTrack = stream.getVideoTracks()[0];
            console.warn("captureStream not supported on this browser (e.g. iOS Safari), falling back to raw video track.");
        }
        
        const audioTrack = stream.getAudioTracks()[0];
        
        const tracks = [videoTrack, audioTrack].filter(Boolean);
        const outputStream = new MediaStream(tracks);
        processedStreamRef.current = outputStream;
        
        if (videoRef.current) {
          videoRef.current.srcObject = outputStream;
        }
        
        setVideoTrack(videoTrack);
        
        setTimeout(() => {
          const track = stream.getVideoTracks()[0];
          const caps = track.getCapabilities && track.getCapabilities() as any;
          if (caps && caps.zoom) {
             setZoomCapabilities({ min: caps.zoom.min, max: caps.zoom.max, step: caps.zoom.step });
             setZoomValue(track.getSettings().zoom || caps.zoom.min);
          }
        }, 1000);

        if (peerInstance.current) {
          Object.values(peerInstance.current.connections).forEach((conns: any) => {
            conns.forEach((conn: any) => {
              const peerConnection = conn.peerConnection;
              if (peerConnection) {
                const sender = peerConnection.getSenders().find((s: any) => s.track?.kind === "video");
                if (sender) sender.replaceTrack(videoTrack);
              }
            });
          });
          return;
        }
        
        initPeerJS(outputStream);
        
        if (!mediaRecorderRef.current) {
          try {
            const recorder = new MediaRecorder(outputStream, { mimeType: 'video/webm; codecs=vp8,opus' });
            recorder.ondataavailable = (e) => {
              if (e.data.size > 0) recordedChunksRef.current.push(e.data);
            };
            recorder.start(5000);
            mediaRecorderRef.current = recorder;
          } catch (e) {
            console.error('MediaRecorder start failed:', e);
          }
        }
      }, 500);

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
    if (videoTrack) {
       videoTrack.stop();
    }
    if (useWebrtcTreeRef.current) {
      startCameraAndNativeWebRTC(newMode);
    } else {
      startCameraAndPeerJS(newMode);
    }
  };

  const startCameraAndNativeWebRTC = async (mode: "user" | "environment") => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("SECURE_CONTEXT_REQUIRED");
      }
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: mode, width: { ideal: 640 }, height: { ideal: 480 } },
        audio: {
          noiseSuppression: isNoiseSuppressionEnabledRef.current,
          echoCancellation: true,
          autoGainControl: true
        }
      });
      rawStreamRef.current = stream;
      if (rawVideoRef.current) {
        rawVideoRef.current.srcObject = stream;
        rawVideoRef.current.play().catch(e => console.error(e));
      }
      if (!processedStreamRef.current) requestAnimationFrame(processVideoFrame);
      
      setTimeout(async () => {
        let videoTrack = stream.getVideoTracks()[0];
        if (canvasRef.current && (canvasRef.current as any).captureStream) {
            videoTrack = (canvasRef.current as any).captureStream(30).getVideoTracks()[0];
        }
        const audioTrack = stream.getAudioTracks()[0];
        const outputStream = new MediaStream([videoTrack, audioTrack].filter(Boolean));
        processedStreamRef.current = outputStream;
        if (videoRef.current) videoRef.current.srcObject = outputStream;
        
        const socket = io({ path: '/peer-api/socket.io', addTrailingSlash: false, transports: ['polling'] });
        socketRef.current = socket;
        
        const client = new RTCTreeClient({
          onStatusChange: setViewerStatus,
          onStreamReady: (s) => {
             if (videoRef.current) videoRef.current.srcObject = s;
          },
          sendMessageFn: (targetPeerId, payload) => {
             socket.emit("rtc-message", { roomId: id, toPeerId: targetPeerId, payload });
          }
        });
        webrtcClientRef.current = client;

        socket.on('rtc-message', (data: any) => {
          client.receiveMessage(data.fromPeerId, data.payload);
        });

        socket.on('connect', () => {
            socket.emit("create-room", id);
        });

        socket.on("room-created", async () => {
           await client.initStreamer(socket.id!, outputStream);
           showToast("MODE 2: 原生 WebRTC 啟動成功", "success");
           
           fetch(`/api/live/rooms/${id}/peer`, {
             method: "PUT",
             headers: { "Content-Type": "application/json", "ngrok-skip-browser-warning": "69420" },
             body: JSON.stringify({ peer_id: "MODE2_" + socket.id })
           }).catch(console.error);
        });
        
      }, 500);
    } catch(err: any) {
      console.error(err);
      setCameraError("相機異常: " + err.message);
    }
  };

  const startViewerNativeWebRTC = async () => {
    try {
      const socket = io({ path: '/peer-api/socket.io', addTrailingSlash: false, transports: ['polling'] });
      socketRef.current = socket;
      
      const client = new RTCTreeClient({
        onStatusChange: setViewerStatus,
        onStreamReady: (s) => {
           if (videoRef.current) {
              videoRef.current.srcObject = s;
              videoRef.current.play().catch(e => console.error(e));
           }
        },
        sendMessageFn: (targetPeerId, payload) => {
           socket.emit("rtc-message", { roomId: id, toPeerId: targetPeerId, payload });
        },
        fetchParentIdFn: () => {
           return new Promise((resolve) => {
              socket.emit('join-room', id, (parentId: string) => resolve(parentId));
           });
        }
      });
      webrtcClientRef.current = client;

      socket.on('rtc-message', (data: any) => {
        client.receiveMessage(data.fromPeerId, data.payload);
      });

      socket.on('connect', async () => {
          await client.initViewer(socket.id!);
          showToast("MODE 2: 已連接原生 WebRTC", "success");
      });
    } catch(err) {
      console.error(err);
    }
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
      activeCallsRef.current = activeCalls;

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
                 if (joinData.layer !== undefined) layerRef.current = joinData.layer;
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
        parentCallRef.current = call;
        call.on('stream', (remoteStream) => {
          myStream = remoteStream;
          if (videoRef.current) {
            videoRef.current.srcObject = remoteStream;
            setViewerStatus(""); 
            
            // Apply WebRTC Playout Delay Hint for Layer Sync
            if (roomInfoRef.current && layerRef.current > 0) {
              const base = roomInfoRef.current.base_delay || 1000;
              const step = roomInfoRef.current.layer_delay || 300;
              let delayMs = base - ((layerRef.current - 1) * step);
              if (delayMs < 0) delayMs = 0;
              
              if (call.peerConnection) {
                const receivers = call.peerConnection.getReceivers();
                receivers.forEach((receiver: any) => {
                  if ('playoutDelayHint' in receiver) {
                    receiver.playoutDelayHint = delayMs / 1000;
                  }
                });
              }
            }
            
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
        showToast("正在儲存回放影片...", "info");
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
          mediaRecorderRef.current.stop();
          await new Promise<void>((resolve) => {
            if (!mediaRecorderRef.current) return resolve();
            mediaRecorderRef.current.onstop = async () => {
              const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
              
              // Local download
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.style.display = 'none';
              a.href = url;
              a.download = `VOD_${id}_${new Date().getTime()}.webm`;
              document.body.appendChild(a);
              a.click();
              window.URL.revokeObjectURL(url);
              
              // Backend upload
              const formData = new FormData();
              formData.append('video', blob, `vod_${id}.webm`);
              try {
                 await fetch(`/api/live/rooms/${id}/vod`, { method: 'POST', body: formData });
                 showToast("回放影片上傳成功", "success");
              } catch (e) {
                 showToast("回放影片上傳失敗", "error");
              }
              resolve();
            };
          });
        }
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

  const handleFollow = async () => {
    if (!currentUser) {
      showToast("請先登入！", "info");
      return;
    }
    if (!roomInfo?.streamer_id) return;
    try {
      const res = await fetch(`/api/users/${currentUser}/follow`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "ngrok-skip-browser-warning": "69420" },
        body: JSON.stringify({ target_id: roomInfo.streamer_id })
      });
      if (res.ok) {
        const data = await res.json();
        setIsFollowing(data.action === "followed");
        showToast(data.action === "followed" ? "已追蹤直播主！" : "已取消追蹤", "success");
      }
    } catch (err) {
      showToast("操作失敗", "error");
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
                <>
                  <video ref={rawVideoRef} className="hidden" muted playsInline />
                  <canvas ref={canvasRef} className="hidden" width={640} height={480} />
                  <video 
                    ref={videoRef} 
                    autoPlay 
                    muted 
                    playsInline
                    className={`absolute inset-0 w-full h-full object-cover z-0 pointer-events-none ${facingMode === 'user' ? 'scale-x-[-1]' : ''}`}
                  />
                </>
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
                className={`absolute inset-0 w-full h-full object-cover z-0 pointer-events-none ${viewerStatus ? 'hidden' : 'block'} ${roomInfo.blur_preview && !isPasswordVerified ? 'blur-md' : ''}`}
              />
              {viewerStatus && !showPasswordPrompt && (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-white/50 bg-black z-0">
                  <div className="text-6xl mb-4 animate-bounce">📺</div>
                  <p className="font-bold px-4 text-center">{viewerStatus}</p>
                  <p className="text-xs mt-2 opacity-50 md:hidden">向左/右滑動可切換房間</p>
                </div>
              )}
            </>
          )}
        </div>

        {showPasswordPrompt && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <form onSubmit={verifyPassword} className="bg-surface border border-border w-full max-w-sm p-6 rounded-2xl shadow-2xl text-center">
              <h3 className="text-xl font-bold text-text-primary mb-2">🔒 私密直播間</h3>
              <p className="text-sm text-text-secondary mb-6">此直播間需要密碼才能進入</p>
              <input
                type="password"
                value={passwordInput}
                onChange={e => setPasswordInput(e.target.value)}
                placeholder="請輸入密碼"
                className="w-full bg-background border border-border px-4 py-3 rounded-xl text-white focus:border-primary focus:outline-none mb-4 text-center tracking-widest"
              />
              <button
                type="submit"
                disabled={!passwordInput}
                className="w-full bg-primary hover:bg-primary-hover text-white py-3 rounded-xl font-bold transition-colors disabled:opacity-50"
              >
                進入直播間
              </button>
            </form>
          </div>
        )}

        <div className="absolute top-0 left-0 right-0 flex justify-between items-start p-4 pointer-events-none bg-gradient-to-b from-black/80 via-black/40 to-transparent z-10 pt-safe-top">
          <div className="flex flex-col space-y-1 pointer-events-auto">
            <div className="flex items-center space-x-2">
              <span className="bg-red-500 text-white px-2 py-0.5 rounded text-xs font-bold animate-pulse shadow-lg">LIVE</span>
              <span className="text-white font-bold text-sm md:text-base drop-shadow-md">{roomInfo.title}</span>
            </div>
            <div className="flex items-center gap-2 self-start">
              <span className="text-white/80 text-xs drop-shadow bg-black/30 rounded-full px-2 py-0.5">直播主：{roomInfo.streamer_name}</span>
              {!isStreamer && currentUser && (
                <button
                  onClick={handleFollow}
                  className={`text-[10px] px-3 py-0.5 rounded-full font-bold shadow-md transition-all ${
                    isFollowing 
                      ? 'bg-surface/80 text-text-secondary border border-surface/50 hover:bg-surface' 
                      : 'bg-brand text-white border border-brand hover:bg-brand-hover hover:scale-105'
                  }`}
                >
                  {isFollowing ? '✓ 已追蹤' : '➕ 追蹤'}
                </button>
              )}
            </div>
          </div>
          
          <div className="flex items-center space-x-3 pointer-events-auto">
            {(isStreamer || isAdmin) && (
              <button
                onClick={() => setShowTree(true)}
                className="w-10 h-10 bg-indigo-500/80 backdrop-blur-md rounded-full flex items-center justify-center text-white shadow-lg"
                title="網路拓樸"
              >
                📊
              </button>
            )}
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
              onClick={() => setShowShareModal(true)}
              className="w-10 h-10 bg-blue-500/80 backdrop-blur-md border border-white/20 rounded-full flex items-center justify-center text-white hover:bg-blue-400 transition-colors shadow-lg"
              title="分享直播"
            >
              📤
            </button>
            <button 
              onClick={endLive}
              className="w-10 h-10 bg-black/40 backdrop-blur-md border border-white/20 rounded-full flex items-center justify-center text-white hover:bg-red-500/80 transition-colors shadow-lg"
              title="離開直播"
            >
              ✕
            </button>
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 h-[50vh] flex flex-col justify-end z-10 pointer-events-none pb-safe">
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

      {showTree && (
        <MeshTreeVisualizer roomId={id as string} onClose={() => setShowTree(false)} isStreamer={isStreamer} />
      )}

      {showShareModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-surface border border-border w-full max-w-sm rounded-2xl shadow-2xl p-6 text-center animate-in zoom-in fade-in duration-200">
            <h2 className="text-xl font-bold text-text-primary mb-4">分享直播</h2>
            
            <div className="bg-white p-4 rounded-xl mx-auto mb-3 inline-block shadow-inner relative group">
              <img 
                src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(typeof window !== 'undefined' ? window.location.href : '')}`}
                alt="Live Stream QR Code"
                className="w-48 h-48 object-contain"
              />
              <button 
                onClick={async () => {
                  if (typeof window !== 'undefined') {
                    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(window.location.href)}`;
                    try {
                      const response = await fetch(qrUrl);
                      const blob = await response.blob();
                      const objectUrl = URL.createObjectURL(blob);
                      const link = document.createElement('a');
                      link.href = objectUrl;
                      link.download = `PetBar_QR.png`;
                      document.body.appendChild(link);
                      link.click();
                      document.body.removeChild(link);
                      URL.revokeObjectURL(objectUrl);
                    } catch (error) {
                      window.open(qrUrl, '_blank');
                    }
                  }
                }}
                className="absolute -bottom-4 left-1/2 -translate-x-1/2 bg-blue-500 text-white text-xs font-bold py-1.5 px-4 rounded-full shadow-lg hover:bg-blue-600 transition-colors whitespace-nowrap"
              >
                ⬇️ 下載圖片
              </button>
            </div>
            
            <p className="text-sm text-text-secondary mt-6 mb-4">掃描上方 QR Code 或點擊下方複製網址</p>
            
            <button
              onClick={() => {
                if (typeof window !== 'undefined') {
                  navigator.clipboard.writeText(window.location.href);
                  showToast("已複製網址！", "success");
                }
              }}
              className="w-full py-3 mb-3 bg-brand/10 text-brand border border-brand/20 hover:bg-brand/20 font-bold rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              📋 複製直播連結
            </button>
            
            <button 
              onClick={() => setShowShareModal(false)}
              className="w-full py-2 bg-surface-hover text-text-secondary hover:text-text-primary rounded-lg transition-colors"
            >
              關閉
            </button>
          </div>
        </div>
      )}
    </div>
    </>
  );
}
