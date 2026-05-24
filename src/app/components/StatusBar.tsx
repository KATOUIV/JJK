import { motion } from "motion/react";
import { MapPin, Clock, Zap, ChevronRight, Star, Crown } from "lucide-react";
import type { GameState } from "../types";

interface StatusBarProps {
  gameState: GameState;
}

export function StatusBar({ gameState }: StatusBarProps) {
  const { 系统: sys, user } = gameState;
  const curseEnergy = typeof user.咒力 === "string" ? { 当前值: 0, 最大值: 100 } : user.咒力;
  const energyPct = Math.round((curseEnergy.当前值 / curseEnergy.最大值) * 100);

  const locationParts = [sys.地点.地域, sys.地点.场所, sys.地点.具体位置];

  return (
    <div
      className="relative flex items-center justify-between px-3 md:px-5 shrink-0 z-10"
      style={{
        height: 52,
        background: "rgba(8,8,24,0.92)",
        borderBottom: "1px solid rgba(139,92,246,0.15)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
      }}
    >
      {/* Location */}
      <div className="flex items-center gap-1.5 min-w-0 flex-1">
        <MapPin size={13} style={{ color: "#8b5cf6", flexShrink: 0 }} />
        <div className="flex items-center gap-0.5 min-w-0 overflow-hidden">
          {locationParts.map((part, i) => (
            <div key={i} className="flex items-center gap-0.5 shrink-0">
              {i > 0 && <ChevronRight size={10} style={{ color: "#524d70" }} />}
              <span
                className="text-xs whitespace-nowrap"
                style={{
                  color: i === locationParts.length - 1 ? "#ede9fe" : "#a09ac5",
                  fontWeight: i === locationParts.length - 1 ? 500 : 400,
                  fontFamily: "'Noto Sans SC', sans-serif",
                }}
              >
                {part}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Center - time (hidden on very small screens) */}
      <div className="hidden sm:flex items-center gap-3 flex-shrink-0 mx-4">
        <div className="flex items-center gap-1.5">
          <Clock size={12} style={{ color: "#a09ac5" }} />
          <span
            className="text-xs"
            style={{ color: "#a09ac5", fontFamily: "'Share Tech Mono', monospace" }}
          >
            {sys.时间.星期} {sys.时间.月日} {sys.时间.时分}
          </span>
        </div>
      </div>

      {/* Right - user stats */}
      <div className="flex items-center gap-3 shrink-0">
        {/* Level badge */}
        <div
          className="hidden sm:flex items-center gap-1.5 rounded-full px-2.5 py-0.5"
          style={{ background: "rgba(139,92,246,0.12)", border: "1px solid rgba(139,92,246,0.25)" }}
        >
          <Crown size={11} style={{ color: "#f59e0b" }} />
          <span
            className="text-xs"
            style={{ color: "#ede9fe", fontWeight: 600, fontFamily: "'Share Tech Mono', monospace" }}
          >
            Lv.{user.等级}
          </span>
          <span
            className="text-xs"
            style={{ color: "#a09ac5", fontFamily: "'Noto Sans SC', sans-serif" }}
          >
            {user.战力评级}
          </span>
        </div>

        {/* Curse energy */}
        <div className="flex items-center gap-1.5">
          <Zap size={12} style={{ color: "#8b5cf6" }} />
          <div className="flex flex-col gap-0.5">
            <div
              className="stat-bar-track"
              style={{ width: 56, height: 4 }}
            >
              <motion.div
                className="h-full rounded-full energy-bar"
                initial={{ width: 0 }}
                animate={{ width: `${energyPct}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
              />
            </div>
          </div>
          <span
            className="text-xs hidden md:block"
            style={{ color: "#8b5cf6", fontFamily: "'Share Tech Mono', monospace" }}
          >
            {curseEnergy.当前值}/{curseEnergy.最大值}
          </span>
        </div>

        {/* KP */}
        <div className="hidden md:flex items-center gap-1">
          <Star size={11} style={{ color: "#f59e0b" }} />
          <span
            className="text-xs"
            style={{ color: "#f59e0b", fontFamily: "'Share Tech Mono', monospace", fontWeight: 600 }}
          >
            {user.KP}KP
          </span>
        </div>
      </div>
    </div>
  );
}
