import { useState } from "react";
import { motion } from "motion/react";
import { X, User, Lock, Mail, Eye, EyeOff, LogIn, UserPlus, AlertCircle, ShieldCheck, Send } from "lucide-react";
import type { AppView } from "../types";

interface LoginPageProps {
  onClose: () => void;
  onNavigate: (view: AppView) => void;
  onLogin?: (email: string) => void;
}

function isQQEmail(email: string): boolean {
  return /^[1-9]\d{4,10}@qq\.com$/i.test(email.trim());
}

export function LoginPage({ onClose, onNavigate, onLogin }: LoginPageProps) {
  const [mode, setMode] = useState<"login" | "register">("register");
  const [showPwd, setShowPwd] = useState(false);
  const [form, setForm] = useState({ email: "", password: "", confirm: "", code: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [verifyToken, setVerifyToken] = useState("");
  const [codeSent, setCodeSent] = useState(false);
  const [countdown, setCountdown] = useState(0);

  const registeredUsers = JSON.parse(localStorage.getItem("jjk_registered_users") || "[]") as string[];

  const sendCode = async () => {
    const emailInput = document.getElementById("login-email") as HTMLInputElement | null;
    const email = (emailInput?.value ?? form.email).trim();
    if (!isQQEmail(email)) { setError("请输入正确的 QQ 邮箱（如 123456@qq.com）"); return; }
    if (mode === "register" && registeredUsers.includes(email)) { setError("该邮箱已注册，请直接登录"); return; }
    if (mode === "login" && !registeredUsers.includes(email)) { setError("该邮箱未注册，请先注册"); return; }

    setError("");
    setLoading(true);

    try {
      const res = await fetch('/api/send-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || '发送验证码失败');
        setLoading(false);
        return;
      }
      setVerifyToken(data.token);
      setCodeSent(true);
      setCountdown(60);
      const timer = setInterval(() => {
        setCountdown((c) => {
          if (c <= 1) { clearInterval(timer); return 0; }
          return c - 1;
        });
      }, 1000);
    } catch {
      setError('网络错误，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const email = form.email.trim();
    if (!isQQEmail(email)) { setError("请输入正确的 QQ 邮箱"); return; }
    if (mode === "register" && !form.password) { setError("请设置密码"); return; }
    if (mode === "register" && form.password !== form.confirm) { setError("两次密码不一致"); return; }

    if (mode === "register") {
      if (!form.code || form.code.length !== 6) { setError("请输入 6 位验证码"); return; }
      if (!verifyToken) { setError("请先获取验证码"); return; }
    }

    setError("");
    setLoading(true);

    try {
      if (mode === "register") {
        const res = await fetch('/api/send-verification', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, action: 'verify', token: verifyToken, code: form.code }),
        });
        const data = await res.json();
        if (!res.ok || !data.valid) {
          setError(data.error || '验证码错误或已过期');
          setLoading(false);
          return;
        }
      }

      if (mode === "register") {
        if (!registeredUsers.includes(email)) {
          registeredUsers.push(email);
          localStorage.setItem("jjk_registered_users", JSON.stringify(registeredUsers));
        }
        localStorage.setItem("jjk_current_user_email", email);
        localStorage.setItem(`jjk_user_${email}_password`, form.password);
      } else {
        const storedPwd = localStorage.getItem(`jjk_user_${email}_password`);
        if (storedPwd && storedPwd !== form.password) { setError("密码错误"); setLoading(false); return; }
        localStorage.setItem("jjk_current_user_email", email);
      }

      setVerifyToken("");
      onLogin?.(email);
      onClose();
    } catch {
      setError('网络错误，请稍后重试');
    } finally {
      setLoading(false);
    }
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
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: "1px solid rgba(212,175,55,0.15)" }}>
          <h2 className="jjk-title-section" style={{ fontSize: 15 }}>
            {mode === "login" ? "咒术师账号登录" : "注册咒术档案"}
          </h2>
          <button id="login-close" className="w-7 h-7 flex items-center justify-center cursor-pointer" style={{ border: "1px solid rgba(170,0,0,0.25)", background: "transparent" }} onClick={onClose}>
            <X size={13} style={{ color: "var(--jjk-text-3)" }} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* QQ Email */}
          <div>
            <label className="block mb-1.5" style={{ fontSize: 12, color: "var(--jjk-text-3)", fontFamily: "'Noto Sans SC', sans-serif" }}>
              QQ 邮箱
            </label>
            <div className="relative">
              <Mail size={13} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--jjk-text-4)" }} />
              <input
                id="login-email"
                className="jjk-input"
                style={{ paddingLeft: 32 }}
                placeholder="123456@qq.com"
                autoComplete="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>
          </div>

          {/* Verification Code (register only) */}
          {mode === "register" && (
            <div>
              <label className="block mb-1.5" style={{ fontSize: 12, color: "var(--jjk-text-3)", fontFamily: "'Noto Sans SC', sans-serif" }}>
                验证码
              </label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <ShieldCheck size={13} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--jjk-text-4)" }} />
                  <input
                    id="login-code"
                    className="jjk-input"
                    style={{ paddingLeft: 32 }}
                    placeholder="6位数字"
                    maxLength={6}
                    value={form.code}
                    onChange={(e) => setForm({ ...form, code: e.target.value.replace(/\D/g, "") })}
                  />
                </div>
                <button
                  type="button"
                  className="jjk-btn"
                  style={{ fontSize: 12, padding: "0 12px", whiteSpace: "nowrap" }}
                  onClick={sendCode}
                  disabled={countdown > 0}
                >
                  <Send size={12} />
                  {countdown > 0 ? `${countdown}s` : "获取验证码"}
                </button>
              </div>
            </div>
          )}

          {/* Password */}
          <div>
            <label className="block mb-1.5" style={{ fontSize: 12, color: "var(--jjk-text-3)", fontFamily: "'Noto Sans SC', sans-serif" }}>
              密码
            </label>
            <div className="relative">
              <Lock size={13} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--jjk-text-4)" }} />
              <input
                id="login-password"
                className="jjk-input"
                type={showPwd ? "text" : "password"}
                style={{ paddingLeft: 32, paddingRight: 36 }}
                placeholder={mode === "register" ? "设置密码" : "输入密码"}
                autoComplete={mode === "register" ? "new-password" : "current-password"}
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
              />
              <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer" style={{ background: "transparent", border: "none", color: "var(--jjk-text-4)" }} onClick={() => setShowPwd(!showPwd)}>
                {showPwd ? <EyeOff size={13} /> : <Eye size={13} />}
              </button>
            </div>
          </div>

          {/* Confirm password (register only) */}
          {mode === "register" && (
            <div>
              <label className="block mb-1.5" style={{ fontSize: 12, color: "var(--jjk-text-3)", fontFamily: "'Noto Sans SC', sans-serif" }}>
                确认密码
              </label>
              <div className="relative">
                <Lock size={13} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--jjk-text-4)" }} />
                <input
                  id="login-confirm"
                  className="jjk-input"
                  type="password"
                  style={{ paddingLeft: 32 }}
                  placeholder="再次输入密码"
                  autoComplete="new-password"
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
          <button id="login-submit" type="submit" className="jjk-btn jjk-btn--primary w-full" disabled={loading}>
            {loading ? (
              <span style={{ color: "var(--jjk-text-2)" }}>验证中...</span>
            ) : (
              <>
                {mode === "login" ? <LogIn size={14} /> : <UserPlus size={14} />}
                {mode === "login" ? "进入咒术世界" : "创建咒术档案"}
              </>
            )}
          </button>

          {/* Mode toggle */}
          <div className="flex items-center justify-between pt-1">
            <button
              type="button"
              className="cursor-pointer"
              style={{ background: "transparent", border: "none", fontSize: 12, color: "var(--jjk-text-4)", fontFamily: "'Noto Sans SC', sans-serif" }}
              onClick={() => { setMode(mode === "login" ? "register" : "login"); setError(""); setCodeSent(false); setVerifyToken(""); setForm({ email: "", password: "", confirm: "", code: "" }); }}
            >
              {mode === "login" ? "注册账号" : "已有账号？登录"}
            </button>
            {mode === "login" && (
              <button type="button" className="cursor-pointer" style={{ background: "transparent", border: "none", fontSize: 12, color: "var(--jjk-text-4)", fontFamily: "'Noto Sans SC', sans-serif" }}>
                忘记密码？
              </button>
            )}
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}
