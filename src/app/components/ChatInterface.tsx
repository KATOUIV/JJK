import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Send, CornerDownLeft, Sparkles, TrendingUp } from "lucide-react";
import type { ChatMessage } from "../types";

interface ChatInterfaceProps {
  messages: ChatMessage[];
  isTyping: boolean;
  onSend: (text: string) => void;
}

function SystemMessage({ message }: { message: ChatMessage }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex justify-center my-3"
    >
      <div
        className="px-4 py-2 rounded-xl max-w-[80%] text-center"
        style={{
          background: "rgba(14,10,38,0.6)",
          border: "1px solid rgba(139,92,246,0.18)",
          backdropFilter: "blur(12px)",
        }}
      >
        <p
          className="text-xs leading-relaxed"
          style={{
            color: "#7c6da8",
            fontFamily: "'Noto Sans SC', sans-serif",
            fontStyle: "italic",
          }}
        >
          {message.content}
        </p>
        <span
          className="text-[10px] mt-1 block"
          style={{ color: "#3d3860", fontFamily: "'Share Tech Mono', monospace" }}
        >
          {message.timestamp}
        </span>
      </div>
    </motion.div>
  );
}

function UserMessage({ message }: { message: ChatMessage }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20, y: 4 }}
      animate={{ opacity: 1, x: 0, y: 0 }}
      transition={{ type: "spring", stiffness: 400, damping: 30 }}
      className="flex justify-end mb-4"
    >
      <div className="flex flex-col items-end gap-1 max-w-[75%]">
        <div
          className="px-4 py-3 rounded-2xl rounded-br-sm"
          style={{
            background: "linear-gradient(135deg, rgba(109,40,217,0.75), rgba(139,92,246,0.65))",
            border: "1px solid rgba(139,92,246,0.45)",
            boxShadow: "0 4px 20px rgba(109,40,217,0.25)",
          }}
        >
          <p
            className="text-sm leading-relaxed whitespace-pre-wrap"
            style={{ color: "#ede9fe", fontFamily: "'Noto Sans SC', sans-serif" }}
          >
            {message.content}
          </p>
        </div>
        <span
          className="text-[10px] mr-1"
          style={{ color: "#3d3860", fontFamily: "'Share Tech Mono', monospace" }}
        >
          {message.timestamp}
        </span>
      </div>
    </motion.div>
  );
}

function AssistantMessage({ message }: { message: ChatMessage }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20, y: 4 }}
      animate={{ opacity: 1, x: 0, y: 0 }}
      transition={{ type: "spring", stiffness: 400, damping: 30 }}
      className="flex gap-3 mb-4"
    >
      <div className="flex-shrink-0 mt-1">
        <div
          className="w-7 h-7 rounded-full flex items-center justify-center"
          style={{
            background: "linear-gradient(135deg, rgba(55,20,100,0.9), rgba(109,40,217,0.7))",
            border: "1px solid rgba(139,92,246,0.4)",
            boxShadow: "0 0 12px rgba(139,92,246,0.2)",
          }}
        >
          <Sparkles size={12} style={{ color: "#a78bfa" }} />
        </div>
      </div>
      <div className="flex flex-col gap-1 max-w-[80%]">
        <div
          className="px-4 py-3 rounded-2xl rounded-tl-sm"
          style={{
            background: "rgba(14,10,38,0.82)",
            border: "1px solid rgba(139,92,246,0.20)",
            backdropFilter: "blur(16px)",
            boxShadow: "0 4px 24px rgba(0,0,0,0.4), 0 0 0 1px rgba(139,92,246,0.10)",
          }}
        >
          <p
            className="text-sm leading-relaxed whitespace-pre-wrap"
            style={{ color: "#d5d0f0", fontFamily: "'Noto Sans SC', sans-serif" }}
          >
            {message.content}
          </p>
          {message.expGain !== undefined && message.expGain > 0 && (
            <div
              className="mt-2 pt-2 flex items-center gap-1.5"
              style={{ borderTop: "1px solid rgba(139,92,246,0.15)" }}
            >
              <TrendingUp size={11} style={{ color: "#4ade80" }} />
              <span
                className="text-xs"
                style={{ color: "#4ade80", fontFamily: "'Share Tech Mono', monospace", fontWeight: 600 }}
              >
                +{message.expGain} EXP
              </span>
            </div>
          )}
        </div>
        <span
          className="text-[10px] ml-1"
          style={{ color: "#3d3860", fontFamily: "'Share Tech Mono', monospace" }}
        >
          {message.timestamp}
        </span>
      </div>
    </motion.div>
  );
}

function TypingIndicator() {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -10 }}
      className="flex gap-3 mb-4"
    >
      <div
        className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-1"
        style={{
          background: "linear-gradient(135deg, rgba(55,20,100,0.9), rgba(109,40,217,0.7))",
          border: "1px solid rgba(139,92,246,0.4)",
        }}
      >
        <Sparkles size={12} style={{ color: "#a78bfa" }} />
      </div>
      <div
        className="flex items-center gap-2 px-4 py-3 rounded-2xl rounded-tl-sm"
        style={{
          background: "rgba(14,10,38,0.82)",
          border: "1px solid rgba(139,92,246,0.20)",
          backdropFilter: "blur(16px)",
        }}
      >
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="typing-dot w-1.5 h-1.5 rounded-full"
            style={{
              background: "#8b5cf6",
              animationDelay: `${i * 0.2}s`,
            }}
          />
        ))}
      </div>
    </motion.div>
  );
}

export function ChatInterface({ messages, isTyping, onSend }: ChatInterfaceProps) {
  const [input, setInput] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) {
      el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
    }
  }, [messages, isTyping]);

  const handleSend = useCallback(() => {
    const text = input.trim();
    if (!text || isTyping) return;
    onSend(text);
    setInput("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  }, [input, isTyping, onSend]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    const ta = e.target;
    ta.style.height = "auto";
    ta.style.height = `${Math.min(ta.scrollHeight, 120)}px`;
  };

  return (
    <div className="flex flex-col flex-1 min-h-0 relative z-10">
      {/* Messages area */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 md:px-6 py-4">
        <div className="max-w-3xl mx-auto">
          <AnimatePresence initial={false}>
            {messages.map((msg) => {
              if (msg.role === "system") return <SystemMessage key={msg.id} message={msg} />;
              if (msg.role === "user") return <UserMessage key={msg.id} message={msg} />;
              return <AssistantMessage key={msg.id} message={msg} />;
            })}
          </AnimatePresence>

          <AnimatePresence>
            {isTyping && <TypingIndicator key="typing" />}
          </AnimatePresence>
        </div>
      </div>

      {/* Input area */}
      <div
        className="shrink-0 px-3 md:px-6 py-3"
        style={{
          background: "rgba(8,8,24,0.80)",
          borderTop: "1px solid rgba(139,92,246,0.12)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
        }}
      >
        <div className="max-w-3xl mx-auto">
          <motion.div
            className="relative flex items-end gap-2 rounded-2xl px-4 py-2.5"
            animate={{
              boxShadow: isFocused
                ? "0 0 0 1px rgba(139,92,246,0.45), 0 0 24px rgba(139,92,246,0.12)"
                : "0 0 0 1px rgba(139,92,246,0.18)",
            }}
            style={{
              background: "rgba(14,10,38,0.85)",
              backdropFilter: "blur(16px)",
            }}
            transition={{ duration: 0.2 }}
          >
            <textarea
              ref={textareaRef}
              id="chat-input"
              value={input}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              placeholder="描述你的行动..."
              rows={1}
              className="flex-1 resize-none bg-transparent text-sm outline-none leading-relaxed"
              style={{
                color: "#ede9fe",
                fontFamily: "'Noto Sans SC', sans-serif",
                maxHeight: 120,
                caretColor: "#8b5cf6",
              }}
            />

            <div className="flex items-center gap-1.5 shrink-0 self-end pb-0.5">
              <span
                className="hidden sm:flex items-center gap-0.5 text-[10px]"
                style={{ color: "#3d3860", fontFamily: "'Share Tech Mono', monospace" }}
              >
                <CornerDownLeft size={9} />
                发送
              </span>
              <motion.button
                id="send-button"
                className="w-8 h-8 rounded-xl flex items-center justify-center"
                style={{
                  background: input.trim() && !isTyping
                    ? "linear-gradient(135deg, #6d28d9, #8b5cf6)"
                    : "rgba(139,92,246,0.12)",
                  border: "1px solid rgba(139,92,246,0.3)",
                  cursor: input.trim() && !isTyping ? "pointer" : "default",
                  transition: "background 0.2s ease",
                }}
                whileHover={{ scale: input.trim() && !isTyping ? 1.05 : 1 }}
                whileTap={{ scale: input.trim() && !isTyping ? 0.92 : 1 }}
                onClick={handleSend}
                disabled={!input.trim() || isTyping}
              >
                <Send size={14} style={{ color: input.trim() && !isTyping ? "#fff" : "#524d70" }} />
              </motion.button>
            </div>
          </motion.div>

          <p
            className="text-center mt-1.5 text-[10px]"
            style={{ color: "#2d2850", fontFamily: "'Noto Sans SC', sans-serif" }}
          >
            按 Enter 发送 · Shift+Enter 换行 · 由 LLM 驱动的沉浸式剧本
          </p>
        </div>
      </div>
    </div>
  );
}
