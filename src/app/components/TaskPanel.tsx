import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, ClipboardList, ChevronDown, Coins, Star, Package } from "lucide-react";
import type { GameState } from "../types";

interface TaskPanelProps {
  gameState: GameState;
  onClose: () => void;
}

const GRADE_COLORS: Record<string, { color: string; bg: string; border: string }> = {
  "特级": { color: "#FF4444", bg: "rgba(170,0,0,0.15)", border: "rgba(170,0,0,0.5)" },
  "一级": { color: "#D4AF37", bg: "rgba(212,175,55,0.12)", border: "rgba(212,175,55,0.4)" },
  "二级": { color: "#4B92DB", bg: "rgba(75,146,219,0.1)", border: "rgba(75,146,219,0.35)" },
  "三级": { color: "#9B59B6", bg: "rgba(106,13,173,0.1)", border: "rgba(106,13,173,0.3)" },
  "四级": { color: "#888", bg: "rgba(80,80,80,0.1)", border: "rgba(80,80,80,0.3)" },
  "特殊": { color: "#00CC88", bg: "rgba(0,170,100,0.1)", border: "rgba(0,170,100,0.3)" },
};

function TaskCard({ taskId, task }: {
  taskId: string;
  task: GameState["任务系统"][string];
}) {
  const [open, setOpen] = useState(false);
  const grade = GRADE_COLORS[task.任务等级] || GRADE_COLORS["四级"];

  return (
    <motion.div
      className="overflow-hidden"
      style={{ background: "rgba(22,14,10,0.8)", border: `1px solid ${grade.border}30` }}
      layout
    >
      <button
        type="button"
        className="w-full flex items-start gap-3 px-4 py-3 text-left cursor-pointer"
        onClick={() => setOpen(!open)}
      >
        <div
          className="shrink-0 px-1.5 py-0.5 mt-0.5"
          style={{ background: grade.bg, border: `1px solid ${grade.border}`, minWidth: 36, textAlign: "center" }}
        >
          <span style={{ fontSize: 10, color: grade.color, fontFamily: "'Noto Sans SC', sans-serif" }}>
            {task.任务等级}
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <p style={{ fontSize: 13, color: "var(--jjk-text-2)", fontFamily: "'Noto Serif SC', serif", fontWeight: 600, lineHeight: 1.3 }}>
            {task.任务名}
          </p>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <span style={{ fontSize: 10, color: "var(--jjk-text-4)", fontFamily: "'Noto Sans SC', sans-serif" }}>
              {task.委托人或势力}
            </span>
            <span
              className="px-1.5"
              style={{
                fontSize: 9,
                color: task.类型 === "正道" ? "#4B92DB" : "#AA0000",
                border: `1px solid ${task.类型 === "正道" ? "rgba(75,146,219,0.3)" : "rgba(170,0,0,0.3)"}`,
                fontFamily: "'Noto Sans SC', sans-serif",
              }}
            >
              {task.类型}
            </span>
          </div>
        </div>
        <ChevronDown
          size={13}
          style={{
            color: "var(--jjk-text-4)",
            transform: open ? "rotate(180deg)" : "rotate(0deg)",
            transition: "transform 0.2s",
            flexShrink: 0,
            marginTop: 4,
          }}
        />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22 }}
            style={{ overflow: "hidden" }}
          >
            <div className="px-4 pb-4" style={{ borderTop: `1px solid ${grade.border}20` }}>
              <p style={{ fontSize: 12, color: "var(--jjk-text-3)", fontFamily: "'Noto Sans SC', sans-serif", lineHeight: 1.8, paddingTop: 10 }}>
                {task.任务描述}
              </p>

              <div className="mt-3 space-y-1.5">
                <div className="flex items-start gap-2">
                  <span style={{ fontSize: 10, color: "#00CC66", fontFamily: "'Noto Sans SC', sans-serif", flexShrink: 0, marginTop: 1 }}>完成条件</span>
                  <span style={{ fontSize: 11, color: "var(--jjk-text-3)", fontFamily: "'Noto Sans SC', sans-serif", lineHeight: 1.6 }}>{task.完成条件}</span>
                </div>
                {task.失败条件 && task.失败条件 !== "无" && (
                  <div className="flex items-start gap-2">
                    <span style={{ fontSize: 10, color: "#FF4444", fontFamily: "'Noto Sans SC', sans-serif", flexShrink: 0, marginTop: 1 }}>失败条件</span>
                    <span style={{ fontSize: 11, color: "var(--jjk-text-3)", fontFamily: "'Noto Sans SC', sans-serif", lineHeight: 1.6 }}>{task.失败条件}</span>
                  </div>
                )}
              </div>

              <div
                className="mt-3 px-3 py-2.5 flex items-center gap-4 flex-wrap"
                style={{ background: "rgba(212,175,55,0.05)", border: "1px solid rgba(212,175,55,0.12)" }}
              >
                <span style={{ fontSize: 10, color: "rgba(212,175,55,0.6)", fontFamily: "'Share Tech Mono', monospace" }}>REWARD</span>
                {task.报酬.金钱 > 0 && (
                  <div className="flex items-center gap-1.5">
                    <Coins size={11} style={{ color: "#D4AF37" }} />
                    <span className="jjk-mono" style={{ fontSize: 11, color: "#D4AF37" }}>
                      ¥{task.报酬.金钱.toLocaleString()}
                    </span>
                  </div>
                )}
                {task.报酬.名望提升值 > 0 && (
                  <div className="flex items-center gap-1.5">
                    <Star size={11} style={{ color: "#4B92DB" }} />
                    <span className="jjk-mono" style={{ fontSize: 11, color: "#4B92DB" }}>
                      名望 +{task.报酬.名望提升值}
                    </span>
                  </div>
                )}
                {Object.entries(task.报酬.物品).map(([item, qty]) => (
                  <div key={item} className="flex items-center gap-1.5">
                    <Package size={11} style={{ color: "#9B59B6" }} />
                    <span style={{ fontSize: 11, color: "#9B59B6", fontFamily: "'Noto Sans SC', sans-serif" }}>
                      {item} ×{qty}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export function TaskPanel({ gameState, onClose }: TaskPanelProps) {
  const tasks = gameState.任务系统;
  const taskEntries = Object.entries(tasks);

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
        <div className="flex justify-center pt-3 pb-1">
          <div style={{ width: 36, height: 3, background: "rgba(170,0,0,0.3)" }} />
        </div>

        <div
          className="flex items-center justify-between px-5 py-3 shrink-0"
          style={{ borderBottom: "1px solid rgba(170,0,0,0.12)" }}
        >
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 flex items-center justify-center" style={{ background: "rgba(170,0,0,0.1)", border: "1px solid rgba(170,0,0,0.3)" }}>
              <ClipboardList size={14} style={{ color: "#FF6666" }} />
            </div>
            <div>
              <h2 className="jjk-title-section" style={{ fontSize: 14 }}>任务清单</h2>
              <p className="jjk-mono" style={{ fontSize: 10, color: "var(--jjk-text-4)" }}>{taskEntries.length} 个进行中</p>
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

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
          {taskEntries.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-12">
              <ClipboardList size={28} style={{ color: "rgba(170,0,0,0.2)" }} />
              <p style={{ fontSize: 13, color: "var(--jjk-text-4)", fontFamily: "'Noto Sans SC', sans-serif" }}>暂无进行中的任务</p>
            </div>
          ) : (
            taskEntries.map(([id, task]) => (
              <TaskCard key={id} taskId={id} task={task} />
            ))
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
