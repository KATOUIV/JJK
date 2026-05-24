import { motion } from "motion/react";
import { User, MapPin, Clock } from "lucide-react";
import type { GameState } from "../types";

interface GameRightPanelProps {
  gameState: GameState;
}

function StatBar({ value, max, barClass }: { value: number; max: number; barClass: string }) {
  const pct = Math.max(0, Math.min(1, value / max)) * 100;
  return (
    <div className="relative h-2.5" style={{ background: "rgba(40,30,25,0.8)", border: "1px solid rgba(170,0,0,0.1)" }}>
      <motion.div
        className={barClass}
        style={{ position: "absolute", top: 0, left: 0, height: "100%" }}
        initial={{ width: 0 }}
        animate={{ width: `${pct}%` }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      />
    </div>
  );
}

const ATTR_LABELS: Record<string, string> = {
  VIT: "体", DEX: "敏", STR: "力", CEP: "感", APT: "才", MND: "心",
};

export function GameRightPanel({ gameState }: GameRightPanelProps) {
  const { user, 系统 } = gameState;
  const attrs = user.attributes;

  return (
    <div
      className="hidden lg:flex flex-col h-full relative z-10 overflow-y-auto"
      style={{
        width: 240,
        flexShrink: 0,
        background: "rgba(14,10,8,0.96)",
        borderLeft: "1px solid rgba(170,0,0,0.15)",
      }}
    >
      {/* Header */}
      <div
        className="px-4 flex items-center shrink-0"
        style={{ height: 52, borderBottom: "1px solid rgba(170,0,0,0.12)" }}
      >
        <span style={{ fontSize: 11, color: "var(--jjk-text-4)", fontFamily: "'Share Tech Mono', monospace", letterSpacing: "0.1em" }}>
          CHARACTER STATUS
        </span>
      </div>

      {/* Avatar + Name + Tags */}
      <div className="px-4 py-4 flex flex-col items-center gap-3" style={{ borderBottom: "1px solid rgba(170,0,0,0.1)" }}>
        {/* Avatar */}
        <div className="relative">
          <div
            className="w-16 h-16 flex items-center justify-center"
            style={{
              background: "rgba(170,0,0,0.1)",
              border: "1px solid rgba(170,0,0,0.3)",
              boxShadow: "0 0 20px rgba(170,0,0,0.1)",
            }}
          >
            <User size={28} style={{ color: "rgba(170,0,0,0.6)" }} />
          </div>
          {/* Level badge */}
          <div
            className="absolute -bottom-1.5 -right-1.5 flex items-center justify-center px-1.5"
            style={{ background: "#AA0000", minWidth: 22, height: 16 }}
          >
            <span className="jjk-mono" style={{ fontSize: 9, color: "#FFF", letterSpacing: "0.05em" }}>
              {user.等级}
            </span>
          </div>
        </div>

        <div className="text-center">
          <p style={{ fontFamily: "'Noto Serif SC', serif", fontWeight: 700, fontSize: 15, color: "var(--jjk-text)", lineHeight: 1.2 }}>
            {user.名称}
          </p>
          <div className="flex items-center justify-center gap-1.5 mt-1.5 flex-wrap">
            <span
              className="px-2 py-0.5"
              style={{
                fontSize: 10,
                color: "#D4AF37",
                border: "1px solid rgba(212,175,55,0.4)",
                background: "rgba(212,175,55,0.1)",
                fontFamily: "'Noto Sans SC', sans-serif",
              }}
            >
              {user.战力评级}
            </span>
            <span style={{ fontSize: 10, color: "var(--jjk-text-4)", fontFamily: "'Noto Sans SC', sans-serif" }}>
              {user.流派}
            </span>
          </div>
        </div>
      </div>

      {/* Bars */}
      <div className="px-4 py-3 space-y-3" style={{ borderBottom: "1px solid rgba(170,0,0,0.1)" }}>
        <div>
          <div className="flex items-center justify-between mb-1">
            <span style={{ fontSize: 10, color: "var(--jjk-text-4)", fontFamily: "'Noto Sans SC', sans-serif" }}>生命值</span>
            <span className="jjk-mono" style={{ fontSize: 10, color: "#FF4444" }}>
              {user.生命值.当前值}/{user.生命值.最大值}
            </span>
          </div>
          <StatBar value={user.生命值.当前值} max={user.生命值.最大值} barClass="jjk-bar-hp" />
        </div>
        <div>
          <div className="flex items-center justify-between mb-1">
            <span style={{ fontSize: 10, color: "var(--jjk-text-4)", fontFamily: "'Noto Sans SC', sans-serif" }}>咒力</span>
            <span className="jjk-mono" style={{ fontSize: 10, color: "#00CC66" }}>
              {user.咒力.当前值}/{user.咒力.最大值}
            </span>
          </div>
          <StatBar value={user.咒力.当前值} max={user.咒力.最大值} barClass="jjk-bar-energy" />
        </div>

        {/* EXP */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <span style={{ fontSize: 10, color: "var(--jjk-text-4)", fontFamily: "'Noto Sans SC', sans-serif" }}>经验值</span>
            <span className="jjk-mono" style={{ fontSize: 10, color: "#D4AF37" }}>
              {user.EXP}
            </span>
          </div>
          <StatBar value={user.EXP % 1000} max={1000} barClass="jjk-bar-exp" />
        </div>

        {/* KP */}
        <div className="flex items-center justify-between">
          <span style={{ fontSize: 10, color: "var(--jjk-text-4)", fontFamily: "'Noto Sans SC', sans-serif" }}>咒印点</span>
          <span className="jjk-mono" style={{ fontSize: 11, color: "#9B59B6" }}>{user.KP} K</span>
        </div>
      </div>

      {/* Attributes grid */}
      <div className="px-4 py-3" style={{ borderBottom: "1px solid rgba(170,0,0,0.1)" }}>
        <p style={{ fontSize: 10, color: "var(--jjk-text-4)", fontFamily: "'Share Tech Mono', monospace", marginBottom: 8, letterSpacing: "0.1em" }}>
          ATTRIBUTES
        </p>
        <div className="grid grid-cols-3 gap-1.5">
          {Object.entries(attrs).map(([key, val]) => (
            <div
              key={key}
              className="flex flex-col items-center py-1.5"
              style={{ background: "rgba(28,20,16,0.7)", border: "1px solid rgba(170,0,0,0.1)" }}
            >
              <span style={{ fontSize: 9, color: "var(--jjk-text-4)", fontFamily: "'Share Tech Mono', monospace" }}>
                {ATTR_LABELS[key]}
              </span>
              <span className="jjk-mono" style={{ fontSize: 14, color: "var(--jjk-text-2)", marginTop: 1 }}>{val}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Location + time + body status */}
      <div className="px-4 py-3 space-y-2">
        <div className="flex items-start gap-2">
          <MapPin size={11} style={{ color: "var(--jjk-text-4)", marginTop: 1, flexShrink: 0 }} />
          <span style={{ fontSize: 11, color: "var(--jjk-text-3)", fontFamily: "'Noto Sans SC', sans-serif", lineHeight: 1.5 }}>
            {系统.地点.场所}
            <span style={{ display: "block", fontSize: 10, color: "var(--jjk-text-4)" }}>
              {系统.地点.地域}
            </span>
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Clock size={11} style={{ color: "var(--jjk-text-4)", flexShrink: 0 }} />
          <span className="jjk-mono" style={{ fontSize: 10, color: "var(--jjk-text-4)" }}>
            {系统.时间.月日} {系统.时间.时分}
          </span>
        </div>

        {/* Body status */}
        <div
          className="mt-2 px-3 py-2"
          style={{ background: "rgba(28,20,16,0.5)", border: "1px solid rgba(170,0,0,0.1)" }}
        >
          <p style={{ fontSize: 10, color: "var(--jjk-text-4)", fontFamily: "'Noto Sans SC', sans-serif", marginBottom: 2 }}>
            身体状况
          </p>
          <p style={{ fontSize: 11, color: user.身体状况 === "健康" ? "#66CC66" : "#FFAA44", fontFamily: "'Noto Sans SC', sans-serif" }}>
            {user.身体状况}
          </p>
        </div>
      </div>
    </div>
  );
}
