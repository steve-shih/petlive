import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-surface border-t border-surface/50 py-12 mt-20 relative z-10">
      <div className="max-w-6xl mx-auto px-4 md:px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          
          <div className="col-span-1 md:col-span-2">
            <Link href="/" className="flex items-center space-x-2 text-2xl font-black text-brand mb-4">
              <span>🦎</span>
              <span>PetLive</span>
            </Link>
            <p className="text-text-secondary mb-4 leading-relaxed max-w-sm">
              全台首創活體競標與直購平台。我們提供最安全的交易環境、DOA活體保障機制，以及最即時的 WebRTC 直播與一對一視訊服務。
            </p>
            <div className="flex space-x-4">
              <a href="#" className="w-10 h-10 rounded-full bg-surface-hover flex items-center justify-center text-xl hover:bg-brand hover:text-white transition-colors">📱</a>
              <a href="#" className="w-10 h-10 rounded-full bg-surface-hover flex items-center justify-center text-xl hover:bg-brand hover:text-white transition-colors">📷</a>
              <a href="#" className="w-10 h-10 rounded-full bg-surface-hover flex items-center justify-center text-xl hover:bg-brand hover:text-white transition-colors">💬</a>
            </div>
          </div>

          <div>
            <h3 className="font-bold text-lg mb-4 text-white">了解更多</h3>
            <ul className="space-y-3 text-text-secondary">
              <li><Link href="/about" className="hover:text-brand transition-colors">關於我們</Link></li>
              <li><Link href="/about?tab=features" className="hover:text-brand transition-colors">平台特色</Link></li>
              <li><Link href="/about?tab=certification" className="hover:text-brand transition-colors">賣家認證制度</Link></li>
              <li><Link href="/live" className="hover:text-brand transition-colors">最新直播</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="font-bold text-lg mb-4 text-white">服務與幫助</h3>
            <ul className="space-y-3 text-text-secondary">
              <li><Link href="/help" className="hover:text-brand transition-colors">幫助中心</Link></li>
              <li><Link href="/help?tab=doa" className="hover:text-brand transition-colors">DOA 活體保障</Link></li>
              <li><Link href="/help?tab=seller" className="hover:text-brand transition-colors">賣家上架指南</Link></li>
              <li><Link href="/legal" className="hover:text-brand transition-colors">法律與政策</Link></li>
            </ul>
          </div>
          
        </div>
        
        <div className="pt-8 border-t border-surface/50 text-center text-text-secondary text-sm flex flex-col md:flex-row justify-between items-center gap-4">
          <p>© {new Date().getFullYear()} PetLive 活體生態館. All rights reserved.</p>
          <div className="flex space-x-6">
            <Link href="/legal?tab=terms" className="hover:text-brand transition-colors">使用條款</Link>
            <Link href="/legal?tab=privacy" className="hover:text-brand transition-colors">隱私政策</Link>
            <Link href="/legal?tab=live" className="hover:text-brand transition-colors">活體交易須知</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
