import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-surface border-t border-surface/50 py-12 mt-20 relative z-10">
      <div className="max-w-6xl mx-auto px-4 md:px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">

          <div className="col-span-1 md:col-span-2">
            <Link href="/" className="flex items-center space-x-2 text-2xl font-black text-brand mb-4">
              <span>??</span>
              <span>PetBar</span>
            </Link>
            <p className="text-text-secondary mb-4 leading-relaxed max-w-sm">
              ?典擐?孵秘?湔蝡嗆?撟喳???箏?瘜平????閫?捱?喟絞蝷曄黎撟喳嚗? FB?ikTok嚗????瘚??唳嚗?靘??芰??敹?撅蝛粹???            </p>
            <div className="flex space-x-4">
              <button onClick={() => alert("?祈??? iOS App嚗?)} className="w-10 h-10 rounded-full bg-surface-hover flex items-center justify-center text-xl hover:bg-brand hover:text-white transition-colors cursor-pointer border-none outline-none">?</button>
              <button onClick={() => alert("?祈??? Instagram 摰撣唾?嚗?)} className="w-10 h-10 rounded-full bg-surface-hover flex items-center justify-center text-xl hover:bg-brand hover:text-white transition-colors cursor-pointer border-none outline-none">?</button>
              <button onClick={() => alert("?祈??? LINE 摰撣唾?嚗?)} className="w-10 h-10 rounded-full bg-surface-hover flex items-center justify-center text-xl hover:bg-brand hover:text-white transition-colors cursor-pointer border-none outline-none">?</button>
            </div>
          </div>

          <div>
            <h3 className="font-bold text-lg mb-4 text-white">鈭圾?游?</h3>
            <ul className="space-y-3 text-text-secondary">
              <li><Link href="/about" className="hover:text-brand transition-colors">???/Link></li>
              <li><Link href="/about?tab=features" className="hover:text-brand transition-colors">撟喳?寡</Link></li>
              <li><Link href="/about?tab=certification" className="hover:text-brand transition-colors">鞈?振隤??嗅漲</Link></li>
              <li><Link href="/live" className="hover:text-brand transition-colors">??啁??/Link></li>
            </ul>
          </div>

          <div>
            <h3 className="font-bold text-lg mb-4 text-white">???鼠??/h3>
            <ul className="space-y-3 text-text-secondary">
              <li><Link href="/help" className="hover:text-brand transition-colors">撟怠銝剖?</Link></li>
              <li><Link href="/help?tab=doa" className="hover:text-brand transition-colors">DOA 瘣駁?靽?</Link></li>
              <li><Link href="/help?tab=seller" className="hover:text-brand transition-colors">鞈?振銝??</Link></li>
              <li><Link href="/legal" className="hover:text-brand transition-colors">瘜??蝑?/Link></li>
            </ul>
          </div>

        </div>

        <div className="pt-8 border-t border-surface/50 text-center text-text-secondary text-sm flex flex-col md:flex-row justify-between items-center gap-4">
          <p>live.petpa.tw 2026 ?????/p>
          <div className="flex space-x-6">
            <Link href="/legal?tab=terms" className="hover:text-brand transition-colors">雿輻璇狡</Link>
            <Link href="/legal?tab=privacy" className="hover:text-brand transition-colors">?梁??輻?</Link>
            <Link href="/legal?tab=live" className="hover:text-brand transition-colors">瘣駁?鈭斗??</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
