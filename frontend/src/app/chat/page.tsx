"use client";
import { useEffect, useState, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useToast } from "../components/Toast";
import { Suspense } from 'react';

interface ChatMessage {
  id: string;
  sender_id: string;
  receiver_id: string;
  message_text: string;
  created_at: string;
}

interface Friend {
  id: string;
  name: string;
  role: string;
}

function ChatContent() {
  const searchParams = useSearchParams();
  const receiverIdFromUrl = searchParams.get('to');
  const router = useRouter();
  const { showToast } = useToast();
  
  const [friends, setFriends] = useState<Friend[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState("");
  const [currentUser, setCurrentUser] = useState<string | null>(null);
  const [activeFriendId, setActiveFriendId] = useState<string | null>(receiverIdFromUrl);
  
  // WebRTC Call State
  const [incomingCall, setIncomingCall] = useState<any>(null);
  const [activeCallId, setActiveCallId] = useState<string | null>(null);
  const [isCalling, setIsCalling] = useState(false);
  const [isCallAccepted, setIsCallAccepted] = useState(false);
  
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const pcRef = useRef<any>(null);
  const localStreamRef = useRef<MediaStream | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const userId = localStorage.getItem("current_user_id");
    setCurrentUser(userId);

    if (userId) {
      fetch(`/api/users/${userId}/following`, { headers: { "ngrok-skip-browser-warning": "69420" } })
        .then(res => res.json())
        .then(data => {
          setFriends(data.details || []);
        })
        .catch(console.error);
    }
  }, []);

  useEffect(() => {
    if (currentUser && activeFriendId) {
      fetchMessages();
      const interval = setInterval(fetchMessages, 3000);
      return () => clearInterval(interval);
    } else {
      setMessages([]);
    }
  }, [currentUser, activeFriendId]);

  const fetchMessages = () => {
    if (!currentUser || !activeFriendId) return;
    fetch(`/api/messages?user1=${currentUser}&user2=${activeFriendId}`, { headers: { "ngrok-skip-browser-warning": "69420" } })
      .then(res => res.json())
      .then(data => setMessages(data))
      .catch(err => console.error(err));
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Polling for Incoming Calls
  useEffect(() => {
    if (!currentUser) return;
    const pollCalls = async () => {
      if (activeCallId || isCalling) return;
      try {
        const res = await fetch(`/api/calls/incoming?user_id=${currentUser}`);
        const data = await res.json();
        if (data.incoming && data.incoming.id !== incomingCall?.id) {
          setIncomingCall(data.incoming);
        } else if (!data.incoming) {
          setIncomingCall(null);
        }
      } catch (e) {}
    };
    const interval = setInterval(pollCalls, 3000);
    return () => clearInterval(interval);
  }, [currentUser, activeCallId, isCalling, incomingCall]);

  const cleanupCall = async () => {
    if (activeCallId) {
      fetch(`/api/calls/${activeCallId}/end`, { method: 'POST' }).catch(() => {});
    }
    if (pcRef.current) {
      if (pcRef.current.pollAnswerInterval) clearInterval(pcRef.current.pollAnswerInterval);
      if (pcRef.current.pollCandInterval) clearInterval(pcRef.current.pollCandInterval);
      pcRef.current.close();
    }
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
    }
    pcRef.current = null;
    localStreamRef.current = null;
    setActiveCallId(null);
    setIsCalling(false);
    setIsCallAccepted(false);
    setIncomingCall(null);
  };

  const startCall = async () => {
    if (!activeFriendId || !currentUser) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      localStreamRef.current = stream;
      if (localVideoRef.current) localVideoRef.current.srcObject = stream;
      
      const pc = new RTCPeerConnection({ iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] });
      pcRef.current = pc;
      
      stream.getTracks().forEach(track => pc.addTrack(track, stream));
      
      pc.ontrack = (event) => {
        if (remoteVideoRef.current) remoteVideoRef.current.srcObject = event.streams[0];
      };
      
      setIsCalling(true);
      
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      
      const res = await fetch('/api/calls', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ caller_id: currentUser, receiver_id: activeFriendId, offer })
      });
      const data = await res.json();
      setActiveCallId(data.call_id);
      
      pc.onicecandidate = async (e) => {
        if (e.candidate) {
          await fetch(`/api/calls/${data.call_id}/candidates`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ candidate: e.candidate, is_caller: true })
          });
        }
      };
      
      const pollAnswer = setInterval(async () => {
        const checkRes = await fetch(`/api/calls/${data.call_id}`);
        const checkData = await checkRes.json();
        if (checkData.status === 'REJECTED' || checkData.status === 'ENDED') {
          clearInterval(pollAnswer);
          cleanupCall();
          showToast("通話已結束或對方拒絕", "error");
        } else if (checkData.answer && pc.signalingState !== 'stable') {
          await pc.setRemoteDescription(new RTCSessionDescription(checkData.answer));
          setIsCallAccepted(true);
          clearInterval(pollAnswer);
          
          const pollCandidates = setInterval(async () => {
             const cRes = await fetch(`/api/calls/${data.call_id}`);
             const cData = await cRes.json();
             if (cData.status === 'ENDED') {
               clearInterval(pollCandidates);
               cleanupCall();
             }
             if (cData.receiver_candidates) {
               for (const cand of cData.receiver_candidates) {
                 try { await pc.addIceCandidate(new RTCIceCandidate(cand)); } catch (e) {}
               }
             }
          }, 2000);
          pcRef.current.pollCandInterval = pollCandidates;
        }
      }, 2000);
      pcRef.current.pollAnswerInterval = pollAnswer;
      
    } catch (err) {
      console.error(err);
      showToast("無法取得攝影機權限", "error");
      cleanupCall();
    }
  };

  const acceptCall = async () => {
    if (!incomingCall || !currentUser) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      localStreamRef.current = stream;
      if (localVideoRef.current) localVideoRef.current.srcObject = stream;
      
      const pc = new RTCPeerConnection({ iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] });
      pcRef.current = pc;
      
      stream.getTracks().forEach(track => pc.addTrack(track, stream));
      
      pc.ontrack = (event) => {
        if (remoteVideoRef.current) remoteVideoRef.current.srcObject = event.streams[0];
      };
      
      await pc.setRemoteDescription(new RTCSessionDescription(incomingCall.offer));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      
      await fetch(`/api/calls/${incomingCall.id}/answer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answer })
      });
      
      setActiveCallId(incomingCall.id);
      setIsCallAccepted(true);
      
      pc.onicecandidate = async (e) => {
        if (e.candidate) {
          await fetch(`/api/calls/${incomingCall.id}/candidates`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ candidate: e.candidate, is_caller: false })
          });
        }
      };
      
      const pollCandidates = setInterval(async () => {
         const cRes = await fetch(`/api/calls/${incomingCall.id}`);
         const cData = await cRes.json();
         if (cData.status === 'ENDED') {
           clearInterval(pollCandidates);
           cleanupCall();
         }
         if (cData.caller_candidates) {
           for (const cand of cData.caller_candidates) {
             try { await pc.addIceCandidate(new RTCIceCandidate(cand)); } catch (e) {}
           }
         }
      }, 2000);
      pcRef.current.pollCandInterval = pollCandidates;
      
      setIncomingCall(null);
    } catch (err) {
      console.error(err);
      showToast("接聽失敗或無相機權限", "error");
      cleanupCall();
    }
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !currentUser || !activeFriendId) return;

    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sender_id: currentUser,
          receiver_id: activeFriendId,
          message_text: inputText
        })
      });
      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || "發送失敗", "error");
        return;
      }
      setInputText("");
      fetchMessages();
    } catch (err) {
      console.error("Failed to send message", err);
    }
  };

  if (currentUser === null && typeof window !== "undefined") {
    return (
      <div className="w-full flex flex-col items-center justify-center pt-32 p-6 text-center">
        <div className="text-6xl mb-6">🛑</div>
        <h2 className="text-2xl font-bold mb-4">您目前處於訪客模式</h2>
        <p className="text-text-secondary mb-8">請先登入以使用聊天室與私訊功能</p>
      </div>
    );
  }

  const activeFriend = friends.find(f => f.id === activeFriendId);

  return (
    <div className="w-full max-w-6xl p-4 md:p-6 h-[calc(100dvh-5rem)]">
      
      {/* INCOMING CALL OVERLAY */}
      {incomingCall && !activeCallId && (
        <div className="fixed inset-0 z-[200] bg-black/90 backdrop-blur-sm flex flex-col items-center justify-center text-white animate-fade-in">
          <div className="w-24 h-24 bg-brand rounded-full flex items-center justify-center text-4xl mb-6 animate-pulse">
            📞
          </div>
          <h2 className="text-3xl font-bold mb-2">{incomingCall.caller_name} 來電</h2>
          <p className="text-text-secondary mb-8">正在邀請您進行 WebRTC 1對1視訊</p>
          <div className="flex gap-6">
            <button 
              onClick={() => {
                fetch(`/api/calls/${incomingCall.id}/end`, { method: 'POST' });
                setIncomingCall(null);
              }}
              className="bg-red-500 hover:bg-red-600 rounded-full px-8 py-3 font-bold transition-colors"
            >
              掛斷
            </button>
            <button 
              onClick={acceptCall}
              className="bg-green-500 hover:bg-green-600 rounded-full px-8 py-3 font-bold transition-colors shadow-lg shadow-green-500/50"
            >
              接聽視訊
            </button>
          </div>
        </div>
      )}

      {/* ACTIVE CALL MODAL */}
      {(isCalling || activeCallId) && (
        <div className="fixed inset-0 z-[150] bg-black flex flex-col items-center justify-center text-white">
          <div className="relative w-full max-w-5xl h-[80vh] bg-surface rounded-2xl overflow-hidden border border-surface-hover shadow-2xl">
            {/* Remote Video (Full Size) */}
            <video 
              ref={remoteVideoRef} 
              autoPlay 
              playsInline 
              className="w-full h-full object-cover bg-black"
            />
            
            {/* Local Video (PiP) */}
            <div className="absolute top-4 right-4 w-32 md:w-48 aspect-[3/4] bg-gray-900 rounded-xl overflow-hidden shadow-2xl border-2 border-surface/50">
              <video 
                ref={localVideoRef} 
                autoPlay 
                playsInline 
                muted
                className="w-full h-full object-cover transform -scale-x-100"
              />
            </div>

            {/* Calling Status Overlay */}
            {!isCallAccepted && isCalling && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60">
                <div className="text-5xl mb-4 animate-bounce">📞</div>
                <div className="text-2xl font-bold">正在呼叫對方...</div>
                <div className="text-text-secondary mt-2">請等待對方接聽</div>
              </div>
            )}

            {/* Controls */}
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2">
              <button 
                onClick={cleanupCall}
                className="bg-red-500 hover:bg-red-600 rounded-full w-16 h-16 flex items-center justify-center text-2xl shadow-xl transition-transform hover:scale-110"
              >
                📴
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-between items-center mb-4 md:mb-6 px-2 md:px-0">
        <h1 className="text-2xl md:text-3xl font-bold">💬 聊天室</h1>
      </div>

      <div className="bg-surface border border-surface/50 rounded-2xl flex flex-col md:flex-row h-full overflow-hidden shadow-sm">
        
        {/* Left: Friends List */}
        <div className={`w-full md:w-1/3 border-r border-surface/50 flex flex-col ${activeFriendId ? 'hidden md:flex' : 'flex'}`}>
          <div className="p-4 border-b border-surface/50 bg-background/50 font-bold flex-shrink-0">
            聯絡人清單
          </div>
          <div className="flex-1 overflow-y-auto">
            {friends.length === 0 ? (
              <div className="p-6 text-center text-text-secondary text-sm">
                目前尚無追蹤任何賣家。<br/>請先在商品頁點擊「+ 追蹤」來建立聯絡人！
              </div>
            ) : (
              friends.map(f => (
                <button
                  key={f.id}
                  onClick={() => setActiveFriendId(f.id)}
                  className={`w-full text-left p-4 flex items-center space-x-3 hover:bg-background/80 transition-colors border-b border-surface/50 ${activeFriendId === f.id ? 'bg-background border-l-4 border-l-brand' : ''}`}
                >
                  <div className="w-10 h-10 rounded-full bg-brand/10 flex items-center justify-center text-brand font-bold shrink-0">
                    {f.name.charAt(0)}
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <div className="font-bold truncate">{f.name}</div>
                    <div className="text-xs text-text-secondary">{f.role}</div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Right: Chat Area */}
        <div className={`flex-1 flex flex-col bg-background/50 relative ${!activeFriendId ? 'hidden md:flex' : 'flex'}`}>
          {!activeFriendId ? (
            <div className="flex-1 flex flex-col items-center justify-center text-text-secondary">
              <div className="text-5xl mb-4">👆</div>
              <p>請從左側選擇聯絡人開始聊天</p>
            </div>
          ) : (
            <>
              {/* Chat Header */}
              <div className="bg-surface/50 border-b border-surface/50 p-4 font-bold flex justify-between items-center space-x-2 shrink-0">
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => setActiveFriendId(null)}
                    className="md:hidden text-brand mr-2 font-normal"
                  >
                    ← 返回
                  </button>
                  <span className="text-brand">👤 {activeFriend?.name || '未知使用者'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={startCall}
                    className="text-sm px-4 py-1.5 bg-green-500/20 text-green-400 border border-green-500/30 rounded-full hover:bg-green-500 hover:text-white transition-colors flex items-center gap-1 font-bold"
                  >
                    📹 視訊通話
                  </button>
                  <button 
                    onClick={async () => {
                      if (confirm(`確定要封鎖 ${activeFriend?.name} 嗎？`)) {
                        try {
                          await fetch(`/api/users/${currentUser}/block`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ target_id: activeFriendId })
                          });
                          showToast("已封鎖該用戶", "success");
                        } catch (err) {
                          showToast("發生錯誤", "error");
                        }
                      }
                    }}
                    className="text-xs px-3 py-1 border border-red-500/50 text-red-400 rounded-full hover:bg-red-500 hover:text-white transition-colors"
                  >
                    🚫 封鎖
                  </button>
                </div>
              </div>
              
              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-24 md:pb-4">
                {messages.length === 0 ? (
                  <div className="text-center text-text-secondary py-10 text-sm">
                    這是您與 {activeFriend?.name} 的新對話！
                  </div>
                ) : (
                  messages.map(msg => {
                    const isMe = msg.sender_id === currentUser;
                    return (
                      <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[70%] rounded-2xl px-4 py-2 ${isMe ? 'bg-brand text-white rounded-br-sm' : 'bg-surface border border-surface/50 rounded-bl-sm'}`}>
                          <div className="text-sm break-all">{msg.message_text}</div>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input Area */}
              <form onSubmit={sendMessage} className="p-4 border-t border-surface/50 bg-surface/50 flex gap-2 shrink-0 absolute bottom-16 md:static w-full">
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="輸入訊息..."
                  className="flex-1 bg-background border border-surface/50 rounded-xl px-4 py-2 focus:outline-none focus:border-brand"
                />
                <button 
                  type="submit"
                  disabled={!inputText.trim()}
                  className="bg-brand text-white px-6 py-2 rounded-xl font-bold disabled:opacity-50 hover:bg-brand/90 transition-colors"
                >
                  發送
                </button>
              </form>
            </>
          )}
        </div>

      </div>
    </div>
  );
}

export default function ChatPage() {
  return (
    <Suspense fallback={<div className="p-10 text-center">載入中...</div>}>
      <ChatContent />
    </Suspense>
  );
}
