"use client";

import Image from "next/image";
import Link from "next/link";
import { useUserStore } from "@/store/userStore";

export default function Home() {
  const user = useUserStore(state => state.user);
  const logout = useUserStore(state => state.logout);
  return (
    <main className="min-h-screen">
      {/* Navigation */}
      <nav className="glass-nav" style={{ position: 'fixed', top: 0, width: '100%', zIndex: 50, padding: '16px 0' }}>
        <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--brand-primary)' }}>
            🐾 寵霸 PetLive
          </div>
          <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
            <Link href="/shops" className="btn btn-glass" style={{ border: 'none' }}>
              探索店家
            </Link>
            
            {user ? (
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                {user.role === 'SELLER' && (
                  <>
                    <Link href="/seller/dashboard" className="btn btn-glass" style={{ padding: '8px 16px', fontSize: '0.9rem' }}>
                      ⚙️ 店鋪後台
                    </Link>
                    <Link href="/live/host" className="btn btn-primary" style={{ animation: 'pulse 2s infinite', padding: '8px 16px', fontSize: '0.9rem' }}>
                      🔴 開播大廳
                    </Link>
                  </>
                )}
                <div style={{ padding: '8px 16px', background: 'rgba(255,255,255,0.1)', borderRadius: '999px', fontSize: '0.9rem' }}>
                  {user.name} ({user.role === 'SELLER' ? '賣家' : '買家'})
                </div>
                <button onClick={logout} className="btn btn-glass" style={{ padding: '8px 16px', fontSize: '0.9rem' }}>登出</button>
              </div>
            ) : (
              <Link href="/login" className="btn btn-primary">
                登入 / 註冊
              </Link>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="container" style={{ paddingTop: '140px', paddingBottom: '80px', textAlign: 'center' }}>
        <div className="fade-in-up">
          <div style={{ 
            display: 'inline-flex', 
            alignItems: 'center', 
            gap: '8px',
            padding: '8px 16px',
            background: 'rgba(249, 115, 22, 0.1)',
            border: '1px solid rgba(249, 115, 22, 0.2)',
            borderRadius: '999px',
            color: 'var(--brand-secondary)',
            fontWeight: 700,
            fontSize: '0.875rem',
            marginBottom: '24px'
          }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--brand-primary)', boxShadow: '0 0 10px var(--brand-primary)' }}></span>
            合法店家專屬 ． 實名安全認證
          </div>
          
          <h1 style={{ fontSize: 'clamp(2.5rem, 6vw, 4.5rem)', marginBottom: '24px' }}>
            看直播，找毛孩<br/>
            <span className="text-gradient">最有保障的活體交易平台</span>
          </h1>
          
          <p style={{ 
            fontSize: '1.125rem', 
            color: 'var(--text-secondary)', 
            maxWidth: '600px', 
            margin: '0 auto 40px',
            lineHeight: 1.8
          }}>
            告別黑箱審查與惡意下架。專為合法貓舍、犬舍與特寵業者打造，
            支援網頁直接觀看，也提供更流暢的手機原生 App 下載。
          </p>
          
          <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button className="btn btn-primary" style={{ padding: '16px 32px', fontSize: '1.1rem' }}>
              網頁版直接看直播
            </button>
            <a href="#download-section" className="btn btn-glass" style={{ padding: '16px 32px', fontSize: '1.1rem' }}>
              📱 下載手機 App
            </a>
          </div>
        </div>
      </section>

      {/* App Download Section */}
      <section id="download-section" className="container" style={{ paddingBottom: '100px' }}>
        <div className="glass-panel fade-in-up delay-100" style={{ padding: '50px', background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.7) 0%, rgba(249, 115, 22, 0.1) 100%)' }}>
          <div style={{ textAlign: 'center', marginBottom: '40px' }}>
            <h2 style={{ fontSize: '2.5rem', marginBottom: '16px' }}>雙平台 App 正式上線</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem' }}>不管您是找家人的買家，還是經營寵物店的業者，都能享受最極致的流暢體驗</p>
          </div>
          
          <div style={{ display: 'flex', gap: '30px', flexWrap: 'wrap' }}>
            {/* Buyer App */}
            <div style={{ flex: 1, minWidth: '300px', background: 'rgba(0,0,0,0.3)', padding: '30px', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.05)' }}>
              <div style={{ fontSize: '3rem', marginBottom: '10px' }}>🐾</div>
              <h3 style={{ fontSize: '1.5rem', marginBottom: '10px' }}>買家端 App (找毛孩)</h3>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>上下滑動沉浸式看直播、一鍵付訂金預約，把未來的家人帶回家。</p>
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                <button className="btn btn-glass" style={{ flex: 1, minWidth: '140px' }}>🍏 Apple iOS</button>
                <a href="/petlive-app.apk" download className="btn btn-glass" style={{ flex: 1, minWidth: '140px', textAlign: 'center' }}>🤖 Android APK</a>
              </div>
            </div>
            
            {/* Seller App */}
            <div style={{ flex: 1, minWidth: '300px', background: 'rgba(249, 115, 22, 0.1)', padding: '30px', borderRadius: '20px', border: '1px solid rgba(249, 115, 22, 0.2)' }}>
              <div style={{ fontSize: '3rem', marginBottom: '10px' }}>💼</div>
              <h3 style={{ fontSize: '1.5rem', marginBottom: '10px', color: 'var(--brand-secondary)' }}>業者端 App (PetLive Pro)</h3>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>合法店家專用！一鍵呼叫手機超高畫質相機開播、即時核對觀眾聯絡身分。</p>
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                <button className="btn btn-primary" style={{ flex: 1, minWidth: '140px' }}>🍏 Apple iOS</button>
                <a href="/petlive-app.apk" download className="btn btn-primary" style={{ flex: 1, minWidth: '140px', textAlign: 'center' }}>🤖 Android APK</a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Grid / Live Preview */}
      <section className="container" style={{ paddingBottom: '100px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
          
          {/* Card 1 */}
          <div className="glass-panel animate-hover fade-in-up delay-100" style={{ padding: '32px' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '16px' }}>🎥</div>
            <h3 style={{ fontSize: '1.5rem', marginBottom: '12px' }}>會員限定直播</h3>
            <p style={{ color: 'var(--text-secondary)' }}>
              登入後方可觀看。店家透過直播介紹寵物、飼養知識與互動，
              即時核對身分，杜絕惡意亂入與無端檢舉。
            </p>
          </div>

          {/* Card 2 */}
          <div className="glass-panel animate-hover fade-in-up delay-200" style={{ padding: '32px' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '16px' }}>🛡️</div>
            <h3 style={{ fontSize: '1.5rem', marginBottom: '12px' }}>雙軌交易保障</h3>
            <p style={{ color: 'var(--text-secondary)' }}>
              用品全額線上結帳；活體交易僅支援「付訂金」，
              尾款依現場或雙方約定辦理，平台絕不強扣高額活體手續費。
            </p>
          </div>

          {/* Card 3 */}
          <div className="glass-panel animate-hover fade-in-up delay-300" style={{ padding: '32px' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '16px' }}>📅</div>
            <h3 style={{ fontSize: '1.5rem', marginBottom: '12px' }}>預約現場看</h3>
            <p style={{ color: 'var(--text-secondary)' }}>
              直播中看到心儀的毛孩？直接點擊預約！
              店家後台自訂時段、名額，線下實體面交最安心。
            </p>
          </div>

        </div>
      </section>

      {/* Mockup Preview Area */}
      <section className="container" style={{ paddingBottom: '120px' }}>
        <div className="glass-panel fade-in-up delay-300" style={{ padding: '60px 40px', textAlign: 'center', background: 'linear-gradient(to bottom right, rgba(30, 41, 59, 0.8), rgba(15, 23, 42, 0.9))' }}>
          <h2 style={{ fontSize: '2rem', marginBottom: '20px' }}>為手機瀏覽器而生</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '40px', maxWidth: '500px', margin: '0 auto 40px' }}>
            顧客完全不需下載 App！流暢的 Mobile-Web 體驗，
            不論是看直播、付訂金還是逛商鋪，隨點隨看。
          </p>
          <button className="btn btn-primary" style={{ padding: '12px 24px' }}>
            體驗商鋪預覽介面 →
          </button>
        </div>
      </section>

    </main>
  );
}
