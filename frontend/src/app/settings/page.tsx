"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "../components/Toast";

export default function SettingsPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [formData, setFormData] = useState({
    bio: "",
    phone: "",
    email: "",
    addressBook: ["", "", "", "", ""],
    sevenElevenStore: "",
    airForceOneStation: "",
    notifications: true
  });

  useEffect(() => {
    const userId = localStorage.getItem("petlive_current_user_id");
    if (!userId) {
      router.push("/login");
      return;
    }

    const fetchSettings = async () => {
      try {
        const res = await fetch(`http://127.0.0.1:5000/api/user/${userId}/settings`);
        if (res.ok) {
          const data = await res.json();
          // also get user base info
          const userRes = await fetch(`http://127.0.0.1:5000/api/users/${userId}`);
          const userData = await userRes.json();
          setUser(userData);
          
          setFormData({
            bio: data.bio || "",
            phone: data.phone || "",
            email: userData.email || "",
            addressBook: data.addressBook || ["", "", "", "", ""],
            sevenElevenStore: data.sevenElevenStore || "",
            airForceOneStation: data.airForceOneStation || "",
            notifications: data.notifications ?? true
          });
        }
      } catch (err) {
        console.error("Failed to load settings");
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, [router]);

  const handleSave = async () => {
    try {
      const res = await fetch(`http://127.0.0.1:5000/api/user/${user.id}/settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        showToast("設定已儲存", "success");
      } else {
        showToast("儲存失敗", "error");
      }
    } catch (err) {
      showToast("連線錯誤", "error");
    }
  };

  if (loading) return <div className="text-center py-20 text-brand animate-pulse">載入中...</div>;

  return (
    <div className="w-full max-w-3xl mx-auto px-4 py-8 space-y-8 animate-fade-in-up">
      <h1 className="text-3xl font-extrabold text-brand mb-6">帳號設定</h1>

      {/* Profile Section */}
      <div className="bg-surface rounded-2xl p-6 shadow-sm border border-surface/50">
        <h2 className="text-xl font-bold mb-4">個人資料</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-text-secondary mb-1">使用者名稱 🔒</label>
            <input type="text" disabled value={user?.name || ""} className="w-full bg-background border border-surface/50 rounded-xl px-4 py-3 text-text-secondary opacity-70 cursor-not-allowed" />
            <p className="text-xs text-text-secondary mt-1">使用者名稱建立後無法變更</p>
          </div>
          <div>
            <label className="block text-sm text-text-secondary mb-1">自我介紹</label>
            <textarea 
              value={formData.bio}
              onChange={(e) => setFormData({...formData, bio: e.target.value})}
              className="w-full bg-background border border-surface focus:border-brand rounded-xl px-4 py-3 text-text-primary focus:outline-none transition-colors h-32"
              placeholder="簡單介紹自己..."
            />
          </div>
        </div>
      </div>

      {/* Contact & Security */}
      <div className="bg-surface rounded-2xl p-6 shadow-sm border border-surface/50">
        <h2 className="text-xl font-bold mb-4">聯絡與安全</h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-surface/50 pb-4">
            <div>
              <div className="font-bold">Email</div>
              <div className="text-sm text-text-secondary">{formData.email} <span className="text-green-500 text-xs ml-2">✓ 已驗證</span></div>
            </div>
          </div>
          <div className="flex items-center justify-between border-b border-surface/50 pb-4">
            <div className="flex-1 mr-4">
              <div className="font-bold">手機號碼</div>
              <input 
                type="text" 
                value={formData.phone}
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
                placeholder="+886-xxx-xxx"
                className="w-full bg-background border border-surface focus:border-brand rounded-xl px-4 py-2 mt-2 text-text-primary focus:outline-none"
              />
            </div>
          </div>
          <div className="flex items-center justify-between pt-2">
            <div>
              <div className="font-bold">密碼</div>
              <div className="text-sm text-text-secondary">定期更新密碼以保障帳號安全</div>
            </div>
            <button className="text-brand font-bold hover:underline">修改密碼</button>
          </div>
        </div>
      </div>

      {/* Address Book */}
      <div className="bg-surface rounded-2xl p-6 shadow-sm border border-surface/50">
        <h2 className="text-xl font-bold mb-4">收件地址簿</h2>
        <p className="text-sm text-text-secondary mb-4">最多 5 筆，給黑貓宅配使用</p>
        <div className="space-y-3">
          {formData.addressBook.map((addr, index) => (
            <input 
              key={index}
              type="text"
              value={addr}
              onChange={(e) => {
                const newBook = [...formData.addressBook];
                newBook[index] = e.target.value;
                setFormData({...formData, addressBook: newBook});
              }}
              placeholder={`地址 ${index + 1}`}
              className="w-full bg-background border border-surface focus:border-brand rounded-xl px-4 py-2 text-text-primary focus:outline-none"
            />
          ))}
        </div>
      </div>

      {/* Logistics Preferences */}
      <div className="bg-surface rounded-2xl p-6 shadow-sm border border-surface/50">
        <h2 className="text-xl font-bold mb-4">常用門市 / 站點</h2>
        <div className="space-y-6">
          <div>
            <label className="block font-bold mb-2">常用 7-11 取貨門市</label>
            <input 
              type="text"
              value={formData.sevenElevenStore}
              onChange={(e) => setFormData({...formData, sevenElevenStore: e.target.value})}
              placeholder="店號或店名"
              className="w-full bg-background border border-surface focus:border-brand rounded-xl px-4 py-3 text-text-primary focus:outline-none"
            />
          </div>
          <div>
            <label className="block font-bold mb-2">常用空軍一號站點</label>
            <select 
              value={formData.airForceOneStation}
              onChange={(e) => setFormData({...formData, airForceOneStation: e.target.value})}
              className="w-full bg-background border border-surface focus:border-brand rounded-xl px-4 py-3 text-text-primary focus:outline-none"
            >
              <option value="">-- 未設定 --</option>
              <option value="TPE">台北站</option>
              <option value="TXG">台中站</option>
              <option value="KHH">高雄站</option>
            </select>
          </div>
        </div>
      </div>

      <div className="flex justify-end space-x-4 sticky bottom-4 z-10">
        <button className="px-6 py-3 rounded-xl font-bold text-text-secondary bg-surface hover:bg-surface-hover transition-colors shadow-lg">取消</button>
        <button onClick={handleSave} className="px-8 py-3 rounded-xl font-bold text-white bg-brand hover:opacity-90 transition-colors shadow-lg">儲存變更</button>
      </div>

      {/* Danger Zone */}
      <div className="border border-red-500/50 rounded-2xl p-6 mt-12 bg-red-500/5">
        <h2 className="text-red-500 font-bold mb-2">危險操作</h2>
        <p className="text-sm text-text-secondary mb-4">註銷帳號後，您的個人資料將被永久清除，但交易紀錄會保留。此操作無法復原。</p>
        <button className="bg-red-500 text-white font-bold px-4 py-2 rounded-lg hover:bg-red-600 transition-colors text-sm">
          註銷帳號
        </button>
      </div>
    </div>
  );
}
