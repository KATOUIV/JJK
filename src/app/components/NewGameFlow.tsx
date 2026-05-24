import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ArrowLeft, ArrowRight, Check, Plus, Minus, Zap, Shield, Wind, Brain, Star, Sword, CheckSquare, Square } from "lucide-react";
import type { AppView, CharacterCreation } from "../types";

interface NewGameFlowProps {
  onComplete: (data: CharacterCreation) => void;
  onBack: () => void;
}

/* ===== STEP 1: DIFFICULTY ===== */
const DIFFICULTIES = [
  { id: "四级", label: "四级咒术师", level: "简单", points: 25, color: "#5FD075", desc: "适合初次踏入咒术界的新人，容错率极高，轻松体验剧情" },
  { id: "三级", label: "三级咒术师", level: "普通", points: 20, color: "#4B92DB", desc: "标准的咒术师体验，平衡的难度与剧情体验" },
  { id: "二级", label: "二级咒术师", level: "困难", points: 15, color: "#D4AF37", desc: "挑战较强的咒灵，需要合理规划属性与行动" },
  { id: "一级", label: "一级咒术师", level: "噩梦", points: 10, color: "#F97316", desc: "直面一级咒灵的威胁，稍有失误便会陷入危机" },
  { id: "特级", label: "特级咒术师", level: "地狱", points: 5, color: "#AA0000", desc: "最强的挑战，初始属性极度匮乏，每一步都需要谨慎抉择" },
];

function Step1({ data, onChange }: { data: CharacterCreation; onChange: (d: Partial<CharacterCreation>) => void }) {
  return (
    <div>
      <p className="mb-6 text-center" style={{ color: "var(--jjk-text-3)", fontFamily: "'Noto Sans SC', sans-serif", fontSize: 13 }}>
        难度决定你的初始属性点数，越高难度越少的初始资源
      </p>
      <div className="flex flex-col gap-3">
        {DIFFICULTIES.map((d) => (
          <motion.button
            key={d.id}
            id={`difficulty-${d.id}`}
            className={`curse-card w-full text-left p-4 ${data.difficulty === d.id ? "active" : ""}`}
            style={{ background: data.difficulty === d.id ? "rgba(170,0,0,0.10)" : "var(--jjk-surface)" }}
            whileHover={{ x: 4 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onChange({ difficulty: d.id, difficultyPoints: d.points, remainingPoints: d.points, attributes: { VIT: 0, DEX: 0, STR: 0, CEP: 0, APT: 0, MND: 0 } })}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-2 h-8" style={{ background: d.color, opacity: 0.8 }} />
                <div>
                  <div className="flex items-center gap-2">
                    <span style={{ fontFamily: "'Noto Serif SC', serif", fontWeight: 700, fontSize: 15, color: "var(--jjk-text)" }}>{d.label}</span>
                    <span className="px-2 py-0.5 text-xs" style={{ background: `${d.color}22`, color: d.color, border: `1px solid ${d.color}55`, fontFamily: "'Noto Sans SC', sans-serif" }}>
                      {d.level}
                    </span>
                  </div>
                  <p style={{ fontSize: 12, color: "var(--jjk-text-4)", marginTop: 3, fontFamily: "'Noto Sans SC', sans-serif" }}>{d.desc}</p>
                </div>
              </div>
              <div className="text-right shrink-0 ml-3">
                <span className="jjk-mono" style={{ fontSize: 20, fontWeight: 700, color: d.color }}>{d.points}</span>
                <p style={{ fontSize: 10, color: "var(--jjk-text-4)", fontFamily: "'Noto Sans SC', sans-serif" }}>属性点</p>
              </div>
            </div>
          </motion.button>
        ))}
      </div>
    </div>
  );
}

/* ===== STEP 2: CHARACTER INFO + ATTRIBUTES ===== */
const ATTR_CONFIG = [
  { key: "VIT", label: "体质", sub: "VIT", icon: Shield, desc: "影响生命值与抗打击能力", color: "#AA0000" },
  { key: "DEX", label: "敏捷", sub: "DEX", icon: Wind, desc: "影响行动速度与闪避能力", color: "#4B92DB" },
  { key: "STR", label: "力量", sub: "STR", icon: Sword, desc: "影响物理攻击力与肉搏能力", color: "#D4AF37" },
  { key: "CEP", label: "咒力", sub: "CEP", icon: Zap, desc: "影响咒力最大值与术式威力", color: "#008000" },
  { key: "APT", label: "适配", sub: "APT", icon: Star, desc: "影响天生术式的成长上限", color: "#6A0DAD" },
  { key: "MND", label: "精神", sub: "MND", icon: Brain, desc: "影响对咒灵的精神抗性", color: "#F97316" },
] as const;

const HEX_LABELS = ["体质", "敏捷", "力量", "咒力", "适配", "精神"];
const HEX_KEYS: (keyof CharacterCreation["attributes"])[] = ["VIT", "DEX", "STR", "CEP", "APT", "MND"];
const HEX_COLORS = ["#AA0000", "#4B92DB", "#D4AF37", "#008000", "#6A0DAD", "#F97316"];

function HexRadar({ attrs, max }: { attrs: CharacterCreation["attributes"]; max: number }) {
  const cx = 100;
  const cy = 88;
  const R = 68;
  const n = 6;
  const getPoint = (i: number, r: number) => {
    const angle = (Math.PI * 2 * i) / n - Math.PI / 2;
    return { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) };
  };

  const gridLevels = [0.25, 0.5, 0.75, 1];
  const values = HEX_KEYS.map((k) => attrs[k]);
  const dataPoints = values.map((v, i) => getPoint(i, (Math.min(v, max) / max) * R));
  const dataPath = dataPoints.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(" ") + " Z";

  return (
    <svg viewBox="0 0 200 176" width="100%" height={160} style={{ overflow: "visible", marginBottom: 8 }}>
      {/* Grid */}
      {gridLevels.map((lvl) => {
        const pts = Array.from({ length: n }, (_, i) => getPoint(i, R * lvl));
        const path = pts.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(" ") + " Z";
        return <path key={lvl} d={path} fill="none" stroke="rgba(170,0,0,0.12)" strokeWidth={0.8} />;
      })}
      {/* Spokes */}
      {Array.from({ length: n }, (_, i) => {
        const outer = getPoint(i, R);
        return <line key={i} x1={cx} y1={cy} x2={outer.x.toFixed(1)} y2={outer.y.toFixed(1)} stroke="rgba(170,0,0,0.1)" strokeWidth={0.8} />;
      })}
      {/* Data area */}
      <path d={dataPath} fill="rgba(170,0,0,0.2)" stroke="#AA0000" strokeWidth={1.5} />
      {/* Data dots */}
      {dataPoints.map((p, i) => (
        <circle key={i} cx={p.x.toFixed(1)} cy={p.y.toFixed(1)} r={3} fill={HEX_COLORS[i]} />
      ))}
      {/* Labels */}
      {Array.from({ length: n }, (_, i) => {
        const pt = getPoint(i, R + 14);
        return (
          <text
            key={i}
            x={pt.x.toFixed(1)}
            y={pt.y.toFixed(1)}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize={9}
            fill="rgba(200,180,160,0.75)"
            fontFamily="'Noto Sans SC', sans-serif"
          >
            {HEX_LABELS[i]}
          </text>
        );
      })}
    </svg>
  );
}

function Step2({ data, onChange }: { data: CharacterCreation; onChange: (d: Partial<CharacterCreation>) => void }) {
  const adjust = (key: keyof CharacterCreation["attributes"], delta: number) => {
    const newVal = Math.max(0, data.attributes[key] + delta);
    const newRemaining = data.remainingPoints - delta;
    if (newRemaining < 0) return;
    onChange({ attributes: { ...data.attributes, [key]: newVal }, remainingPoints: newRemaining });
  };

  return (
    <div className="grid md:grid-cols-2 gap-6">
      {/* Left: Basic info */}
      <div className="space-y-4">
        <h3 style={{ fontFamily: "'Noto Serif SC', serif", fontWeight: 700, color: "var(--jjk-gold)", fontSize: 14, letterSpacing: "0.1em" }}>基础信息</h3>
        <div>
          <label className="block mb-1" style={{ fontSize: 12, color: "var(--jjk-text-3)", fontFamily: "'Noto Sans SC', sans-serif" }}>咒术师姓名</label>
          <input id="char-name" className="jjk-input" placeholder="输入你的姓名" value={data.name} onChange={(e) => onChange({ name: e.target.value })} />
        </div>
        <div>
          <label className="block mb-1" style={{ fontSize: 12, color: "var(--jjk-text-3)", fontFamily: "'Noto Sans SC', sans-serif" }}>年龄</label>
          <input id="char-age" className="jjk-input" type="number" placeholder="16" min="14" max="60" value={data.age} onChange={(e) => onChange({ age: e.target.value })} />
        </div>
        <div>
          <label className="block mb-2" style={{ fontSize: 12, color: "var(--jjk-text-3)", fontFamily: "'Noto Sans SC', sans-serif" }}>性别</label>
          <div className="flex gap-2">
            {(["男", "女", "未知"] as const).map((g) => (
              <button
                key={g}
                id={`gender-${g}`}
                className="flex-1 py-2 text-sm cursor-pointer transition-all"
                style={{
                  background: data.gender === g ? "rgba(170,0,0,0.18)" : "var(--jjk-surface-2)",
                  border: `1px solid ${data.gender === g ? "rgba(170,0,0,0.6)" : "var(--jjk-border)"}`,
                  color: data.gender === g ? "var(--jjk-text)" : "var(--jjk-text-3)",
                  fontFamily: "'Noto Sans SC', sans-serif",
                }}
                onClick={() => onChange({ gender: g })}
              >
                {g}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="block mb-1" style={{ fontSize: 12, color: "var(--jjk-text-3)", fontFamily: "'Noto Sans SC', sans-serif" }}>角色人设</label>
          <textarea
            id="char-persona"
            className="jjk-input"
            style={{ minHeight: 90, resize: "none" }}
            placeholder="描述你的性格、背景故事、外貌等..."
            value={data.persona}
            onChange={(e) => onChange({ persona: e.target.value })}
          />
        </div>
      </div>

      {/* Right: Attributes */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 style={{ fontFamily: "'Noto Serif SC', serif", fontWeight: 700, color: "var(--jjk-gold)", fontSize: 14, letterSpacing: "0.1em" }}>属性分配</h3>
          <div className="flex items-center gap-2">
            <span style={{ fontSize: 11, color: "var(--jjk-text-4)", fontFamily: "'Noto Sans SC', sans-serif" }}>剩余点数</span>
            <span className="jjk-mono px-2 py-0.5" style={{ background: data.remainingPoints > 0 ? "rgba(0,128,0,0.15)" : "rgba(170,0,0,0.15)", color: data.remainingPoints > 0 ? "var(--jjk-green)" : "var(--jjk-red)", border: `1px solid ${data.remainingPoints > 0 ? "rgba(0,128,0,0.4)" : "rgba(170,0,0,0.4)"}`, fontSize: 14, fontWeight: 700 }}>
              {data.remainingPoints}
            </span>
          </div>
        </div>

        {/* Radar — custom SVG hexagon */}
        <HexRadar attrs={data.attributes} max={Math.max(data.difficultyPoints, 1)} />

        {/* Attribute sliders */}
        <div className="space-y-2">
          {ATTR_CONFIG.map((a) => {
            const Icon = a.icon;
            return (
              <div key={a.key} className="flex items-center gap-2">
                <div className="flex items-center gap-1 w-20 shrink-0">
                  <Icon size={11} style={{ color: a.color }} />
                  <span style={{ fontSize: 12, color: "var(--jjk-text-2)", fontFamily: "'Noto Sans SC', sans-serif" }}>{a.label}</span>
                </div>
                <button
                  id={`attr-${a.key}-minus`}
                  className="w-6 h-6 flex items-center justify-center cursor-pointer"
                  style={{ border: "1px solid var(--jjk-border)", background: "var(--jjk-surface-2)" }}
                  onClick={() => adjust(a.key, -1)}
                >
                  <Minus size={10} style={{ color: "var(--jjk-text-3)" }} />
                </button>
                <div className="flex-1 jjk-bar-track" style={{ height: 6 }}>
                  <motion.div
                    className="h-full"
                    style={{ background: a.color, opacity: 0.8 }}
                    animate={{ width: `${data.difficultyPoints > 0 ? (data.attributes[a.key] / data.difficultyPoints) * 100 : 0}%` }}
                    transition={{ duration: 0.2 }}
                  />
                </div>
                <button
                  id={`attr-${a.key}-plus`}
                  className="w-6 h-6 flex items-center justify-center cursor-pointer"
                  style={{ border: "1px solid var(--jjk-border)", background: "var(--jjk-surface-2)" }}
                  onClick={() => adjust(a.key, 1)}
                  disabled={data.remainingPoints <= 0}
                >
                  <Plus size={10} style={{ color: data.remainingPoints > 0 ? "var(--jjk-text-3)" : "var(--jjk-text-4)" }} />
                </button>
                <span className="jjk-mono w-5 text-right shrink-0" style={{ fontSize: 13, color: a.color }}>{data.attributes[a.key]}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ===== STEP 3: FACTION ===== */
const FACTIONS = [
  { id: "东京咒术高专", label: "东京咒术高专", sub: "正道咒术师的摇篮", bonus: "初始正道名望 +10，解锁高专专属任务线", color: "#4B92DB" },
  { id: "京都咒术高专", label: "京都咒术高专", sub: "传统咒术的传承者", bonus: "初始战斗技巧 +5，初始金钱 +2000", color: "#D4AF37" },
  { id: "民间咒术师", label: "民间咒术师", sub: "游离在体系外的强者", bonus: "无初始阵营限制，可自由接取所有类型任务", color: "#999999" },
  { id: "叛逃咒术师", label: "叛逃咒术师", sub: "被高专驱逐的异类", bonus: "初始邪道名望 +10，解锁邪道专属任务线", color: "#AA0000" },
  { id: "咒灵操使", label: "咒灵操使", sub: "能够操控咒灵的特殊存在", bonus: "初始解锁咒灵相关特殊能力", color: "#6A0DAD" },
];

function Step3({ data, onChange }: { data: CharacterCreation; onChange: (d: Partial<CharacterCreation>) => void }) {
  return (
    <div>
      <p className="mb-6 text-center" style={{ color: "var(--jjk-text-3)", fontFamily: "'Noto Sans SC', sans-serif", fontSize: 13 }}>
        流派决定你的初始阵营归属与特殊加成
      </p>
      <div className="grid grid-cols-1 gap-3">
        {FACTIONS.map((f) => (
          <motion.button
            key={f.id}
            id={`faction-${f.id}`}
            className={`curse-card w-full text-left p-4 ${data.faction === f.id ? "active" : ""}`}
            style={{ background: data.faction === f.id ? "rgba(170,0,0,0.10)" : "var(--jjk-surface)" }}
            whileHover={{ x: 4 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onChange({ faction: f.id })}
          >
            <div className="flex items-center gap-3">
              <div style={{ width: 3, height: 48, background: f.color, opacity: 0.8, flexShrink: 0 }} />
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span style={{ fontFamily: "'Noto Serif SC', serif", fontWeight: 700, fontSize: 15, color: "var(--jjk-text)" }}>{f.label}</span>
                  <span style={{ fontSize: 11, color: f.color, fontFamily: "'Noto Sans SC', sans-serif" }}>{f.sub}</span>
                </div>
                <p style={{ fontSize: 12, color: "var(--jjk-text-4)", fontFamily: "'Noto Sans SC', sans-serif" }}>{f.bonus}</p>
              </div>
              {data.faction === f.id && <Check size={16} style={{ color: "var(--jjk-red)", flexShrink: 0 }} />}
            </div>
          </motion.button>
        ))}
      </div>
    </div>
  );
}

/* ===== STEP 4: TECHNIQUE ===== */
const TECH_ATTRS = ["无", "火", "水", "影", "空间", "时间", "重力", "电", "冰", "毒", "光", "暗"];
const EXTENSIONS = ["黑闪", "咒力强化", "反転術式", "赤（咒力发散）", "蒼（最适化）", "茈（虚式）", "術式反転", "咒力强化肉体"];

function Step4({ data, onChange }: { data: CharacterCreation; onChange: (d: Partial<CharacterCreation>) => void }) {
  const toggleExtension = (ext: string) => {
    const exts = data.extensions.includes(ext) ? data.extensions.filter((e) => e !== ext) : [...data.extensions, ext];
    onChange({ extensions: exts });
  };

  return (
    <div className="space-y-5">
      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label className="block mb-1.5" style={{ fontSize: 12, color: "var(--jjk-text-3)", fontFamily: "'Noto Sans SC', sans-serif" }}>术式名称</label>
          <input
            id="tech-name"
            className="jjk-input"
            placeholder="如：无量空处、赤血操术..."
            value={data.technique.name}
            onChange={(e) => onChange({ technique: { ...data.technique, name: e.target.value } })}
          />
        </div>
        <div>
          <label className="block mb-1.5" style={{ fontSize: 12, color: "var(--jjk-text-3)", fontFamily: "'Noto Sans SC', sans-serif" }}>术式属性</label>
          <div className="flex flex-wrap gap-1.5">
            {TECH_ATTRS.map((attr) => (
              <button
                key={attr}
                id={`tech-attr-${attr}`}
                className="px-2 py-1 text-xs cursor-pointer transition-all"
                style={{
                  background: data.technique.attribute === attr ? "rgba(106,13,173,0.25)" : "var(--jjk-surface-2)",
                  border: `1px solid ${data.technique.attribute === attr ? "rgba(106,13,173,0.6)" : "var(--jjk-border)"}`,
                  color: data.technique.attribute === attr ? "#C084FC" : "var(--jjk-text-3)",
                  fontFamily: "'Noto Sans SC', sans-serif",
                }}
                onClick={() => onChange({ technique: { ...data.technique, attribute: attr } })}
              >
                {attr}
              </button>
            ))}
          </div>
        </div>
      </div>
      <div>
        <label className="block mb-1.5" style={{ fontSize: 12, color: "var(--jjk-text-3)", fontFamily: "'Noto Sans SC', sans-serif" }}>术式描述</label>
        <textarea
          id="tech-description"
          className="jjk-input"
          style={{ minHeight: 100, resize: "none" }}
          placeholder="详细描述你的术式能力、效果、使用限制..."
          value={data.technique.description}
          onChange={(e) => onChange({ technique: { ...data.technique, description: e.target.value } })}
        />
      </div>
      <div>
        <label className="block mb-2.5" style={{ fontSize: 12, color: "var(--jjk-text-3)", fontFamily: "'Noto Sans SC', sans-serif" }}>已掌握的扩展术式</label>
        <div className="grid grid-cols-2 gap-2">
          {EXTENSIONS.map((ext) => {
            const checked = data.extensions.includes(ext);
            return (
              <button
                key={ext}
                id={`ext-${ext}`}
                className="flex items-center gap-2 p-2.5 text-left cursor-pointer transition-all"
                style={{
                  background: checked ? "rgba(106,13,173,0.12)" : "var(--jjk-surface-2)",
                  border: `1px solid ${checked ? "rgba(106,13,173,0.45)" : "var(--jjk-border)"}`,
                }}
                onClick={() => toggleExtension(ext)}
              >
                {checked ? <CheckSquare size={13} style={{ color: "#C084FC", flexShrink: 0 }} /> : <Square size={13} style={{ color: "var(--jjk-text-4)", flexShrink: 0 }} />}
                <span style={{ fontSize: 12, color: checked ? "#C084FC" : "var(--jjk-text-3)", fontFamily: "'Noto Sans SC', sans-serif" }}>{ext}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ===== STEP 5: BACKSTORY ===== */
function Step5({ data, onChange }: { data: CharacterCreation; onChange: (d: Partial<CharacterCreation>) => void }) {
  const autoGenerated = `${data.name || "你"}，一名来自${data.faction || "咒术高专"}的年轻咒术师。从小便显现出超凡的咒力，在家族的期望与同龄人的异样目光中成长。你的天生术式「${data.technique.name || "未命名"}」是你与生俱来的特质——一把双刃剑，既是你最强的武器，也是你最沉重的枷锁。\n\n为了寻找属于自己的答案，你选择踏上这条充满未知与危险的咒术之路...`;

  return (
    <div className="space-y-5">
      {/* Mode select */}
      <div className="grid grid-cols-2 gap-3">
        {(["custom", "auto"] as const).map((mode) => (
          <button
            key={mode}
            id={`backstory-${mode}`}
            className={`curse-card p-4 text-left cursor-pointer ${data.backstoryMode === mode ? "active" : ""}`}
            style={{ background: data.backstoryMode === mode ? "rgba(170,0,0,0.10)" : "var(--jjk-surface)" }}
            onClick={() => {
              onChange({ backstoryMode: mode, backstory: mode === "auto" ? autoGenerated : data.backstory });
            }}
          >
            <div className="flex items-center justify-between mb-2">
              <span style={{ fontFamily: "'Noto Serif SC', serif", fontWeight: 700, fontSize: 14, color: "var(--jjk-text)" }}>
                {mode === "custom" ? "自定义开篇" : "自动生成过往"}
              </span>
              {data.backstoryMode === mode && <Check size={14} style={{ color: "var(--jjk-red)" }} />}
            </div>
            <p style={{ fontSize: 11, color: "var(--jjk-text-4)", fontFamily: "'Noto Sans SC', sans-serif" }}>
              {mode === "custom" ? "一问一答模式，高度自定义你的过往经历" : "根据你之前所有选择自动生成开篇，可直接编辑修改"}
            </p>
          </button>
        ))}
      </div>

      {/* Backstory editor */}
      <div>
        <label className="block mb-1.5" style={{ fontSize: 12, color: "var(--jjk-text-3)", fontFamily: "'Noto Sans SC', sans-serif" }}>
          {data.backstoryMode === "custom" ? "描述你的过往经历" : "生成的过往经历（可编辑）"}
        </label>
        <textarea
          id="backstory-text"
          className="jjk-input story-text"
          style={{ minHeight: 180, resize: "vertical", fontSize: 13, lineHeight: 1.8 }}
          placeholder={data.backstoryMode === "custom" ? "请描述你的过往：家庭背景、咒术觉醒的契机、加入当前流派的原因..." : ""}
          value={data.backstoryMode === "auto" && !data.backstory ? autoGenerated : data.backstory}
          onChange={(e) => onChange({ backstory: e.target.value })}
        />
      </div>

      {/* Summary */}
      <div className="curse-card p-4" style={{ background: "rgba(212,175,55,0.05)" }}>
        <p className="mb-2" style={{ fontSize: 11, color: "var(--jjk-gold)", fontFamily: "'Noto Serif SC', serif", fontWeight: 700 }}>角色概要</p>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
          {[
            ["姓名", data.name || "—"],
            ["难度", data.difficulty || "—"],
            ["流派", data.faction || "—"],
            ["术式", data.technique.name || "—"],
          ].map(([k, v]) => (
            <div key={k} className="flex items-center gap-2">
              <span style={{ fontSize: 11, color: "var(--jjk-text-4)", fontFamily: "'Noto Sans SC', sans-serif", minWidth: 28 }}>{k}</span>
              <span style={{ fontSize: 12, color: "var(--jjk-text-2)", fontFamily: "'Noto Sans SC', sans-serif" }}>{v}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ===== MAIN FLOW CONTROLLER ===== */
const STEP_LABELS = ["选择难度", "角色塑造", "选择流派", "定义术式", "过往经历"];

const defaultData: CharacterCreation = {
  step: 1,
  difficulty: "",
  difficultyPoints: 20,
  name: "",
  age: "17",
  gender: "男",
  persona: "",
  attributes: { VIT: 0, DEX: 0, STR: 0, CEP: 0, APT: 0, MND: 0 },
  remainingPoints: 20,
  faction: "",
  technique: { name: "", attribute: "无", description: "" },
  extensions: [],
  backstoryMode: "auto",
  backstory: "",
};

export function NewGameFlow({ onComplete, onBack }: NewGameFlowProps) {
  const [data, setData] = useState<CharacterCreation>(defaultData);
  const [dir, setDir] = useState(1);

  const update = useCallback((partial: Partial<CharacterCreation>) => {
    setData((prev) => ({ ...prev, ...partial }));
  }, []);

  const canNext = () => {
    if (data.step === 1) return !!data.difficulty;
    if (data.step === 2) return !!data.name.trim() && data.remainingPoints >= 0;
    if (data.step === 3) return !!data.faction;
    if (data.step === 4) return !!data.technique.name.trim();
    return true;
  };

  const next = () => {
    if (data.step < 5) { setDir(1); setData((p) => ({ ...p, step: (p.step + 1) as any })); }
    else onComplete(data);
  };
  const prev = () => {
    if (data.step > 1) { setDir(-1); setData((p) => ({ ...p, step: (p.step - 1) as any })); }
    else onBack();
  };

  const stepContent: Record<number, React.ReactNode> = {
    1: <Step1 data={data} onChange={update} />,
    2: <Step2 data={data} onChange={update} />,
    3: <Step3 data={data} onChange={update} />,
    4: <Step4 data={data} onChange={update} />,
    5: <Step5 data={data} onChange={update} />,
  };

  return (
    <div
      className="relative flex flex-col h-screen overflow-hidden"
      style={{ background: "linear-gradient(165deg, #100000 0%, #1C1C1C 50%, #0a0a18 100%)" }}
    >
      {/* Background */}
      <div className="absolute inset-0 pointer-events-none">
        <div style={{ position: "absolute", inset: 0, backgroundImage: "linear-gradient(rgba(170,0,0,0.03) 1px, transparent 1px), linear-gradient(90deg,rgba(170,0,0,0.03) 1px, transparent 1px)", backgroundSize: "60px 60px" }} />
      </div>

      {/* Header */}
      <div className="relative z-10 flex items-center gap-4 px-5 py-4 shrink-0" style={{ borderBottom: "1px solid rgba(170,0,0,0.15)" }}>
        <button
          id="newgame-back"
          className="flex items-center gap-1.5 cursor-pointer"
          style={{ background: "transparent", border: "none", color: "var(--jjk-text-4)" }}
          onClick={prev}
        >
          <ArrowLeft size={15} />
          <span style={{ fontSize: 12, fontFamily: "'Noto Sans SC', sans-serif" }}>{data.step === 1 ? "返回主页" : "上一步"}</span>
        </button>

        {/* Step indicators */}
        <div className="flex-1 flex items-center justify-center gap-2">
          {STEP_LABELS.map((label, i) => {
            const stepNum = i + 1;
            const done = stepNum < data.step;
            const active = stepNum === data.step;
            return (
              <div key={i} className="flex items-center gap-1.5">
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center"
                  style={{
                    background: done ? "var(--jjk-red)" : active ? "rgba(170,0,0,0.25)" : "var(--jjk-surface-2)",
                    border: `1px solid ${done || active ? "var(--jjk-red)" : "var(--jjk-border)"}`,
                    fontSize: 10,
                    color: done ? "#fff" : active ? "#FF8888" : "var(--jjk-text-4)",
                    fontFamily: "'Share Tech Mono', monospace",
                  }}
                >
                  {done ? <Check size={10} /> : stepNum}
                </div>
                <span className="hidden sm:block" style={{ fontSize: 10, color: active ? "var(--jjk-text)" : "var(--jjk-text-4)", fontFamily: "'Noto Sans SC', sans-serif" }}>
                  {label}
                </span>
                {i < STEP_LABELS.length - 1 && (
                  <div style={{ width: 16, height: 1, background: done ? "rgba(170,0,0,0.5)" : "rgba(255,255,255,0.06)" }} />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Step title */}
      <div className="relative z-10 px-5 py-4 shrink-0 text-center">
        <h2 className="jjk-title-section" style={{ fontSize: 18 }}>
          {{
            1: "选择你的咒术难度",
            2: "咒术师登记表",
            3: "选择你的咒术流派",
            4: "定义你的咒术术式",
            5: "定义你的过往经历",
          }[data.step]}
        </h2>
        <p style={{ fontSize: 11, color: "var(--jjk-text-4)", marginTop: 4, fontFamily: "'Share Tech Mono', monospace" }}>
          {data.step} / 5
        </p>
      </div>

      {/* Content area */}
      <div className="relative z-10 flex-1 overflow-y-auto px-5 pb-4">
        <div className="max-w-2xl mx-auto">
          <AnimatePresence mode="wait" custom={dir}>
            <motion.div
              key={data.step}
              custom={dir}
              initial={{ opacity: 0, x: dir * 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -dir * 30 }}
              transition={{ duration: 0.25, ease: "easeInOut" }}
            >
              {stepContent[data.step]}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Footer */}
      <div
        className="relative z-10 flex items-center justify-between px-5 py-4 shrink-0"
        style={{ borderTop: "1px solid rgba(170,0,0,0.15)" }}
      >
        <span style={{ fontSize: 12, color: "var(--jjk-text-4)", fontFamily: "'Noto Sans SC', sans-serif" }}>
          {data.name && `· ${data.name}`} {data.faction && `· ${data.faction}`}
        </span>
        <motion.button
          id="newgame-next"
          className="jjk-btn jjk-btn--primary flex items-center gap-2"
          whileTap={{ scale: 0.96 }}
          onClick={next}
          disabled={!canNext()}
          style={{ opacity: canNext() ? 1 : 0.4, cursor: canNext() ? "pointer" : "not-allowed" }}
        >
          {data.step === 5 ? (
            <>
              <Star size={14} />
              确认开启咒术人生
            </>
          ) : (
            <>
              下一步
              <ArrowRight size={14} />
            </>
          )}
        </motion.button>
      </div>
    </div>
  );
}
