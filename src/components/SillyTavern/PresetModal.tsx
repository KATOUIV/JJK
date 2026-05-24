import { useState, useMemo, useEffect } from 'react';
import { Search } from 'lucide-react';
import type { ChatPreset } from '../../sillytavern/types';
import { useSillytavern } from '../../hooks/useSillytavern';
import { PromptOrderEditor, type PromptOrderItem } from './PromptOrderEditor';
import { clampNumber } from '../../sillytavern/editor-utils';

const TABS = ['sampling', 'prompts', 'custom', 'order'] as const;
type Tab = typeof TABS[number];
const TAB_LABELS: Record<Tab, string> = {
  sampling: '采样',
  prompts: 'Prompt 文本',
  custom: '自定义 Prompts',
  order: '排序',
};

const PROMPT_TEXT_FIELDS: { key: string; label: string }[] = [
  { key: 'main', label: 'Main' },
  { key: 'nsfw', label: 'NSFW' },
  { key: 'jailbreak', label: 'Jailbreak' },
  { key: 'enhanceDefinitions', label: 'Enhance Definitions' },
  { key: 'impersonation_prompt', label: 'Impersonation Prompt' },
  { key: 'new_chat_prompt', label: 'New Chat Prompt' },
  { key: 'new_group_chat_prompt', label: 'New Group Chat Prompt' },
  { key: 'new_example_chat_prompt', label: 'New Example Chat Prompt' },
  { key: 'continue_nudge_prompt', label: 'Continue Nudge Prompt' },
  { key: 'wi_format', label: 'World Info Format' },
  { key: 'group_nudge_prompt', label: 'Group Nudge Prompt' },
  { key: 'scenario_format', label: 'Scenario Format' },
  { key: 'personality_format', label: 'Personality Format' },
];

interface CustomPromptItem {
  identifier: string;
  role?: 'system' | 'user' | 'assistant';
  content?: string;
}

function NumberField({
  label,
  value,
  onChange,
  step,
  min,
  max,
  fallback,
}: {
  label: string;
  value: number | undefined;
  onChange: (n: number) => void;
  step?: number;
  min?: number;
  max?: number;
  fallback: number;
}) {
  return (
    <label style={{ display: 'block', marginBottom: 8 }}>
      <span style={{ display: 'block', fontSize: 12, color: 'var(--jjk-text-3)', marginBottom: 2 }}>
        {label}
      </span>
      <input
        type="number"
        step={step ?? 1}
        value={value ?? fallback}
        onChange={(e) =>
          onChange(clampNumber(e.target.value, min ?? -1e9, max ?? 1e9, fallback))
        }
        style={{ padding: 6, width: 140, background: 'rgba(28,28,28,0.8)', border: '1px solid rgba(170,0,0,0.3)', color: 'var(--jjk-text)' }}
      />
    </label>
  );
}

function TextField({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string | undefined;
  onChange: (s: string) => void;
  placeholder?: string;
}) {
  return (
    <label style={{ display: 'block', marginBottom: 8 }}>
      <span style={{ display: 'block', fontSize: 12, color: 'var(--jjk-text-3)', marginBottom: 2 }}>
        {label}
      </span>
      <input
        type="text"
        value={value ?? ''}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        style={{ padding: 6, width: '100%', background: 'rgba(28,28,28,0.8)', border: '1px solid rgba(170,0,0,0.3)', color: 'var(--jjk-text)' }}
      />
    </label>
  );
}

function TextArea({
  label,
  value,
  onChange,
  rows,
}: {
  label: string;
  value: string | undefined;
  onChange: (s: string) => void;
  rows?: number;
}) {
  return (
    <label style={{ display: 'block', marginBottom: 12 }}>
      <span style={{ display: 'block', fontSize: 12, color: 'var(--jjk-text-3)', marginBottom: 4 }}>
        {label}
      </span>
      <textarea
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value)}
        style={{
          width: '100%',
          padding: 8,
          fontFamily: 'monospace',
          fontSize: 12,
          background: 'rgba(28,28,28,0.8)',
          border: '1px solid rgba(170,0,0,0.3)',
          color: 'var(--jjk-text)',
        }}
        rows={rows ?? 4}
      />
    </label>
  );
}

export function PresetModal({ onClose }: { onClose: () => void }) {
  const {
    presets,
    settings,
    updateSettings,
    updatePreset,
    deletePreset,
    addPresetFromDefault,
  } = useSillytavern();

  const [selectedId, setSelectedId] = useState<string | null>(
    settings?.activePresetId ?? presets[0]?.id ?? null,
  );
  const [searchQuery, setSearchQuery] = useState('');
  const original = useMemo(
    () => presets.find((p) => p.id === selectedId) ?? null,
    [presets, selectedId],
  );
  const [draft, setDraft] = useState<ChatPreset | null>(original);
  const [tab, setTab] = useState<Tab>('sampling');

  const filteredPresets = useMemo(() => {
    if (!searchQuery.trim()) return presets;
    const q = searchQuery.trim().toLowerCase();
    return presets.filter((p) => p.name.toLowerCase().includes(q));
  }, [presets, searchQuery]);

  useEffect(() => {
    setDraft(original);
  }, [original?.id]);

  const dirty = useMemo(() => {
    if (!draft || !original) return false;
    return draft.name !== original.name || JSON.stringify(draft.settings) !== JSON.stringify(original.settings);
  }, [draft, original]);

  const patchSettings = (patch: Record<string, any>) => {
    if (!draft) return;
    setDraft({ ...draft, settings: { ...draft.settings, ...patch } });
  };

  const tryClose = () => {
    if (dirty && !confirm('放弃未保存的修改?')) return;
    onClose();
  };

  const handleSave = async () => {
    if (!draft) return;
    try {
      await updatePreset(draft);
    } catch (e) {
      alert('保存失败: ' + (e as Error).message);
    }
  };

  const handleSelectPreset = (id: string) => {
    if (dirty && !confirm('当前预设有未保存修改,确定切换?')) return;
    setSelectedId(id);
    const next = presets.find((p) => p.id === id);
    setDraft(next ?? null);
  };

  const handleActivate = async () => {
    if (!draft) return;
    await updateSettings({ activePresetId: draft.id });
  };

  const handleNewPreset = async () => {
    const name = prompt('新预设名称', '新预设');
    if (!name) return;
    const p = await addPresetFromDefault(name);
    setSelectedId(p.id);
    setDraft(p);
  };

  const handleDelete = async () => {
    if (!draft) return;
    if (!confirm(`删除预设 "${draft.name}"?`)) return;
    await deletePreset(draft.id);
    const remaining = presets.filter((p) => p.id !== draft.id);
    setSelectedId(remaining[0]?.id ?? null);
    setDraft(remaining[0] ?? null);
  };

  const handleAddCustomPrompt = () => {
    if (!draft) return;
    const current = (draft.settings.prompts ?? []) as CustomPromptItem[];
    const id = prompt('新 prompt 的 identifier (英文/下划线)', 'custom_' + (current.length + 1));
    if (!id) return;
    if (current.some((p) => p.identifier === id)) {
      alert('identifier 已存在');
      return;
    }
    patchSettings({
      prompts: [...current, { identifier: id, role: 'system', content: '' }],
    });
  };

  return (
    <div
      onClick={tryClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,.5)',
        zIndex: 200,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'rgba(14,10,8,0.98)',
          width: 'min(1100px, 95vw)',
          height: '90vh',
          display: 'flex',
          flexDirection: 'column',
          borderRadius: 6,
          overflow: 'hidden',
          border: '1px solid rgba(170,0,0,0.3)',
          color: 'var(--jjk-text)',
        }}
      >
        <header
          style={{
            padding: '12px 16px',
            borderBottom: '1px solid rgba(170,0,0,0.2)',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
          }}
        >
          <strong>预设管理</strong>
          <button onClick={handleNewPreset}>+ 新建</button>
          {draft && (
            <>
              <button onClick={handleActivate} disabled={settings?.activePresetId === draft.id}>
                {settings?.activePresetId === draft.id ? '当前已激活' : '设为激活'}
              </button>
              <button onClick={handleDelete} style={{ color: '#c00' }}>
                删除
              </button>
            </>
          )}
          <span style={{ flex: 1 }} />
          <button
            onClick={handleSave}
            disabled={!dirty}
            style={{
              padding: '6px 14px',
              background: dirty ? 'var(--jjk-red)' : 'rgba(100,100,100,0.3)',
              color: '#fff',
              border: 'none',
              borderRadius: 4,
              cursor: dirty ? 'pointer' : 'not-allowed',
            }}
          >
            保存
          </button>
          <button onClick={tryClose} style={{ color: 'var(--jjk-text-3)', background: 'transparent', border: 'none', fontSize: 18 }}>×</button>
        </header>

        <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
          <aside
            style={{
              width: 260,
              borderRight: '1px solid rgba(170,0,0,0.2)',
              overflowY: 'auto',
              padding: 12,
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
            }}
          >
            <div style={{ position: 'relative' }}>
              <Search size={14} style={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)', color: 'var(--jjk-text-4)' }} />
              <input
                type="text"
                placeholder="搜索预设..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  padding: '6px 8px 6px 28px',
                  background: 'rgba(28,28,28,0.6)',
                  border: '1px solid rgba(170,0,0,0.2)',
                  borderRadius: 4,
                  color: 'var(--jjk-text)',
                  fontSize: 13,
                  outline: 'none',
                }}
              />
            </div>

            <ul style={{ listStyle: 'none', padding: 0, margin: 0, flex: 1, overflowY: 'auto' }}>
              {filteredPresets.map((p) => {
                const isActive = settings?.activePresetId === p.id;
                const isSelected = p.id === selectedId;
                return (
                  <li
                    key={p.id}
                    onClick={() => handleSelectPreset(p.id)}
                    style={{
                      padding: '8px 10px',
                      cursor: 'pointer',
                      background: isSelected ? 'rgba(170,0,0,0.15)' : 'transparent',
                      border: isSelected ? '1px solid rgba(170,0,0,0.3)' : '1px solid transparent',
                      borderRadius: 4,
                      fontSize: 13,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      color: isSelected ? 'var(--jjk-text)' : 'var(--jjk-text-3)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      marginBottom: 4,
                    }}
                  >
                    <span
                      style={{
                        width: 6,
                        height: 6,
                        borderRadius: '50%',
                        background: isActive ? '#00CC66' : 'rgba(100,100,100,0.4)',
                        boxShadow: isActive ? '0 0 4px #00CC66' : 'none',
                        flexShrink: 0,
                      }}
                      title={isActive ? '已激活' : '未激活'}
                    />
                    <span className="truncate" style={{ flex: 1, minWidth: 0 }}>{p.name}</span>
                    {isActive && (
                      <span style={{ fontSize: 10, color: '#D4AF37', fontFamily: 'monospace', flexShrink: 0 }}>★</span>
                    )}
                  </li>
                );
              })}
            </ul>
            {filteredPresets.length === 0 && (
              <div style={{ textAlign: 'center', color: 'var(--jjk-text-4)', padding: 24, fontSize: 13 }}>
                {searchQuery ? '无匹配预设' : '暂无预设'}
              </div>
            )}
          </aside>

          <main style={{ flex: 1, overflowY: 'auto', padding: 12 }}>
            {!draft ? (
              <div style={{ textAlign: 'center', color: 'var(--jjk-text-4)', padding: 60 }}>
                选择左侧预设或新建一个
              </div>
            ) : (
              <>
                <div style={{ marginBottom: 12 }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    名称:
                    <input
                      type="text"
                      value={draft.name}
                      onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                      style={{ padding: 6, flex: 1 }}
                    />
                  </label>
                </div>

                <div style={{ display: 'flex', gap: 4, marginBottom: 16 }}>
                  {TABS.map((t) => (
                    <button
                      key={t}
                      onClick={() => setTab(t)}
                      style={{
                        padding: '4px 10px',
                        border: 'none',
                        background: tab === t ? 'rgba(170,0,0,0.4)' : 'rgba(28,28,28,0.6)',
                        color: tab === t ? '#fff' : 'var(--jjk-text-3)',
                        borderRadius: 4,
                        cursor: 'pointer',
                      }}
                    >
                      {TAB_LABELS[t]}
                    </button>
                  ))}
                </div>

                {tab === 'sampling' && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    <NumberField
                      label="temp_openai (温度)"
                      value={draft.settings.temp_openai}
                      onChange={(v) => patchSettings({ temp_openai: v })}
                      step={0.05}
                      min={0}
                      max={2}
                      fallback={0.8}
                    />
                    <NumberField
                      label="top_p_openai"
                      value={draft.settings.top_p_openai}
                      onChange={(v) => patchSettings({ top_p_openai: v })}
                      step={0.01}
                      min={0}
                      max={1}
                      fallback={0.9}
                    />
                    <NumberField
                      label="top_k_openai"
                      value={draft.settings.top_k_openai}
                      onChange={(v) => patchSettings({ top_k_openai: v })}
                      step={1}
                      min={0}
                      max={500}
                      fallback={0}
                    />
                    <NumberField
                      label="top_a_openai"
                      value={draft.settings.top_a_openai}
                      onChange={(v) => patchSettings({ top_a_openai: v })}
                      step={0.01}
                      min={0}
                      max={1}
                      fallback={0}
                    />
                    <NumberField
                      label="min_p_openai"
                      value={draft.settings.min_p_openai}
                      onChange={(v) => patchSettings({ min_p_openai: v })}
                      step={0.01}
                      min={0}
                      max={1}
                      fallback={0}
                    />
                    <NumberField
                      label="freq_pen_openai (频率惩罚)"
                      value={draft.settings.freq_pen_openai}
                      onChange={(v) => patchSettings({ freq_pen_openai: v })}
                      step={0.1}
                      min={-2}
                      max={2}
                      fallback={0}
                    />
                    <NumberField
                      label="pres_pen_openai (存在惩罚)"
                      value={draft.settings.pres_pen_openai}
                      onChange={(v) => patchSettings({ pres_pen_openai: v })}
                      step={0.1}
                      min={-2}
                      max={2}
                      fallback={0}
                    />
                    <NumberField
                      label="repetition_penalty_openai"
                      value={draft.settings.repetition_penalty_openai}
                      onChange={(v) => patchSettings({ repetition_penalty_openai: v })}
                      step={0.05}
                      min={0}
                      max={2}
                      fallback={1}
                    />
                    <NumberField
                      label="openai_max_context"
                      value={draft.settings.openai_max_context}
                      onChange={(v) => patchSettings({ openai_max_context: v })}
                      step={256}
                      min={256}
                      max={2_000_000}
                      fallback={4096}
                    />
                    <NumberField
                      label="openai_max_tokens"
                      value={draft.settings.openai_max_tokens}
                      onChange={(v) => patchSettings({ openai_max_tokens: v })}
                      step={64}
                      min={32}
                      max={32768}
                      fallback={2048}
                    />
                    <TextField
                      label="openai_model"
                      value={draft.settings.openai_model}
                      onChange={(v) => patchSettings({ openai_model: v })}
                      placeholder="gpt-3.5-turbo"
                    />
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                      <label>
                        <input
                          type="checkbox"
                          checked={!!draft.settings.stream_openai}
                          onChange={(e) => patchSettings({ stream_openai: e.target.checked })}
                        />
                        stream_openai
                      </label>
                      <label>
                        <input
                          type="checkbox"
                          checked={!!draft.settings.max_context_unlocked}
                          onChange={(e) =>
                            patchSettings({ max_context_unlocked: e.target.checked })
                          }
                        />
                        max_context_unlocked
                      </label>
                    </div>
                  </div>
                )}

                {tab === 'prompts' && (
                  <div>
                    {PROMPT_TEXT_FIELDS.map((f) => (
                      <TextArea
                        key={f.key}
                        label={f.label + ' (' + f.key + ')'}
                        value={draft.settings[f.key]}
                        onChange={(v) => patchSettings({ [f.key]: v })}
                        rows={4}
                      />
                    ))}
                  </div>
                )}

                {tab === 'custom' && (
                  <div>
                    <button onClick={handleAddCustomPrompt} style={{ marginBottom: 12, background: 'rgba(28,28,28,0.6)', border: '1px solid rgba(170,0,0,0.3)', color: 'var(--jjk-text)', padding: '6px 12px', cursor: 'pointer', borderRadius: 4 }}>
                      + 新建自定义 prompt
                    </button>
                    <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                      {((draft.settings.prompts ?? []) as CustomPromptItem[]).map((p, idx) => (
                        <li
                          key={p.identifier + idx}
                          style={{
                            border: '1px solid rgba(100,100,100,0.2)',
                            borderRadius: 4,
                            padding: 8,
                            marginBottom: 8,
                            background: 'rgba(28,28,28,0.4)',
                          }}
                        >
                          <div
                            style={{
                              display: 'flex',
                              gap: 8,
                              alignItems: 'center',
                              marginBottom: 8,
                            }}
                          >
                            <code style={{ fontSize: 12, color: 'var(--jjk-text-4)' }}>{p.identifier}</code>
                            <select
                              value={p.role ?? 'system'}
                              onChange={(e) => {
                                const list = (draft.settings.prompts ?? []).slice();
                                list[idx] = { ...list[idx], role: e.target.value as any };
                                patchSettings({ prompts: list });
                              }}
                              style={{ padding: 4, background: 'rgba(28,28,28,0.8)', border: '1px solid rgba(170,0,0,0.3)', color: 'var(--jjk-text)' }}
                            >
                              <option value="system">system</option>
                              <option value="user">user</option>
                              <option value="assistant">assistant</option>
                            </select>
                            <span style={{ flex: 1 }} />
                            <button
                              onClick={() => {
                                if (!confirm('删除此 prompt?')) return;
                                const list = (draft.settings.prompts ?? []).filter(
                                  (_: any, i: number) => i !== idx,
                                );
                                patchSettings({ prompts: list });
                              }}
                              style={{ color: '#FF4444', background: 'transparent', border: 'none', cursor: 'pointer' }}
                            >
                              删除
                            </button>
                          </div>
                          <textarea
                            value={p.content ?? ''}
                            onChange={(e) => {
                              const list = (draft.settings.prompts ?? []).slice();
                              list[idx] = { ...list[idx], content: e.target.value };
                              patchSettings({ prompts: list });
                            }}
                            style={{
                              width: '100%',
                              minHeight: 80,
                              padding: 6,
                              fontFamily: 'monospace',
                              fontSize: 12,
                              background: 'rgba(28,28,28,0.8)',
                              border: '1px solid rgba(170,0,0,0.3)',
                              color: 'var(--jjk-text)',
                            }}
                          />
                        </li>
                      ))}
                    </ul>
                    {((draft.settings.prompts ?? []) as CustomPromptItem[]).length === 0 && (
                      <div style={{ color: 'var(--jjk-text-4)', padding: 16, fontSize: 13 }}>
                        无自定义 prompt
                      </div>
                    )}
                  </div>
                )}

                {tab === 'order' && (
                  <PromptOrderEditor
                    value={(draft.settings.prompt_order ?? []) as PromptOrderItem[]}
                    onChange={(next) => patchSettings({ prompt_order: next })}
                  />
                )}
              </>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
