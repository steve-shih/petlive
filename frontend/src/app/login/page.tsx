"use client";

import { useUserStore } from '@/store/userStore';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function Login() {
  const login = useUserStore(state => state.login);
  const router = useRouter();

  const handleMockLogin = (role: 'BUYER' | 'SELLER') => {
    if (role === 'BUYER') {
      login('user-buyer-1', '王大明', 'BUYER');
      router.push('/');
    } else {
      login('user-seller-1', '極光英國短毛貓舍', 'SELLER');
      router.push('/live/host');
    }
  };

  return (
    <main className="min-h-screen" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      
      {/* Background decoration */}
      <div style={{ position: 'fixed', top: '-10%', left: '-10%', width: '50vw', height: '50vw', background: 'radial-gradient(circle, rgba(249, 115, 22, 0.2) 0%, rgba(0,0,0,0) 70%)', zIndex: -1 }}></div>
      <div style={{ position: 'fixed', bottom: '-10%', right: '-10%', width: '50vw', height: '50vw', background: 'radial-gradient(circle, rgba(59, 130, 246, 0.2) 0%, rgba(0,0,0,0) 70%)', zIndex: -1 }}></div>

      <div className="glass-panel fade-in-up" style={{ padding: '40px', maxWidth: '400px', width: '100%', textAlign: 'center' }}>
        <div style={{ fontSize: '3rem', marginBottom: '16px' }}>🐾</div>
        <h1 style={{ fontSize: '1.8rem', marginBottom: '8px' }}>歡迎來到寵霸</h1>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '40px' }}>請選擇您的登入身分進行測試</p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <button 
            onClick={() => handleMockLogin('BUYER')}
            className="btn btn-glass animate-hover" 
            style={{ padding: '16px', fontSize: '1.1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px' }}
          >
            🙋🏻‍♂️ 買家登入 (找毛孩)
          </button>
          
          <button 
            onClick={() => handleMockLogin('SELLER')}
            className="btn btn-primary animate-hover" 
            style={{ padding: '16px', fontSize: '1.1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px' }}
          >
            🏪 賣家登入 (開播/店鋪)
          </button>
        </div>

        <div style={{ marginTop: '32px', borderTop: '1px solid var(--glass-border)', paddingTop: '20px' }}>
          <Link href="/" style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', textDecoration: 'underline' }}>
            返回首頁
          </Link>
        </div>
      </div>
    </main>
  );
}
