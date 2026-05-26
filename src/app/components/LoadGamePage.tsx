import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ArrowLeft, RotateCcw, Trash2, MapPin, Clock, User, Star, AlertTriangle, Home } from "lucide-react";
import type { AppView, SaveFile } from "../types";
import { useSillytavern } from "../../hooks/useSillytavern";

const RATING_COLOR: Record<string, string> = {
  "特级": "#AA0000",
  "一级": "#D4AF37",
  "二级": "#4B92DB",
  "三级": "#6A0DAD",
  "四级": "#555555",
};

function extractRating(战力评级: string): string {
  if (!战力评级) return "四级";
  for (const r of Object.keys(RATING_COLOR)) {
    if (战力评级.includes(r)) return r;
  }
  return "四级";
}

function formatDate(ts: number): string {
  const d = new Date(ts);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const hh = String(d.getHours()).padStart(2, "0");
  const mi = String(d.getMinutes()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd} ${hh}:${mi}`;
}

function chatToSaveFile(chat: any): SaveFile {
  const vars = chat.variables || {};
  const userVars = vars.user || {};
  const locVars = vars.系统?.地点 || {};
  const lastAssistant = [...chat.messages].reverse().find((m: any) => m.role === "assistant");
  const preview = lastAssistant?.content?.slice(0, 80) || "新的咒术之旅……";

  return {
    id: chat.id,
    characterName: userVars.名称 || chat.characterName || "未知角色",
    level: userVars.等级 ?? 1,
    rating: extractRating(userVars.战力评级),
    location: locVars.场所 ? `${locVars.地域 || ""}·${locVars.场所}` : "未知地点",
    savedAt: formatDate(chat.updatedAt),
    playtime: "0:00",
    preview: preview + (lastAssistant?.content?.length > 80 ? "……" : ""),
    updatedAt: chat.updatedAt || chat.createdAt || 0,
  };
}

interface LoadGamePageProps {
  onNavigate: (view: AppView) => void;
  onLoadSave?: (saveId: string) => void;
}

function DeleteConfirmModal({ save, onConfirm, onCancel }: { save: SaveFile; onConfirm: () => void; onCancel: () => void }) {
  return (
    <motion.div
      className="panel-overlay flex items-center justify-center px-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onCancel}
    >
      <motion.div
        className="curse-card curse-card--red w-full max-w-xs rounded-none overflow-hidden"
        style={{ background: "rgba(22,8,8,0.98)" }}
        initial={{ scale: 0.9, opacity: 0, y: 16 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0 }}
        transition={{ type: "spring", stiffness: 400, damping: 30 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 flex flex-col items-center gap-4 text-center">
          <div
            className="w-12 h-12 flex items-center justify-center"
            style={{ background: "rgba(170,0,0,0.15)", border: "1px solid rgba(170,0,0,0.4)" }}
          >
            <AlertTriangle size={22} style={{ color: "#FF4444" }} />
          </div>
          <div>
            <p className="jjk-title-section" style={{ fontSize: 14, marginBottom: 6 }}>删除存档</p>
            <p style={{ fontSize: 12, color: "var(--jjk-text-3)", fontFamily: "'Noto Sans SC', sans-serif", lineHeight: 1.7 }}>
              确定删除「{save.characterName}」的存档？<br />
              <span style={{ color: "#FF6666" }}>此操作不可撤销。</span>
            </p>
          </div>
          <div className="flex gap-3 w-full">
            <button
              className="jjk-btn jjk-btn--ghost flex-1"
              style={{ fontSize: 13 }}
              onClick={onCancel}
            >
              取消
            </button>
            <button
              className="jjk-btn jjk-btn--primary flex-1"
              style={{ fontSize: 13, background: "rgba(170,0,0,0.3)", borderColor: "rgba(170,0,0,0.7)" }}
              onClick={onConfirm}
            >
              <Trash2 size={13} />
              确认删除
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

export function LoadGamePage({ onNavigate, onLoadSave }: LoadGamePageProps) {
  const { chats, selectChat, removeChat } = useSillytavern();
  const saves = useMemo(() => {
    return chats.map(chatToSaveFile).sort((a, b) => b.updatedAt - a.updatedAt);
  }, [chats]);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const confirmDelete = async () => {
    if (deletingId) {
      await removeChat(deletingId);
      setDeletingId(null);
    }
  };

  const handleLoad = (saveId: string) => {
    selectChat(saveId);
    if (onLoadSave) onLoadSave(saveId);
    else onNavigate("game");
  };

  return (
    <div
      className="relative flex flex-col h-[100dvh] w-full overflow-hidden"
      style={{ background: "linear-gradient(165deg, #120000 0%, #1C1C1C 45%, #0a0a1a 100%)" }}
    >
      {/* Background grid */}
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: "linear-gradient(rgba(170,0,0,0.035) 1px, transparent 1px), linear-gradient(90deg,rgba(170,0,0,0.035) 1px, transparent 1px)",
            backgroundSize: "80px 80px",
          }}
        />
        <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse 100% 100% at 50% 50%, transparent 40%, rgba(0,0,0,0.75) 100%)" }} />
      </div>

      {/* Header */}
      <div
        className="relative z-10 flex items-center gap-4 px-6"
        style={{ height: 60, borderBottom: "1px solid rgba(170,0,0,0.12)" }}
      >
        <motion.button
          className="w-8 h-8 flex items-center justify-center cursor-pointer"
          style={{ background: "rgba(28,28,28,0.7)", border: "1px solid rgba(170,0,0,0.25)" }}
          whileHover={{ borderColor: "rgba(170,0,0,0.6)", background: "rgba(170,0,0,0.1)" }}
          whileTap={{ scale: 0.92 }}
          onClick={() => onNavigate("home")}
        >
          <ArrowLeft size={15} style={{ color: "var(--jjk-text-3)" }} />
        </motion.button>
        <div className="flex-1 min-w-0">
          <h1 className="jjk-title-section" style={{ fontSize: 15 }}>接续咒术之旅</h1>
          <p style={{ fontSize: 11, color: "var(--jjk-text-4)", fontFamily: "'Noto Sans SC', sans-serif" }}>
            选择存档，继续你的故事
          </p>
        </div>

        {/* Mobile exit fullscreen / home */}
        <motion.button
          className="md:hidden flex items-center justify-center w-8 h-8 cursor-pointer shrink-0"
          style={{ background: "rgba(28,28,28,0.7)", border: "1px solid rgba(170,0,0,0.25)" }}
          whileTap={{ scale: 0.92 }}
          onClick={() => {
            if (document.fullscreenElement) document.exitFullscreen?.().catch(() => {});
            onNavigate("home");
          }}
          title="退出并返回主页"
        >
          <Home size={14} style={{ color: "var(--jjk-text-3)" }} />
        </motion.button>
      </div>

      {/* Content */}
      <div className="relative z-10 flex-1 overflow-y-auto px-4 py-5 space-y-4" style={{ maxWidth: 680, margin: "0 auto", width: "100%" }}>
        {saves.length === 0 ? (
          <motion.div
            className="flex flex-col items-center justify-center gap-4 py-24"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div
              className="w-16 h-16 flex items-center justify-center"
              style={{ border: "1px solid rgba(170,0,0,0.2)", background: "rgba(170,0,0,0.05)" }}
            >
              <RotateCcw size={28} style={{ color: "rgba(170,0,0,0.35)" }} />
            </div>
            <p style={{ fontSize: 14, color: "var(--jjk-text-4)", fontFamily: "'Noto Sans SC', sans-serif" }}>
              暂无存档
            </p>
            <button
              className="jjk-btn jjk-btn--primary"
              style={{ fontSize: 13 }}
              onClick={() => onNavigate("new-game")}
            >
              开始新的咒术人生
            </button>
          </motion.div>
        ) : (
          saves.map((save, i) => {
            const ratingColor = RATING_COLOR[save.rating] || "#555";
            const isHovered = hoveredId === save.id;
            return (
              <motion.div
                key={save.id}
                className="curse-card relative overflow-hidden"
                style={{ background: isHovered ? "rgba(28,18,12,0.98)" : "rgba(22,18,12,0.9)", cursor: "pointer" }}
                initial={{ opacity: 0, x: -24 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.08, duration: 0.4 }}
                onHoverStart={() => setHoveredId(save.id)}
                onHoverEnd={() => setHoveredId(null)}
              >
                {/* Red accent line */}
                <div
                  className="absolute left-0 top-0 bottom-0"
                  style={{ width: 3, background: `linear-gradient(180deg, ${ratingColor}, transparent)` }}
                />

                <div className="px-5 py-4" style={{ paddingLeft: 20 }}>
                  {/* Top row */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      {/* Avatar placeholder */}
                      <div
                        className="w-11 h-11 flex items-center justify-center shrink-0"
                        style={{ background: "rgba(170,0,0,0.1)", border: `1px solid ${ratingColor}40` }}
                      >
                        <User size={18} style={{ color: ratingColor }} />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span
                            style={{
                              fontFamily: "'Noto Serif SC', serif",
                              fontWeight: 700,
                              fontSize: 16,
                              color: "var(--jjk-text)",
                            }}
                          >
                            {save.characterName}
                          </span>
                          <span
                            className="px-2 py-0.5"
                            style={{
                              fontSize: 10,
                              color: ratingColor,
                              border: `1px solid ${ratingColor}50`,
                              background: `${ratingColor}12`,
                              fontFamily: "'Noto Sans SC', sans-serif",
                              letterSpacing: "0.08em",
                            }}
                          >
                            {save.rating}咒术师
                          </span>
                        </div>
                        <div className="flex items-center gap-3 mt-1 flex-wrap">
                          <span className="jjk-mono" style={{ fontSize: 11, color: "var(--jjk-text-4)" }}>
                            Lv.{save.level}
                          </span>
                          <div className="flex items-center gap-1">
                            <MapPin size={10} style={{ color: "var(--jjk-text-4)" }} />
                            <span style={{ fontSize: 11, color: "var(--jjk-text-4)", fontFamily: "'Noto Sans SC', sans-serif" }}>
                              {save.location}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Star */}
                    {i === 0 && (
                      <div title="最近存档">
                        <Star size={14} style={{ color: "#D4AF37", fill: "#D4AF37" }} />
                      </div>
                    )}
                  </div>

                  {/* Preview text */}
                  <p
                    className="mt-3 line-clamp-2"
                    style={{
                      fontSize: 12,
                      color: "var(--jjk-text-3)",
                      fontFamily: "'Noto Sans SC', sans-serif",
                      lineHeight: 1.7,
                      borderLeft: "2px solid rgba(170,0,0,0.2)",
                      paddingLeft: 10,
                    }}
                  >
                    {save.preview}
                  </p>

                  {/* Bottom row */}
                  <div className="flex items-center justify-between mt-4 flex-wrap gap-3">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1.5">
                        <Clock size={10} style={{ color: "var(--jjk-text-4)" }} />
                        <span className="jjk-mono" style={{ fontSize: 10, color: "var(--jjk-text-4)" }}>
                          {save.savedAt}
                        </span>
                      </div>
                      <span className="jjk-mono" style={{ fontSize: 10, color: "rgba(170,0,0,0.5)" }}>
                        {save.playtime}h
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <motion.button
                        className="w-7 h-7 flex items-center justify-center cursor-pointer"
                        style={{ background: "rgba(0,0,0,0)", border: "1px solid rgba(170,0,0,0.2)" }}
                        whileHover={{ borderColor: "rgba(170,0,0,0.6)", background: "rgba(170,0,0,0.1)" }}
                        whileTap={{ scale: 0.9 }}
                        onClick={(e) => { e.stopPropagation(); setDeletingId(save.id); }}
                        title="删除存档"
                      >
                        <Trash2 size={12} style={{ color: "rgba(170,0,0,0.6)" }} />
                      </motion.button>
                      <motion.button
                        className="jjk-btn jjk-btn--primary"
                        style={{ fontSize: 12, padding: "6px 16px" }}
                        whileTap={{ scale: 0.96 }}
                        onClick={() => handleLoad(save.id)}
                      >
                        <RotateCcw size={12} />
                        读取
                      </motion.button>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })
        )}

        {/* New game link */}
        {saves.length > 0 && (
          <motion.div
            className="flex items-center justify-center py-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            <button
              className="cursor-pointer"
              style={{
                background: "transparent",
                border: "none",
                fontSize: 12,
                color: "var(--jjk-text-4)",
                fontFamily: "'Noto Sans SC', sans-serif",
                textDecoration: "underline",
                textDecorationColor: "rgba(170,0,0,0.3)",
              }}
              onClick={() => onNavigate("new-game")}
            >
              或者开始新的咒术人生 →
            </button>
          </motion.div>
        )}
      </div>

      {/* Delete confirm modal */}
      <AnimatePresence>
        {deletingId && (
          <DeleteConfirmModal
            save={saves.find((s) => s.id === deletingId)!}
            onConfirm={confirmDelete}
            onCancel={() => setDeletingId(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
