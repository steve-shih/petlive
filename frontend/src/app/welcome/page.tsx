"use client";

import React, { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

function useIntersectionObserver() {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(entry.target);
        }
      },
      { threshold: 0.15 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return { ref, isVisible };
}

function FadeIn({ children, delay = 0, className = "" }: { children: React.ReactNode, delay?: number, className?: string }) {
  const { ref, isVisible } = useIntersectionObserver();
  return (
    <div
      ref={ref}
      style={{ transitionDelay: `${delay}ms` }}
      className={`transition-all duration-1000 ease-out transform ${
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-12"
      } ${className}`}
    >
      {children}
    </div>
  );
}

export default function WelcomePage() {
  const router = useRouter();

  const handleEnter = () => {
    localStorage.setItem("has_seen_welcome", "true");
    router.push("/");
  };

  return (
    <div className="min-h-screen bg-background text-text-primary overflow-x-hidden font-sans">
      
      {/* 1. Hero Section */}
      <section className="relative h-screen flex flex-col items-center justify-center overflow-hidden">
        {/* Background gradient effects */}
        <div className="absolute inset-0 bg-gradient-to-br from-brand/20 via-background to-purple-900/20 z-0"></div>
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-brand/30 rounded-full mix-blend-screen filter blur-[100px] animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-600/20 rounded-full mix-blend-screen filter blur-[100px] animate-pulse delay-1000"></div>
        
        <div className="relative z-10 text-center px-4 max-w-4xl mx-auto flex flex-col items-center">
          <FadeIn>
            <div className="text-6xl md:text-8xl mb-6 drop-shadow-2xl">🦎</div>
          </FadeIn>
          <FadeIn delay={200}>
            <h1 className="text-4xl md:text-7xl font-black mb-6 tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-brand via-yellow-400 to-orange-500">
              PetBar 寵BAR
            </h1>
          </FadeIn>
          <FadeIn delay={400}>
            <p className="text-xl md:text-3xl font-bold text-text-secondary mb-4 drop-shadow-md">
              全台首創特寵直播競標平台
            </p>
            <p className="text-base md:text-lg text-text-secondary/80 max-w-2xl mx-auto mb-12">
              專為合法業者打造，解決傳統社群平台動輒封鎖、限流的困擾，提供最自由、安心的展售空間。
            </p>
          </FadeIn>
          
          <FadeIn delay={800} className="mt-12">
            <div className="flex flex-col items-center text-text-secondary/60 animate-bounce">
              <span className="text-sm tracking-widest uppercase mb-2">向下捲動探索</span>
              <span className="text-2xl">↓</span>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* 2. Flow Section */}
      <section className="py-24 px-4 relative z-10 bg-surface/30">
        <div className="max-w-6xl mx-auto">
          <FadeIn>
            <h2 className="text-3xl md:text-5xl font-black text-center mb-16">
              四步輕鬆展開 <span className="text-brand">奇妙旅程</span>
            </h2>
          </FadeIn>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {[
              { icon: "👤", title: "加入會員", desc: "簡單快速註冊，打造您的專屬收藏主頁。" },
              { icon: "📺", title: "尋寶競標", desc: "參與高互動直播，或在動態牆尋找心儀特寵。" },
              { icon: "🤝", title: "安心簽約", desc: "專屬公版電子合約，保障雙方交易安全。" },
              { icon: "🚚", title: "安全到府", desc: "完善的 DOA 活體保障與配套物流系統。" }
            ].map((step, idx) => (
              <FadeIn key={idx} delay={idx * 200}>
                <div className="bg-surface border border-surface/50 rounded-2xl p-8 h-full hover:border-brand/50 hover:-translate-y-2 transition-all duration-300 shadow-xl relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-brand/5 rounded-bl-full -z-10 group-hover:bg-brand/10 transition-colors"></div>
                  <div className="text-5xl mb-6 drop-shadow-lg">{step.icon}</div>
                  <h3 className="text-xl font-bold mb-3">{step.title}</h3>
                  <p className="text-text-secondary leading-relaxed">{step.desc}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* 3. Comparison Section (Pros & Cons) */}
      <section className="py-32 px-4 relative z-10">
        <div className="max-w-5xl mx-auto">
          <FadeIn>
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-5xl font-black mb-6">為何選擇我們？</h2>
              <p className="text-lg text-text-secondary">告別傳統社群平台的各種不便與限制</p>
            </div>
          </FadeIn>

          <div className="flex flex-col md:flex-row gap-8">
            <FadeIn delay={200} className="flex-1">
              <div className="bg-red-500/10 border border-red-500/20 rounded-3xl p-8 h-full backdrop-blur-sm">
                <div className="flex items-center gap-3 mb-8">
                  <span className="text-4xl">❌</span>
                  <h3 className="text-2xl font-bold text-red-400">傳統社群平台</h3>
                </div>
                <ul className="space-y-6">
                  {[
                    "經常無預警封鎖直播與貼文",
                    "演算法限流，觸及率極低",
                    "買賣雙方無第三方合約保障",
                    "詐騙頻傳，缺乏實名與店家認證",
                    "系統不支援活體交易的特性"
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-3 text-text-secondary">
                      <span className="mt-1 text-red-500/70 text-sm">✖</span>
                      <span className="text-lg">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </FadeIn>

            <FadeIn delay={400} className="flex-1">
              <div className="bg-gradient-to-b from-brand/20 to-surface border border-brand/30 rounded-3xl p-8 h-full shadow-[0_0_40px_rgba(245,166,35,0.1)] backdrop-blur-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10 text-8xl">👑</div>
                <div className="flex items-center gap-3 mb-8 relative z-10">
                  <span className="text-4xl">✅</span>
                  <h3 className="text-2xl font-bold text-brand">PetBar 寵BAR</h3>
                </div>
                <ul className="space-y-6 relative z-10">
                  {[
                    "完全合法合規，不再擔心被封禁",
                    "精準受眾，內建網狀網路確保直播流暢",
                    "數位公版簽約系統，法規保障最安心",
                    "嚴格賣家認證與買家保護機制",
                    "專屬特寵功能 (如：基因計算機)"
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-3 text-white">
                      <span className="mt-1 text-brand text-sm">✔</span>
                      <span className="text-lg font-medium">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* 4. Call to Action */}
      <section className="py-32 px-4 relative z-10 bg-gradient-to-t from-brand/10 to-transparent">
        <div className="max-w-3xl mx-auto text-center">
          <FadeIn>
            <h2 className="text-4xl md:text-6xl font-black mb-8">準備好開始了嗎？</h2>
            <p className="text-xl text-text-secondary mb-12">
              加入全台最大的特寵交流宇宙，現在就展開您的奇妙旅程。
            </p>
            <button
              onClick={handleEnter}
              className="group relative px-10 py-5 bg-brand text-white rounded-full font-black text-xl hover:bg-brand-hover hover:scale-105 transition-all duration-300 shadow-[0_0_30px_rgba(245,166,35,0.4)] overflow-hidden"
            >
              <div className="absolute inset-0 w-full h-full bg-white/20 -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]"></div>
              <span className="relative flex items-center gap-3">
                進入寵物交流 <span>➔</span>
              </span>
            </button>
          </FadeIn>
        </div>
      </section>

      {/* CSS for button shimmer effect */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes shimmer {
          100% { transform: translateX(100%); }
        }
      `}} />
    </div>
  );
}
