import { useState, useMemo, useEffect, useCallback } from "react";
import { motion } from "motion/react";
import {
  ArrowLeft, Cpu, Globe, Key, ChevronDown, Check, BookOpen,
  Sliders, Save, RotateCcw, RefreshCw,
  Upload, Download, Trash2, Edit3, Plus,
} from "lucide-react";
import type { AppView } from "../types";
import { useSillytavern } from "../../hooks/useSillytavern";
import { fetchModels, testConnection } from "../../sillytavern/api-tools";
import {
  importLorebook, exportLorebook, importPreset, exportPreset,
  importJsonFile, exportToJson, importMultipleLorebooks,
} from "../../sillytavern/importer";
import type { Lorebook, ChatPreset } from "../../sillytavern/types";

interface SystemSettingsPageProps {
  onNavigate: (view: AppView) => void;
  onOpenLorebooks?: () => void;
  onOpenPresets?: () => void;
}

const LLM_PROVIDERS = [
  { id: "openai", label: "OpenAI", models: ["gpt-4o", "gpt-4o-mini", "gpt-4-turbo"] },
  { id: "claude", label: "Anthropic Claude", models: ["claude-sonnet-4-6", "claude-opus-4-7", "claude-haiku-4-5"] },
  { id: "deepseek", label: "DeepSeek", models: ["deepseek-chat", "deepseek-reasoner"] },
  { id: "custom", label: "自定义兼容端点", models: [] },
];


function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <motion.button
      type="button"
      className="relative cursor-pointer shrink-0"
      style={{
        width: 40, height: 22,
        borderRadius: 0,
        background: value ? "rgba(170,0,0,0.4)" : "rgba(50,50,50,0.6)",
        border: value ? "1px solid rgba(170,0,0,0.7)" : "1px solid rgba(100,100,100,0.3)",
      }}
      onClick={() => onChange(!value)}
      animate={{ background: value ? "rgba(170,0,0,0.35)" : "rgba(50,50,50,0.5)" }}
    >
      <motion.div
        className="absolute top-0.5"
        style={{ width: 16, height: 16, background: value ? "#FF6666" : "#555" }}
        animate={{ left: value ? 20 : 2 }}
        transition={{ type: "spring", stiffness: 500, damping: 35 }}
      />
    </motion.button>
  );
}

function SelectDropdown({
  value, options, onChange, placeholder,
}: {
  value: string;
  options: string[];
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button
        type="button"
        className="jjk-input w-full flex items-center justify-between cursor-pointer"
        style={{ textAlign: "left", paddingRight: 12 }}
        onClick={() => setOpen(!open)}
      >
        <span style={{ color: value ? "var(--jjk-text-2)" : "var(--jjk-text-4)", fontSize: 13, fontFamily: "'Noto Sans SC', sans-serif" }}>
          {value || placeholder || "请选择"}
        </span>
        <ChevronDown size={13} style={{ color: "var(--jjk-text-4)", transition: "transform 0.2s", transform: open ? "rotate(180deg)" : "none" }} />
      </button>
      {open && (
        <div
          className="absolute top-full left-0 right-0 z-50 mt-1"
          style={{ background: "rgba(22,18,12,0.98)", border: "1px solid rgba(170,0,0,0.3)" }}
        >
          {options.map((opt) => (
            <button
              key={opt}
              type="button"
              className="w-full flex items-center justify-between px-3 py-2 cursor-pointer"
              style={{
                background: opt === value ? "rgba(170,0,0,0.12)" : "transparent",
                fontSize: 13,
                color: opt === value ? "var(--jjk-text)" : "var(--jjk-text-3)",
                fontFamily: "'Noto Sans SC', sans-serif",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(170,0,0,0.08)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = opt === value ? "rgba(170,0,0,0.12)" : "transparent")}
              onClick={() => { onChange(opt); setOpen(false); }}
            >
              {opt}
              {opt === value && <Check size={11} style={{ color: "#FF6666" }} />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function SectionCard({ icon: Icon, title, subtitle, children, actions }: {
  icon: React.ElementType;
  title: string;
  subtitle: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
}) {
  return (
    <div className="curse-card" style={{ background: "rgba(22,18,12,0.9)" }}>
      <div
        className="flex items-center gap-3 px-5 py-4"
        style={{ borderBottom: "1px solid rgba(170,0,0,0.12)" }}
      >
        <div
          className="w-8 h-8 flex items-center justify-center shrink-0"
          style={{ background: "rgba(170,0,0,0.1)", border: "1px solid rgba(170,0,0,0.3)" }}
        >
          <Icon size={15} style={{ color: "#FF6666" }} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="jjk-title-section" style={{ fontSize: 13 }}>{title}</p>
          <p style={{ fontSize: 11, color: "var(--jjk-text-4)", fontFamily: "'Noto Sans SC', sans-serif" }}>{subtitle}</p>
        </div>
        {actions && (
          <div className="flex items-center gap-2 shrink-0">
            {actions}
          </div>
        )}
      </div>
      <div className="px-5 py-4 space-y-4">
        {children}
      </div>
    </div>
  );
}

function FormRow({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <div>
      <label className="block mb-1.5" style={{ fontSize: 12, color: "var(--jjk-text-3)", fontFamily: "'Noto Sans SC', sans-serif" }}>
        {label}
      </label>
      {children}
      {hint && (
        <p style={{ fontSize: 11, color: "var(--jjk-text-4)", fontFamily: "'Noto Sans SC', sans-serif", marginTop: 5 }}>
          {hint}
        </p>
      )}
    </div>
  );
}

export function SystemSettingsPage({ onNavigate, onOpenLorebooks, onOpenPresets }: SystemSettingsPageProps) {
  const {
    settings, updateSettings,
    presets, lorebooks,
    toggleLorebook, addLorebookFromDefault, deleteLorebook, addLorebook,
    addPresetFromDefault, deletePreset, addPreset,
    showToast,
  } = useSillytavern();

  const [apiTab, setApiTab] = useState<'primary' | 'secondary'>('primary');
  const [savedIndicator, setSavedIndicator] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [primaryModels, setPrimaryModels] = useState<string[]>([]);
  const [secondaryModels, setSecondaryModels] = useState<string[]>([]);

  const isDual = settings?.apiMode === 'dual';
  const secondary = settings?.api?.secondary ?? {
    enabled: false, baseUrl: '', apiKey: '', model: '', temperature: 0.7, maxTokens: 8000,
  };

  const inferProviderId = useCallback((baseUrl: string): string => {
    if (baseUrl.includes('anthropic') || baseUrl.includes('claude')) return 'claude';
    if (baseUrl.includes('deepseek')) return 'deepseek';
    if (baseUrl.includes('openai')) return 'openai';
    if (baseUrl) return 'custom';
    return 'claude';
  }, []);

  const [providerId, setProviderId] = useState(() =>
    inferProviderId(settings?.api.baseUrl || '')
  );

  useEffect(() => {
    if (!settings) return;
    const baseUrl = settings.api.baseUrl || '';
    if (baseUrl) {
      setProviderId(inferProviderId(baseUrl));
    }
  }, [settings?.api.baseUrl, inferProviderId]);

  const handleSave = () => {
    setSavedIndicator(true);
    setTimeout(() => setSavedIndicator(false), 2000);
  };

  const updateApi = (patch: Partial<typeof settings.api>) => {
    if (!settings) return;
    updateSettings({
      api: { ...settings.api, ...patch },
    });
  };

  const updateSecondaryApi = (patch: Partial<typeof secondary>) => {
    if (!settings) return;
    updateSettings({
      api: { ...settings.api, secondary: { ...secondary, ...patch, enabled: true } },
    });
  };

  const handleFetchModels = async (which: 'primary' | 'secondary') => {
    setBusy(`fetch-${which}`);
    try {
      const target = which === 'primary'
        ? { baseUrl: settings?.api.baseUrl || '', apiKey: settings?.api.apiKey || '' }
        : { baseUrl: secondary.baseUrl, apiKey: secondary.apiKey };
      const { models, source, error } = await fetchModels(target);
      if (which === 'primary') setPrimaryModels(models);
      else setSecondaryModels(models);
      if (source === 'remote') {
        showToast?.(`已获取 ${models.length} 个模型`);
      } else if (error) {
        showToast?.(`获取失败 (${error})，已显示常用模型`);
      }
    } finally {
      setBusy(null);
    }
  };

  const handleTestConnection = async (which: 'primary' | 'secondary') => {
    setBusy(`test-${which}`);
    try {
      const target = which === 'primary'
        ? { baseUrl: settings?.api.baseUrl || '', apiKey: settings?.api.apiKey || '', model: settings?.api.model }
        : { baseUrl: secondary.baseUrl, apiKey: secondary.apiKey, model: secondary.model };
      const result = await testConnection(target);
      if (result.ok) {
        showToast?.(`${which === 'primary' ? '主' : '副'} API 连通性测试通过`);
      } else if (result.status) {
        alert(`测试失败: HTTP ${result.status}\n${result.errorBody ?? ''}`);
      } else {
        alert(`测试失败: ${result.error ?? '未知错误'}`);
      }
    } finally {
      setBusy(null);
    }
  };

  const handleProviderChange = (pid: string) => {
    const p = LLM_PROVIDERS.find(x => x.id === pid);
    if (!p || !settings) return;
    const baseUrls: Record<string, string> = {
      openai: 'https://api.openai.com/v1',
      claude: 'https://api.anthropic.com/v1',
      deepseek: 'https://api.deepseek.com/v1',
      custom: '',
    };
    setProviderId(pid);
    updateApi({ baseUrl: baseUrls[pid], model: p.models[0] || settings.api.model });
  };

  // World book import/export
  const handleImportLorebooks = async () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.multiple = true;
    input.accept = '.json,application/json';
    input.onchange = async (e) => {
      const files = Array.from((e.target as HTMLInputElement).files ?? []);
      if (files.length === 0) return;
      const inputs = await Promise.all(
        files.map(async (f) => ({ fileName: f.name, json: JSON.parse(await f.text()) }))
      );
      const { successes, failures } = importMultipleLorebooks(inputs);
      for (const s of successes) {
        const lorebook: Lorebook = {
          ...s.lorebook,
          id: crypto.randomUUID(),
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };
        await addLorebook(lorebook);
      }
      if (failures.length) {
        alert('导入失败：\n' + failures.map((f) => `${f.fileName}: ${f.error}`).join('\n'));
      } else {
        showToast?.(`成功导入 ${successes.length} 本世界书`);
      }
    };
    input.click();
  };

  const handleExportLorebook = (lb: Lorebook) => {
    exportToJson(exportLorebook(lb), `${lb.name}.json`);
  };

  const handleDeleteLorebook = async (id: string, name: string) => {
    if (!confirm(`确定删除世界书 "${name}"？`)) return;
    await deleteLorebook(id);
    showToast?.('世界书已删除');
  };

  const handleNewLorebook = async () => {
    const name = prompt('新世界书名称', '新世界书');
    if (!name) return;
    await addLorebookFromDefault(name);
    showToast?.('世界书已创建');
  };

  // Preset import/export
  const handleImportPreset = async () => {
    const data = await importJsonFile<Record<string, any>>();
    if (!data) return;
    try {
      const imported = importPreset(data);
      const preset: ChatPreset = {
        ...imported,
        id: crypto.randomUUID(),
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      await addPreset(preset);
      showToast?.('预设已导入');
    } catch (e) {
      alert('导入失败: ' + (e as Error).message);
    }
  };

  const handleExportPreset = (p: ChatPreset) => {
    exportToJson(exportPreset(p), `${p.name}.json`);
  };

  const handleDeletePreset = async (id: string, name: string) => {
    if (!confirm(`删除预设 "${name}"?`)) return;
    await deletePreset(id);
    showToast?.('预设已删除');
  };

  const handleNewPreset = async () => {
    const name = prompt('新预设名称', '新预设');
    if (!name) return;
    await addPresetFromDefault(name);
    showToast?.('预设已创建');
  };

  const handleActivatePreset = async (id: string) => {
    await updateSettings({ activePresetId: id });
    showToast?.('预设已激活');
  };

  if (!settings) {
    return (
      <div className="flex items-center justify-center h-screen w-full" style={{ background: "linear-gradient(165deg, #120000 0%, #1C1C1C 45%, #0a0a1a 100%)" }}>
        <p style={{ color: "var(--jjk-text-4)", fontFamily: "'Noto Sans SC', sans-serif" }}>加载中……</p>
      </div>
    );
  }

  return (
    <div
      className="relative flex flex-col h-screen w-full overflow-hidden"
      style={{ background: "linear-gradient(165deg, #120000 0%, #1C1C1C 45%, #0a0a1a 100%)" }}
    >
      {/* Background */}
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: "linear-gradient(rgba(170,0,0,0.035) 1px, transparent 1px), linear-gradient(90deg,rgba(170,0,0,0.035) 1px, transparent 1px)",
            backgroundSize: "80px 80px",
          }}
        />
        <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse 100% 100% at 50% 50%, transparent 40%, rgba(0,0,0,0.75) 100%)" }} />
      </div>

      {/* Header */}
      <div
        className="relative z-10 flex items-center justify-between px-6"
        style={{ height: 60, borderBottom: "1px solid rgba(170,0,0,0.12)", flexShrink: 0 }}
      >
        <div className="flex items-center gap-4">
          <motion.button
            className="w-8 h-8 flex items-center justify-center cursor-pointer"
            style={{ background: "rgba(28,28,28,0.7)", border: "1px solid rgba(170,0,0,0.25)" }}
            whileHover={{ borderColor: "rgba(170,0,0,0.6)", background: "rgba(170,0,0,0.1)" }}
            whileTap={{ scale: 0.92 }}
            onClick={() => onNavigate("home")}
          >
            <ArrowLeft size={15} style={{ color: "var(--jjk-text-3)" }} />
          </motion.button>
          <div>
            <h1 className="jjk-title-section" style={{ fontSize: 15 }}>咒术系统设置</h1>
            <p style={{ fontSize: 11, color: "var(--jjk-text-4)", fontFamily: "'Noto Sans SC', sans-serif" }}>
              配置 LLM 接口与世界设定
            </p>
          </div>
        </div>
        <motion.button
          className="jjk-btn jjk-btn--primary"
          style={{ fontSize: 12, padding: "7px 18px" }}
          whileTap={{ scale: 0.96 }}
          onClick={handleSave}
          animate={savedIndicator ? { background: "rgba(0,100,0,0.3)", borderColor: "rgba(0,170,0,0.6)" } : {}}
        >
          {savedIndicator ? <><Check size={13} /> 已保存</> : <><Save size={13} /> 保存设置</>}
        </motion.button>
      </div>

      {/* Scrollable content */}
      <div className="relative z-10 flex-1 overflow-y-auto px-4 py-5 space-y-5" style={{ maxWidth: 720, margin: "0 auto", width: "100%" }}>

        {/* LLM API Settings */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
          <SectionCard icon={Cpu} title="LLM 接口配置" subtitle="设置 AI 驱动引擎，连接咒术叙事核心">
            {/* Primary / Secondary tabs */}
            <div className="flex gap-2 mb-2">
              {(['primary', 'secondary'] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  className="px-3 py-1.5 cursor-pointer"
                  style={{
                    background: apiTab === t ? "rgba(170,0,0,0.2)" : "rgba(28,28,28,0.6)",
                    border: apiTab === t ? "1px solid rgba(170,0,0,0.6)" : "1px solid rgba(100,100,100,0.2)",
                    fontSize: 12,
                    color: apiTab === t ? "var(--jjk-text)" : "var(--jjk-text-3)",
                    fontFamily: "'Noto Sans SC', sans-serif",
                  }}
                  onClick={() => setApiTab(t)}
                >
                  {t === 'primary' ? '主 API' : '副 API'}
                </button>
              ))}
              <div className="flex-1" />
              <select
                className="jjk-input cursor-pointer"
                style={{ fontSize: 12, width: 'auto', padding: '4px 8px' }}
                value={settings.apiMode}
                onChange={(e) => updateSettings({ apiMode: e.target.value as 'single' | 'dual' })}
              >
                <option value="single">单 API 模式</option>
                <option value="dual">双 API 模式</option>
              </select>
            </div>
            {apiTab === 'secondary' && !isDual && (
              <div className="px-3 py-2" style={{ background: "rgba(170,0,0,0.08)", border: "1px solid rgba(170,0,0,0.25)", fontSize: 12, color: "var(--jjk-text-3)", fontFamily: "'Noto Sans SC', sans-serif" }}>
                当前为单 API 模式。副 API 仅在双 API 模式下生效，用于处理变量更新等次要任务。
              </div>
            )}

            {apiTab === 'primary' ? (
              <>
                <FormRow label="AI 提供商">
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                    {LLM_PROVIDERS.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        className="px-3 py-2.5 cursor-pointer transition-all"
                        style={{
                          background: providerId === p.id ? "rgba(170,0,0,0.2)" : "rgba(28,28,28,0.6)",
                          border: providerId === p.id ? "1px solid rgba(170,0,0,0.6)" : "1px solid rgba(100,100,100,0.2)",
                          fontSize: 12,
                          color: providerId === p.id ? "var(--jjk-text)" : "var(--jjk-text-3)",
                          fontFamily: "'Noto Sans SC', sans-serif",
                        }}
                        onClick={() => handleProviderChange(p.id)}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                </FormRow>

                {LLM_PROVIDERS.find(p => p.id === providerId)?.models.length > 0 && (
                  <FormRow label="模型版本">
                    <SelectDropdown
                      value={settings.api.model}
                      options={LLM_PROVIDERS.find(p => p.id === providerId)?.models || []}
                      onChange={(v) => updateApi({ model: v })}
                    />
                  </FormRow>
                )}

                {providerId === "custom" && (
                  <FormRow label="API 端点 (Base URL)" hint="兼容 OpenAI 格式的自定义端点地址">
                    <input
                      className="jjk-input w-full"
                      placeholder="https://api.example.com/v1"
                      value={settings.api.baseUrl}
                      onChange={(e) => updateApi({ baseUrl: e.target.value })}
                      style={{ fontSize: 13 }}
                    />
                  </FormRow>
                )}

                <FormRow label="API 密钥" hint="密钥仅保存在本地，不会上传至服务器">
                  <div className="relative">
                    <Key size={13} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--jjk-text-4)" }} />
                    <input
                      className="jjk-input w-full"
                      type="password"
                      placeholder="sk-..."
                      value={settings.api.apiKey}
                      onChange={(e) => updateApi({ apiKey: e.target.value })}
                      style={{ paddingLeft: 32, fontSize: 13 }}
                    />
                  </div>
                </FormRow>

                <div className="grid grid-cols-2 gap-3">
                  <FormRow label="Max Tokens" hint="单次响应最大 token 数">
                    <input
                      className="jjk-input w-full"
                      value={settings.api.maxTokens ?? 2048}
                      onChange={(e) => updateApi({ maxTokens: Number(e.target.value) || 2048 })}
                      style={{ fontSize: 13 }}
                    />
                  </FormRow>
                  <FormRow label="Temperature" hint="创意度 (0.0 ~ 2.0)">
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      max="2"
                      className="jjk-input w-full"
                      value={settings.api.temperature ?? 0.85}
                      onChange={(e) => updateApi({ temperature: parseFloat(e.target.value) })}
                      style={{ fontSize: 13 }}
                    />
                  </FormRow>
                </div>

                {primaryModels.length > 0 && (
                  <FormRow label="可用模型">
                    <SelectDropdown
                      value={settings.api.model}
                      options={primaryModels}
                      onChange={(v) => updateApi({ model: v })}
                    />
                  </FormRow>
                )}

                <div className="flex items-center justify-between pt-1 flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      className="jjk-btn jjk-btn--ghost"
                      style={{ fontSize: 12, padding: "6px 14px" }}
                      onClick={() => handleFetchModels('primary')}
                      disabled={busy !== null}
                    >
                      <RefreshCw size={12} />
                      {busy === 'fetch-primary' ? '获取中…' : '获取模型'}
                    </button>
                    <button
                      type="button"
                      className="jjk-btn jjk-btn--ghost"
                      style={{ fontSize: 12, padding: "6px 14px" }}
                      onClick={() => handleTestConnection('primary')}
                      disabled={busy !== null}
                    >
                      <RefreshCw size={12} />
                      {busy === 'test-primary' ? '测试中…' : '测试连接'}
                    </button>
                  </div>
                  <div
                    className="flex items-center gap-1.5 px-3 py-1.5"
                    style={{ background: "rgba(0,100,0,0.1)", border: "1px solid rgba(0,100,0,0.25)" }}
                  >
                    <div className="w-1.5 h-1.5 rounded-full" style={{ background: "#00CC00", boxShadow: "0 0 4px #00CC00" }} />
                    <span style={{ fontSize: 11, color: "#66CC66", fontFamily: "'Share Tech Mono', monospace" }}>连接就绪</span>
                  </div>
                </div>
              </>
            ) : (
              <>
                <FormRow label="API 端点 (Base URL)">
                  <input
                    className="jjk-input w-full"
                    placeholder="https://api.example.com/v1"
                    value={secondary.baseUrl}
                    onChange={(e) => updateSecondaryApi({ baseUrl: e.target.value })}
                    style={{ fontSize: 13 }}
                  />
                </FormRow>
                <FormRow label="API 密钥">
                  <div className="relative">
                    <Key size={13} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--jjk-text-4)" }} />
                    <input
                      className="jjk-input w-full"
                      type="password"
                      placeholder="sk-..."
                      value={secondary.apiKey}
                      onChange={(e) => updateSecondaryApi({ apiKey: e.target.value })}
                      style={{ paddingLeft: 32, fontSize: 13 }}
                    />
                  </div>
                </FormRow>
                <FormRow label="模型">
                  <input
                    className="jjk-input w-full"
                    placeholder="gpt-3.5-turbo"
                    value={secondary.model}
                    onChange={(e) => updateSecondaryApi({ model: e.target.value })}
                    style={{ fontSize: 13 }}
                  />
                </FormRow>
                <div className="grid grid-cols-2 gap-3">
                  <FormRow label="Temperature">
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      max="2"
                      className="jjk-input w-full"
                      value={secondary.temperature ?? 0.7}
                      onChange={(e) => updateSecondaryApi({ temperature: parseFloat(e.target.value) })}
                      style={{ fontSize: 13 }}
                    />
                  </FormRow>
                  <FormRow label="Max Tokens">
                    <input
                      className="jjk-input w-full"
                      value={secondary.maxTokens ?? 8000}
                      onChange={(e) => updateSecondaryApi({ maxTokens: Number(e.target.value) })}
                      style={{ fontSize: 13 }}
                    />
                  </FormRow>
                </div>
                {secondaryModels.length > 0 && (
                  <FormRow label="可用模型">
                    <SelectDropdown
                      value={secondary.model}
                      options={secondaryModels}
                      onChange={(v) => updateSecondaryApi({ model: v })}
                    />
                  </FormRow>
                )}
                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    className="jjk-btn jjk-btn--ghost"
                    style={{ fontSize: 12, padding: "6px 14px" }}
                    onClick={() => handleFetchModels('secondary')}
                    disabled={busy !== null}
                  >
                    <RefreshCw size={12} />
                    {busy === 'fetch-secondary' ? '获取中…' : '获取模型'}
                  </button>
                  <button
                    type="button"
                    className="jjk-btn jjk-btn--ghost"
                    style={{ fontSize: 12, padding: "6px 14px" }}
                    onClick={() => handleTestConnection('secondary')}
                    disabled={busy !== null}
                  >
                    <RefreshCw size={12} />
                    {busy === 'test-secondary' ? '测试中…' : '测试连接'}
                  </button>
                </div>
              </>
            )}
          </SectionCard>
        </motion.div>

        {/* World Settings */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <SectionCard
            icon={Globe}
            title="咒术世界书"
            subtitle="定义故事发生的世界规则与背景设定"
            actions={
              <>
                <motion.button
                  className="flex items-center gap-1 px-2 py-1 cursor-pointer"
                  style={{ background: "rgba(28,28,28,0.6)", border: "1px solid rgba(170,0,0,0.25)", fontSize: 11, color: "var(--jjk-text-3)", fontFamily: "'Noto Sans SC', sans-serif" }}
                  whileHover={{ borderColor: "rgba(170,0,0,0.5)" }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleImportLorebooks}
                >
                  <Upload size={11} /> 导入
                </motion.button>
                {onOpenLorebooks && (
                  <motion.button
                    className="flex items-center gap-1 px-2 py-1 cursor-pointer"
                    style={{ background: "rgba(28,28,28,0.6)", border: "1px solid rgba(170,0,0,0.25)", fontSize: 11, color: "var(--jjk-text-3)", fontFamily: "'Noto Sans SC', sans-serif" }}
                    whileHover={{ borderColor: "rgba(170,0,0,0.5)" }}
                    whileTap={{ scale: 0.95 }}
                    onClick={onOpenLorebooks}
                  >
                    <Edit3 size={11} /> 管理
                  </motion.button>
                )}
              </>
            }
          >
            {/* Lorebook list */}
            {lorebooks.length > 0 && (
              <div className="space-y-2">
                <p style={{ fontSize: 12, color: "var(--jjk-text-3)", fontFamily: "'Noto Sans SC', sans-serif" }}>已加载的世界书</p>
                {lorebooks.map((lb) => {
                  const isActive = settings.activeLorebookIds.includes(lb.id);
                  return (
                    <div
                      key={lb.id}
                      className="flex items-center justify-between gap-2 px-3 py-2"
                      style={{ background: "rgba(28,28,28,0.4)", border: "1px solid rgba(100,100,100,0.12)" }}
                    >
                      <label className="flex items-center gap-2 cursor-pointer flex-1 min-w-0">
                        <input
                          type="checkbox"
                          checked={isActive}
                          onChange={() => toggleLorebook(lb.id)}
                          style={{ accentColor: '#AA0000' }}
                        />
                        <span className="truncate" style={{ fontSize: 12, color: "var(--jjk-text-2)", fontFamily: "'Noto Sans SC', sans-serif" }}>
                          {lb.name}
                        </span>
                        <span style={{ fontSize: 10, color: "var(--jjk-text-4)", fontFamily: "'Share Tech Mono', monospace" }}>
                          ({lb.entries.length} 条目)
                        </span>
                      </label>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          className="p-1 cursor-pointer"
                          style={{ background: "transparent", border: "none", color: "var(--jjk-text-4)" }}
                          onClick={() => handleExportLorebook(lb)}
                          title="导出"
                        >
                          <Download size={12} />
                        </button>
                        <button
                          type="button"
                          className="p-1 cursor-pointer"
                          style={{ background: "transparent", border: "none", color: "rgba(170,0,0,0.6)" }}
                          onClick={() => handleDeleteLorebook(lb.id, lb.name)}
                          title="删除"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <button
              type="button"
              className="jjk-btn jjk-btn--ghost w-full"
              style={{ fontSize: 12 }}
              onClick={handleNewLorebook}
            >
              <Plus size={12} /> 新建世界书
            </button>

          </SectionCard>
        </motion.div>

        {/* Preset Config */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <SectionCard
            icon={Sliders}
            title="预设配置"
            subtitle="控制叙事行为、内容过滤与角色扮演规则"
            actions={
              <>
                <motion.button
                  className="flex items-center gap-1 px-2 py-1 cursor-pointer"
                  style={{ background: "rgba(28,28,28,0.6)", border: "1px solid rgba(170,0,0,0.25)", fontSize: 11, color: "var(--jjk-text-3)", fontFamily: "'Noto Sans SC', sans-serif" }}
                  whileHover={{ borderColor: "rgba(170,0,0,0.5)" }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleImportPreset}
                >
                  <Upload size={11} /> 导入
                </motion.button>
                {onOpenPresets && (
                  <motion.button
                    className="flex items-center gap-1 px-2 py-1 cursor-pointer"
                    style={{ background: "rgba(28,28,28,0.6)", border: "1px solid rgba(170,0,0,0.25)", fontSize: 11, color: "var(--jjk-text-3)", fontFamily: "'Noto Sans SC', sans-serif" }}
                    whileHover={{ borderColor: "rgba(170,0,0,0.5)" }}
                    whileTap={{ scale: 0.95 }}
                    onClick={onOpenPresets}
                  >
                    <Edit3 size={11} /> 管理
                  </motion.button>
                )}
              </>
            }
          >
            {/* Preset list */}
            {presets.length > 0 && (
              <div className="space-y-2">
                <p style={{ fontSize: 12, color: "var(--jjk-text-3)", fontFamily: "'Noto Sans SC', sans-serif" }}>已加载的预设</p>
                {presets.map((p) => {
                  const isActive = settings.activePresetId === p.id;
                  return (
                    <div
                      key={p.id}
                      className="flex items-center justify-between gap-2 px-3 py-2"
                      style={{ background: isActive ? "rgba(170,0,0,0.1)" : "rgba(28,28,28,0.4)", border: isActive ? "1px solid rgba(170,0,0,0.35)" : "1px solid rgba(100,100,100,0.12)" }}
                    >
                      <label className="flex items-center gap-2 cursor-pointer flex-1 min-w-0">
                        <div
                          className="w-3.5 h-3.5 flex items-center justify-center shrink-0"
                          style={{ border: isActive ? "1px solid #AA0000" : "1px solid rgba(100,100,100,0.4)", background: isActive ? "rgba(170,0,0,0.3)" : "transparent", borderRadius: '50%' }}
                          onClick={() => handleActivatePreset(p.id)}
                        >
                          {isActive && <div className="w-1.5 h-1.5 rounded-full" style={{ background: "#FF6666" }} />}
                        </div>
                        <span className="truncate" style={{ fontSize: 12, color: "var(--jjk-text-2)", fontFamily: "'Noto Sans SC', sans-serif" }}>
                          {p.name}
                        </span>
                        {isActive && (
                          <span style={{ fontSize: 10, color: "#D4AF37", fontFamily: "'Share Tech Mono', monospace" }}>★ 激活</span>
                        )}
                      </label>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          className="p-1 cursor-pointer"
                          style={{ background: "transparent", border: "none", color: "var(--jjk-text-4)" }}
                          onClick={() => handleExportPreset(p)}
                          title="导出"
                        >
                          <Download size={12} />
                        </button>
                        <button
                          type="button"
                          className="p-1 cursor-pointer"
                          style={{ background: "transparent", border: "none", color: "rgba(170,0,0,0.6)" }}
                          onClick={() => handleDeletePreset(p.id, p.name)}
                          title="删除"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <button
              type="button"
              className="jjk-btn jjk-btn--ghost w-full"
              style={{ fontSize: 12 }}
              onClick={handleNewPreset}
            >
              <Plus size={12} /> 新建预设
            </button>

            <div style={{ borderTop: "1px solid rgba(170,0,0,0.12)", margin: "8px 0" }} />

            <div className="pt-2">
              <button
                type="button"
                className="jjk-btn jjk-btn--ghost w-full"
                style={{ fontSize: 12 }}
                onClick={() => {
                  if (!confirm('确定恢复默认设置？')) return;
                  updateSettings({
                    apiMode: 'single',
                    api: {
                      baseUrl: '',
                      apiKey: '',
                      model: '',
                    },
                  });
                }}
              >
                <RotateCcw size={12} />
                恢复默认设置
              </button>
            </div>
          </SectionCard>
        </motion.div>

        {/* System Prompt preview hint */}
        <motion.div
          className="px-4 py-3 flex items-start gap-3"
          style={{ background: "rgba(212,175,55,0.05)", border: "1px solid rgba(212,175,55,0.15)" }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <BookOpen size={13} style={{ color: "rgba(212,175,55,0.7)", marginTop: 2, shrink: 0 }} />
          <p style={{ fontSize: 12, color: "rgba(212,175,55,0.7)", fontFamily: "'Noto Sans SC', sans-serif", lineHeight: 1.7 }}>
            上述设置将自动生成系统提示词，并在每次游戏开始时注入至对话上下文中。角色创建完成后才可启动游戏。
          </p>
        </motion.div>

        <div style={{ height: 20 }} />
      </div>
    </div>
  );
}
