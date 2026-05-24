import { motion } from "motion/react";
import { MessageSquare, User, ScrollText, Users, Settings, Zap } from "lucide-react";
import type { GamePanel } from "../types";
type ActivePanel = GamePanel;

interface NavItem {
  id: ActivePanel;
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
}

const navItems: NavItem[] = [
  { id: null, label: "对话", icon: MessageSquare },
  { id: "character", label: "角色", icon: User },
  { id: "tasks", label: "任务", icon: ScrollText },
  { id: "npc", label: "人际", icon: Users },
  { id: "settings", label: "设置", icon: Settings },
];

interface NavigationBarProps {
  activePanel: ActivePanel;
  onNavigate: (panel: ActivePanel) => void;
  taskCount?: number;
}

export function NavigationBar({ activePanel, onNavigate, taskCount = 0 }: NavigationBarProps) {
  return (
    <>
      {/* Desktop: left sidebar */}
      <nav
        className="hidden md:flex flex-col items-center gap-1 py-4 shrink-0 z-10"
        style={{
          width: 64,
          background: "rgba(8,8,24,0.90)",
          borderRight: "1px solid rgba(139,92,246,0.12)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
        }}
      >
        {/* Logo mark */}
        <div className="mb-4 flex flex-col items-center">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{
              background: "linear-gradient(135deg, rgba(109,40,217,0.5), rgba(139,92,246,0.3))",
              border: "1px solid rgba(139,92,246,0.4)",
              boxShadow: "0 0 16px rgba(139,92,246,0.25)",
            }}
          >
            <Zap size={15} style={{ color: "#a78bfa" }} />
          </div>
        </div>

        {navItems.map((item) => {
          const isActive = activePanel === item.id;
          const Icon = item.icon;
          const showBadge = item.id === "tasks" && taskCount > 0;

          return (
            <div key={String(item.id)} className="relative w-full px-2">
              <motion.button
                className="relative w-full flex flex-col items-center gap-1 rounded-xl py-2.5 transition-all duration-200"
                style={{
                  background: isActive
                    ? "rgba(139,92,246,0.18)"
                    : "transparent",
                  border: isActive
                    ? "1px solid rgba(139,92,246,0.32)"
                    : "1px solid transparent",
                  boxShadow: isActive ? "0 0 16px rgba(139,92,246,0.12)" : "none",
                  cursor: "pointer",
                }}
                whileHover={{ backgroundColor: "rgba(139,92,246,0.10)" }}
                whileTap={{ scale: 0.92 }}
                onClick={() => onNavigate(item.id)}
              >
                {/* Active indicator line */}
                {isActive && (
                  <motion.div
                    layoutId="nav-active-desktop"
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-6 rounded-r-full"
                    style={{ background: "#8b5cf6" }}
                    transition={{ type: "spring", stiffness: 500, damping: 35 }}
                  />
                )}

                <Icon
                  size={18}
                  style={{ color: isActive ? "#a78bfa" : "#524d70" }}
                />
                <span
                  className="text-[9px] tracking-wider uppercase"
                  style={{
                    color: isActive ? "#a78bfa" : "#524d70",
                    fontFamily: "'Noto Sans SC', sans-serif",
                    fontWeight: 500,
                  }}
                >
                  {item.label}
                </span>

                {/* Badge */}
                {showBadge && (
                  <span
                    className="absolute top-1.5 right-1.5 min-w-[14px] h-3.5 rounded-full flex items-center justify-center text-[9px]"
                    style={{
                      background: "#ef4444",
                      color: "#fff",
                      fontWeight: 700,
                      padding: "0 3px",
                    }}
                  >
                    {taskCount}
                  </span>
                )}
              </motion.button>
            </div>
          );
        })}
      </nav>

      {/* Mobile: fixed bottom tab bar */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 flex items-center justify-around px-2 z-20 pb-safe"
        style={{
          height: 60,
          background: "rgba(8,8,24,0.96)",
          borderTop: "1px solid rgba(139,92,246,0.15)",
          backdropFilter: "blur(24px)",
          WebkitBackdropFilter: "blur(24px)",
        }}
      >
        {navItems.map((item) => {
          const isActive = activePanel === item.id;
          const Icon = item.icon;
          const showBadge = item.id === "tasks" && taskCount > 0;

          return (
            <motion.button
              key={String(item.id)}
              className="relative flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl min-w-[52px]"
              style={{ background: "transparent", border: "none", cursor: "pointer" }}
              whileTap={{ scale: 0.88 }}
              onClick={() => onNavigate(item.id)}
            >
              {isActive && (
                <motion.div
                  layoutId="nav-active-mobile"
                  className="absolute inset-0 rounded-xl"
                  style={{ background: "rgba(139,92,246,0.15)" }}
                  transition={{ type: "spring", stiffness: 500, damping: 35 }}
                />
              )}
              <Icon
                size={20}
                style={{ color: isActive ? "#a78bfa" : "#524d70", position: "relative" }}
              />
              <span
                className="text-[9px]"
                style={{
                  color: isActive ? "#a78bfa" : "#524d70",
                  fontFamily: "'Noto Sans SC', sans-serif",
                  fontWeight: 500,
                  position: "relative",
                }}
              >
                {item.label}
              </span>

              {showBadge && (
                <span
                  className="absolute top-0.5 right-0.5 w-3.5 h-3.5 rounded-full flex items-center justify-center text-[9px]"
                  style={{ background: "#ef4444", color: "#fff", fontWeight: 700 }}
                >
                  {taskCount}
                </span>
              )}
            </motion.button>
          );
        })}
      </nav>
    </>
  );
}
