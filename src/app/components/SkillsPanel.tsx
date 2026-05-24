import { motion, AnimatePresence } from "motion/react";
import { X, Zap, Star, ChevronDown } from "lucide-react";
import { useState } from "react";
import type { GameState } from "../types";

interface SkillsPanelProps {
  gameState: GameState;
  onClose: () => void;
}

function ProficiencyBar({ value }: { value: number }) {
  const bars = 5;
  const filled = Math.round((value / 100) * bars);
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: bars }, (_, i) => (
        <div
          key={i}
          style={{
            width: 12, height: 4,
            background: i < filled ? "#AA0000" : "rgba(170,0,0,0.15)",
            border: "1px solid rgba(170,0,0,0.2)",
          }}
        />
      ))}
    </div>
  );
}

function SkillCard({ name, data, highlight }: {
  name: string;
  data: { 熟练度: number; 阶段: string; 描述: string };
  highlight?: boolean;
}) {
  const [open, setOpen] = useState(false);
  return (
    <motion.div
      className="overflow-hidden"
      style={{
        background: highlight ? "rgba(106,13,173,0.12)" : "rgba(28,20,16,0.6)",
        border: highlight ? "1px solid rgba(106,13,173,0.4)" : "1px solid rgba(170,0,0,0.12)",
      }}
    >
      <button
        type="button"
        className="w-full flex items-center justify-between gap-3 px-4 py-3 cursor-pointer text-left"
        onClick={() => setOpen(!open)}
      >
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div
            className="w-7 h-7 flex items-center justify-center shrink-0"
            style={{
              background: highlight ? "rgba(106,13,173,0.2)" : "rgba(170,0,0,0.1)",
              border: highlight ? "1px solid rgba(106,13,173,0.4)" : "1px solid rgba(170,0,0,0.2)",
            }}
          >
            <Zap size={12} style={{ color: highlight ? "#9B59B6" : "rgba(170,0,0,0.7)" }} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span style={{ fontSize: 13, color: "var(--jjk-text-2)", fontFamily: "'Noto Sans SC', sans-serif" }}>{name}</span>
              <span
                style={{
                  fontSize: 10,
                  color: highlight ? "#9B59B6" : "rgba(170,0,0,0.7)",
                  border: highlight ? "1px solid rgba(106,13,173,0.3)" : "1px solid rgba(170,0,0,0.3)",
                  padding: "0 5px",
                  fontFamily: "'Noto Sans SC', sans-serif",
                }}
              >
                {data.阶段}
              </span>
            </div>
            <ProficiencyBar value={data.熟练度} />
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="jjk-mono" style={{ fontSize: 10, color: highlight ? "#9B59B6" : "rgba(170,0,0,0.6)" }}>
            {data.熟练度}%
          </span>
          <ChevronDown
            size={12}
            style={{
              color: "var(--jjk-text-4)",
              transform: open ? "rotate(180deg)" : "rotate(0deg)",
              transition: "transform 0.2s",
            }}
          />
        </div>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            style={{ overflow: "hidden" }}
          >
            <div
              className="px-4 pb-3"
              style={{ borderTop: "1px solid rgba(170,0,0,0.1)" }}
            >
              <p style={{ fontSize: 12, color: "var(--jjk-text-3)", fontFamily: "'Noto Sans SC', sans-serif", lineHeight: 1.7, paddingTop: 8 }}>
                {data.描述}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export function SkillsPanel({ gameState, onClose }: SkillsPanelProps) {
  const { user } = gameState;
  const 战技 = Object.entries(user.战技);
  const 扩展 = Object.entries(user.扩展术式);

  return (
    <motion.div
      className="panel-overlay flex items-end md:items-center justify-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="curse-card w-full md:max-w-lg rounded-none overflow-hidden"
        style={{
          background: "rgba(18,12,8,0.99)",
          maxHeight: "90vh",
          display: "flex",
          flexDirection: "column",
        }}
        initial={{ y: 60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 60, opacity: 0 }}
        transition={{ type: "spring", stiffness: 400, damping: 32 }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-5 py-4 shrink-0"
          style={{ borderBottom: "1px solid rgba(170,0,0,0.15)" }}
        >
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 flex items-center justify-center" style={{ background: "rgba(106,13,173,0.15)", border: "1px solid rgba(106,13,173,0.4)" }}>
              <Zap size={14} style={{ color: "#9B59B6" }} />
            </div>
            <h2 className="jjk-title-section" style={{ fontSize: 14 }}>术式技能</h2>
          </div>
          <button
            className="w-7 h-7 flex items-center justify-center cursor-pointer"
            style={{ border: "1px solid rgba(170,0,0,0.25)", background: "transparent" }}
            onClick={onClose}
          >
            <X size={13} style={{ color: "var(--jjk-text-3)" }} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
          {/* Innate technique */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Star size={11} style={{ color: "#D4AF37" }} />
              <span style={{ fontSize: 11, color: "#D4AF37", fontFamily: "'Share Tech Mono', monospace", letterSpacing: "0.1em" }}>
                生得术式
              </span>
            </div>
            <div
              className="px-4 py-3"
              style={{ background: "rgba(212,175,55,0.06)", border: "1px solid rgba(212,175,55,0.25)" }}
            >
              <div className="flex items-center gap-2 mb-1">
                <span style={{ fontSize: 14, fontFamily: "'Noto Serif SC', serif", fontWeight: 700, color: "var(--jjk-text)" }}>
                  {user.生得术式.名称}
                </span>
                <span style={{ fontSize: 10, color: "#D4AF37", border: "1px solid rgba(212,175,55,0.3)", padding: "0 5px", fontFamily: "'Noto Sans SC', sans-serif" }}>
                  {user.生得术式.阶段}
                </span>
              </div>
              <p style={{ fontSize: 11, color: "var(--jjk-text-3)", fontFamily: "'Noto Sans SC', sans-serif", lineHeight: 1.7 }}>
                {user.生得术式.描述}
              </p>
              <div className="mt-2 flex items-center gap-2">
                <span style={{ fontSize: 10, color: "var(--jjk-text-4)", fontFamily: "'Noto Sans SC', sans-serif" }}>熟练度</span>
                <ProficiencyBar value={user.生得术式.熟练度} />
                <span className="jjk-mono" style={{ fontSize: 10, color: "#D4AF37" }}>{user.生得术式.熟练度}%</span>
              </div>
            </div>
          </div>

          {/* Combat techniques */}
          {战技.length > 0 && (
            <div>
              <p style={{ fontSize: 11, color: "var(--jjk-text-4)", fontFamily: "'Share Tech Mono', monospace", marginBottom: 8, letterSpacing: "0.1em" }}>
                战斗技能
              </p>
              <div className="space-y-2">
                {战技.map(([name, data]) => (
                  <SkillCard key={name} name={name} data={data} />
                ))}
              </div>
            </div>
          )}

          {/* Extension techniques */}
          {扩展.length > 0 && (
            <div>
              <p style={{ fontSize: 11, color: "var(--jjk-text-4)", fontFamily: "'Share Tech Mono', monospace", marginBottom: 8, letterSpacing: "0.1em" }}>
                扩展术式
              </p>
              <div className="space-y-2">
                {扩展.map(([name, data]) => (
                  <SkillCard key={name} name={name} data={data} highlight />
                ))}
              </div>
            </div>
          )}

          {战技.length === 0 && 扩展.length === 0 && (
            <div className="flex flex-col items-center gap-3 py-10">
              <Zap size={28} style={{ color: "rgba(106,13,173,0.3)" }} />
              <p style={{ fontSize: 13, color: "var(--jjk-text-4)", fontFamily: "'Noto Sans SC', sans-serif" }}>暂无已习得技能</p>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
