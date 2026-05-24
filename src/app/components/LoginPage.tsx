import { useState } from "react";
import { motion } from "motion/react";
import { X, User, Lock, Eye, EyeOff, LogIn, UserPlus, AlertCircle } from "lucide-react";
import type { AppView } from "../types";

interface LoginPageProps {
  onClose: () => void;
  onNavigate: (view: AppView) => void;
}

export function LoginPage({ onClose }: LoginPageProps) {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [showPwd, setShowPwd] = useState(false);
  const [form, setForm] = useState({ username: "", password: "", confirm: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.username.trim() || !form.password) { setError("请填写完整信息"); return; }
    if (mode === "register" && form.password !== form.confirm) { setError("两次密码不一致"); return; }
    setError("");
    setLoading(true);
    setTimeout(() => { setLoading(false); onClose(); }, 1500);
  };

  return (
    <motion.div
      className="panel-overlay flex items-center justify-center px-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="curse-card curse-card--gold w-full max-w-sm rounded-none overflow-hidden"
        style={{ background: "rgba(22,18,12,0.98)" }}
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0 }}
        transition={{ type: "spring", stiffness: 400, damping: 30 }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-5 py-4"
          style={{ borderBottom: "1px solid rgba(212,175,55,0.15)" }}
        >
          <h2 className="jjk-title-section" style={{ fontSize: 15 }}>
            {mode === "login" ? "咒术师账号登录" : "注册新账号"}
          </h2>
          <button
            id="login-close"
            className="w-7 h-7 flex items-center justify-center cursor-pointer"
            style={{ border: "1px solid rgba(170,0,0,0.25)", background: "transparent" }}
            onClick={onClose}
          >
            <X size={13} style={{ color: "var(--jjk-text-3)" }} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Username */}
          <div>
            <label className="block mb-1.5" style={{ fontSize: 12, color: "var(--jjk-text-3)", fontFamily: "'Noto Sans SC', sans-serif" }}>
              咒术师代号
            </label>
            <div className="relative">
              <User size={13} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--jjk-text-4)" }} />
              <input
                id="login-username"
                className="jjk-input"
                style={{ paddingLeft: 32 }}
                placeholder="输入你的代号"
                value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })}
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="block mb-1.5" style={{ fontSize: 12, color: "var(--jjk-text-3)", fontFamily: "'Noto Sans SC', sans-serif" }}>
              封印密钥
            </label>
            <div className="relative">
              <Lock size={13} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--jjk-text-4)" }} />
              <input
                id="login-password"
                className="jjk-input"
                type={showPwd ? "text" : "password"}
                style={{ paddingLeft: 32, paddingRight: 36 }}
                placeholder="输入密钥"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer"
                style={{ background: "transparent", border: "none", color: "var(--jjk-text-4)" }}
                onClick={() => setShowPwd(!showPwd)}
              >
                {showPwd ? <EyeOff size={13} /> : <Eye size={13} />}
              </button>
            </div>
          </div>

          {/* Confirm password (register only) */}
          {mode === "register" && (
            <div>
              <label className="block mb-1.5" style={{ fontSize: 12, color: "var(--jjk-text-3)", fontFamily: "'Noto Sans SC', sans-serif" }}>
                确认密钥
              </label>
              <div className="relative">
                <Lock size={13} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--jjk-text-4)" }} />
                <input
                  id="login-confirm"
                  className="jjk-input"
                  type="password"
                  style={{ paddingLeft: 32 }}
                  placeholder="再次输入密钥"
                  value={form.confirm}
                  onChange={(e) => setForm({ ...form, confirm: e.target.value })}
                />
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 px-3 py-2" style={{ background: "rgba(170,0,0,0.12)", border: "1px solid rgba(170,0,0,0.3)" }}>
              <AlertCircle size={12} style={{ color: "#FF6666", flexShrink: 0 }} />
              <span style={{ fontSize: 12, color: "#FF6666", fontFamily: "'Noto Sans SC', sans-serif" }}>{error}</span>
            </div>
          )}

          {/* Submit */}
          <button
            id="login-submit"
            type="submit"
            className="jjk-btn jjk-btn--primary w-full"
            disabled={loading}
          >
            {loading ? (
              <span style={{ color: "var(--jjk-text-2)" }}>验证中...</span>
            ) : (
              <>
                {mode === "login" ? <LogIn size={14} /> : <UserPlus size={14} />}
                {mode === "login" ? "进入咒术世界" : "创建咒术档案"}
              </>
            )}
          </button>

          {/* Mode toggle + forgot */}
          <div className="flex items-center justify-between pt-1">
            <button
              type="button"
              className="cursor-pointer"
              style={{ background: "transparent", border: "none", fontSize: 12, color: "var(--jjk-text-4)", fontFamily: "'Noto Sans SC', sans-serif" }}
              onClick={() => { setMode(mode === "login" ? "register" : "login"); setError(""); }}
            >
              {mode === "login" ? "注册账号" : "已有账号？登录"}
            </button>
            {mode === "login" && (
              <button
                type="button"
                className="cursor-pointer"
                style={{ background: "transparent", border: "none", fontSize: 12, color: "var(--jjk-text-4)", fontFamily: "'Noto Sans SC', sans-serif" }}
              >
                忘记密码？
              </button>
            )}
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}
