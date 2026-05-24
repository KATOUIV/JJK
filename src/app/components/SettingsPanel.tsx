import { useState } from "react";
import { motion } from "motion/react";
import { X, Settings, Volume2, VolumeX, Bell, BellOff, Eye, EyeOff, Info, Gamepad2, BookOpen, Keyboard } from "lucide-react";

interface SettingsPanelProps {
  onClose: () => void;
}

function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <motion.button
      className="relative w-10 h-5.5 rounded-full flex-shrink-0"
      style={{
        background: value ? "linear-gradient(90deg,#6d28d9,#8b5cf6)" : "rgba(139,92,246,0.12)",
        border: value ? "1px solid rgba(139,92,246,0.5)" : "1px solid rgba(139,92,246,0.18)",
        cursor: "pointer",
        minWidth: 40,
        height: 22,
      }}
      onClick={() => onChange(!value)}
      whileTap={{ scale: 0.92 }}
    >
      <motion.div
        className="absolute top-0.5 w-4 h-4 rounded-full"
        style={{
          background: value ? "#fff" : "#524d70",
          top: 3,
          left: value ? "calc(100% - 19px)" : 3,
        }}
        animate={{ left: value ? "calc(100% - 19px)" : 3 }}
        transition={{ type: "spring", stiffness: 500, damping: 30 }}
      />
    </motion.button>
  );
}

function SettingRow({
  icon: Icon,
  label,
  description,
  control,
}: {
  icon: React.ComponentType<{ size?: number }>;
  label: string;
  description?: string;
  control: React.ReactNode;
}) {
  return (
    <div
      className="flex items-center gap-3 p-3.5 rounded-xl"
      style={{ background: "rgba(14,10,38,0.55)", border: "1px solid rgba(139,92,246,0.10)" }}
    >
      <div
        className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
        style={{ background: "rgba(139,92,246,0.12)", border: "1px solid rgba(139,92,246,0.20)" }}
      >
        <Icon size={14} />
      </div>
      <div className="flex-1 min-w-0">
        <span className="text-sm block" style={{ color: "#ede9fe", fontFamily: "'Noto Sans SC', sans-serif", fontWeight: 500 }}>
          {label}
        </span>
        {description && (
          <span className="text-xs" style={{ color: "#524d70", fontFamily: "'Noto Sans SC', sans-serif" }}>
            {description}
          </span>
        )}
      </div>
      {control}
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 mb-2 mt-5 first:mt-0">
      <span
        className="text-[10px] tracking-widest uppercase"
        style={{ color: "#524d70", fontFamily: "'Noto Sans SC', sans-serif", fontWeight: 500 }}
      >
        {children}
      </span>
      <div className="flex-1 h-px" style={{ background: "rgba(139,92,246,0.08)" }} />
    </div>
  );
}

export function SettingsPanel({ onClose }: SettingsPanelProps) {
  const [settings, setSettings] = useState({
    sound: true,
    bgm: true,
    notifications: true,
    hints: true,
    contentWarning: true,
    autoScroll: true,
    compactMode: false,
  });

  const set = (key: keyof typeof settings) => (v: boolean) =>
    setSettings((s) => ({ ...s, [key]: v }));

  return (
    <motion.div
      className="panel-overlay flex items-end md:items-center justify-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="relative w-full md:w-[480px] md:max-w-[90vw] max-h-[85vh] flex flex-col rounded-t-2xl md:rounded-2xl overflow-hidden"
        style={{
          background: "rgba(10,8,28,0.97)",
          border: "1px solid rgba(139,92,246,0.22)",
          boxShadow: "0 -20px 80px rgba(0,0,0,0.7), 0 0 0 1px rgba(139,92,246,0.15)",
          backdropFilter: "blur(32px)",
        }}
        initial={{ y: 60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 60, opacity: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-5 py-4 shrink-0"
          style={{ borderBottom: "1px solid rgba(139,92,246,0.14)" }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center"
              style={{ background: "rgba(139,92,246,0.15)", border: "1px solid rgba(139,92,246,0.28)" }}
            >
              <Settings size={15} style={{ color: "#a78bfa" }} />
            </div>
            <h2 style={{ color: "#ede9fe", fontFamily: "'Noto Serif SC', serif", fontWeight: 700, fontSize: 16, lineHeight: 1 }}>
              系统设置
            </h2>
          </div>
          <button
            className="w-8 h-8 rounded-xl flex items-center justify-center"
            style={{ background: "rgba(139,92,246,0.10)", border: "1px solid rgba(139,92,246,0.20)", cursor: "pointer" }}
            onClick={onClose}
          >
            <X size={15} style={{ color: "#7c6da8" }} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4">
          <SectionTitle>音效</SectionTitle>
          <div className="space-y-2">
            <SettingRow icon={Volume2} label="音效" description="界面操作音效" control={<Toggle value={settings.sound} onChange={set("sound")} />} />
            <SettingRow icon={Volume2} label="背景音乐" description="环境背景音乐" control={<Toggle value={settings.bgm} onChange={set("bgm")} />} />
          </div>

          <SectionTitle>体验</SectionTitle>
          <div className="space-y-2">
            <SettingRow icon={Bell} label="系统通知" description="游戏内事件提示" control={<Toggle value={settings.notifications} onChange={set("notifications")} />} />
            <SettingRow icon={Eye} label="新手提示" description="操作引导提示" control={<Toggle value={settings.hints} onChange={set("hints")} />} />
            <SettingRow icon={Eye} label="内容警告" description="敏感剧情前置提示" control={<Toggle value={settings.contentWarning} onChange={set("contentWarning")} />} />
            <SettingRow icon={Eye} label="自动滚动" description="新消息自动滚动到底部" control={<Toggle value={settings.autoScroll} onChange={set("autoScroll")} />} />
            <SettingRow icon={Eye} label="紧凑模式" description="缩减界面元素间距" control={<Toggle value={settings.compactMode} onChange={set("compactMode")} />} />
          </div>

          <SectionTitle>关于</SectionTitle>
          <div className="space-y-2">
            <div
              className="p-4 rounded-xl"
              style={{ background: "rgba(14,10,38,0.55)", border: "1px solid rgba(139,92,246,0.10)" }}
            >
              <div className="flex items-center gap-3 mb-3">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{
                    background: "linear-gradient(135deg, rgba(109,40,217,0.5), rgba(139,92,246,0.3))",
                    border: "1px solid rgba(139,92,246,0.4)",
                    boxShadow: "0 0 20px rgba(139,92,246,0.2)",
                  }}
                >
                  <Gamepad2 size={18} style={{ color: "#a78bfa" }} />
                </div>
                <div>
                  <p className="text-sm" style={{ color: "#ede9fe", fontFamily: "'Noto Serif SC', serif", fontWeight: 700 }}>
                    SANCTUM
                  </p>
                  <p className="text-xs" style={{ color: "#524d70", fontFamily: "'Share Tech Mono', monospace" }}>
                    v0.1.0-alpha · LLM驱动的沉浸式剧本
                  </p>
                </div>
              </div>
              <p
                className="text-xs leading-relaxed"
                style={{ color: "#7c6da8", fontFamily: "'Noto Sans SC', sans-serif" }}
              >
                本作品基于咒術廻戦世界观的同人交互剧本，由大型语言模型驱动叙事与角色行为。所有内容均为创作虚构，不代表原著立场。
              </p>
            </div>

            <div className="flex gap-2 p-3 rounded-xl" style={{ background: "rgba(14,10,38,0.40)", border: "1px solid rgba(139,92,246,0.08)" }}>
              <Keyboard size={12} style={{ color: "#524d70", flexShrink: 0, marginTop: 2 }} />
              <div>
                <p className="text-xs mb-1" style={{ color: "#524d70", fontFamily: "'Noto Sans SC', sans-serif", fontWeight: 500 }}>键盘快捷键</p>
                <p className="text-xs" style={{ color: "#3d3860", fontFamily: "'Share Tech Mono', monospace" }}>Enter — 发送 · Shift+Enter — 换行</p>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
