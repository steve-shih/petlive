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
    const userId = localStorage.getItem("petbar_current_user_id");
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
        showToast("閮剖?撌脣摮?, "success");
      } else {
        showToast("?脣?憭望?", "error");
      }
    } catch (err) {
      showToast("????航炊", "error");
    }
  };

  if (loading) return <div className="text-center py-20 text-brand animate-pulse">頛銝?..</div>;

  return (
    <div className="w-full max-w-3xl mx-auto px-4 py-8 space-y-8 animate-fade-in-up">
      <h1 className="text-3xl font-extrabold text-brand mb-6">撣唾?閮剖?</h1>

      {/* Profile Section */}
      <div className="bg-surface rounded-2xl p-6 shadow-sm border border-surface/50">
        <h2 className="text-xl font-bold mb-4">?犖鞈?</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-text-secondary mb-1">雿輻??蝔???</label>
            <input type="text" disabled value={user?.name || ""} className="w-full bg-background border border-surface/50 rounded-xl px-4 py-3 text-text-secondary opacity-70 cursor-not-allowed" />
            <p className="text-xs text-text-secondary mt-1">雿輻??蝔勗遣蝡??⊥?霈</p>
          </div>
          <div>
            <label className="block text-sm text-text-secondary mb-1">?芣?隞晶</label>
            <textarea 
              value={formData.bio}
              onChange={(e) => setFormData({...formData, bio: e.target.value})}
              className="w-full bg-background border border-surface focus:border-brand rounded-xl px-4 py-3 text-text-primary focus:outline-none transition-colors h-32"
              placeholder="蝪∪隞晶?芸楛..."
            />
          </div>
        </div>
      </div>

      {/* Contact & Security */}
      <div className="bg-surface rounded-2xl p-6 shadow-sm border border-surface/50">
        <h2 className="text-xl font-bold mb-4">?舐窗????/h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-surface/50 pb-4">
            <div>
              <div className="font-bold">Email</div>
              <div className="text-sm text-text-secondary">{formData.email} <span className="text-green-500 text-xs ml-2">??撌脤?霅?/span></div>
            </div>
          </div>
          <div className="flex items-center justify-between border-b border-surface/50 pb-4">
            <div className="flex-1 mr-4">
              <div className="font-bold">???Ⅳ</div>
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
              <div className="font-bold">撖Ⅳ</div>
              <div className="text-sm text-text-secondary">摰??湔撖Ⅳ隞乩??董????/div>
            </div>
            <button className="text-brand font-bold hover:underline">靽格撖Ⅳ</button>
          </div>
        </div>
      </div>

      {/* Address Book */}
      <div className="bg-surface rounded-2xl p-6 shadow-sm border border-surface/50">
        <h2 className="text-xl font-bold mb-4">?嗡辣?啣?蝪?/h2>
        <p className="text-sm text-text-secondary mb-4">?憭?5 蝑?蝯阡?鞎??蝙??/p>
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
              placeholder={`?啣? ${index + 1}`}
              className="w-full bg-background border border-surface focus:border-brand rounded-xl px-4 py-2 text-text-primary focus:outline-none"
            />
          ))}
        </div>
      </div>

      {/* Logistics Preferences */}
      <div className="bg-surface rounded-2xl p-6 shadow-sm border border-surface/50">
        <h2 className="text-xl font-bold mb-4">撣貊?撣?/ 蝡?</h2>
        <div className="space-y-6">
          <div>
            <label className="block font-bold mb-2">撣貊 7-11 ?疏?撣?/label>
            <input 
              type="text"
              value={formData.sevenElevenStore}
              onChange={(e) => setFormData({...formData, sevenElevenStore: e.target.value})}
              placeholder="摨?????
              className="w-full bg-background border border-surface focus:border-brand rounded-xl px-4 py-3 text-text-primary focus:outline-none"
            />
          </div>
          <div>
            <label className="block font-bold mb-2">撣貊蝛箄?銝??暺?/label>
            <select 
              value={formData.airForceOneStation}
              onChange={(e) => setFormData({...formData, airForceOneStation: e.target.value})}
              className="w-full bg-background border border-surface focus:border-brand rounded-xl px-4 py-3 text-text-primary focus:outline-none"
            >
              <option value="">-- ?芾身摰?--</option>
              <option value="TPE">?啣?蝡?/option>
              <option value="TXG">?唬葉蝡?/option>
              <option value="KHH">擃?蝡?/option>
            </select>
          </div>
        </div>
      </div>

      <div className="flex justify-end space-x-4 sticky bottom-4 z-10">
        <button className="px-6 py-3 rounded-xl font-bold text-text-secondary bg-surface hover:bg-surface-hover transition-colors shadow-lg">??</button>
        <button onClick={handleSave} className="px-8 py-3 rounded-xl font-bold text-white bg-brand hover:opacity-90 transition-colors shadow-lg">?脣?霈</button>
      </div>

      {/* Danger Zone */}
      <div className="border border-red-500/50 rounded-2xl p-6 mt-12 bg-red-500/5">
        <h2 className="text-red-500 font-bold mb-2">?梢??</h2>
        <p className="text-sm text-text-secondary mb-4">閮駁撣唾?敺??函??犖鞈?撠◤瘞訾?皜嚗?鈭斗?蝝??靽??迨???⊥?敺拙???/p>
        <button className="bg-red-500 text-white font-bold px-4 py-2 rounded-lg hover:bg-red-600 transition-colors text-sm">
          閮駁撣唾?
        </button>
      </div>
    </div>
  );
}
