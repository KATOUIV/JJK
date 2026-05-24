import { motion } from "motion/react";
import { User, ClipboardList, Users, Package, Zap } from "lucide-react";
import type { GamePanel, AppView } from "../types";

interface GameLeftSidebarProps {
  activePanel: GamePanel;
  onPanel: (p: GamePanel) => void;
  onNavigate: (view: AppView) => void;
  taskCount?: number;
}

const NAV_ITEMS: { id: GamePanel; label: string; icon: React.ElementType; badge?: number }[] = [
  { id: "character", label: "咒术师状态", icon: User },
  { id: "tasks", label: "任务清单", icon: ClipboardList },
  { id: "npc", label: "人际档案", icon: Users },
  { id: "inventory", label: "咒术行囊", icon: Package },
  { id: "skills", label: "术式技能", icon: Zap },
];

export function GameLeftSidebar({ activePanel, onPanel, onNavigate, taskCount }: GameLeftSidebarProps) {
  const handleClick = (id: GamePanel) => {
    onPanel(activePanel === id ? null : id);
  };

  return (
    <div
      className="hidden md:flex flex-col h-full relative z-10"
      style={{
        width: 220,
        flexShrink: 0,
        background: "rgba(14,10,8,0.96)",
        borderRight: "1px solid rgba(170,0,0,0.15)",
      }}
    >
      {/* Brand */}
      <div
        className="flex items-center px-4 shrink-0"
        style={{ height: 52, borderBottom: "1px solid rgba(170,0,0,0.12)" }}
      >
        <span
          className="jjk-mono"
          style={{ color: "rgba(170,0,0,0.5)", fontSize: 10, letterSpacing: "0.18em" }}
        >
          SANCTUM
        </span>
      </div>

      {/* Nav items */}
      <div className="flex-1 py-3 flex flex-col gap-0.5 overflow-y-auto">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = activePanel === item.id;
          const badge = item.id === "tasks" && taskCount ? taskCount : undefined;
          return (
            <motion.button
              key={item.id}
              className="relative flex items-center gap-3 mx-2 px-3 py-2.5 cursor-pointer text-left"
              style={{
                background: isActive ? "rgba(170,0,0,0.15)" : "rgba(0,0,0,0)",
                border: isActive ? "1px solid rgba(170,0,0,0.3)" : "1px solid rgba(0,0,0,0)",
              }}
              whileHover={{ background: isActive ? "rgba(170,0,0,0.18)" : "rgba(170,0,0,0.06)" }}
              whileTap={{ scale: 0.97 }}
              onClick={() => handleClick(item.id)}
            >
              {/* Active left bar */}
              {isActive && (
                <motion.div
                  className="absolute left-0 top-2 bottom-2"
                  style={{ width: 2, background: "#AA0000" }}
                  layoutId="sidebar-active"
                />
              )}
              <Icon
                size={15}
                style={{ color: isActive ? "#FF6666" : "var(--jjk-text-4)", flexShrink: 0 }}
              />
              <span
                style={{
                  fontSize: 13,
                  color: isActive ? "var(--jjk-text)" : "var(--jjk-text-3)",
                  fontFamily: "'Noto Sans SC', sans-serif",
                }}
              >
                {item.label}
              </span>
              {badge && (
                <span
                  className="ml-auto flex items-center justify-center"
                  style={{
                    minWidth: 18, height: 18, fontSize: 10,
                    background: "rgba(170,0,0,0.4)",
                    border: "1px solid rgba(170,0,0,0.5)",
                    color: "#FF9999",
                    fontFamily: "'Share Tech Mono', monospace",
                    padding: "0 4px",
                  }}
                >
                  {badge}
                </span>
              )}
            </motion.button>
          );
        })}
      </div>

      {/* Bottom spacer */}
      <div className="shrink-0" style={{ height: 12 }} />
    </div>
  );
}
