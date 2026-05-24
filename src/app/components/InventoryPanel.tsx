import { motion, AnimatePresence } from "motion/react";
import { X, Package, Coins, Info } from "lucide-react";
import { useState } from "react";
import type { GameState } from "../types";

interface InventoryPanelProps {
  gameState: GameState;
  onClose: () => void;
}

export function InventoryPanel({ gameState, onClose }: InventoryPanelProps) {
  const { user } = gameState;
  const [selectedItem, setSelectedItem] = useState<string | null>(null);
  const items = Object.entries(user.行囊);

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
          maxHeight: "85vh",
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
            <div className="w-7 h-7 flex items-center justify-center" style={{ background: "rgba(170,0,0,0.1)", border: "1px solid rgba(170,0,0,0.3)" }}>
              <Package size={14} style={{ color: "#FF6666" }} />
            </div>
            <div>
              <h2 className="jjk-title-section" style={{ fontSize: 14 }}>咒术行囊</h2>
              <p style={{ fontSize: 10, color: "var(--jjk-text-4)", fontFamily: "'Share Tech Mono', monospace" }}>
                {items.length} 件物品
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <Coins size={13} style={{ color: "#D4AF37" }} />
              <span className="jjk-mono" style={{ fontSize: 12, color: "#D4AF37" }}>{user.持有金钱.toLocaleString()}</span>
            </div>
            <button
              className="w-7 h-7 flex items-center justify-center cursor-pointer"
              style={{ border: "1px solid rgba(170,0,0,0.25)", background: "transparent" }}
              onClick={onClose}
            >
              <X size={13} style={{ color: "var(--jjk-text-3)" }} />
            </button>
          </div>
        </div>

        {/* Item grid */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 py-12">
              <Package size={32} style={{ color: "rgba(170,0,0,0.2)" }} />
              <p style={{ fontSize: 13, color: "var(--jjk-text-4)", fontFamily: "'Noto Sans SC', sans-serif" }}>行囊空空如也</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-2">
              {items.map(([name, data]) => (
                <motion.div
                  key={name}
                  className="flex items-center justify-between gap-3 px-4 py-3 cursor-pointer"
                  style={{
                    background: selectedItem === name ? "rgba(170,0,0,0.12)" : "rgba(28,20,16,0.6)",
                    border: selectedItem === name ? "1px solid rgba(170,0,0,0.4)" : "1px solid rgba(170,0,0,0.1)",
                  }}
                  whileHover={{ background: "rgba(170,0,0,0.08)" }}
                  onClick={() => setSelectedItem(selectedItem === name ? null : name)}
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="w-8 h-8 flex items-center justify-center shrink-0"
                      style={{ background: "rgba(170,0,0,0.1)", border: "1px solid rgba(170,0,0,0.2)" }}>
                      <Package size={13} style={{ color: "rgba(170,0,0,0.6)" }} />
                    </div>
                    <div className="min-w-0">
                      <p style={{ fontSize: 13, color: "var(--jjk-text-2)", fontFamily: "'Noto Sans SC', sans-serif" }}>{name}</p>
                      <AnimatePresence>
                        {selectedItem === name && (
                          <motion.p
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            style={{ fontSize: 11, color: "var(--jjk-text-4)", fontFamily: "'Noto Sans SC', sans-serif", lineHeight: 1.6, overflow: "hidden" }}
                          >
                            {data.描述}
                          </motion.p>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="jjk-mono" style={{ fontSize: 11, color: "var(--jjk-text-3)" }}>x{data.数量}</span>
                    <Info size={12} style={{ color: "var(--jjk-text-4)" }} />
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
