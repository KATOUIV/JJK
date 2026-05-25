import { useState, useRef, useEffect } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  User, ClipboardList, Users, Package, Zap, Home, Settings,
  Send, Mic, MoreHorizontal, ChevronUp, BookOpen, SlidersHorizontal, Variable,
  Lightbulb, Eye, EyeOff, Pencil,
} from "lucide-react";
import type { AppView, GamePanel, GameState, ChatMessage } from "../types";
import { GameLeftSidebar } from "./GameLeftSidebar";
import { GameRightPanel } from "./GameRightPanel";
import { CharacterPanel } from "./CharacterPanel";
import { TaskPanel } from "./TaskPanel";
import { NPCArchive } from "./NPCArchive";
import { InventoryPanel } from "./InventoryPanel";
import { SkillsPanel } from "./SkillsPanel";

interface GameViewProps {
  gameState: GameState;
  messages: ChatMessage[];
  isTyping: boolean;
  onSendMessage: (text: string) => void;
  onNavigate: (view: AppView) => void;
  onOpenSettings: () => void;
  onOpenLorebooks: () => void;
  onOpenPresets: () => void;
  onOpenVariables: () => void;
  streamOptions: string[];
  onSelectOption: (option: string) => void;
  apiConnected: boolean;
  thinking: string;
  sum: string;
}

const MOBILE_NAV = [
  { id: "character" as GamePanel, icon: User, label: "状态" },
  { id: "tasks" as GamePanel, icon: ClipboardList, label: "任务" },
  { id: "npc" as GamePanel, icon: Users, label: "人际" },
  { id: "inventory" as GamePanel, icon: Package, label: "行囊" },
  { id: "skills" as GamePanel, icon: Zap, label: "术式" },
];

function AssistantMessage({ msg }: { msg: ChatMessage }) {
  const [showRaw, setShowRaw] = useState(false);
  return (
    <div className="flex flex-col gap-1 max-w-[85%]">
      <div
        className="px-4 py-3 relative"
        style={{
          background: "rgba(22,14,10,0.9)",
          border: "1px solid rgba(170,0,0,0.18)",
          borderLeft: "3px solid rgba(170,0,0,0.6)",
        }}
      >
        {msg.rawContent && (
          <button
            onClick={() => setShowRaw((v) => !v)}
            className="absolute top-1.5 right-1.5 cursor-pointer"
            style={{ background: "transparent", border: "none", padding: 4 }}
            title="查看原始输出"
          >
            <Pencil size={11} style={{ color: "var(--jjk-text-4)", opacity: 0.6 }} />
          </button>
        )}
        <p
          style={{
            fontSize: 14,
            color: "var(--jjk-text-2)",
            fontFamily: "'Noto Serif SC', serif",
            lineHeight: 1.9,
            whiteSpace: "pre-wrap",
          }}
        >
          {showRaw && msg.rawContent ? msg.rawContent : (msg.content || (
            msg.id === "streaming" ? (
              <span style={{ color: "var(--jjk-text-4)", fontSize: 12, fontStyle: "italic" }}>
                AI 正在输入
                <span className="typing-cursor" />
              </span>
            ) : (
              <span style={{ color: "var(--jjk-text-4)", fontSize: 12, fontStyle: "italic" }}>
                （系统内部处理，点击右上角铅笔查看原始输出）
              </span>
            )
          ))}
        </p>
        {showRaw && msg.rawContent && (
          <p style={{ fontSize: 10, color: "var(--jjk-text-4)", marginTop: 6, fontFamily: "'Share Tech Mono', monospace" }}>
            —— 原始 XML 输出 ——
          </p>
        )}
        {(msg.expGain || msg.kpGain) && (
          <div className="flex items-center gap-3 mt-2 pt-2" style={{ borderTop: "1px solid rgba(170,0,0,0.1)" }}>
            {msg.expGain && (
              <span style={{ fontSize: 11, color: "#D4AF37", fontFamily: "'Share Tech Mono', monospace" }}>
                +{msg.expGain} EXP
              </span>
            )}
            {msg.kpGain && (
              <span style={{ fontSize: 11, color: "#9B59B6", fontFamily: "'Share Tech Mono', monospace" }}>
                +{msg.kpGain} KP
              </span>
            )}
          </div>
        )}
      </div>
      <span className="jjk-mono" style={{ fontSize: 10, color: "var(--jjk-text-4)", paddingLeft: 4 }}>
        {msg.timestamp}
      </span>
    </div>
  );
}

function UserMessage({ msg }: { msg: ChatMessage }) {
  return (
    <div className="flex flex-col items-end gap-1 max-w-[75%] self-end">
      <div
        className="px-4 py-3"
        style={{
          background: "rgba(170,0,0,0.15)",
          border: "1px solid rgba(170,0,0,0.35)",
        }}
      >
        <p
          style={{
            fontSize: 14,
            color: "var(--jjk-text)",
            fontFamily: "'Noto Sans SC', sans-serif",
            lineHeight: 1.7,
          }}
        >
          {msg.content}
        </p>
      </div>
      <span className="jjk-mono" style={{ fontSize: 10, color: "var(--jjk-text-4)", paddingRight: 4 }}>
        {msg.timestamp}
      </span>
    </div>
  );
}

function SystemMessage({ msg }: { msg: ChatMessage }) {
  const [showRaw, setShowRaw] = useState(false);
  // 过滤后内容为空则彻底隐藏（系统提示不是 LLM 输出，无需占位）
  if (!msg.content) return null;
  return (
    <div className="flex justify-center py-2">
      <div
        className="px-4 py-2 max-w-[90%] relative"
        style={{
          background: "rgba(212,175,55,0.06)",
          border: "1px solid rgba(212,175,55,0.15)",
        }}
      >
        {msg.rawContent && (
          <button
            onClick={() => setShowRaw((v) => !v)}
            className="absolute top-1 right-1 cursor-pointer"
            style={{ background: "transparent", border: "none", padding: 2 }}
            title="查看原始输出"
          >
            <Pencil size={10} style={{ color: "var(--jjk-text-4)", opacity: 0.5 }} />
          </button>
        )}
        <p
          style={{
            fontSize: 12,
            color: "rgba(212,175,55,0.7)",
            fontFamily: "'Noto Serif SC', serif",
            lineHeight: 1.7,
            textAlign: "center",
            whiteSpace: "pre-wrap",
          }}
        >
          {showRaw && msg.rawContent ? msg.rawContent : msg.content}
        </p>
      </div>
    </div>
  );
}

function TypingIndicator() {
  return (
    <div className="flex items-center gap-1.5 px-4 py-3" style={{ background: "rgba(22,14,10,0.7)", border: "1px solid rgba(170,0,0,0.12)", width: "fit-content" }}>
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="w-1.5 h-1.5"
          style={{
            background: "rgba(170,0,0,0.6)",
            borderRadius: "0",
            animation: `typing-bounce 1.4s ease-in-out ${i * 0.16}s infinite`,
          }}
        />
      ))}
    </div>
  );
}

function SumBanner({ sum }: { sum: string }) {
  if (!sum) return null;
  return (
    <div className="flex justify-center py-2 shrink-0">
      <div
        className="px-4 py-2 max-w-[90%]"
        style={{
          background: "rgba(212,175,55,0.08)",
          border: "1px solid rgba(212,175,55,0.25)",
          borderLeft: "3px solid rgba(212,175,55,0.6)",
        }}
      >
        <p
          style={{
            fontSize: 12,
            color: "rgba(212,175,55,0.85)",
            fontFamily: "'Noto Serif SC', serif",
            lineHeight: 1.6,
            textAlign: "center",
          }}
        >
          {sum}
        </p>
      </div>
    </div>
  );
}

function ThinkingPanel({ thinking, show, onToggle }: { thinking: string; show: boolean; onToggle: () => void }) {
  if (!thinking) return null;
  return (
    <div className="shrink-0 px-4 pt-3">
      <div
        style={{
          background: "rgba(22,14,10,0.9)",
          border: "1px solid rgba(170,0,0,0.15)",
          borderLeft: "3px solid rgba(170,0,0,0.4)",
        }}
      >
        <button
          onClick={onToggle}
          className="flex items-center gap-2 w-full px-3 py-2 cursor-pointer"
          style={{ background: "transparent", border: "none" }}
        >
          <Lightbulb size={12} style={{ color: "rgba(212,175,55,0.7)" }} />
          <span style={{ fontSize: 11, color: "rgba(212,175,55,0.7)", fontFamily: "'Noto Sans SC', sans-serif" }}>
            AI 思考过程
          </span>
          {show ? (
            <EyeOff size={12} style={{ color: "var(--jjk-text-4)", marginLeft: "auto" }} />
          ) : (
            <Eye size={12} style={{ color: "var(--jjk-text-4)", marginLeft: "auto" }} />
          )}
        </button>
        <AnimatePresence>
          {show && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              style={{ overflow: "hidden" }}
            >
              <pre
                className="px-3 pb-3"
                style={{
                  fontSize: 11,
                  color: "var(--jjk-text-4)",
                  fontFamily: "'Share Tech Mono', monospace",
                  lineHeight: 1.7,
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-word",
                }}
              >
                {thinking}
              </pre>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function StreamOptions({ options, onSelect }: { options: string[]; onSelect: (opt: string) => void }) {
  if (!options.length) return null;
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt, idx) => (
        <motion.button
          key={idx}
          className="flex-1 min-w-0 px-3 py-2 text-xs cursor-pointer"
          style={{
            background: "rgba(170,0,0,0.12)",
            border: "1px solid rgba(170,0,0,0.4)",
            color: "#ff9999",
            fontFamily: "'Noto Sans SC', sans-serif",
          }}
          whileHover={{ background: "rgba(170,0,0,0.25)", scale: 1.02 }}
          whileTap={{ scale: 0.96 }}
          onClick={() => onSelect(opt)}
        >
          {opt}
        </motion.button>
      ))}
    </div>
  );
}

export function GameView({
  gameState,
  messages,
  isTyping,
  onSendMessage,
  onNavigate,
  onOpenSettings,
  onOpenLorebooks,
  onOpenPresets,
  onOpenVariables,
  streamOptions,
  onSelectOption,
  apiConnected,
  thinking,
  sum,
}: GameViewProps) {
  const [activePanel, setActivePanel] = useState<GamePanel>(null);
  const [inputText, setInputText] = useState("");
  const [showMobileStatus, setShowMobileStatus] = useState(false);
  const [showThinking, setShowThinking] = useState(false);
  const chatRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const handleSend = () => {
    const text = inputText.trim();
    if (!text || isTyping) return;
    setInputText("");
    onSendMessage(text);
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Global keyboard shortcuts
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      // Ignore if user is typing in an input/textarea
      const tag = (e.target as HTMLElement)?.tagName?.toLowerCase();
      if (tag === "input" || tag === "textarea") return;

      switch (e.key) {
        case "Escape":
        case "m":
        case "M":
          onNavigate("home");
          break;
        case "1":
          setActivePanel((prev) => (prev === "character" ? null : "character"));
          break;
        case "2":
          setActivePanel((prev) => (prev === "tasks" ? null : "tasks"));
          break;
        case "3":
          setActivePanel((prev) => (prev === "npc" ? null : "npc"));
          break;
        case "4":
          setActivePanel((prev) => (prev === "inventory" ? null : "inventory"));
          break;
        case "5":
          setActivePanel((prev) => (prev === "skills" ? null : "skills"));
          break;
        case "s":
        case "S":
          onOpenSettings();
          break;
        case "v":
        case "V":
          onOpenVariables();
          break;
        case "l":
        case "L":
          onOpenLorebooks();
          break;
        case "p":
        case "P":
          onOpenPresets();
          break;
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onNavigate, onOpenSettings, onOpenVariables, onOpenLorebooks, onOpenPresets]);

  const { user } = gameState;
  const hpPct = Math.round(((user.生命值?.当前值 ?? 0) / (user.生命值?.最大值 ?? 100)) * 100);
  const epPct = Math.round(((user.咒力?.当前值 ?? 0) / (user.咒力?.最大值 ?? 100)) * 100);

  return (
    <div className="flex h-screen w-full overflow-hidden" style={{ background: "#0E0A08" }}>
      {/* Left sidebar (desktop) */}
      <GameLeftSidebar
        activePanel={activePanel}
        onPanel={setActivePanel}
        onNavigate={onNavigate}
        taskCount={Object.keys(gameState.任务系统).length}
      />

      {/* Center column */}
      <div className="flex-1 flex flex-col min-w-0 relative">
        {/* Top bar */}
        <div
          className="flex items-center justify-between px-4 shrink-0"
          style={{
            height: 52,
            background: "rgba(14,10,8,0.98)",
            borderBottom: "1px solid rgba(170,0,0,0.12)",
          }}
        >
          <div className="flex items-center gap-3">
            <span style={{ fontSize: 12, color: "var(--jjk-text-4)", fontFamily: "'Noto Sans SC', sans-serif" }}>
              {gameState.系统.地点.场所}
            </span>
            <span style={{ fontSize: 11, color: "var(--jjk-text-4)", fontFamily: "'Share Tech Mono', monospace" }}>
              {gameState.系统.时间.月日} {gameState.系统.时间.时分}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {/* Mobile status toggle */}
            <motion.button
              className="lg:hidden flex items-center gap-1.5 px-2 py-1 cursor-pointer"
              style={{ background: "rgba(170,0,0,0.1)", border: "1px solid rgba(170,0,0,0.25)" }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowMobileStatus(!showMobileStatus)}
            >
              <User size={12} style={{ color: "rgba(170,0,0,0.7)" }} />
              <ChevronUp size={11} style={{ color: "var(--jjk-text-4)", transform: showMobileStatus ? "rotate(0)" : "rotate(180deg)", transition: "transform 0.2s" }} />
            </motion.button>

            {/* Tavern management buttons — unified container per fig 1-1 */}
            <div
              className="hidden md:flex items-center"
              style={{
                background: "rgba(14,10,8,0.6)",
                border: "1px solid rgba(170,0,0,0.25)",
                borderRadius: 4,
                overflow: "hidden",
              }}
            >
              {[
                { icon: BookOpen, label: "世界书", onClick: onOpenLorebooks },
                { icon: SlidersHorizontal, label: "预设", onClick: onOpenPresets },
                { icon: Variable, label: "变量", onClick: onOpenVariables },
                { icon: Settings, label: "设置", onClick: onOpenSettings },
                { icon: Home, label: "主页", onClick: () => onNavigate("home") },
              ].map((btn, idx, arr) => (
                <motion.button
                  key={btn.label}
                  className="flex items-center gap-1 px-2.5 py-1.5 cursor-pointer"
                  style={{
                    background: "transparent",
                    border: "none",
                    borderRight: idx < arr.length - 1 ? "1px solid rgba(170,0,0,0.15)" : "none",
                  }}
                  whileHover={{ background: "rgba(170,0,0,0.1)" }}
                  whileTap={{ scale: 0.95 }}
                  onClick={btn.onClick}
                  title={btn.label}
                >
                  <btn.icon size={12} style={{ color: "var(--jjk-text-4)" }} />
                  <span
                    style={{
                      fontSize: 11,
                      color: "var(--jjk-text-4)",
                      fontFamily: "'Noto Sans SC', sans-serif",
                    }}
                  >
                    {btn.label}
                  </span>
                </motion.button>
              ))}
            </div>
          </div>
        </div>

        {/* Mobile status bar */}
        <AnimatePresence>
          {showMobileStatus && (
            <motion.div
              className="lg:hidden px-4 py-3 shrink-0"
              style={{ background: "rgba(14,10,8,0.98)", borderBottom: "1px solid rgba(170,0,0,0.1)" }}
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
            >
              <div className="flex items-center justify-between mb-2">
                <span style={{ fontSize: 13, fontFamily: "'Noto Serif SC', serif", color: "var(--jjk-text-2)", fontWeight: 600 }}>
                  {user.名称}
                </span>
                <span className="jjk-mono" style={{ fontSize: 10, color: "#D4AF37" }}>Lv.{user.等级}</span>
              </div>
              <div className="space-y-1.5">
                {[
                  { label: "HP", value: user.生命值?.当前值 ?? 0, max: user.生命值?.最大值 ?? 100, pct: hpPct, cls: "jjk-bar-hp", color: "#FF4444" },
                  { label: "EP", value: user.咒力?.当前值 ?? 0, max: user.咒力?.最大值 ?? 100, pct: epPct, cls: "jjk-bar-energy", color: "#00CC66" },
                ].map((bar) => (
                  <div key={bar.label}>
                    <div className="flex items-center justify-between mb-0.5">
                      <span style={{ fontSize: 9, color: "var(--jjk-text-4)", fontFamily: "'Share Tech Mono', monospace" }}>{bar.label}</span>
                      <span className="jjk-mono" style={{ fontSize: 9, color: bar.color }}>{bar.value}/{bar.max}</span>
                    </div>
                    <div className="relative h-1.5" style={{ background: "rgba(40,30,25,0.8)" }}>
                      <div className={bar.cls} style={{ position: "absolute", top: 0, left: 0, height: "100%", width: `${bar.pct}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Sum banner (from <sum> tag) */}
        <SumBanner sum={sum} />

        {/* Thinking panel (from <thinking> tag) */}
        <ThinkingPanel
          thinking={thinking}
          show={showThinking}
          onToggle={() => setShowThinking((v) => !v)}
        />

        {/* Chat messages */}
        <div
          ref={chatRef}
          className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-4"
          style={{ minHeight: 0 }}
        >
          {messages.map((msg) =>
            msg.role === "system" ? (
              <SystemMessage key={msg.id} msg={msg} />
            ) : msg.role === "user" ? (
              <UserMessage key={msg.id} msg={msg} />
            ) : (
              <AssistantMessage key={msg.id} msg={msg} />
            )
          )}
          {isTyping && !messages.some(m => m.id === "streaming") && <TypingIndicator />}
        </div>

        {/* Stream options */}
        {streamOptions.length > 0 && (
          <div className="shrink-0 px-4 pb-2">
            <StreamOptions options={streamOptions} onSelect={onSelectOption} />
          </div>
        )}

        {/* Input area */}
        <div
          className="shrink-0 px-4 py-3"
          style={{
            background: "rgba(14,10,8,0.98)",
            borderTop: "1px solid rgba(170,0,0,0.12)",
            paddingBottom: "max(12px, env(safe-area-inset-bottom, 12px))",
          }}
        >
          <div className="flex items-end gap-3">
            <div
              className="flex-1 flex items-end gap-2"
              style={{ background: "rgba(28,20,16,0.8)", border: "1px solid rgba(170,0,0,0.2)", padding: "8px 12px 8px 14px" }}
            >
              <textarea
                ref={textareaRef}
                className="flex-1 bg-transparent resize-none outline-none"
                rows={1}
                placeholder="在咒术世界中，你会怎么做……"
                value={inputText}
                onChange={(e) => {
                  setInputText(e.target.value);
                  e.target.style.height = "auto";
                  e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px";
                }}
                onKeyDown={handleKeyDown}
                disabled={isTyping}
                style={{
                  fontSize: 14,
                  color: "var(--jjk-text)",
                  fontFamily: "'Noto Sans SC', sans-serif",
                  lineHeight: 1.6,
                  caretColor: "#AA0000",
                  maxHeight: 120,
                }}
              />
              <div className="flex items-center gap-1.5 pb-0.5">
                <motion.button
                  className="w-7 h-7 flex items-center justify-center cursor-pointer"
                  style={{ background: "transparent", border: "none" }}
                  whileHover={{ color: "var(--jjk-text-2)" }}
                  whileTap={{ scale: 0.9 }}
                >
                  <Mic size={14} style={{ color: "var(--jjk-text-4)" }} />
                </motion.button>
                <motion.button
                  className="w-8 h-8 flex items-center justify-center cursor-pointer"
                  style={{
                    background: inputText.trim() && !isTyping ? "rgba(170,0,0,0.3)" : "rgba(50,30,25,0.4)",
                    border: inputText.trim() && !isTyping ? "1px solid rgba(170,0,0,0.6)" : "1px solid rgba(100,50,50,0.2)",
                  }}
                  whileHover={inputText.trim() && !isTyping ? { background: "rgba(170,0,0,0.45)" } : {}}
                  whileTap={{ scale: 0.92 }}
                  onClick={handleSend}
                  disabled={!inputText.trim() || isTyping}
                >
                  <Send size={13} style={{ color: inputText.trim() && !isTyping ? "#FF9999" : "rgba(100,60,60,0.6)" }} />
                </motion.button>
              </div>
            </div>
          </div>
          <div className="flex items-center justify-between" style={{ marginTop: 4 }}>
            <p style={{ fontSize: 10, color: "rgba(100,60,60,0.5)", fontFamily: "'Share Tech Mono', monospace" }}>
              ENTER 发送 · SHIFT+ENTER 换行 · ESC/M 主页 · 1~5 面板 · S 设置 · V 变量 · L 世界书 · P 预设
            </p>
            {apiConnected && (
              <div className="flex items-center gap-1.5">
                <span
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: "50%",
                    background: "#00CC66",
                    display: "inline-block",
                    boxShadow: "0 0 4px #00CC66",
                  }}
                />
                <span style={{ fontSize: 10, color: "#00CC66", fontFamily: "'Share Tech Mono', monospace" }}>
                  链接就绪
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Mobile bottom nav */}
        <div
          className="md:hidden flex items-center justify-around shrink-0"
          style={{
            height: 56,
            background: "rgba(10,6,4,0.98)",
            borderTop: "1px solid rgba(170,0,0,0.2)",
            paddingBottom: "env(safe-area-inset-bottom, 0px)",
          }}
        >
          {MOBILE_NAV.map(({ id, icon: Icon, label }) => {
            const isActive = activePanel === id;
            return (
              <motion.button
                key={id}
                className="flex flex-col items-center justify-center gap-0.5 flex-1 h-full cursor-pointer"
                style={{ background: "transparent", border: "none" }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setActivePanel(activePanel === id ? null : id)}
              >
                {isActive && (
                  <motion.div
                    className="absolute top-0 inset-x-0"
                    style={{ height: 2, background: "#AA0000" }}
                    layoutId="mobile-nav-active"
                  />
                )}
                <Icon size={17} style={{ color: isActive ? "#FF6666" : "var(--jjk-text-4)" }} />
                <span style={{ fontSize: 9, color: isActive ? "#FF9999" : "var(--jjk-text-4)", fontFamily: "'Noto Sans SC', sans-serif" }}>
                  {label}
                </span>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Right status panel (large desktop) */}
      <GameRightPanel gameState={gameState} />

      {/* Modals */}
      <AnimatePresence>
        {activePanel === "character" && (
          <CharacterPanel gameState={gameState} onClose={() => setActivePanel(null)} />
        )}
        {activePanel === "tasks" && (
          <TaskPanel gameState={gameState} onClose={() => setActivePanel(null)} />
        )}
        {activePanel === "npc" && (
          <NPCArchive gameState={gameState} onClose={() => setActivePanel(null)} />
        )}
        {activePanel === "inventory" && (
          <InventoryPanel gameState={gameState} onClose={() => setActivePanel(null)} />
        )}
        {activePanel === "skills" && (
          <SkillsPanel gameState={gameState} onClose={() => setActivePanel(null)} />
        )}
      </AnimatePresence>
    </div>
  );
}
