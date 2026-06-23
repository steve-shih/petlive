"use client";
import { useSearchParams } from "next/navigation";
import { useState, useEffect, Suspense } from "react";

function LegalContent() {
  const searchParams = useSearchParams();
  const initTab = searchParams.get('tab') || 'terms';
  const [activeTab, setActiveTab] = useState(initTab);

  useEffect(() => {
    setActiveTab(searchParams.get('tab') || 'terms');
  }, [searchParams]);

  return (
    <div className="w-full max-w-6xl p-4 md:p-8 flex flex-col md:flex-row gap-8">
      {/* Sidebar */}
      <div className="w-full md:w-64 shrink-0">
        <h1 className="text-3xl font-black mb-6">法律與政策</h1>
        <div className="flex flex-col space-y-2">
          <button 
            onClick={() => setActiveTab('terms')}
            className={`text-left px-4 py-3 rounded-xl transition-colors font-bold ${activeTab === 'terms' ? 'bg-brand text-white' : 'hover:bg-surface-hover text-text-secondary'}`}
          >
            使用條款
          </button>
          <button 
            onClick={() => setActiveTab('privacy')}
            className={`text-left px-4 py-3 rounded-xl transition-colors font-bold ${activeTab === 'privacy' ? 'bg-brand text-white' : 'hover:bg-surface-hover text-text-secondary'}`}
          >
            隱私政策
          </button>
          <button 
            onClick={() => setActiveTab('abandon')}
            className={`text-left px-4 py-3 rounded-xl transition-colors font-bold ${activeTab === 'abandon' ? 'bg-brand text-white' : 'hover:bg-surface-hover text-text-secondary'}`}
          >
            棄標法律須知
          </button>
          <button 
            onClick={() => setActiveTab('live')}
            className={`text-left px-4 py-3 rounded-xl transition-colors font-bold ${activeTab === 'live' ? 'bg-brand text-white' : 'hover:bg-surface-hover text-text-secondary'}`}
          >
            活體交易須知
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 bg-surface border border-surface/50 rounded-2xl p-6 md:p-10 shadow-lg prose prose-invert max-w-none">
        {activeTab === 'terms' && (
          <div className="animate-fade-in">
            <h2 className="text-2xl font-bold text-brand mb-6">PetBar 使用條款</h2>
            <p>歡迎您使用 PetBar（以下簡稱「本平台」）。在您註冊成為本平台會員，或開始使用本平台提供之服務前，請務必詳細閱讀並同意本使用條款。</p>
            
            <h3>1. 帳號與安全</h3>
            <p>您同意在註冊時提供真實且準確的個人資料。若發現資料有虛偽不實，本平台有權立即暫停或終止您的帳號，並拒絕您使用本平台之全部或部分服務。</p>

            <h3>2. 交易規範</h3>
            <p>本平台僅提供資訊媒合服務。買賣雙方應秉持誠信原則進行交易。嚴禁上架任何違反《野生動物保育法》之保育類動物。</p>

            <h3>3. 停權標準</h3>
            <p>若會員有以下行為，系統將自動或經人工審核後永久停權：</p>
            <ul>
              <li>一個月內累計兩次棄標紀錄。</li>
              <li>發送垃圾訊息、詐騙連結或騷擾其他使用者。</li>
              <li>販售非法物品或保育類動物。</li>
            </ul>
          </div>
        )}

        {activeTab === 'privacy' && (
          <div className="animate-fade-in">
            <h2 className="text-2xl font-bold text-brand mb-6">隱私政策</h2>
            <p>PetBar 非常重視您的隱私權。本政策說明我們如何收集、使用及保護您的個人資料。</p>
            
            <h3>1. 資料收集</h3>
            <p>我們將收集您在註冊、填寫個人資料、以及進行交易時所提供的資訊（包含但不限於姓名、聯絡電話、寄送地址等）。</p>

            <h3>2. 資料使用</h3>
            <p>您的個人資料將僅用於：</p>
            <ul>
              <li>處理訂單與物流運送（提供給賣方與物流業者）。</li>
              <li>身份認證與帳號安全保護。</li>
              <li>處理客訴或法律爭議。</li>
            </ul>

            <h3>3. 資料保護</h3>
            <p>我們採用業界標準的 SSL 加密技術保護您的資料傳輸安全，且不會將您的個資出售或任意提供給無關的第三方機構。</p>
          </div>
        )}

        {activeTab === 'abandon' && (
          <div className="animate-fade-in">
            <h2 className="text-2xl font-bold text-red-500 mb-6">⚠️ 棄標法律須知</h2>
            <div className="bg-red-500/10 border border-red-500/50 p-6 rounded-xl mb-6">
              <p className="text-red-400 font-bold m-0">在 PetBar 平台參與競標，即代表您同意並受法律約束。嚴禁惡意棄標行為！</p>
            </div>
            
            <h3>1. 民事責任</h3>
            <p>依據《民法》第 397 條規定，拍賣之買受人，如不按時支付價金者，拍賣人得解除契約，將其物再為拍賣。再拍賣之價金，如少於原拍賣之價金及再拍賣之費用者，原買受人應負賠償其差額之責任。</p>

            <h3>2. 刑事責任</h3>
            <p>若您無意購買卻惡意參與競標，導致賣方受有損害，可能構成《刑法》第 355 條「間接毀損罪」：意圖損害他人，以詐術使本人或第三人為財產上之處分，致生財產上之損害者，處三年以下有期徒刑、拘役或一萬五千元以下罰金。</p>

            <h3>3. 平台處置</h3>
            <p>對於棄標者，平台將立即永久封鎖帳號，並將相關註冊資料與 IP 紀錄提供給賣家報警提告使用。</p>
          </div>
        )}

        {activeTab === 'live' && (
          <div className="animate-fade-in">
            <h2 className="text-2xl font-bold text-brand mb-6">活體交易須知</h2>
            
            <h3>1. 不適用七天鑑賞期</h3>
            <p>依據《消費者保護法》第 19 條第 1 項但書規定，以及行政院發布之《通訊交易解除權合理例外情事適用準則》第 2 條第 1 款：「易於腐敗、保存期限較短或解約時即將逾期」，活體動物因具備生命特性，於運送及飼養過程中存在極大變數，故**不適用七天鑑賞期之規定**，售出後非因 DOA 因素概不退換。</p>

            <h3>2. 買方義務</h3>
            <p>買家在下標或購買前，應：</p>
            <ul>
              <li>充分了解該物種的飼養方式、環境需求與食性。</li>
              <li>確認自身有能力提供合適的飼養環境。</li>
              <li>透過視訊或直播充分確認活體狀態。</li>
            </ul>

            <h3>3. 運送風險</h3>
            <p>活體運送存在一定風險。買方應盡量選擇賣方建議的物流方式（如黑貓宅急便或超商店到店）。若買方堅持使用不當物流，可能喪失 DOA 保障權益。</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function LegalPage() {
  return (
    <Suspense fallback={<div className="p-10 text-center">載入中...</div>}>
      <LegalContent />
    </Suspense>
  );
}
