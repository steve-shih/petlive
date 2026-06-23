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
        <h1 className="text-3xl font-black mb-6">About</h1>
        <div className="flex flex-col space-y-2">
          <button 
            onClick={() => setActiveTab('about')}
            className={`text-left px-4 py-3 rounded-xl transition-colors font-bold ${activeTab === 'about' ? 'bg-brand text-white' : 'hover:bg-surface-hover text-text-secondary'}`}
          >
            ? PetBar
          </button>
          <button 
            onClick={() => setActiveTab('features')}
            className={`text-left px-4 py-3 rounded-xl transition-colors font-bold ${activeTab === 'features' ? 'bg-brand text-white' : 'hover:bg-surface-hover text-text-secondary'}`}
          >
            撟喳?之?寡
          </button>
          <button 
            onClick={() => setActiveTab('certification')}
            className={`text-left px-4 py-3 rounded-xl transition-colors font-bold ${activeTab === 'certification' ? 'bg-brand text-white' : 'hover:bg-surface-hover text-text-secondary'}`}
          >
            隤?蝜?摰嗅摨?          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 bg-surface border border-surface/50 rounded-2xl p-6 md:p-10 shadow-lg">
        {activeTab === 'about' && (
          <div className="space-y-6 animate-fade-in">
            <h2 className="text-2xl font-bold text-brand">?典擐瘣駁?蝡嗆??鞈澆像</h2>
            <p className="leading-relaxed text-text-secondary text-lg">
              PetBar ?游??潭??????具????遛鈭??抒??寞?撖萇鈭斗??啣????楛?亦?脯?脩?瘣駁???券???鈭斗???銝剔???嚗?甇文??乩??拙?抒? WebRTC ?湔??閮?蝷箇頂蝯梧?霈眺摰嗅銝? 100% 蝣箄?撖萇?摨瑞???            </p>
            <div className="h-64 rounded-2xl bg-gradient-to-r from-gray-800 to-gray-900 flex items-center justify-center overflow-hidden relative">
              <span className="text-6xl absolute animate-bounce">??</span>
            </div>
            <p className="leading-relaxed text-text-secondary text-lg">
              ???芣銝?????湔銝???頂???湔?都摰嗅祟?貉? DOA (Dead on Arrival) 靽?璈嚗????潸?箏????孵秘?葆靘?擃?皞?鈭斗?擃???            </p>
          </div>
        )}

        {activeTab === 'features' && (
          <div className="space-y-8 animate-fade-in">
            <h2 className="text-2xl font-bold text-brand mb-6">撟喳?之?寡</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-background p-6 rounded-xl border border-surface-hover">
                <div className="text-4xl mb-4">?</div>
                <h3 className="text-xl font-bold mb-2">?單?閬?撅內</h3>
                <p className="text-text-secondary">?? WebRTC ?銵??舀 1 撠?1 閬??鈭箇?哨?鞎瑕振?臬??瘙都摰嗅?蝷箸暑擃暑??嚗?蝯耨???蔣??</p>
              </div>
              <div className="bg-background p-6 rounded-xl border border-surface-hover">
                <div className="text-4xl mb-4">?儭</div>
                <h3 className="text-xl font-bold mb-2">鈭斗?摰?脰風</h3>
                <p className="text-text-secondary">鞎瑁都???靽∠閰?蝟餌絞嚗??璅?鋡怎頂蝯梯??閮??瘞訾???嚗??眺鞈???寞??</p>
              </div>
              <div className="bg-background p-6 rounded-xl border border-surface-hover">
                <div className="text-4xl mb-4">??</div>
                <h3 className="text-xl font-bold mb-2">隞???箏蝟餌絞</h3>
                <p className="text-text-secondary">瘝???歹?閮剖?憟賣?擃?蝺?蝟餌絞撠?鼠?其誑?撠?摨血?????霈頛?璅?敹?撖萇</p>
              </div>
              <div className="bg-background p-6 rounded-xl border border-surface-hover">
                <div className="text-4xl mb-4">??</div>
                <h3 className="text-xl font-bold mb-2">銵蝯勗?澈</h3>
                <p className="text-text-secondary">?舀銵蝯望銝???蝞嚗?靘?璆剔摰嗆??渲牲??蝯梯蕭皞荔??踹?餈扛蝜???撩?瑯</p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'certification' && (
          <div className="space-y-6 animate-fade-in">
            <h2 className="text-2xl font-bold text-brand">隤?蝜?摰嗅摨</h2>
            <p className="leading-relaxed text-text-secondary text-lg">
              ?箔???瘣駁?鈭斗???鞈迎?PetBar ?典鈭?霅?畾振?摨艾?隤??都摰嗅??脣?撠惇???曉璅?嚗蒂鈭急???鞎餅???撠惇?????            </p>
            <h3 className="text-xl font-bold mt-8 mb-4">憒???隤?嚗</h3>
            <ul className="list-disc pl-6 space-y-4 text-text-secondary">
              <li>摰?撖血?隤??澈??銝</li>
              <li>? 90 憭拙摰?頞? 50 蝑?剛降閮</li>
              <li>撟喳?鞎瑕振閰??4.8 憿?隞乩?</li>
              <li>?∩遙雿?DOA 銝????⊥?璉?蝝?</li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

export default function AboutPage() {
  return (
    <Suspense fallback={<div className="p-10 text-center">頛銝?..</div>}>
      <AboutContent />
    </Suspense>
  );
}
