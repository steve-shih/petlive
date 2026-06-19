"use client";
import { useSearchParams } from "next/navigation";
import { useState, useEffect, Suspense } from "react";

function AboutContent() {
  const searchParams = useSearchParams();
  const initTab = searchParams.get('tab') || 'about';
  const [activeTab, setActiveTab] = useState(initTab);

  useEffect(() => {
    setActiveTab(searchParams.get('tab') || 'about');
  }, [searchParams]);

  return (
    <div className="w-full max-w-6xl p-4 md:p-8 flex flex-col md:flex-row gap-8">
      {/* Sidebar */}
      <div className="w-full md:w-64 shrink-0">
        <h1 className="text-3xl font-black mb-6">關於我們</h1>
        <div className="flex flex-col space-y-2">
          <button 
            onClick={() => setActiveTab('about')}
            className={`text-left px-4 py-3 rounded-xl transition-colors font-bold ${activeTab === 'about' ? 'bg-brand text-white' : 'hover:bg-surface-hover text-text-secondary'}`}
          >
            關於 PetLive
          </button>
          <button 
            onClick={() => setActiveTab('features')}
            className={`text-left px-4 py-3 rounded-xl transition-colors font-bold ${activeTab === 'features' ? 'bg-brand text-white' : 'hover:bg-surface-hover text-text-secondary'}`}
          >
            平台四大特色
          </button>
          <button 
            onClick={() => setActiveTab('certification')}
            className={`text-left px-4 py-3 rounded-xl transition-colors font-bold ${activeTab === 'certification' ? 'bg-brand text-white' : 'hover:bg-surface-hover text-text-secondary'}`}
          >
            認證繁殖家制度
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 bg-surface border border-surface/50 rounded-2xl p-6 md:p-10 shadow-lg">
        {activeTab === 'about' && (
          <div className="space-y-6 animate-fade-in">
            <h2 className="text-2xl font-bold text-brand">全台首創活體競標與直購平台</h2>
            <p className="leading-relaxed text-text-secondary text-lg">
              PetLive 致力於打造一個安全、透明、且充滿互動性的特殊寵物交易環境。我們深知甲蟲、爬蟲等活體動物在運送與交易過程中的痛點，因此導入了革命性的 WebRTC 直播與視訊展示系統，讓買家在下單前能 100% 確認寵物的健康狀態。
            </p>
            <div className="h-64 rounded-2xl bg-gradient-to-r from-gray-800 to-gray-900 flex items-center justify-center overflow-hidden relative">
              <span className="text-6xl absolute animate-bounce">🦎</span>
            </div>
            <p className="leading-relaxed text-text-secondary text-lg">
              我們不只是一個商城，更是一個生態系。透過嚴格的賣家審核與 DOA (Dead on Arrival) 保障機制，我們期盼能為台灣的特寵圈帶來最高標準的交易體驗。
            </p>
          </div>
        )}

        {activeTab === 'features' && (
          <div className="space-y-8 animate-fade-in">
            <h2 className="text-2xl font-bold text-brand mb-6">平台四大特色</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-background p-6 rounded-xl border border-surface-hover">
                <div className="text-4xl mb-4">📹</div>
                <h3 className="text-xl font-bold mb-2">即時視訊展示</h3>
                <p className="text-text-secondary">透過 WebRTC 技術，支援 1 對 1 視訊與萬人直播，買家可即時要求賣家展示活體活動力，杜絕修圖與舊影片造假。</p>
              </div>
              <div className="bg-background p-6 rounded-xl border border-surface-hover">
                <div className="text-4xl mb-4">🛡️</div>
                <h3 className="text-xl font-bold mb-2">交易安全防護</h3>
                <p className="text-text-secondary">買賣雙方皆有信用評分系統，惡意棄標者將被系統自動標記，甚至永久停權，保障買賣雙方權益。</p>
              </div>
              <div className="bg-background p-6 rounded-xl border border-surface-hover">
                <div className="text-4xl mb-4">🤖</div>
                <h3 className="text-xl font-bold mb-2">代理出價系統</h3>
                <p className="text-text-secondary">沒時間盯盤？設定好最高底線，系統將自動幫您以最小幅度壓過對手，讓您輕鬆標得心儀寵物。</p>
              </div>
              <div className="bg-background p-6 rounded-xl border border-surface-hover">
                <div className="text-4xl mb-4">📜</div>
                <h3 className="text-xl font-bold mb-2">血統基因庫</h3>
                <p className="text-text-secondary">支援血統書上傳與基因計算器，提供專業玩家最嚴謹的血統追溯，避免近親繁殖與基因缺陷。</p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'certification' && (
          <div className="space-y-6 animate-fade-in">
            <h2 className="text-2xl font-bold text-brand">認證繁殖家制度</h2>
            <p className="leading-relaxed text-text-secondary text-lg">
              為了提升活體交易的品質，PetLive 推出了「認證繁殖家」制度。通過認證的賣家將獲得專屬的藍勾勾標章，並享有手續費減免與專屬曝光版面。
            </p>
            <h3 className="text-xl font-bold mt-8 mb-4">如何取得認證？</h3>
            <ul className="list-disc pl-6 space-y-4 text-text-secondary">
              <li>完成實名認證與身分證上傳。</li>
              <li>過去 90 天內完成超過 50 筆無爭議訂單。</li>
              <li>平均買家評價達 4.8 顆星以上。</li>
              <li>無任何 DOA 不處理或惡意棄標紀錄。</li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

export default function AboutPage() {
  return (
    <Suspense fallback={<div className="p-10 text-center">載入中...</div>}>
      <AboutContent />
    </Suspense>
  );
}
