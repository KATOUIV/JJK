import { createContext, useContext, useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from "lucide-react";

export type NotificationType = "success" | "error" | "warning" | "info";

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message?: string;
  duration?: number;
}

interface NotificationContextValue {
  addNotification: (n: Omit<Notification, "id">) => void;
}

export const NotificationContext = createContext<NotificationContextValue>({
  addNotification: () => {},
});

export function useNotification() {
  return useContext(NotificationContext);
}

const icons: Record<NotificationType, React.ComponentType<{ size?: number; className?: string }>> = {
  success: CheckCircle2,
  error: AlertCircle,
  warning: AlertTriangle,
  info: Info,
};

const styles: Record<NotificationType, { border: string; icon: string; glow: string; bg: string }> = {
  success: {
    border: "rgba(0,170,80,0.4)",
    icon: "#00CC66",
    glow: "rgba(0,170,80,0.1)",
    bg: "rgba(12,28,18,0.97)",
  },
  error: {
    border: "rgba(170,0,0,0.5)",
    icon: "#FF6666",
    glow: "rgba(170,0,0,0.12)",
    bg: "rgba(28,8,8,0.97)",
  },
  warning: {
    border: "rgba(212,175,55,0.4)",
    icon: "#D4AF37",
    glow: "rgba(212,175,55,0.1)",
    bg: "rgba(28,22,8,0.97)",
  },
  info: {
    border: "rgba(75,146,219,0.4)",
    icon: "#4B92DB",
    glow: "rgba(75,146,219,0.1)",
    bg: "rgba(8,18,32,0.97)",
  },
};

function NotificationItem({
  notification,
  onDismiss,
}: {
  notification: Notification;
  onDismiss: (id: string) => void;
}) {
  const s = styles[notification.type];
  const Icon = icons[notification.type];

  useEffect(() => {
    const t = setTimeout(() => onDismiss(notification.id), notification.duration ?? 4500);
    return () => clearTimeout(t);
  }, [notification.id, notification.duration, onDismiss]);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 80, scale: 0.92 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 80, scale: 0.88, transition: { duration: 0.2 } }}
      transition={{ type: "spring", stiffness: 400, damping: 30 }}
      className="relative flex items-start gap-3 px-4 py-3 min-w-[280px] max-w-[340px] cursor-pointer select-none"
      style={{
        background: s.bg,
        border: `1px solid ${s.border}`,
        boxShadow: `0 8px 32px rgba(0,0,0,0.6), 0 0 20px ${s.glow}`,
        borderRadius: 0,
      }}
      onClick={() => onDismiss(notification.id)}
    >
      <Icon size={18} style={{ color: s.icon, flexShrink: 0, marginTop: 2 }} />
      <div className="flex-1 min-w-0">
        <p
          className="text-sm leading-snug"
          style={{ color: "var(--jjk-text)", fontFamily: "'Noto Sans SC', sans-serif" }}
        >
          {notification.title}
        </p>
        {notification.message && (
          <p
            className="text-xs mt-0.5 leading-relaxed"
            style={{ color: "var(--jjk-text-3)", fontFamily: "'Noto Sans SC', sans-serif" }}
          >
            {notification.message}
          </p>
        )}
      </div>
      <button
        className="flex-shrink-0 p-0.5 transition-colors cursor-pointer"
        style={{ color: "var(--jjk-text-4)", background: "transparent", border: "none" }}
        onClick={(e) => { e.stopPropagation(); onDismiss(notification.id); }}
      >
        <X size={13} />
      </button>

      {/* Progress bar */}
      <motion.div
        className="absolute bottom-0 left-0 h-0.5"
        style={{ background: s.icon }}
        initial={{ width: "100%" }}
        animate={{ width: "0%" }}
        transition={{ duration: (notification.duration ?? 4500) / 1000, ease: "linear" }}
      />
    </motion.div>
  );
}

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const addNotification = useCallback((n: Omit<Notification, "id">) => {
    const id = `${Date.now()}-${Math.random()}`;
    setNotifications((prev) => [...prev.slice(-4), { ...n, id }]);
  }, []);

  const dismiss = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  return (
    <NotificationContext.Provider value={{ addNotification }}>
      {children}
      <div
        className="fixed right-4 z-[200] flex flex-col gap-2 pointer-events-none"
        style={{ top: "1rem", bottom: "auto" }}
      >
        <AnimatePresence mode="popLayout">
          {notifications.map((n) => (
            <div key={n.id} className="pointer-events-auto">
              <NotificationItem notification={n} onDismiss={dismiss} />
            </div>
          ))}
        </AnimatePresence>
      </div>
    </NotificationContext.Provider>
  );
}
