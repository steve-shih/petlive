"use client";
import { useSearchParams } from "next/navigation";
import { useState, useEffect, Suspense } from "react";

function HelpContent() {
  const searchParams = useSearchParams();
  const initTab = searchParams.get('tab') || 'safe';
  const [activeTab, setActiveTab] = useState(initTab);

  useEffect(() => {
    setActiveTab(searchParams.get('tab') || 'safe');
  }, [searchParams]);

  return (
    <div className="w-full max-w-6xl p-4 md:p-8 flex flex-col md:flex-row gap-8">
      {/* Sidebar */}
      <div className="w-full md:w-64 shrink-0">
        <h1 className="text-3xl font-black mb-6">幫助中心</h1>
        <div className="flex flex-col space-y-2">
          <button 
            onClick={() => setActiveTab('safe')}
            className={`text-left px-4 py-3 rounded-xl transition-colors font-bold ${activeTab === 'safe' ? 'bg-brand text-white' : 'hover:bg-surface-hover text-text-secondary'}`}
          >
            交易安全防護
          </button>
          <button 
            onClick={() => setActiveTab('doa')}
            className={`text-left px-4 py-3 rounded-xl transition-colors font-bold ${activeTab === 'doa' ? 'bg-brand text-white' : 'hover:bg-surface-hover text-text-secondary'}`}
          >
            DOA 活體保障
          </button>
          <button 
            onClick={() => setActiveTab('seller')}
            className={`text-left px-4 py-3 rounded-xl transition-colors font-bold ${activeTab === 'seller' ? 'bg-brand text-white' : 'hover:bg-surface-hover text-text-secondary'}`}
          >
            賣家上架指南
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 bg-surface border border-surface/50 rounded-2xl p-6 md:p-10 shadow-lg prose prose-invert max-w-none">
        
        {activeTab === 'safe' && (
          <div className="animate-fade-in">
            <h2 className="text-2xl font-bold text-brand mb-6">交易安全防護</h2>
            <p>PetBar 致力於打造無詐騙、無棄標的安全交易環境。我們導入了多重防護機制：</p>
            
            <h3>1. 實名認證系統</h3>
            <p>所有申請成為「賣家」的用戶，皆須通過手機號碼綁定與實名身分驗證。這大幅降低了免洗帳號詐騙的風險。</p>

            <h3>2. 信用評分機制</h3>
            <p>每一次成功的交易都會累積買賣雙方的信用積分。若有棄標或交易糾紛，系統將扣除積分。當積分低於一定門檻，系統將自動限制其出價與上架權限。</p>

            <h3>3. 直播/視訊驗證</h3>
            <p>我們強烈建議買家在結帳前，要求賣家透過平台的 WebRTC 1對1視訊功能，即時展示活體的現狀，確保商品「所見即所得」。</p>
          </div>
        )}

        {activeTab === 'doa' && (
          <div className="animate-fade-in">
            <h2 className="text-2xl font-bold text-brand mb-6">DOA 活體保障流程 (Dead on Arrival)</h2>
            <p>活體運送存在風險，為保障雙方權益，請務必嚴格遵守以下開箱流程：</p>
            
            <div className="bg-brand/10 border border-brand/50 p-6 rounded-xl my-6">
              <h3 className="text-brand m-0 mb-4">📹 全程錄影開箱規定</h3>
              <ul className="m-0 space-y-2">
                <li>必須從「剪開膠帶前」開始錄影，確保包裹完整未被拆封。</li>
                <li>錄影必須「一鏡到底」，不可剪輯、暫停或中斷。</li>
                <li>影片必須清晰拍到托運單號、箱體外觀，以及開箱後活體的狀況。</li>
              </ul>
            </div>

            <h3>如何申請 DOA 理賠？</h3>
            <ol>
              <li>**確認死亡**：開箱時若發現活體已無生命跡象，請立即將死體畫面清楚錄下。</li>
              <li>**時效內回報**：請於簽收包裹後 **24 小時內**，將開箱影片傳送給賣家。</li>
              <li>**後續處理**：賣家確認無誤後，應依據當初交易約定，進行「全額退款」、「退還活體本金（不含運費）」或「補寄同等值活體」。</li>
            </ol>
            <p className="text-sm text-text-secondary">※ 註：若買家未依規定錄影，或超過 24 小時才回報，賣家有權拒絕受理 DOA 理賠。</p>
          </div>
        )}

        {activeTab === 'seller' && (
          <div className="animate-fade-in">
            <h2 className="text-2xl font-bold text-brand mb-6">賣家上架指南</h2>
            <p>歡迎您成為 PetBar 的賣家！為維護平台品質，上架商品請遵守以下規範：</p>

            <h3>1. 圖文規範</h3>
            <ul>
              <li>必須提供至少 1 張清晰的實物照片。強烈建議上傳展示影片。</li>
              <li>標題應清楚標示物種名稱、尺寸或特徵。</li>
              <li>禁止盜用他人照片。</li>
            </ul>

            <h3>2. 基因與產地標示</h3>
            <p>若販售之活體具有特殊基因（如：黑化、白化）或特定產地，請務必於描述中誠實標明。若查證有造假基因之情事，將永久停權。</p>

            <h3>3. 出貨時效</h3>
            <p>買家完成結帳後，賣家應於 **48 小時內** 安排出貨。若因天氣過熱/過冷等因素需要延遲出貨，請務必透過私訊與買家溝通取得同意。</p>

            <h3>4. 包裝規範</h3>
            <p>寄送活體請務必使用堅固的紙箱或保麗龍箱。內部應做好防撞措施，並依季節放置保冷袋或暖暖包，確保活體安全送達。</p>
          </div>
        )}

      </div>
    </div>
  );
}

export default function HelpPage() {
  return (
    <Suspense fallback={<div className="p-10 text-center">載入中...</div>}>
      <HelpContent />
    </Suspense>
  );
}
