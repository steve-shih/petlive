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
      className={`transition-all duration-1000 ease-out transform ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-12"
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
            <div className="text-6xl md:text-8xl mb-6 drop-shadow-2xl">??</div>
          </FadeIn>
          <FadeIn delay={200}>
            <h1 className="text-4xl md:text-7xl font-black mb-6 tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-brand via-yellow-400 to-orange-500">
              PetBar 撖湎AR
            </h1>
          </FadeIn>
          <FadeIn delay={400}>
            <p className="text-xl md:text-3xl font-bold text-text-secondary mb-4 drop-shadow-md">
              ?典擐?孵秘?湔蝡嗆?撟喳
            </p>
            <p className="text-base md:text-lg text-text-secondary/80 max-w-2xl mx-auto mb-12">
              撠??璆剛???閫?捱?喟絞蝷曄黎撟喳??撠???瘚??唳嚗?靘??芰??敹?撅蝛粹???            </p>
          </FadeIn>

          <FadeIn delay={800} className="mt-12">
            <div className="flex flex-col items-center text-text-secondary/60 animate-bounce">
              <span className="text-sm tracking-widest uppercase mb-2">???脣??Ｙ揣</span>
              <span className="text-2xl"></span>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* 2. Flow Section */}
      <section className="py-24 px-4 relative z-10 bg-surface/30">
        <div className="max-w-6xl mx-auto">
          <FadeIn>
            <h2 className="text-3xl md:text-5xl font-black text-center mb-16">
              ?郊頛?撅? <span className="text-brand">憟???</span>
            </h2>
          </FadeIn>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {[
              { icon: "?", title: "??", desc: "蝪∪敹恍酉?????撅祆?蜓?? },
              { icon: "?", title: "撠窄蝡嗆?", desc: "??擃???哨???????曉???孵秘?? },
              { icon: "??", title: "摰?蝪賜?", desc: "撠惇?祉??餃???嚗????嫣漱???具? },
              { icon: "??", title: "摰?啣?", desc: "摰???DOA 瘣駁?靽???憟瘚頂蝯晞? }
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
              <h2 className="text-3xl md:text-5xl font-black mb-6">?箔??豢???</h2>
              <p className="text-lg text-text-secondary">??喟絞蝷曄黎撟喳??蝔桐?靘輯??</p>
            </div>
          </FadeIn>

          <div className="flex flex-col md:flex-row gap-8">
            <FadeIn delay={200} className="flex-1">
              <div className="bg-red-500/10 border border-red-500/20 rounded-3xl p-8 h-full backdrop-blur-sm">
                <div className="flex items-center gap-3 mb-8">
                  <span className="text-4xl"></span>
                  <h3 className="text-2xl font-bold text-red-400">?喟絞蝷曄黎撟喳</h3>
                </div>
                <ul className="space-y-6">
                  {[
                    "蝬虜?⊿?霅血???剛?鞎潭?",
                    "瞍?瘜?瘚?閫詨??扔雿?,
                    "鞎瑁都??∠洵銝??靽?",
                    "閰??餃嚗撩銋祕??摨振隤?",
                    "蝟餌絞銝?湔暑擃漱???寞?
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-3 text-text-secondary">
                      <span className="mt-1 text-red-500/70 text-sm"></span>
                      <span className="text-lg">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </FadeIn>

            <FadeIn delay={400} className="flex-1">
              <div className="bg-gradient-to-b from-brand/20 to-surface border border-brand/30 rounded-3xl p-8 h-full shadow-[0_0_40px_rgba(245,166,35,0.1)] backdrop-blur-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10 text-8xl">??</div>
                <div className="flex items-center gap-3 mb-8 relative z-10">
                  <span className="text-4xl"></span>
                  <h3 className="text-2xl font-bold text-brand">PetBar 撖湎AR</h3>
                </div>
                <ul className="space-y-6 relative z-10">
                  {[
                    "摰????嚗???敹◤撠?",
                    "蝎暹??嚗撱箇雯?蝬脰楝蝣箔??湔瘚",
                    "?訾??祉?蝪賜?蝟餌絞嚗?閬???摰?",
                    "?湔鞈?振隤??眺摰嗡?霅瑟???,
                    "撠惇?孵秘? (憒??箏?閮?璈?"
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-3 text-white">
                      <span className="mt-1 text-brand text-sm"></span>
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
            <h2 className="text-4xl md:text-6xl font-black mb-8">皞?憟賡?憪???</h2>
            <p className="text-xl text-text-secondary mb-12">
              ??典?憭抒??孵秘鈭斗?摰?嚗?典停撅??函?憟?????            </p>
            <button
              onClick={handleEnter}
              className="group relative px-10 py-5 bg-brand text-white rounded-full font-black text-xl hover:bg-brand-hover hover:scale-105 transition-all duration-300 shadow-[0_0_30px_rgba(245,166,35,0.4)] overflow-hidden"
            >
              <div className="absolute inset-0 w-full h-full bg-white/20 -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]"></div>
              <span className="relative flex items-center gap-3">
                ?脣撖萇鈭斗? <span></span>
              </span>
            </button>
          </FadeIn>
        </div>
      </section>

      {/* CSS for button shimmer effect */}
      <style dangerouslySetInnerHTML={{
        __html: `
        @keyframes shimmer {
          100% { transform: translateX(100%); }
        }
      `}} />
    </div>
  );
}
