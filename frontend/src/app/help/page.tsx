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
        <h1 className="text-3xl font-black mb-6">撟怠銝剖?</h1>
        <div className="flex flex-col space-y-2">
          <button 
            onClick={() => setActiveTab('safe')}
            className={`text-left px-4 py-3 rounded-xl transition-colors font-bold ${activeTab === 'safe' ? 'bg-brand text-white' : 'hover:bg-surface-hover text-text-secondary'}`}
          >
            鈭斗?摰?脰風
          </button>
          <button 
            onClick={() => setActiveTab('doa')}
            className={`text-left px-4 py-3 rounded-xl transition-colors font-bold ${activeTab === 'doa' ? 'bg-brand text-white' : 'hover:bg-surface-hover text-text-secondary'}`}
          >
            DOA 瘣駁?靽?
          </button>
          <button 
            onClick={() => setActiveTab('seller')}
            className={`text-left px-4 py-3 rounded-xl transition-colors font-bold ${activeTab === 'seller' ? 'bg-brand text-white' : 'hover:bg-surface-hover text-text-secondary'}`}
          >
            鞈?振銝??
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 bg-surface border border-surface/50 rounded-2xl p-6 md:p-10 shadow-lg prose prose-invert max-w-none">
        
        {activeTab === 'safe' && (
          <div className="animate-fade-in">
            <h2 className="text-2xl font-bold text-brand mb-6">鈭斗?摰?脰風</h2>
            <p>PetBar ?游??潭??閰??璉????其漱?憓????乩?憭??脰風璈嚗?/p>
            
            <h3>1. 撖血?隤?蝟餌絞</h3>
            <p>??隢??箝都摰嗚??冽嚗??????Ⅳ蝬??祕?澈??霅之撟?雿???撣唾?閰??◢?芥?/p>

            <h3>2. 靽∠閰?璈</h3>
            <p>瘥?甈⊥???鈭斗??賣?蝝舐?鞎瑁都??縑?函????璅?鈭斗?蝟曄?嚗頂蝯勗???蝛??蝛?雿銝摰?瑼鳴?蝟餌絞撠???嗅?箏???嗆???/p>

            <h3>3. ?湔/閬?撽?</h3>
            <p>?撥?遣霅啗眺摰嗅蝯董??閬?鞈?振??撟喳??WebRTC 1撠?閬??嚗??蝷箸暑擃??曄?嚗Ⅱ靽???閬?敺?/p>
          </div>
        )}

        {activeTab === 'doa' && (
          <div className="animate-fade-in">
            <h2 className="text-2xl font-bold text-brand mb-6">DOA 瘣駁?靽?瘚? (Dead on Arrival)</h2>
            <p>瘣駁????券◢?迎??箔????寞???隢?敹?潮摰誑銝?蝞望?蝔?</p>
            
            <div className="bg-brand/10 border border-brand/50 p-6 rounded-xl my-6">
              <h3 className="text-brand m-0 mb-4">? ?函??蔣?拳閬?</h3>
              <ul className="m-0 space-y-2">
                <li>敹?敺??撣嗅???憪?敶梧?蝣箔??ㄨ摰?芾◤????/li>
                <li>?蔣敹????∪摨?銝?芾摩???銝剜??/li>
                <li>敶梁?敹?皜????株??拳擃?閫嚗誑??蝞勗?瘣駁???瘜?/li>
              </ul>
            </div>

            <h3>憒??唾? DOA ??嚗?/h3>
            <ol>
              <li>**蝣箄?甇颱滿**嚗?蝞望??亦?暹暑擃歇?∠??質楚鞊∴?隢??喳?甇駁??恍皜?????/li>
              <li>**???批???*嚗??潛偷?嗅?鋆孵? **24 撠???*嚗??拳敶梁??喲策鞈?振??/li>
              <li>**敺???**嚗都摰嗥Ⅱ隤隤文?嚗?靘??嗅?鈭斗?蝝?嚗脰??憿甈整?暑擃??銝?祥嚗???撖?蝑潭暑擃?/li>
            </ol>
            <p className="text-sm text-text-secondary">??閮鳴??亥眺摰嗆靘?摰?敶梧?????24 撠????梧?鞈?振?????? DOA ????/p>
          </div>
        )}

        {activeTab === 'seller' && (
          <div className="animate-fade-in">
            <h2 className="text-2xl font-bold text-brand mb-6">鞈?振銝??</h2>
            <p>甇∟??冽???PetBar ?都摰塚??箇雁霅瑕像?啣?鞈迎?銝??隢摰誑銝?蝭?</p>

            <h3>1. ??閬?</h3>
            <ul>
              <li>敹????喳? 1 撘菜??啁?撖衣?抒??撥?遣霅唬??喳?蝷箏蔣??/li>
              <li>璅???璆?蝷箇蝔桀?蝔晞偕撖豢??孵噩??/li>
              <li>蝳迫?隞犖?抒???/li>
            </ul>

            <h3>2. ?箏???唳?蝷?/h3>
            <p>?亥痔?桐?瘣駁??瑟??寞??箏?嚗?嚗?????摰?堆?隢?敹?膩銝剛?撖行???亥????箏?銋?鈭?撠偶銋?甈?/p>

            <h3>3. ?箄疏??</h3>
            <p>鞎瑕振摰?蝯董敺?鞈?振? **48 撠???* 摰??箄疏??予瘞?????蝑?蝝?閬辣?脣鞎剁?隢?敹?蝘??眺摰嗆???敺???/p>

            <h3>4. ??閬?</h3>
            <p>撖暑擃???雿輻???蝞望?靽?樴拳??冽??末?脫??芣嚗蒂靘迤蝭?曄蔭靽鋡?????蝣箔?瘣駁?摰????/p>
          </div>
        )}

      </div>
    </div>
  );
}

export default function HelpPage() {
  return (
    <Suspense fallback={<div className="p-10 text-center">頛銝?..</div>}>
      <HelpContent />
    </Suspense>
  );
}
