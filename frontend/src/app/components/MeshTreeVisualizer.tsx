"use client";
import React, { useEffect, useState, useRef } from 'react';

interface MeshNode {
  children: string[];
  parent: string | null;
  layer: number;
  stats?: {
    bitrate: number;
    ping: number;
  };
}

interface MeshTreeData {
  [peerId: string]: MeshNode;
}

export default function MeshTreeVisualizer({ 
  roomId, 
  onClose,
  isStreamer 
}: { 
  roomId: string; 
  onClose: () => void;
  isStreamer: boolean;
}) {
  const [treeData, setTreeData] = useState<MeshTreeData>({});
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'tree' | 'settings'>('tree');
  
  // Advanced Settings State
  const [maxLayers, setMaxLayers] = useState(3);
  const [layerCapacity, setLayerCapacity] = useState(4);
  const [totalViewers, setTotalViewers] = useState(200);
  const [baseDelay, setBaseDelay] = useState(1000);
  const [layerDelay, setLayerDelay] = useState(300);
  
  // New Features State
  const [password, setPassword] = useState("");
  const [blurPreview, setBlurPreview] = useState(false);
  const [noiseSuppression, setNoiseSuppression] = useState(true);
  const [beautyFilter, setBeautyFilter] = useState(false);
  const [bgBlur, setBgBlur] = useState(false);

  const [isApplying, setIsApplying] = useState(false);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const [shareUrl, setShareUrl] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      setShareUrl(`${window.location.origin}/live/${roomId}`);
    }

    const fetchTree = async () => {
      try {
        const isMode2 = process.env.NEXT_PUBLIC_LIVE_MODE === '2';
        const url = isMode2 
          ? `/peer-api/tree/${roomId}`
          : `/api/live/rooms/${roomId}/tree`;

        const res = await fetch(url, {
            headers: { "ngrok-skip-browser-warning": "69420" }
        });
        const data = await res.json();
        if (data.tree) {
          setTreeData(data.tree);
          setError(null);
        } else {
          setError(data.error || "無法取得結構");
        }
      } catch (err) {
        setError("連線錯誤");
      }
    };

    const fetchSettings = async () => {
      try {
        const res = await fetch(`/api/live/rooms/${roomId}`, {
            headers: { "ngrok-skip-browser-warning": "69420" }
        });
        const room = await res.json();
        if (room && !room.error) {
           setMaxLayers(room.max_layers || 3);
           setLayerCapacity(room.layer_0_capacity || 4);
           setTotalViewers(room.max_viewers || 200);
           setBaseDelay(room.base_delay || 1000);
           setLayerDelay(room.layer_delay || 300);
           setPassword(room.password || "");
           setBlurPreview(room.blur_preview || false);
           setNoiseSuppression(room.noise_suppression !== false);
           setBeautyFilter(room.beauty_filter || false);
           setBgBlur(room.bg_blur || false);
        }
      } catch (e) {
        console.error("Failed to fetch room settings");
      }
    }

    fetchTree();
    fetchSettings();
    const interval = setInterval(fetchTree, 1500);
    return () => clearInterval(interval);
  }, [roomId]);

  const applySettings = async () => {
    setIsApplying(true);
    try {
      await fetch(`/api/live/rooms/${roomId}/settings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', "ngrok-skip-browser-warning": "69420" },
        body: JSON.stringify({
          max_layers: maxLayers,
          layer_0_capacity: layerCapacity,
          layer_n_capacity: layerCapacity,
          max_viewers: totalViewers,
          base_delay: baseDelay,
          layer_delay: layerDelay,
          password: password,
          blur_preview: blurPreview,
          noise_suppression: noiseSuppression,
          beauty_filter: beautyFilter,
          bg_blur: bgBlur
        })
      });
      alert("設定已套用！未來的新連線與規則將遵守此設定。");
    } catch (e) {
      alert("套用失敗");
    }
    setIsApplying(false);
  };

  const handleSwap = async (sourceId: string, targetId: string) => {
    if (sourceId === targetId) return;
    try {
      await fetch(`/api/live/rooms/${roomId}/swap_nodes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', "ngrok-skip-browser-warning": "69420" },
        body: JSON.stringify({ node_a: sourceId, node_b: targetId })
      });
    } catch (e) {
      console.error("Swap failed", e);
    }
  };

  const handleDragStart = (e: React.DragEvent, nodeId: string) => {
    e.dataTransfer.setData("peer_id", nodeId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    const sourceId = e.dataTransfer.getData("peer_id");
    handleSwap(sourceId, targetId);
  };

  const rootNodeId = Object.keys(treeData).find(id => treeData[id].parent === null);

  const downloadQRCode = async () => {
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(shareUrl)}`;
    try {
      const response = await fetch(qrUrl);
      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = objectUrl;
      link.download = `LiveRoom_${roomId}_QR.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(objectUrl);
    } catch (error) {
      console.error("QR Code download failed", error);
      window.open(qrUrl, '_blank');
    }
  };

  const estimatedCapacity = React.useMemo(() => {
    let total = layerCapacity;
    let currentLayer = layerCapacity;
    for (let i = 1; i < maxLayers; i++) {
        currentLayer = currentLayer * layerCapacity;
        total += currentLayer;
    }
    return total;
  }, [maxLayers, layerCapacity]);

  const renderNode = (nodeId: string, depth: number = 0) => {
    const nodeInfo = treeData[nodeId];
    if (!nodeInfo) return null;

    const isRoot = nodeInfo.parent === null;
    const stats = nodeInfo.stats;
    const hasValidStats = stats && (stats.bitrate > 0 || stats.ping > 0);
    
    let healthColor = "bg-gray-400";
    if (isRoot) {
      healthColor = "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.8)]"; // Streamer always looks healthy
    } else if (hasValidStats) {
      if (stats.ping > 300) healthColor = "bg-red-500 animate-pulse";
      else if (stats.ping > 150) healthColor = "bg-yellow-500";
      else healthColor = "bg-green-500";
    }

    return (
      <div key={nodeId} className="flex flex-col items-center relative my-4 node-container" data-node-id={nodeId}>
        <div 
          id={`node-${nodeId}`}
          draggable={isStreamer && !isRoot}
          onDragStart={(e) => handleDragStart(e, nodeId)}
          onDragOver={handleDragOver}
          onDrop={(e) => handleDrop(e, nodeId)}
          onClick={() => setSelectedNode(selectedNode === nodeId ? null : nodeId)}
          className={`px-4 py-3 rounded-xl border flex flex-col items-center justify-center transition-all duration-300 shadow-md cursor-pointer hover:scale-105 relative z-10
            ${isRoot ? 'bg-primary/20 border-primary shadow-primary/20' : 'bg-surface border-border'}
            ${selectedNode === nodeId ? 'ring-2 ring-indigo-400' : ''}
          `}
        >
            <div className={`${healthColor} absolute -top-1 -right-1 w-3 h-3 rounded-full border border-black z-20 shadow-sm`} />
            <span className="text-xs font-bold text-text-secondary uppercase mb-1">
                {isRoot ? '👑 Streamer' : `Layer ${nodeInfo.layer}`}
            </span>
            <span className="font-mono text-sm text-text-primary">
                {nodeId.substring(0, 8)}
            </span>
            
            {selectedNode === nodeId && (
              <div className="absolute top-full mt-2 w-48 p-3 bg-gray-900 border border-gray-700 rounded-lg shadow-xl z-50 text-left text-xs animate-in fade-in slide-in-from-top-2">
                 <p className="font-bold mb-2 text-white">節點詳細資訊</p>
                 <p className="text-gray-300">ID: {nodeId}</p>
                 <p className="text-gray-300">Layer: {nodeInfo.layer}</p>
                 {isRoot ? (
                   <p className="mt-2 text-blue-400 font-bold">📡 直播訊號源</p>
                 ) : hasValidStats ? (
                   <p className={`mt-2 font-bold ${stats.ping > 300 ? 'text-red-400' : 'text-green-400'}`}>
                     連線延遲: {stats.ping} ms
                   </p>
                 ) : (
                   <p className="mt-2 text-gray-400 italic flex items-center">
                     <span className="animate-spin mr-2">⏳</span> 數據計算中...
                   </p>
                 )}
              </div>
            )}
        </div>

        {nodeInfo.children.length > 0 && (
          <div className="flex flex-row justify-center space-x-6 mt-12 relative">
            {nodeInfo.children.map(childId => renderNode(childId, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  const [svgLines, setSvgLines] = useState<any[]>([]);

  useEffect(() => {
    if (!containerRef.current || !rootNodeId || activeTab !== 'tree') return;

    const updateLines = () => {
      const container = containerRef.current;
      if (!container) return;
      const rect = container.getBoundingClientRect();
      const newLines: any[] = [];

      Object.keys(treeData).forEach(parentId => {
        const parentNode = treeData[parentId];
        if (parentNode.children.length > 0) {
          const parentEl = document.getElementById(`node-${parentId}`);
          if (!parentEl) return;
          const pRect = parentEl.getBoundingClientRect();
          
          parentNode.children.forEach(childId => {
            const childEl = document.getElementById(`node-${childId}`);
            if (!childEl) return;
            const cRect = childEl.getBoundingClientRect();

            const x1 = pRect.left + pRect.width / 2 - rect.left;
            const y1 = pRect.bottom - rect.top;
            const x2 = cRect.left + cRect.width / 2 - rect.left;
            const y2 = cRect.top - rect.top;

            const path = `M ${x1} ${y1} C ${x1} ${y1 + 30}, ${x2} ${y2 - 30}, ${x2} ${y2}`;
            newLines.push({ id: `${parentId}-${childId}`, path, isSlow: (treeData[childId]?.stats?.ping ?? 0) > 300 });
          });
        }
      });
      setSvgLines(newLines);
    };

    setTimeout(updateLines, 100);
    window.addEventListener('resize', updateLines);
    return () => window.removeEventListener('resize', updateLines);
  }, [treeData, rootNodeId, activeTab]);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
      <div className="bg-background border border-border w-full max-w-6xl h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">
        
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-border bg-surface">
          <div className="flex items-center space-x-3">
            <span className="text-2xl">⚙️</span>
            <div>
              <h3 className="font-bold text-lg text-text-primary">專業設定</h3>
              <p className="text-xs text-text-secondary">管理您的直播間與網路連線</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-surface hover:bg-red-500/20 text-text-secondary hover:text-red-400 flex items-center justify-center transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Tabs */}
        {isStreamer && (
          <div className="flex border-b border-border bg-surface/30">
            <button 
              className={`flex-1 py-3 font-bold transition-colors ${activeTab === 'tree' ? 'text-primary border-b-2 border-primary' : 'text-text-secondary hover:text-text-primary'}`}
              onClick={() => setActiveTab('tree')}
            >
              樹狀圖形 (Mesh Tree)
            </button>
            <button 
              className={`flex-1 py-3 font-bold transition-colors ${activeTab === 'settings' ? 'text-primary border-b-2 border-primary' : 'text-text-secondary hover:text-text-primary'}`}
              onClick={() => setActiveTab('settings')}
            >
              重新設定 (Settings)
            </button>
          </div>
        )}

        {/* Content Area */}
        <div className="flex-1 overflow-hidden relative flex flex-col">
          
          {/* Tab 1: Tree Graph */}
          {activeTab === 'tree' && (
            <div ref={containerRef} className="flex-1 overflow-auto p-12 flex justify-center bg-gradient-to-b from-background to-surface/50 relative">
              <div className="absolute top-4 left-4 z-20 text-xs text-text-secondary bg-surface p-2 rounded border border-border shadow">
                💡 拖曳可互換節點。點擊可看數據。<br/>綠色代表健康，紅色代表網路不穩即將被斷開。
              </div>
              <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
                <defs>
                  <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                    <polygon points="0 0, 10 3.5, 0 7" fill="#888" />
                  </marker>
                  <marker id="arrowhead-slow" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                    <polygon points="0 0, 10 3.5, 0 7" fill="#ef4444" />
                  </marker>
                </defs>
                {svgLines.map(line => (
                  <path 
                    key={line.id} 
                    d={line.path} 
                    fill="none" 
                    stroke={line.isSlow ? "#ef4444" : "#888"} 
                    strokeWidth="2"
                    strokeDasharray={line.isSlow ? "4,4" : "none"}
                    className={line.isSlow ? "animate-pulse" : ""}
                    markerEnd={`url(#${line.isSlow ? 'arrowhead-slow' : 'arrowhead'})`}
                  />
                ))}
              </svg>

              {error ? (
                <div className="m-auto text-red-400 z-10">{error}</div>
              ) : !rootNodeId ? (
                <div className="m-auto text-text-secondary animate-pulse z-10">正在載入網路結構...</div>
              ) : (
                <div className="min-w-max flex justify-center pb-20 relative z-10">
                  {renderNode(rootNodeId)}
                </div>
              )}
            </div>
          )}

          {/* Tab 2: Settings */}
          {activeTab === 'settings' && isStreamer && (
            <div className="flex-1 overflow-auto p-6 bg-surface/30">
              <div className="max-w-4xl mx-auto space-y-8">
                
                {/* Section 1: Mesh Network Configurations */}
                <div className="bg-surface p-6 rounded-xl border border-border shadow-sm">
                  <h4 className="text-lg font-bold text-primary mb-4 flex items-center">
                    <span className="mr-2">🌐</span> 基礎網路容量設定
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="flex flex-col">
                      <label className="text-text-secondary mb-2 font-bold text-sm">總人數上限 (1-500)</label>
                      <input type="range" min="1" max="500" value={totalViewers} onChange={e => setTotalViewers(Number(e.target.value))} className="w-full accent-primary" />
                      <span className="text-sm font-bold text-text-primary text-center mt-2">{totalViewers} 人</span>
                    </div>
                    <div className="flex flex-col">
                      <label className="text-text-secondary mb-2 font-bold text-sm">最大樹狀層數 (Layers)</label>
                      <input type="range" min="1" max="5" value={maxLayers} onChange={e => setMaxLayers(Number(e.target.value))} className="w-full accent-primary" />
                      <span className="text-sm font-bold text-text-primary text-center mt-2">{maxLayers} 層</span>
                    </div>
                    <div className="flex flex-col">
                      <label className="text-text-secondary mb-2 font-bold text-sm">每層節點容量</label>
                      <input type="range" min="1" max="10" value={layerCapacity} onChange={e => setLayerCapacity(Number(e.target.value))} className="w-full accent-primary" />
                      <span className="text-sm font-bold text-text-primary text-center mt-2">{layerCapacity} 人</span>
                    </div>
                  </div>
                  <div className="mt-4 p-3 bg-green-500/10 border border-green-500/20 rounded-lg text-sm text-green-400">
                    💡 依據目前的容量設定，您的網狀架構預計最多可容納：<span className="font-bold">{estimatedCapacity} 人</span>
                  </div>
                </div>

                {/* Section 2: Delay Configuration */}
                <div className="bg-surface p-6 rounded-xl border border-border shadow-sm">
                  <h4 className="text-lg font-bold text-purple-400 mb-4 flex items-center">
                    <span className="mr-2">⏱</span> 影音同步延遲設定
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="flex flex-col">
                      <label className="text-text-secondary mb-2 font-bold text-sm">Layer 1 基礎延遲</label>
                      <input type="range" min="0" max="2000" step="100" value={baseDelay} onChange={e => setBaseDelay(Number(e.target.value))} className="w-full accent-purple-500" />
                      <span className="text-sm font-bold text-text-primary text-center mt-2">{baseDelay} ms</span>
                    </div>
                    <div className="flex flex-col">
                      <label className="text-text-secondary mb-2 font-bold text-sm">逐層遞減</label>
                      <input type="range" min="0" max="500" step="50" value={layerDelay} onChange={e => setLayerDelay(Number(e.target.value))} className="w-full accent-purple-500" />
                      <span className="text-sm font-bold text-text-primary text-center mt-2">-{layerDelay} ms</span>
                    </div>
                  </div>
                </div>

                {/* Section 3: Room Features & Security */}
                <div className="bg-surface p-6 rounded-xl border border-border shadow-sm">
                  <h4 className="text-lg font-bold text-pink-400 mb-4 flex items-center">
                    <span className="mr-2">🔒</span> 房間安全與特效
                  </h4>
                  <div className="space-y-6">
                    {/* Password */}
                    <div>
                      <label className="flex items-center space-x-3 cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={password.length > 0}
                          onChange={(e) => {
                            if (!e.target.checked) setPassword("");
                            else setPassword("1234"); // default when toggled on
                          }}
                          className="w-5 h-5 accent-pink-500 rounded cursor-pointer"
                        />
                        <span className="text-sm font-bold text-text-primary">啟用聊天室密碼</span>
                      </label>
                      {password.length > 0 && (
                        <div className="mt-3 pl-8">
                          <input 
                            type="text" 
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="請輸入密碼"
                            className="bg-background border border-border px-4 py-2 rounded-lg text-sm w-full max-w-xs focus:outline-none focus:border-pink-500 transition-colors text-white"
                          />
                        </div>
                      )}
                    </div>
                    
                    {/* Blur Preview */}
                    <div>
                      <label className="flex items-center space-x-3 cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={blurPreview}
                          onChange={(e) => setBlurPreview(e.target.checked)}
                          className="w-5 h-5 accent-pink-500 rounded cursor-pointer"
                        />
                        <span className="text-sm font-bold text-text-primary">未進入直播前套用輕微馬賽克 (Blur Preview)</span>
                      </label>
                    </div>

                    {/* Noise Suppression */}
                    <div>
                      <label className="flex items-center space-x-3 cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={noiseSuppression}
                          onChange={(e) => setNoiseSuppression(e.target.checked)}
                          className="w-5 h-5 accent-pink-500 rounded cursor-pointer"
                        />
                        <span className="text-sm font-bold text-text-primary">環境音降噪 (Noise Suppression)</span>
                      </label>
                    </div>

                    {/* Beauty Filter */}
                    <div>
                      <label className="flex items-center space-x-3 cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={beautyFilter}
                          onChange={(e) => setBeautyFilter(e.target.checked)}
                          className="w-5 h-5 accent-pink-500 rounded cursor-pointer"
                        />
                        <span className="text-sm font-bold text-text-primary">基礎美顏濾鏡 (柔膚提亮)</span>
                      </label>
                    </div>

                    {/* Background Blur */}
                    <div>
                      <label className="flex items-center space-x-3 cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={bgBlur}
                          onChange={(e) => setBgBlur(e.target.checked)}
                          className="w-5 h-5 accent-pink-500 rounded cursor-pointer"
                        />
                        <span className="text-sm font-bold text-text-primary">背景模糊 (AI Background Blur)</span>
                      </label>
                      {bgBlur && (
                         <p className="mt-1 pl-8 text-xs text-yellow-400">⚠️ 啟用背景模糊可能會增加裝置的運算負擔與耗電量。</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Section 4: Share & QR Code */}
                <div className="bg-surface p-6 rounded-xl border border-border shadow-sm">
                  <h4 className="text-lg font-bold text-blue-400 mb-4 flex items-center">
                    <span className="mr-2">📤</span> 邀請與分享
                  </h4>
                  <div className="flex flex-col md:flex-row items-center gap-6">
                    <div className="flex flex-col items-center">
                      <div className="bg-white p-2 rounded-xl mb-3 shadow-sm border border-gray-200">
                        <img 
                          src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(shareUrl)}`} 
                          alt="QR Code" 
                          width={150} 
                          height={150} 
                        />
                      </div>
                      <button 
                        onClick={downloadQRCode}
                        className="text-xs bg-blue-100 hover:bg-blue-200 text-blue-700 font-bold py-1.5 px-4 rounded-full transition-colors flex items-center gap-1"
                      >
                        ⬇️ 下載 QR Code
                      </button>
                    </div>
                    <div className="flex-1 space-y-4 w-full">
                      <div>
                        <p className="text-xs text-text-secondary mb-1">直播專屬連結</p>
                        <div className="flex">
                          <input 
                            type="text" 
                            readOnly 
                            value={shareUrl}
                            className="bg-background border border-border px-3 py-2 rounded-l-lg text-sm w-full text-white/70"
                          />
                          <button 
                            onClick={() => {
                              navigator.clipboard.writeText(shareUrl);
                              alert("已複製連結！");
                            }}
                            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-r-lg font-bold transition-colors text-sm whitespace-nowrap"
                          >
                            複製
                          </button>
                        </div>
                      </div>
                      <div>
                        <a 
                          href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center justify-center bg-[#1877F2] hover:bg-[#166FE5] text-white font-bold py-2 px-4 rounded-lg transition-colors text-sm w-full md:w-auto"
                        >
                          分享到 Facebook
                        </a>
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        {activeTab === 'settings' && isStreamer && (
          <div className="p-4 border-t border-border bg-surface flex justify-end">
            <button 
              onClick={applySettings}
              disabled={isApplying}
              className="px-8 py-3 bg-primary hover:bg-primary-hover text-white rounded-xl font-bold transition-all disabled:opacity-50 shadow-lg hover:shadow-primary/20 active:scale-95"
            >
              {isApplying ? '儲存中...' : '儲存設定'}
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
