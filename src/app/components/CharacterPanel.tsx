import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  X, Activity, Zap, Star, Package, Shirt,
  Heart, Shield, Coins, Home, ChevronRight,
} from "lucide-react";
import type { GameState } from "../types";

interface CharacterPanelProps {
  gameState: GameState;
  onClose: () => void;
}

type TabId = "overview" | "abilities" | "reputation" | "inventory" | "other";

const TABS: { id: TabId; label: string; icon: React.ElementType }[] = [
  { id: "overview", label: "概览", icon: Activity },
  { id: "abilities", label: "能力", icon: Zap },
  { id: "reputation", label: "名望", icon: Star },
  { id: "inventory", label: "行囊", icon: Package },
  { id: "other", label: "其他", icon: Shirt },
];

const ATTR_LABELS: Record<string, string> = {
  VIT: "体魄", DEX: "敏捷", STR: "力量", CEP: "感知", APT: "才能", MND: "心志",
};

function StatBar({ value, max, barClass }: { value: number; max: number; barClass: string }) {
  const pct = Math.min(100, Math.round((value / max) * 100));
  return (
    <div className="relative h-2" style={{ background: "rgba(40,25,20,0.7)", border: "1px solid rgba(170,0,0,0.1)" }}>
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

function ProficiencySegments({ value }: { value: number }) {
  const segs = 5;
  const filled = Math.round((value / 100) * segs);
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: segs }, (_, i) => (
        <div
          key={i}
          style={{
            width: 14, height: 4,
            background: i < filled ? "#AA0000" : "rgba(170,0,0,0.12)",
            border: "1px solid rgba(170,0,0,0.15)",
          }}
        />
      ))}
      <span className="jjk-mono ml-1.5" style={{ fontSize: 10, color: "rgba(170,0,0,0.7)" }}>{value}%</span>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2" style={{ borderBottom: "1px solid rgba(170,0,0,0.07)" }}>
      <span style={{ fontSize: 12, color: "var(--jjk-text-4)", fontFamily: "'Noto Sans SC', sans-serif", flexShrink: 0 }}>{label}</span>
      <span style={{ fontSize: 12, color: "var(--jjk-text-2)", fontFamily: "'Noto Sans SC', sans-serif", textAlign: "right" }}>{value}</span>
    </div>
  );
}

export function CharacterPanel({ gameState, onClose }: CharacterPanelProps) {
  const [tab, setTab] = useState<TabId>("overview");
  const { user } = gameState;

  return (
    <motion.div
      className="panel-overlay flex items-stretch md:items-center justify-end md:justify-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="curse-card w-full md:max-w-lg rounded-none overflow-hidden flex flex-col"
        style={{ background: "rgba(16,10,8,0.99)", height: "100vh", maxHeight: "100vh" }}
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ type: "spring", stiffness: 340, damping: 34 }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-5 py-4 shrink-0"
          style={{ borderBottom: "1px solid rgba(170,0,0,0.15)" }}
        >
          <div>
            <h2 className="jjk-title-section" style={{ fontSize: 15 }}>{user.名称}</h2>
            <div className="flex items-center gap-2 mt-0.5">
              <span style={{ fontSize: 11, color: "#D4AF37", fontFamily: "'Share Tech Mono', monospace" }}>
                Lv.{user.等级}
              </span>
              <span style={{ fontSize: 10, color: "var(--jjk-text-4)" }}>·</span>
              <span style={{ fontSize: 11, color: "var(--jjk-text-4)", fontFamily: "'Noto Sans SC', sans-serif" }}>
                {user.战力评级}咒術师
              </span>
              <span style={{ fontSize: 10, color: "var(--jjk-text-4)" }}>·</span>
              <span style={{ fontSize: 11, color: "var(--jjk-text-4)", fontFamily: "'Noto Sans SC', sans-serif" }}>
                {user.流派}
              </span>
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

        {/* Tabs */}
        <div
          className="flex shrink-0"
          style={{ borderBottom: "1px solid rgba(170,0,0,0.12)" }}
        >
          {TABS.map((t) => {
            const Icon = t.icon;
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                className="flex-1 flex flex-col items-center py-2.5 gap-0.5 cursor-pointer relative"
                style={{ background: active ? "rgba(170,0,0,0.1)" : "transparent", border: "none" }}
                onClick={() => setTab(t.id)}
              >
                {active && (
                  <motion.div
                    className="absolute bottom-0 left-0 right-0"
                    style={{ height: 2, background: "#AA0000" }}
                    layoutId="char-tab-active"
                  />
                )}
                <Icon size={13} style={{ color: active ? "#FF6666" : "var(--jjk-text-4)" }} />
                <span style={{ fontSize: 10, color: active ? "var(--jjk-text)" : "var(--jjk-text-4)", fontFamily: "'Noto Sans SC', sans-serif" }}>
                  {t.label}
                </span>
              </button>
            );
          })}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          <AnimatePresence mode="wait">
            <motion.div
              key={tab}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.18 }}
            >
              {/* ── Overview ── */}
              {tab === "overview" && (
                <div className="space-y-4">
                  {/* HP / Curse energy */}
                  <div className="space-y-3">
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-1.5">
                          <Heart size={12} style={{ color: "#FF4444" }} />
                          <span style={{ fontSize: 11, color: "var(--jjk-text-4)", fontFamily: "'Noto Sans SC', sans-serif" }}>生命值</span>
                        </div>
                        <span className="jjk-mono" style={{ fontSize: 11, color: "#FF4444" }}>
                          {user.生命值.当前值}/{user.生命值.最大值}
                        </span>
                      </div>
                      <StatBar value={user.生命值.当前值} max={user.生命值.最大值} barClass="jjk-bar-hp" />
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-1.5">
                          <Zap size={12} style={{ color: "#00CC66" }} />
                          <span style={{ fontSize: 11, color: "var(--jjk-text-4)", fontFamily: "'Noto Sans SC', sans-serif" }}>咒力</span>
                        </div>
                        <span className="jjk-mono" style={{ fontSize: 11, color: "#00CC66" }}>
                          {user.咒力.当前值}/{user.咒力.最大值}
                        </span>
                      </div>
                      <StatBar value={user.咒力.当前值} max={user.咒力.最大值} barClass="jjk-bar-energy" />
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span style={{ fontSize: 11, color: "var(--jjk-text-4)", fontFamily: "'Noto Sans SC', sans-serif" }}>经验值</span>
                        <span className="jjk-mono" style={{ fontSize: 11, color: "#D4AF37" }}>{user.EXP} EXP</span>
                      </div>
                      <StatBar value={user.EXP % 1000} max={1000} barClass="jjk-bar-exp" />
                    </div>
                  </div>

                  {/* Attributes grid */}
                  <div>
                    <p style={{ fontSize: 10, color: "var(--jjk-text-4)", fontFamily: "'Share Tech Mono', monospace", marginBottom: 8, letterSpacing: "0.1em" }}>ATTRIBUTES</p>
                    <div className="grid grid-cols-3 gap-2">
                      {Object.entries(user.attributes).map(([key, val]) => (
                        <div key={key} className="flex flex-col items-center py-2" style={{ background: "rgba(28,18,14,0.7)", border: "1px solid rgba(170,0,0,0.1)" }}>
                          <span style={{ fontSize: 10, color: "var(--jjk-text-4)", fontFamily: "'Share Tech Mono', monospace" }}>{key}</span>
                          <span className="jjk-mono" style={{ fontSize: 18, color: "var(--jjk-text-2)", marginTop: 2 }}>{val}</span>
                          <span style={{ fontSize: 9, color: "var(--jjk-text-4)", fontFamily: "'Noto Sans SC', sans-serif" }}>{ATTR_LABELS[key]}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Basic info */}
                  <div style={{ background: "rgba(22,14,10,0.6)", border: "1px solid rgba(170,0,0,0.1)", padding: "0 12px" }}>
                    <Row label="身体状况" value={user.身体状况} />
                    <Row label="肉搏等级" value={user.肉搏等级} />
                    <Row label="KP" value={`${user.KP} 点`} />
                    <Row label="持有金钱" value={`¥${user.持有金钱.toLocaleString()}`} />
                    <Row label="居住地" value={user.居住地} />
                  </div>
                </div>
              )}

              {/* ── Abilities ── */}
              {tab === "abilities" && (
                <div className="space-y-4">
                  {/* Innate technique */}
                  <div>
                    <p style={{ fontSize: 10, color: "#D4AF37", fontFamily: "'Share Tech Mono', monospace", marginBottom: 8, letterSpacing: "0.1em" }}>生得术式</p>
                    <div style={{ background: "rgba(212,175,55,0.05)", border: "1px solid rgba(212,175,55,0.2)", padding: "12px 14px" }}>
                      <div className="flex items-center justify-between mb-1">
                        <span style={{ fontSize: 14, fontFamily: "'Noto Serif SC', serif", fontWeight: 700, color: "var(--jjk-text)" }}>
                          {user.生得术式.名称}
                        </span>
                        <span style={{ fontSize: 10, color: "#D4AF37", border: "1px solid rgba(212,175,55,0.3)", padding: "1px 6px", fontFamily: "'Noto Sans SC', sans-serif" }}>
                          {user.生得术式.阶段}
                        </span>
                      </div>
                      <p style={{ fontSize: 12, color: "var(--jjk-text-3)", fontFamily: "'Noto Sans SC', sans-serif", lineHeight: 1.7, marginBottom: 8 }}>
                        {user.生得术式.描述}
                      </p>
                      <ProficiencySegments value={user.生得术式.熟练度} />
                    </div>
                  </div>

                  {/* Combat skills */}
                  <div>
                    <p style={{ fontSize: 10, color: "var(--jjk-text-4)", fontFamily: "'Share Tech Mono', monospace", marginBottom: 8, letterSpacing: "0.1em" }}>战斗技能</p>
                    {Object.entries(user.战技).length === 0 ? (
                      <p style={{ fontSize: 12, color: "var(--jjk-text-4)", fontFamily: "'Noto Sans SC', sans-serif" }}>暂无</p>
                    ) : (
                      <div className="space-y-2">
                        {Object.entries(user.战技).map(([name, data]) => (
                          <div key={name} style={{ background: "rgba(22,14,10,0.6)", border: "1px solid rgba(170,0,0,0.1)", padding: "10px 12px" }}>
                            <div className="flex items-center justify-between mb-1.5">
                              <span style={{ fontSize: 13, color: "var(--jjk-text-2)", fontFamily: "'Noto Sans SC', sans-serif" }}>{name}</span>
                              <span style={{ fontSize: 10, color: "var(--jjk-text-4)", fontFamily: "'Noto Sans SC', sans-serif" }}>{data.阶段}</span>
                            </div>
                            <ProficiencySegments value={data.熟练度} />
                            <p style={{ fontSize: 11, color: "var(--jjk-text-4)", fontFamily: "'Noto Sans SC', sans-serif", lineHeight: 1.6, marginTop: 6 }}>
                              {data.描述}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Extensions */}
                  {Object.entries(user.扩展术式).length > 0 && (
                    <div>
                      <p style={{ fontSize: 10, color: "#9B59B6", fontFamily: "'Share Tech Mono', monospace", marginBottom: 8, letterSpacing: "0.1em" }}>扩展术式</p>
                      <div className="space-y-2">
                        {Object.entries(user.扩展术式).map(([name, data]) => (
                          <div key={name} style={{ background: "rgba(106,13,173,0.08)", border: "1px solid rgba(106,13,173,0.25)", padding: "10px 12px" }}>
                            <div className="flex items-center justify-between mb-1.5">
                              <span style={{ fontSize: 13, color: "var(--jjk-text-2)", fontFamily: "'Noto Sans SC', sans-serif" }}>{name}</span>
                              <span style={{ fontSize: 10, color: "#9B59B6", fontFamily: "'Noto Sans SC', sans-serif" }}>{data.阶段}</span>
                            </div>
                            <ProficiencySegments value={data.熟练度} />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ── Reputation ── */}
              {tab === "reputation" && (
                <div className="space-y-4">
                  {[
                    { label: "正道声望", data: user.名望.正道, color: "#4B92DB" },
                    { label: "邪道声望", data: user.名望.邪道, color: "#AA0000" },
                  ].map((rep) => (
                    <div key={rep.label}>
                      <p style={{ fontSize: 10, color: rep.color, fontFamily: "'Share Tech Mono', monospace", marginBottom: 8, opacity: 0.8 }}>{rep.label}</p>
                      <div style={{ background: "rgba(22,14,10,0.6)", border: `1px solid ${rep.color}20`, padding: "12px 14px" }}>
                        <div className="flex items-center justify-between mb-3">
                          <span className="jjk-mono" style={{ fontSize: 22, color: rep.color }}>{rep.data.数值}</span>
                          <span style={{ fontSize: 11, color: "var(--jjk-text-3)", fontFamily: "'Noto Sans SC', sans-serif" }}>声望值</span>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {rep.data.称号.map((title) => (
                            <span
                              key={title}
                              style={{
                                fontSize: 11,
                                color: rep.color,
                                border: `1px solid ${rep.color}35`,
                                background: `${rep.color}10`,
                                padding: "2px 8px",
                                fontFamily: "'Noto Sans SC', sans-serif",
                              }}
                            >
                              {title}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* ── Inventory ── */}
              {tab === "inventory" && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between mb-2">
                    <span style={{ fontSize: 10, color: "var(--jjk-text-4)", fontFamily: "'Share Tech Mono', monospace" }}>持有物品</span>
                    <div className="flex items-center gap-1.5">
                      <Coins size={12} style={{ color: "#D4AF37" }} />
                      <span className="jjk-mono" style={{ fontSize: 11, color: "#D4AF37" }}>¥{user.持有金钱.toLocaleString()}</span>
                    </div>
                  </div>
                  {Object.entries(user.行囊).length === 0 ? (
                    <p style={{ fontSize: 12, color: "var(--jjk-text-4)", fontFamily: "'Noto Sans SC', sans-serif" }}>行囊空空如也</p>
                  ) : (
                    Object.entries(user.行囊).map(([name, data]) => (
                      <div key={name} style={{ background: "rgba(22,14,10,0.6)", border: "1px solid rgba(170,0,0,0.1)", padding: "10px 14px" }}>
                        <div className="flex items-center justify-between mb-1">
                          <span style={{ fontSize: 13, color: "var(--jjk-text-2)", fontFamily: "'Noto Sans SC', sans-serif" }}>{name}</span>
                          <span className="jjk-mono" style={{ fontSize: 11, color: "var(--jjk-text-3)" }}>×{data.数量}</span>
                        </div>
                        <p style={{ fontSize: 11, color: "var(--jjk-text-4)", fontFamily: "'Noto Sans SC', sans-serif", lineHeight: 1.6 }}>
                          {data.描述}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* ── Other ── */}
              {tab === "other" && (
                <div className="space-y-4">
                  <div>
                    <p style={{ fontSize: 10, color: "var(--jjk-text-4)", fontFamily: "'Share Tech Mono', monospace", marginBottom: 8 }}>当前服装</p>
                    <div style={{ background: "rgba(22,14,10,0.6)", border: "1px solid rgba(170,0,0,0.1)", padding: "0 12px" }}>
                      <Row label="外套" value={user.当前服装.外套} />
                      <Row label="内搭" value={user.当前服装.内搭} />
                      <Row label="下装" value={user.当前服装.下装} />
                      <Row label="足具" value={user.当前服装.足具} />
                    </div>
                  </div>
                  {Object.keys(user.特殊体质).length > 0 && (
                    <div>
                      <p style={{ fontSize: 10, color: "#D4AF37", fontFamily: "'Share Tech Mono', monospace", marginBottom: 8 }}>特殊体质</p>
                      {Object.entries(user.特殊体质).map(([name, desc]) => (
                        <div key={name} style={{ background: "rgba(212,175,55,0.05)", border: "1px solid rgba(212,175,55,0.15)", padding: "10px 14px", marginBottom: 6 }}>
                          <p style={{ fontSize: 12, color: "#D4AF37", fontFamily: "'Noto Sans SC', sans-serif", marginBottom: 4 }}>{name}</p>
                          <p style={{ fontSize: 11, color: "var(--jjk-text-3)", fontFamily: "'Noto Sans SC', sans-serif", lineHeight: 1.7 }}>{desc}</p>
                        </div>
                      ))}
                    </div>
                  )}
                  {Object.keys(user.束缚).length > 0 && (
                    <div>
                      <p style={{ fontSize: 10, color: "#AA0000", fontFamily: "'Share Tech Mono', monospace", marginBottom: 8 }}>束缚</p>
                      {Object.entries(user.束缚).map(([name, data]) => (
                        <div key={name} style={{ background: "rgba(170,0,0,0.06)", border: "1px solid rgba(170,0,0,0.2)", padding: "10px 14px", marginBottom: 6 }}>
                          <p style={{ fontSize: 12, color: "#FF6666", fontFamily: "'Noto Sans SC', sans-serif", marginBottom: 4 }}>{name}</p>
                          <p style={{ fontSize: 11, color: "var(--jjk-text-3)", fontFamily: "'Noto Sans SC', sans-serif", lineHeight: 1.7 }}>代价: {data.代价}</p>
                          <p style={{ fontSize: 11, color: "var(--jjk-text-4)", fontFamily: "'Noto Sans SC', sans-serif", lineHeight: 1.7 }}>恢复: {data.恢复条件}</p>
                        </div>
                      ))}
                    </div>
                  )}
                  {user.永久损伤或疤痕 && user.永久损伤或疤痕 !== "无" && (
                    <div style={{ background: "rgba(170,0,0,0.06)", border: "1px solid rgba(170,0,0,0.15)", padding: "10px 14px" }}>
                      <p style={{ fontSize: 10, color: "var(--jjk-text-4)", fontFamily: "'Share Tech Mono', monospace", marginBottom: 4 }}>永久损伤/疤痕</p>
                      <p style={{ fontSize: 12, color: "var(--jjk-text-3)", fontFamily: "'Noto Sans SC', sans-serif" }}>{user.永久损伤或疤痕}</p>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </motion.div>
    </motion.div>
  );
}
