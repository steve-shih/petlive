"use client";
import { useEffect, useState, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useToast } from "../components/Toast";

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
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const userId = localStorage.getItem("current_user_id");
    setCurrentUser(userId);

    if (userId) {
      // Load friends
      fetch(`/api/users/${userId}/following`, { headers: { "ngrok-skip-browser-warning": "69420" } })
        .then(res => res.json())
        .then(data => {
          setFriends(data.details || []);
          if (!activeFriendId && data.details && data.details.length > 0) {
            // setActiveFriendId(data.details[0].id); // Don't auto-select if no to param
          }
        })
        .catch(console.error);
    }
  }, []);

  if (currentUser === null && typeof window !== "undefined") {
    const userId = localStorage.getItem("current_user_id");
    if (!userId) {
      return (
        <div className="w-full flex flex-col items-center justify-center pt-32 p-6 text-center">
          <div className="text-6xl mb-6">🛑</div>
          <h2 className="text-2xl font-bold mb-4">您目前處於訪客模式</h2>
          <p className="text-text-secondary mb-8">請先登入以使用聊天室與買賣家私訊功能</p>
          <div className="animate-pulse text-brand font-bold bg-brand/10 px-6 py-3 rounded-full">
            請點擊上方或下方導覽列進行登入
          </div>
        </div>
      );
    }
  }

  useEffect(() => {
    if (currentUser && activeFriendId) {
      fetchMessages();
      const interval = setInterval(fetchMessages, 3000); // Poll every 3 seconds
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

  if (!currentUser) return <div className="p-10 text-center">請先登入或切換帳號</div>;

  const activeFriend = friends.find(f => f.id === activeFriendId);

  return (
    <div className="w-full max-w-6xl p-4 md:p-6 h-[calc(100dvh-5rem)]">
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
                <button 
                  onClick={async () => {
                    if (confirm(`確定要封鎖 ${activeFriend?.name} 嗎？`)) {
                      try {
                        const res = await fetch(`/api/users/${currentUser}/block`, {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ target_id: activeFriendId })
                        }).then(async res => {
                          const data = await res.json();
                          if (!res.ok) showToast(data.error || "封鎖失敗", "error");
                          else showToast(`已${data.action === 'blocked' ? '封鎖' : '解除封鎖'}該用戶`, "success");
                        }).catch(() => {
                          showToast("發生錯誤", "error");
                        });
                      } catch (err) {
                        showToast("發生錯誤", "error");
                      }
                    }
                  }}
                  className="text-xs px-3 py-1 border border-red-500 text-red-500 rounded-full hover:bg-red-500 hover:text-white transition-colors"
                >
                  🚫 封鎖此人
                </button>
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

import { Suspense } from 'react';
export default function ChatPage() {
  return (
    <Suspense fallback={<div className="p-10 text-center">載入中...</div>}>
      <ChatContent />
    </Suspense>
  );
}
