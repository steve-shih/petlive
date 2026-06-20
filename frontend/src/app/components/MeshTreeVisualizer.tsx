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
  
  // Advanced Settings State
  const [maxLayers, setMaxLayers] = useState(3);
  const [layerCapacity, setLayerCapacity] = useState(4);
  const [totalViewers, setTotalViewers] = useState(200);
  const [baseDelay, setBaseDelay] = useState(1000);
  const [layerDelay, setLayerDelay] = useState(300);
  const [isApplying, setIsApplying] = useState(false);

  // Popover State
  const [selectedNode, setSelectedNode] = useState<string | null>(null);

  // SVG Drawing state
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchTree = async () => {
      try {
        const res = await fetch(`/api/live/rooms/${roomId}/tree`, {
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

    fetchTree();
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
          layer_capacity: layerCapacity,
          total_viewers: totalViewers,
          base_delay: baseDelay,
          layer_delay: layerDelay
        })
      });
      alert("設定已套用！未來的新連線與延遲同步將遵守此規則。");
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

  // Calculate estimated capacity
  const estimatedCapacity = React.useMemo(() => {
    let total = layerCapacity;
    let currentLayer = layerCapacity;
    for (let i = 1; i < maxLayers; i++) {
        currentLayer = currentLayer * layerCapacity;
        total += currentLayer;
    }
    return total;
  }, [maxLayers, layerCapacity]);

  // Recursively render nodes without CSS borders, using absolute positioning wrapper for SVG lines
  const renderNode = (nodeId: string, depth: number = 0) => {
    const nodeInfo = treeData[nodeId];
    if (!nodeInfo) return null;

    const isRoot = nodeInfo.parent === null;
    const stats = nodeInfo.stats;
    
    let healthColor = "bg-green-500";
    if (stats) {
      if (stats.bitrate < 300 || stats.ping > 300) healthColor = "bg-red-500 animate-pulse";
      else if (stats.bitrate < 800 || stats.ping > 150) healthColor = "bg-yellow-500";
    } else if (!isRoot) {
      healthColor = "bg-gray-400";
    }

    return (
      <div key={nodeId} className="flex flex-col items-center relative my-4 node-container" data-node-id={nodeId}>
        {/* Node Card */}
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
                 {stats ? (
                   <>
                     <p className={`mt-1 font-bold ${stats.bitrate < 300 ? 'text-red-400' : 'text-green-400'}`}>
                       網路速度: {(stats.bitrate / 1000).toFixed(2)} Mbps
                     </p>
                     <p className={`font-bold ${stats.ping > 300 ? 'text-red-400' : 'text-green-400'}`}>
                       連線延遲: {stats.ping} ms
                     </p>
                   </>
                 ) : (
                   <p className="mt-1 text-gray-500 italic">尚無連線數據</p>
                 )}
              </div>
            )}
        </div>

        {/* Children Row */}
        {nodeInfo.children.length > 0 && (
          <div className="flex flex-row justify-center space-x-6 mt-12 relative">
            {nodeInfo.children.map(childId => renderNode(childId, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  // Draw SVG lines connecting parents to children
  const [svgLines, setSvgLines] = useState<any[]>([]);

  useEffect(() => {
    if (!containerRef.current || !rootNodeId) return;

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

            // Calculate relative coordinates
            const x1 = pRect.left + pRect.width / 2 - rect.left;
            const y1 = pRect.bottom - rect.top;
            const x2 = cRect.left + cRect.width / 2 - rect.left;
            const y2 = cRect.top - rect.top;

            // Create a curved path
            const path = `M ${x1} ${y1} C ${x1} ${y1 + 30}, ${x2} ${y2 - 30}, ${x2} ${y2}`;
            newLines.push({ id: `${parentId}-${childId}`, path, isSlow: (treeData[childId]?.stats?.ping ?? 0) > 300 });
          });
        }
      });
      setSvgLines(newLines);
    };

    // Give react time to render DOM nodes before drawing lines
    setTimeout(updateLines, 100);
    window.addEventListener('resize', updateLines);
    return () => window.removeEventListener('resize', updateLines);
  }, [treeData, rootNodeId]);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
      <div className="bg-background border border-border w-full max-w-6xl h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="flex justify-between items-center p-4 border-b border-border bg-surface">
          <div className="flex items-center space-x-3">
            <span className="text-2xl">📊</span>
            <div>
              <h3 className="font-bold text-lg text-text-primary">即時網路拓樸 (Mesh Tree)</h3>
              <p className="text-xs text-text-secondary">拖曳可互換節點。點擊可看數據。綠色代表健康，紅色代表網路不穩即將被斷開轉發。</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-surface hover:bg-red-500/20 text-text-secondary hover:text-red-400 flex items-center justify-center transition-colors"
          >
            ✕
          </button>
        </div>
        
        {isStreamer && (
          <div className="p-4 bg-surface/50 border-b border-border flex flex-col gap-4 text-sm">
            <div className="flex flex-wrap items-center gap-6">
              <div className="flex flex-col">
                <label className="text-text-secondary mb-1">總人數上限 (1-500)</label>
                <input type="range" min="1" max="500" value={totalViewers} onChange={e => setTotalViewers(Number(e.target.value))} className="w-32 accent-primary" />
                <span className="text-xs font-bold text-primary text-center mt-1">{totalViewers} 人</span>
              </div>
              <div className="flex flex-col">
                <label className="text-text-secondary mb-1">最大樹狀層數 (Layers)</label>
                <input type="range" min="1" max="5" value={maxLayers} onChange={e => setMaxLayers(Number(e.target.value))} className="w-32 accent-primary" />
                <span className="text-xs font-bold text-primary text-center mt-1">{maxLayers} 層</span>
              </div>
              <div className="flex flex-col">
                <label className="text-text-secondary mb-1">每層節點容量</label>
                <input type="range" min="1" max="10" value={layerCapacity} onChange={e => setLayerCapacity(Number(e.target.value))} className="w-32 accent-primary" />
                <span className="text-xs font-bold text-primary text-center mt-1">{layerCapacity} 人</span>
              </div>
              
              {/* Layer Sync Delay Settings */}
              <div className="flex flex-col border-l border-border pl-6 ml-2">
                <label className="text-purple-400 mb-1 font-bold">⏱ Layer 1 基礎延遲</label>
                <input type="range" min="0" max="2000" step="100" value={baseDelay} onChange={e => setBaseDelay(Number(e.target.value))} className="w-32 accent-purple-500" />
                <span className="text-xs font-bold text-purple-400 text-center mt-1">{baseDelay} ms</span>
              </div>
              <div className="flex flex-col">
                <label className="text-purple-400 mb-1 font-bold">逐層遞減</label>
                <input type="range" min="0" max="500" step="50" value={layerDelay} onChange={e => setLayerDelay(Number(e.target.value))} className="w-32 accent-purple-500" />
                <span className="text-xs font-bold text-purple-400 text-center mt-1">-{layerDelay} ms</span>
              </div>

              <div className="ml-auto">
                <button 
                  onClick={applySettings}
                  disabled={isApplying}
                  className="px-6 py-2 bg-primary hover:bg-primary-hover text-white rounded-lg font-bold transition-colors disabled:opacity-50"
                >
                  {isApplying ? '套用中...' : '套用並重構網路'}
                </button>
              </div>
            </div>
            <div className="text-xs text-text-secondary">
              💡 依據目前的容量設定，您的網狀架構預計最多可容納：<span className="font-bold text-green-400">{estimatedCapacity} 人</span>
            </div>
          </div>
        )}
        
        <div ref={containerRef} className="flex-1 overflow-auto p-12 flex justify-center bg-gradient-to-b from-background to-surface/50 relative">
          
          {/* SVG Overlay for Connections */}
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
            <div className="m-auto text-red-400">{error}</div>
          ) : !rootNodeId ? (
            <div className="m-auto text-text-secondary animate-pulse">正在載入網路結構...</div>
          ) : (
            <div className="min-w-max flex justify-center pb-20 relative z-10">
              {renderNode(rootNodeId)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
