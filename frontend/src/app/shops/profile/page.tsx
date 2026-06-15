"use client";

import Link from 'next/link';
import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

function ShopProfileContent() {
  const searchParams = useSearchParams();
  const id = searchParams.get('id');
  const [shop, setShop] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    fetch(`http://localhost:8000/api/shops/${id}`)
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        setShop(data);
        setLoading(false);
      });
  }, [id]);

  if (!id) return <div style={{ color: '#fff', padding: '100px', textAlign: 'center' }}>無效的店家連結</div>;
  if (loading) return <div style={{ color: '#fff', padding: '100px', textAlign: 'center' }}>載入店家資料中...</div>;

  if (!shop) {
    return (
      <div className="container" style={{ paddingTop: '100px', textAlign: 'center' }}>
        <h2>找不到該店家</h2>
        <Link href="/" className="btn btn-primary" style={{ marginTop: '20px' }}>回首頁</Link>
      </div>
    );
  }

  return (
    <main style={{ paddingBottom: '100px' }}>
      <nav className="glass-nav" style={{ position: 'sticky', top: 0, width: '100%', zIndex: 50, padding: '16px 0' }}>
        <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Link href="/" style={{ fontSize: '1.2rem' }}>←</Link>
            <span style={{ fontSize: '1.25rem', fontWeight: 800 }}>{shop.name}</span>
          </div>
          {shop.is_live && (
            <Link href={`/live/room?id=live-001`} className="btn btn-primary" style={{ padding: '8px 16px', fontSize: '0.9rem' }}>
              🔴 正在直播中
            </Link>
          )}
        </div>
      </nav>

      <section className="container" style={{ marginTop: '40px' }}>
        <div className="glass-panel fade-in-up" style={{ padding: '40px', display: 'flex', gap: '30px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
          <div style={{ width: '120px', height: '120px', borderRadius: '50%', background: 'var(--glass-bg)', border: '2px solid var(--brand-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '4rem' }}>
            {shop.avatar}
          </div>
          <div style={{ flex: 1, minWidth: '300px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <h1 style={{ fontSize: '2rem', margin: 0 }}>{shop.name}</h1>
              <span style={{ background: 'rgba(16, 185, 129, 0.2)', color: 'var(--success)', border: '1px solid rgba(16, 185, 129, 0.3)', padding: '4px 12px', borderRadius: '999px', fontSize: '0.8rem', fontWeight: 700 }}>
                ✓ 合法認證店家
              </span>
            </div>
            <div style={{ color: 'var(--text-secondary)', marginBottom: '16px', fontFamily: 'monospace' }}>
              許可證字號：{shop.license_number}
            </div>
            <p style={{ lineHeight: 1.8 }}>
              {shop.description}
            </p>
          </div>
        </div>
      </section>

      <section className="container" style={{ marginTop: '60px' }}>
        <h2 style={{ fontSize: '1.5rem', marginBottom: '24px', borderBottom: '1px solid var(--glass-border)', paddingBottom: '12px' }}>
          環境與影片介紹
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
          {shop.media?.videos?.map((vid: string, idx: number) => (
            <div key={`vid-${idx}`} className="glass-panel animate-hover fade-in-up delay-100" style={{ overflow: 'hidden', height: '250px' }}>
              <video src={vid} controls style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
          ))}
          {shop.media?.photos?.map((img: string, idx: number) => (
            <div key={`img-${idx}`} className="glass-panel animate-hover fade-in-up delay-200" style={{ overflow: 'hidden', height: '250px' }}>
              <img src={img} alt="Shop environment" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
          ))}
        </div>
      </section>

      <section className="container" style={{ marginTop: '60px' }}>
        <h2 style={{ fontSize: '1.5rem', marginBottom: '24px', borderBottom: '1px solid var(--glass-border)', paddingBottom: '12px' }}>
          目前尋找家人的毛孩
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
          {shop.pets?.map((pet: any) => (
            <div key={pet.id} className="glass-panel animate-hover fade-in-up" style={{ padding: '24px', display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                <h3 style={{ fontSize: '1.3rem' }}>{pet.name}</h3>
                {pet.status === 'AVAILABLE' ? (
                  <span style={{ background: 'rgba(59, 130, 246, 0.2)', color: '#60a5fa', padding: '4px 10px', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 800 }}>開放預訂中</span>
                ) : (
                  <span style={{ background: 'rgba(239, 68, 68, 0.2)', color: 'var(--danger)', padding: '4px 10px', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 800 }}>已遭預訂</span>
                )}
              </div>
              
              <div style={{ background: 'rgba(0,0,0,0.2)', padding: '16px', borderRadius: '12px', marginBottom: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>總金額</span>
                  <span style={{ fontWeight: 600 }}>NT$ {pet.price?.toLocaleString()}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '8px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                  <span style={{ color: 'var(--brand-secondary)', fontWeight: 600 }}>保留訂金 (線上付)</span>
                  <span style={{ color: 'var(--brand-secondary)', fontWeight: 800, fontSize: '1.2rem' }}>NT$ {pet.deposit?.toLocaleString()}</span>
                </div>
              </div>

              <div style={{ marginTop: 'auto', display: 'flex', gap: '12px' }}>
                <button className="btn btn-primary" style={{ flex: 1 }} disabled={pet.status !== 'AVAILABLE'}>
                  {pet.status === 'AVAILABLE' ? '💰 支付訂金' : '暫不可售'}
                </button>
                <button className="btn btn-glass" style={{ flex: 1 }}>
                  📅 預約現場看
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

    </main>
  );
}

export default function ShopProfile() {
  return (
    <Suspense fallback={<div style={{ padding: '100px', textAlign: 'center' }}>載入中...</div>}>
      <ShopProfileContent />
    </Suspense>
  );
}
