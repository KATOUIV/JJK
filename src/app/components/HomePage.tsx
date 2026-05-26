import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { User, Sword, RotateCcw, Settings, ChevronRight } from "lucide-react";
import type { AppView } from "../types";

const RUNES = ["咒", "術", "廻", "戦", "呪", "霊", "縛", "術", "式", "域"];

function FloatingRune({ char, x, y, delay }: { char: string; x: number; y: number; delay: number }) {
  return (
    <div
      className="absolute select-none pointer-events-none"
      style={{
        left: `${x}%`,
        top: `${y}%`,
        color: "rgba(170,0,0,0.12)",
        fontSize: 28 + Math.random() * 24,
        fontFamily: "'Noto Serif SC', serif",
        fontWeight: 900,
        animation: `float-rune ${6 + delay}s ease-in-out ${delay}s infinite`,
      }}
    >
      {char}
    </div>
  );
}

interface HomePageProps {
  onNavigate: (view: AppView) => void;
  userEmail?: string | null;
  onLogout?: () => void;
}

const menuItems = [
  {
    id: "new-game" as AppView,
    label: "新的咒术人生",
    sub: "创建新角色，踏入咒术世界",
    icon: Sword,
    primary: true,
  },
  {
    id: "load-game" as AppView,
    label: "接续咒术之旅",
    sub: "读取存档，继续你的故事",
    icon: RotateCcw,
    primary: false,
  },
  {
    id: "system-settings" as AppView,
    label: "咒术系统设置",
    sub: "配置 LLM 接口与世界设定",
    icon: Settings,
    primary: false,
  },
];

const runePositions = Array.from({ length: 18 }, (_, i) => ({
  char: RUNES[i % RUNES.length],
  x: Math.round(5 + (i * 5.3) % 90),
  y: Math.round(3 + (i * 11.7) % 94),
  delay: (i * 0.7) % 5,
}));

export function HomePage({ onNavigate, userEmail, onLogout }: HomePageProps) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setReady(true), 200);
    return () => clearTimeout(t);
  }, []);

  return (
    <div
      className="relative flex flex-col h-[100dvh] w-full overflow-hidden"
      style={{ background: "linear-gradient(165deg, #120000 0%, #1C1C1C 45%, #0a0a1a 100%)" }}
    >
      {/* Atmospheric overlay */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Radial glow center */}
        <div
          className="absolute"
          style={{
            inset: 0,
            background: "radial-gradient(ellipse 60% 70% at 50% 50%, rgba(170,0,0,0.08) 0%, transparent 70%)",
          }}
        />
        {/* Grid lines */}
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: "linear-gradient(rgba(170,0,0,0.04) 1px, transparent 1px), linear-gradient(90deg,rgba(170,0,0,0.04) 1px, transparent 1px)",
            backgroundSize: "80px 80px",
          }}
        />
        {/* Floating runes */}
        {runePositions.map((r, i) => (
          <FloatingRune key={i} {...r} />
        ))}
        {/* Vignette */}
        <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse 100% 100% at 50% 50%, transparent 40%, rgba(0,0,0,0.7) 100%)" }} />
      </div>

      {/* Top bar */}
      <div className="relative z-10 flex items-center justify-between px-6 pt-safe" style={{ height: 56 }}>
        {/* Version */}
        <span className="jjk-mono" style={{ color: "rgba(170,0,0,0.4)", fontSize: 10, letterSpacing: "0.2em" }}>
          SANCTUM v0.1.0-α
        </span>
        {/* Account button */}
        {userEmail ? (
          <div className="flex items-center gap-2">
            <span style={{ fontSize: 11, color: "var(--jjk-text-3)", fontFamily: "'Noto Sans SC', sans-serif" }}>
              {userEmail}
            </span>
            <motion.button
              id="home-logout-btn"
              className="flex items-center gap-2 cursor-pointer"
              style={{
                background: "rgba(28,28,28,0.7)",
                border: "1px solid rgba(170,0,0,0.3)",
                padding: "6px 12px",
                color: "var(--jjk-text-3)",
                borderRadius: 0,
              }}
              whileHover={{ borderColor: "rgba(170,0,0,0.7)", color: "var(--jjk-text)", boxShadow: "0 0 12px rgba(170,0,0,0.2)" }}
              whileTap={{ scale: 0.96 }}
              onClick={onLogout}
            >
              <User size={14} />
              <span style={{ fontFamily: "'Noto Sans SC', sans-serif", fontSize: 12 }}>退出登录</span>
            </motion.button>
          </div>
        ) : (
          <motion.button
            id="home-account-btn"
            className="flex items-center gap-2 cursor-pointer"
            style={{
              background: "rgba(28,28,28,0.7)",
              border: "1px solid rgba(170,0,0,0.3)",
              padding: "6px 12px",
              color: "var(--jjk-text-3)",
              borderRadius: 0,
            }}
            whileHover={{ borderColor: "rgba(170,0,0,0.7)", color: "var(--jjk-text)", boxShadow: "0 0 12px rgba(170,0,0,0.2)" }}
            whileTap={{ scale: 0.96 }}
            onClick={() => onNavigate("login")}
          >
            <User size={14} />
            <span style={{ fontFamily: "'Noto Sans SC', sans-serif", fontSize: 12 }}>注册/登录</span>
          </motion.button>
        )}
      </div>

      {/* Center content */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 gap-10">
        {/* Hero title */}
        <AnimatePresence>
          {ready && (
            <motion.div
              className="text-center"
              initial={{ opacity: 0, scale: 0.85, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            >
              {/* Subtitle */}
              <p
                className="mb-4 tracking-[0.4em] uppercase"
                style={{ color: "rgba(212,175,55,0.6)", fontFamily: "'Share Tech Mono', monospace", fontSize: 11 }}
              >
                LLM · Interactive · Narrative
              </p>

              {/* Main title */}
              <h1
                className="jjk-title-hero"
                style={{ fontSize: "clamp(42px, 8vw, 80px)", lineHeight: 1.1, letterSpacing: "0.18em" }}
              >
                咒术回战
              </h1>

              {/* Domain subtitle */}
              <div className="mt-3 flex items-center justify-center gap-3">
                <div style={{ height: 1, width: 48, background: "linear-gradient(90deg, transparent, rgba(170,0,0,0.5))" }} />
                <span
                  style={{
                    color: "rgba(170,0,0,0.8)",
                    fontFamily: "'Noto Serif SC', serif",
                    fontSize: 13,
                    letterSpacing: "0.35em",
                    fontWeight: 700,
                    animation: "curse-pulse 3s ease-in-out infinite",
                  }}
                >
                  SANCTUM
                </span>
                <div style={{ height: 1, width: 48, background: "linear-gradient(90deg, rgba(170,0,0,0.5), transparent)" }} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Menu buttons */}
        <AnimatePresence>
          {ready && (
            <motion.div
              className="flex flex-col gap-3 w-full max-w-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.5 }}
            >
              {menuItems.map((item, i) => {
                const Icon = item.icon;
                return (
                  <motion.button
                    key={item.id}
                    id={`home-btn-${item.id}`}
                    className="jjk-btn w-full justify-between group"
                    style={{
                      background: item.primary ? "rgba(170,0,0,0.18)" : "rgba(28,28,28,0.7)",
                      borderColor: item.primary ? "rgba(170,0,0,0.5)" : "rgba(170,0,0,0.25)",
                      padding: "14px 20px",
                    }}
                    initial={{ opacity: 0, x: -24 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 + i * 0.12, duration: 0.4 }}
                    whileHover={{ x: 4 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => {
                      if (window.innerWidth < 768) {
                        document.documentElement.requestFullscreen?.().catch(() => {});
                      }
                      onNavigate(item.id);
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-9 h-9 flex items-center justify-center"
                        style={{
                          background: item.primary ? "rgba(170,0,0,0.3)" : "rgba(170,0,0,0.10)",
                          border: "1px solid rgba(170,0,0,0.4)",
                        }}
                      >
                        <Icon size={16} style={{ color: item.primary ? "#FF6666" : "var(--jjk-text-3)" }} />
                      </div>
                      <div className="text-left">
                        <p
                          style={{
                            fontFamily: "'Noto Serif SC', serif",
                            fontWeight: 600,
                            fontSize: 15,
                            color: item.primary ? "var(--jjk-text)" : "var(--jjk-text-2)",
                            lineHeight: 1.2,
                          }}
                        >
                          {item.label}
                        </p>
                        <p style={{ fontSize: 11, color: "var(--jjk-text-4)", fontFamily: "'Noto Sans SC', sans-serif", marginTop: 2 }}>
                          {item.sub}
                        </p>
                      </div>
                    </div>
                    <ChevronRight
                      size={16}
                      style={{ color: "var(--jjk-text-4)", transition: "transform 0.2s, color 0.2s" }}
                      className="group-hover:translate-x-1 group-hover:text-red-400"
                    />
                  </motion.button>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Bottom version info */}
      <div className="relative z-10 flex items-center justify-center pb-safe" style={{ height: 40 }}>
        <span style={{ fontFamily: "'Noto Sans SC', sans-serif", color: "rgba(85,85,85,0.8)", fontSize: 11 }}>
          基于 JUJUTSU KAISEN 同人创作 · 非商业用途 · 由 LLM 驱动
        </span>
      </div>
    </div>
  );
}
