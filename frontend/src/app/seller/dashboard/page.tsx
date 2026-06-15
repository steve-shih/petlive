"use client";

import { useEffect, useState, useRef } from "react";
import { useUserStore } from "@/store/userStore";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function SellerDashboard() {
  const user = useUserStore((state) => state.user);
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'PROFILE' | 'INVENTORY'>('PROFILE');
  
  // Mock Form States for Profile
  const [shopName, setShopName] = useState(user?.name || "極光英國短毛貓舍");
  const [license, setLicense] = useState("特寵業字第1120000號");
  const [address, setAddress] = useState("台北市大安區和平東路一段");
  const [description, setDescription] = useState("我們是一家專注於培育健康、親人英國短毛貓的貓舍。");
  const [saving, setSaving] = useState(false);

  // Mock Form States for Inventory
  const [pets, setPets] = useState([
    { id: 1, name: "兩個月大布偶貓弟弟", price: 35000, deposit: 5000, status: "AVAILABLE", preview: "" }
  ]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newPet, setNewPet] = useState({ name: "", price: "", deposit: "", status: "AVAILABLE" });
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!user || user.role !== "SELLER") {
      router.push("/login");
    }
  }, [user, router]);

  if (!user || user.role !== "SELLER") return null;

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      alert("資料已成功儲存！(模擬)");
    }, 1000);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const urls = Array.from(e.target.files).map(file => URL.createObjectURL(file));
      setPreviewUrls(prev => [...prev, ...urls]);
    }
  };

  const handleAddPet = (e: React.FormEvent) => {
    e.preventDefault();
    const pet = {
      id: Date.now(),
      name: newPet.name,
      price: parseInt(newPet.price) || 0,
      deposit: parseInt(newPet.deposit) || 0,
      status: newPet.status,
      preview: previewUrls[0] || ""
    };
    setPets([pet, ...pets]);
    setShowAddForm(false);
    setNewPet({ name: "", price: "", deposit: "", status: "AVAILABLE" });
    setPreviewUrls([]);
  };

  return (
    <main className="min-h-screen" style={{ paddingBottom: '100px' }}>
      {/* Header */}
      <nav className="glass-nav" style={{ position: 'sticky', top: 0, zIndex: 50, padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Link href="/" style={{ fontSize: '1.2rem' }}>←</Link>
          <span style={{ fontWeight: 800, fontSize: '1.2rem' }}>⚙️ 店鋪管理後台</span>
        </div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <Link href="/live/host" className="btn btn-primary" style={{ padding: '6px 12px', fontSize: '0.9rem' }}>
            前往開播 →
          </Link>
        </div>
      </nav>

      <div className="container" style={{ marginTop: '40px', display: 'flex', gap: '40px', flexWrap: 'wrap', alignItems: 'flex-start' }}>
        
        {/* Left Sidebar Tabs */}
        <div className="glass-panel" style={{ width: '250px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px', flexShrink: 0 }}>
          <button 
            onClick={() => setActiveTab('PROFILE')}
            className={`btn ${activeTab === 'PROFILE' ? 'btn-primary' : 'btn-glass'}`} 
            style={{ textAlign: 'left', padding: '12px 16px', border: activeTab === 'PROFILE' ? 'none' : '' }}
          >
            🏪 店鋪基本資料
          </button>
          <button 
            onClick={() => setActiveTab('INVENTORY')}
            className={`btn ${activeTab === 'INVENTORY' ? 'btn-primary' : 'btn-glass'}`} 
            style={{ textAlign: 'left', padding: '12px 16px', border: activeTab === 'INVENTORY' ? 'none' : '' }}
          >
            🐾 毛孩上架管理
          </button>
        </div>

        {/* Right Content Area */}
        <div style={{ flex: 1, minWidth: '300px' }}>
          
          {/* ================= PROFILE TAB ================= */}
          {activeTab === 'PROFILE' && (
            <div className="glass-panel fade-in-up" style={{ padding: '40px' }}>
              <h2 style={{ fontSize: '1.8rem', marginBottom: '32px', borderBottom: '1px solid var(--glass-border)', paddingBottom: '16px' }}>店鋪對外展示資料</h2>
              <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{ color: 'var(--text-secondary)' }}>店鋪名稱</label>
                  <input type="text" value={shopName} onChange={e => setShopName(e.target.value)} required
                    style={{ padding: '12px 16px', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'rgba(0,0,0,0.3)', color: '#fff', fontSize: '1rem', outline: 'none' }} />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{ color: 'var(--text-secondary)' }}>特定寵物業許可證字號 <span style={{color: 'var(--danger)'}}>*必填並強制公開</span></label>
                  <input type="text" value={license} onChange={e => setLicense(e.target.value)} required
                    style={{ padding: '12px 16px', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'rgba(0,0,0,0.3)', color: '#fff', fontSize: '1rem', outline: 'none' }} />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{ color: 'var(--text-secondary)' }}>聯絡地址</label>
                  <input type="text" value={address} onChange={e => setAddress(e.target.value)}
                    style={{ padding: '12px 16px', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'rgba(0,0,0,0.3)', color: '#fff', fontSize: '1rem', outline: 'none' }} />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{ color: 'var(--text-secondary)' }}>關於我們 / 環境介紹</label>
                  <textarea value={description} onChange={e => setDescription(e.target.value)} rows={4}
                    style={{ padding: '12px 16px', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'rgba(0,0,0,0.3)', color: '#fff', fontSize: '1rem', outline: 'none', resize: 'vertical' }} />
                </div>

                <div style={{ marginTop: '16px' }}>
                  <button type="submit" className="btn btn-primary animate-hover" style={{ padding: '12px 32px', fontSize: '1.1rem' }} disabled={saving}>
                    {saving ? '儲存中...' : '💾 儲存變更'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* ================= INVENTORY TAB ================= */}
          {activeTab === 'INVENTORY' && (
            <div className="fade-in-up">
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <h2 style={{ fontSize: '1.8rem' }}>毛孩展示與上架列表</h2>
                <button onClick={() => setShowAddForm(!showAddForm)} className="btn btn-primary" style={{ padding: '8px 16px' }}>
                  {showAddForm ? '取消新增' : '➕ 新增毛孩'}
                </button>
              </div>

              {/* Add Form Overlay / Panel */}
              {showAddForm && (
                <div className="glass-panel slide-down" style={{ padding: '32px', marginBottom: '32px', border: '1px solid var(--brand-primary)' }}>
                  <h3 style={{ fontSize: '1.3rem', marginBottom: '20px', color: 'var(--brand-primary)' }}>上架新成員</h3>
                  <form onSubmit={handleAddPet} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    
                    <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
                      <div style={{ flex: 1, minWidth: '200px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <label style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>名稱標題</label>
                        <input type="text" placeholder="例：兩個月大純白布偶貓" value={newPet.name} onChange={e => setNewPet({...newPet, name: e.target.value})} required
                          style={{ padding: '10px', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'rgba(0,0,0,0.3)', color: '#fff', outline: 'none' }} />
                      </div>
                      <div style={{ flex: 1, minWidth: '200px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <label style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>總售價 (NT$)</label>
                        <input type="number" placeholder="0" value={newPet.price} onChange={e => setNewPet({...newPet, price: e.target.value})} required
                          style={{ padding: '10px', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'rgba(0,0,0,0.3)', color: '#fff', outline: 'none' }} />
                      </div>
                      <div style={{ flex: 1, minWidth: '200px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <label style={{ color: 'var(--brand-secondary)', fontSize: '0.9rem', fontWeight: 600 }}>線上訂金 (NT$)</label>
                        <input type="number" placeholder="0" value={newPet.deposit} onChange={e => setNewPet({...newPet, deposit: e.target.value})} required
                          style={{ padding: '10px', borderRadius: '8px', border: '1px solid rgba(249, 115, 22, 0.4)', background: 'rgba(0,0,0,0.3)', color: '#fff', outline: 'none' }} />
                      </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '10px' }}>
                      <label style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>上傳照片與影片 (本地預覽測試)</label>
                      <div 
                        onClick={() => fileInputRef.current?.click()}
                        style={{ padding: '40px', border: '2px dashed var(--glass-border)', borderRadius: '12px', textAlign: 'center', cursor: 'pointer', background: 'rgba(255,255,255,0.02)' }}
                      >
                        <span style={{ fontSize: '2rem' }}>📁</span>
                        <p style={{ marginTop: '10px', color: 'var(--text-secondary)' }}>點擊選擇圖片或影片檔案 (支援複選)</p>
                        <input type="file" ref={fileInputRef} multiple accept="image/*,video/*" style={{ display: 'none' }} onChange={handleFileChange} />
                      </div>
                      
                      {/* Preview Gallery */}
                      {previewUrls.length > 0 && (
                        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginTop: '16px' }}>
                          {previewUrls.map((url, i) => (
                            <div key={i} style={{ width: '80px', height: '80px', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--glass-border)' }}>
                              {/* 這裡簡單用 img 標籤預覽，如果是影片會無法播放，但在 MVP 階段足以展示概念 */}
                              <img src={url} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'flex-end' }}>
                      <button type="submit" className="btn btn-primary" style={{ padding: '10px 24px' }}>
                        ✅ 確認上架
                      </button>
                    </div>

                  </form>
                </div>
              )}

              {/* Items List */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {pets.map(pet => (
                  <div key={pet.id} className="glass-panel" style={{ padding: '20px', display: 'flex', gap: '20px', alignItems: 'center' }}>
                    <div style={{ width: '100px', height: '100px', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', overflow: 'hidden', flexShrink: 0 }}>
                      {pet.preview ? (
                        <img src={pet.preview} alt={pet.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem' }}>🐾</div>
                      )}
                    </div>
                    
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <h3 style={{ fontSize: '1.2rem', margin: 0 }}>{pet.name}</h3>
                        <span style={{ background: pet.status === 'AVAILABLE' ? 'rgba(59, 130, 246, 0.2)' : 'rgba(239, 68, 68, 0.2)', color: pet.status === 'AVAILABLE' ? '#60a5fa' : 'var(--danger)', padding: '4px 10px', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 800 }}>
                          {pet.status === 'AVAILABLE' ? '開放預訂中' : '已遭預訂'}
                        </span>
                      </div>
                      <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '4px' }}>總售價：NT$ {pet.price.toLocaleString()}</div>
                      <div style={{ color: 'var(--brand-secondary)', fontSize: '0.9rem', fontWeight: 600 }}>保留訂金：NT$ {pet.deposit.toLocaleString()}</div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <button className="btn btn-glass" style={{ padding: '6px 12px', fontSize: '0.85rem' }}>編輯</button>
                      <button className="btn btn-glass" style={{ padding: '6px 12px', fontSize: '0.85rem', color: 'var(--danger)' }}>下架</button>
                    </div>
                  </div>
                ))}
                {pets.length === 0 && (
                  <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
                    目前尚無上架的毛孩
                  </div>
                )}
              </div>

            </div>
          )}

        </div>
      </div>
    </main>
  );
}
