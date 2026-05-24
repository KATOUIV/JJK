import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Users, Heart, Shield, User, ChevronRight } from "lucide-react";
import type { GameState } from "../types";

interface NPCArchiveProps {
  gameState: GameState;
  onClose: () => void;
}

const NPC_THEMES: Record<string, { accent: string; accentBg: string }> = {
  "五条悟": { accent: "#4B92DB", accentBg: "rgba(75,146,219,0.1)" },
  "伏黒恵": { accent: "#6A0DAD", accentBg: "rgba(106,13,173,0.1)" },
  "钉崎野薔薇": { accent: "#FF6B9D", accentBg: "rgba(255,107,157,0.1)" },
  "七海建人": { accent: "#D4AF37", accentBg: "rgba(212,175,55,0.08)" },
  "禪院真希": { accent: "#00CC88", accentBg: "rgba(0,204,136,0.08)" },
  "虎杖悠仁": { accent: "#FF6644", accentBg: "rgba(255,100,68,0.1)" },
};

const DEFAULT_THEME = { accent: "#AA0000", accentBg: "rgba(170,0,0,0.1)" };

function RelationBar({ value, max = 100, color }: { value: number; max?: number; color: string }) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  return (
    <div className="relative h-1.5" style={{ background: "rgba(40,25,20,0.6)" }}>
      <motion.div
        style={{ position: "absolute", top: 0, left: 0, height: "100%", background: color }}
        initial={{ width: 0 }}
        animate={{ width: `${pct}%` }}
        transition={{ duration: 0.7, ease: "easeOut" }}
      />
    </div>
  );
}

function NPCDetailModal({ name, data, onClose }: {
  name: string;
  data: GameState["人际档案"][string];
  onClose: () => void;
}) {
  const theme = NPC_THEMES[name] || DEFAULT_THEME;
  return (
    <motion.div
      className="panel-overlay flex items-center justify-center px-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="curse-card w-full max-w-sm overflow-hidden"
        style={{ background: "rgba(18,12,8,0.99)" }}
        initial={{ scale: 0.92, opacity: 0, y: 16 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.92, opacity: 0 }}
        transition={{ type: "spring", stiffness: 400, damping: 32 }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Color top bar */}
        <div style={{ height: 3, background: theme.accent }} />

        <div className="px-5 py-5">
          {/* Name + close */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 flex items-center justify-center"
                style={{ background: theme.accentBg, border: `1px solid ${theme.accent}40` }}
              >
                <User size={18} style={{ color: theme.accent }} />
              </div>
              <div>
                <p style={{ fontFamily: "'Noto Serif SC', serif", fontWeight: 700, fontSize: 16, color: "var(--jjk-text)" }}>
                  {name}
                </p>
                <p style={{ fontSize: 11, color: "var(--jjk-text-4)", fontFamily: "'Noto Sans SC', sans-serif" }}>
                  {data.关系阶段}
                </p>
              </div>
            </div>
            <button
              className="w-7 h-7 flex items-center justify-center cursor-pointer"
              style={{ border: "1px solid rgba(170,0,0,0.25)", background: "transparent" }}
              onClick={onClose}
            >
              <X size={12} style={{ color: "var(--jjk-text-4)" }} />
            </button>
          </div>

          {/* Stats */}
          <div className="space-y-3">
            <div>
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-1.5">
                  <Heart size={11} style={{ color: theme.accent }} />
                  <span style={{ fontSize: 11, color: "var(--jjk-text-4)", fontFamily: "'Noto Sans SC', sans-serif" }}>好感度</span>
                </div>
                <span className="jjk-mono" style={{ fontSize: 11, color: theme.accent }}>{data.好感数值}</span>
              </div>
              <RelationBar value={data.好感数值} color={theme.accent} />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-1.5">
                  <Shield size={11} style={{ color: "#4B92DB" }} />
                  <span style={{ fontSize: 11, color: "var(--jjk-text-4)", fontFamily: "'Noto Sans SC', sans-serif" }}>信任度</span>
                </div>
                <span className="jjk-mono" style={{ fontSize: 11, color: "#4B92DB" }}>{data.信任度}</span>
              </div>
              <RelationBar value={data.信任度} color="#4B92DB" />
            </div>
          </div>

          {/* Relation stage */}
          <div
            className="mt-4 px-3 py-2"
            style={{ background: `${theme.accent}0C`, border: `1px solid ${theme.accent}25` }}
          >
            <p style={{ fontSize: 10, color: "var(--jjk-text-4)", fontFamily: "'Noto Sans SC', sans-serif", marginBottom: 3 }}>当前关系</p>
            <p style={{ fontSize: 13, color: "var(--jjk-text-2)", fontFamily: "'Noto Serif SC', serif", fontWeight: 600 }}>
              {data.关系阶段}
            </p>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

export function NPCArchive({ gameState, onClose }: NPCArchiveProps) {
  const [selectedNPC, setSelectedNPC] = useState<string | null>(null);
  const npcs = gameState.人际档案;
  const npcEntries = Object.entries(npcs);

  return (
    <motion.div
      className="panel-overlay flex items-end justify-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="curse-card w-full md:max-w-lg rounded-none overflow-hidden flex flex-col"
        style={{ background: "rgba(16,10,8,0.99)", maxHeight: "85vh" }}
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", stiffness: 380, damping: 36 }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div style={{ width: 36, height: 3, background: "rgba(170,0,0,0.3)" }} />
        </div>

        {/* Header */}
        <div
          className="flex items-center justify-between px-5 py-3 shrink-0"
          style={{ borderBottom: "1px solid rgba(170,0,0,0.12)" }}
        >
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 flex items-center justify-center" style={{ background: "rgba(170,0,0,0.1)", border: "1px solid rgba(170,0,0,0.3)" }}>
              <Users size={14} style={{ color: "#FF6666" }} />
            </div>
            <div>
              <h2 className="jjk-title-section" style={{ fontSize: 14 }}>人际档案</h2>
              <p className="jjk-mono" style={{ fontSize: 10, color: "var(--jjk-text-4)" }}>{npcEntries.length} 人</p>
            </div>
          </div>
          <button
            className="w-7 h-7 flex items-center justify-center cursor-pointer"
            style={{ border: "1px solid rgba(170,0,0,0.25)", background: "transparent" }}
            onClick={onClose}
          >
            <X size={13} style={{ color: "var(--jjk-text-3)" }} />
          </button>
        </div>

        {/* NPC list */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-2">
          {npcEntries.map(([name, data]) => {
            const theme = NPC_THEMES[name] || DEFAULT_THEME;
            return (
              <motion.button
                key={name}
                type="button"
                className="w-full flex items-center gap-3 px-4 py-3 text-left cursor-pointer"
                style={{ background: "rgba(22,14,10,0.7)", border: `1px solid ${theme.accent}20` }}
                whileHover={{ background: "rgba(28,18,12,0.9)", borderColor: `${theme.accent}40` }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setSelectedNPC(name)}
              >
                {/* Avatar */}
                <div
                  className="w-10 h-10 flex items-center justify-center shrink-0"
                  style={{ background: theme.accentBg, border: `1px solid ${theme.accent}35` }}
                >
                  <User size={16} style={{ color: theme.accent }} />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p style={{ fontSize: 13, fontFamily: "'Noto Serif SC', serif", fontWeight: 600, color: "var(--jjk-text-2)" }}>
                    {name}
                  </p>
                  <p style={{ fontSize: 10, color: "var(--jjk-text-4)", fontFamily: "'Noto Sans SC', sans-serif", marginTop: 1 }}>
                    {data.关系阶段}
                  </p>

                  {/* Mini bars */}
                  <div className="mt-2 flex items-center gap-3">
                    <div className="flex-1">
                      <RelationBar value={data.好感数值} color={theme.accent} />
                    </div>
                    <div className="flex-1">
                      <RelationBar value={data.信任度} color="#4B92DB" />
                    </div>
                  </div>
                </div>

                <ChevronRight size={13} style={{ color: "var(--jjk-text-4)", flexShrink: 0 }} />
              </motion.button>
            );
          })}

          {npcEntries.length === 0 && (
            <div className="flex flex-col items-center gap-3 py-12">
              <Users size={28} style={{ color: "rgba(170,0,0,0.2)" }} />
              <p style={{ fontSize: 13, color: "var(--jjk-text-4)", fontFamily: "'Noto Sans SC', sans-serif" }}>暂无人际档案</p>
            </div>
          )}
        </div>
      </motion.div>

      {/* Detail modal */}
      <AnimatePresence>
        {selectedNPC && npcs[selectedNPC] && (
          <NPCDetailModal
            key={selectedNPC}
            name={selectedNPC}
            data={npcs[selectedNPC]}
            onClose={() => setSelectedNPC(null)}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}
