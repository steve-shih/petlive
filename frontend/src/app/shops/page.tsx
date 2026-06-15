import Link from 'next/link';

// Fetch mock shops from FastAPI
async function getShops() {
  try {
    const res = await fetch(`http://localhost:8000/api/shops`, { cache: 'no-store' });
    if (!res.ok) return [];
    return res.json();
  } catch (e) {
    return [];
  }
}

export default async function ShopsList() {
  const shops = await getShops();

  return (
    <main style={{ minHeight: '100vh', paddingBottom: '100px' }}>
      {/* Navigation */}
      <nav className="glass-nav" style={{ position: 'sticky', top: 0, width: '100%', zIndex: 50, padding: '16px 0' }}>
        <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Link href="/" style={{ fontSize: '1.2rem' }}>←</Link>
            <span style={{ fontSize: '1.25rem', fontWeight: 800 }}>探索合法店家</span>
          </div>
        </div>
      </nav>

      <section className="container" style={{ paddingTop: '40px' }}>
        
        {shops.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px' }}>
            <p style={{ color: 'var(--text-secondary)' }}>目前沒有可用的店家資料 (請確認後端是否啟動)</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '24px' }}>
            {shops.map((shop: any) => (
              <Link href={`/shops/profile?id=${shop.id}`} key={shop.id}>
                <div className="glass-panel animate-hover" style={{ padding: '24px', display: 'flex', flexDirection: 'column', height: '100%', cursor: 'pointer' }}>
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
                    <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem' }}>
                      {shop.avatar}
                    </div>
                    {shop.is_live && (
                      <span style={{ background: 'var(--danger)', color: '#fff', padding: '4px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 800, animation: 'pulse 2s infinite' }}>
                        LIVE
                      </span>
                    )}
                  </div>
                  
                  <h3 style={{ fontSize: '1.3rem', marginBottom: '8px' }}>{shop.name}</h3>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontFamily: 'monospace', marginBottom: '16px' }}>
                    證號: {shop.license}
                  </div>
                  
                  <div style={{ marginTop: 'auto' }}>
                    <div style={{ color: 'var(--brand-secondary)', fontSize: '0.9rem', fontWeight: 600 }}>
                      進入商鋪查看毛孩 →
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

    </main>
  );
}
