import { useState, useMemo } from 'react';
import type { Lorebook, LorebookEntry } from '../../sillytavern/types';
import { EntryForm } from './EntryForm';
import {
  createDefaultEntry,
  updateEntry,
  removeEntry,
} from '../../sillytavern/editor-utils';
import { useSillytavern } from '../../hooks/useSillytavern';

function entryLabel(e: LorebookEntry): string {
  if (e.comment?.trim()) return e.comment;
  if (e.content.trim()) return e.content.trim().slice(0, 30);
  if (e.keys.length) return e.keys.join(', ');
  return '(未命名条目)';
}

export function LorebookEditorModal({
  lorebook,
  onClose,
}: {
  lorebook: Lorebook;
  onClose: () => void;
}) {
  const { updateLorebook } = useSillytavern();
  const [draft, setDraft] = useState<Lorebook>(lorebook);
  const [selectedId, setSelectedId] = useState<string | null>(
    lorebook.entries[0]?.id ?? null,
  );

  const dirty = useMemo(() => {
    if (!draft) return false;
    return (
      draft.name !== lorebook.name ||
      draft.entries.length !== lorebook.entries.length ||
      draft.entries.some((e, i) => e !== lorebook.entries[i]) ||
      draft.recursiveScanning !== lorebook.recursiveScanning ||
      draft.caseSensitive !== lorebook.caseSensitive ||
      draft.matchWholeWords !== lorebook.matchWholeWords
    );
  }, [draft, lorebook]);

  const selected = useMemo(
    () => draft.entries.find((e) => e.id === selectedId) ?? null,
    [draft.entries, selectedId],
  );

  const tryClose = () => {
    if (dirty && !confirm('放弃未保存的修改?')) return;
    onClose();
  };

  const handleSave = async () => {
    try {
      await updateLorebook(draft);
      onClose();
    } catch (e) {
      alert('保存失败: ' + (e as Error).message);
    }
  };

  const handleAddEntry = () => {
    const e = createDefaultEntry();
    setDraft((prev) => ({
      ...prev,
      entries: [...prev.entries, e],
      updatedAt: Date.now(),
    }));
    setSelectedId(e.id);
  };

  const handleDeleteEntry = (id: string) => {
    if (!confirm('确定删除此条目?')) return;
    setDraft((prev) => removeEntry(prev, id));
    if (selectedId === id) {
      const remaining = draft.entries.filter((e) => e.id !== id);
      setSelectedId(remaining[0]?.id ?? null);
    }
  };

  const handleEntryChange = (patch: Partial<LorebookEntry>) => {
    if (!selected) return;
    setDraft((prev) => updateEntry(prev, selected.id, patch));
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
          <strong style={{ color: 'var(--jjk-gold)' }}>编辑世界书:</strong>
          <input
            type="text"
            value={draft.name}
            onChange={(e) =>
              setDraft((prev) => ({ ...prev, name: e.target.value, updatedAt: Date.now() }))
            }
            style={{ flex: 1, padding: 6, fontSize: 14, background: 'rgba(28,28,28,0.8)', border: '1px solid rgba(170,0,0,0.3)', color: 'var(--jjk-text)' }}
          />
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
              width: 280,
              borderRight: '1px solid rgba(170,0,0,0.2)',
              overflowY: 'auto',
              padding: 8,
            }}
          >
            <button
              onClick={handleAddEntry}
              style={{
                width: '100%',
                padding: '6px 10px',
                marginBottom: 8,
                background: 'rgba(28,28,28,0.6)',
                border: '1px solid rgba(170,0,0,0.3)',
                borderRadius: 4,
                cursor: 'pointer',
                color: 'var(--jjk-text-2)',
              }}
            >
              + 新建条目
            </button>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {draft.entries.map((e) => {
                const statusColor = e.disabled
                  ? '#888888'
                  : e.constant
                    ? '#4488FF'
                    : '#00CC66';
                const statusLabel = e.disabled
                  ? '关闭'
                  : e.constant
                    ? '常驻'
                    : '关键词';
                return (
                  <li
                    key={e.id}
                    onClick={() => setSelectedId(e.id)}
                    style={{
                      padding: '6px 8px',
                      cursor: 'pointer',
                      background: e.id === selectedId ? 'rgba(170,0,0,0.15)' : 'transparent',
                      borderRadius: 4,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      fontSize: 13,
                      color: e.id === selectedId ? 'var(--jjk-text)' : 'var(--jjk-text-3)',
                    }}
                  >
                    <span
                      style={{
                        width: 7,
                        height: 7,
                        borderRadius: '50%',
                        background: statusColor,
                        flexShrink: 0,
                        boxShadow: `0 0 4px ${statusColor}`,
                      }}
                      title={statusLabel}
                    />
                    <span
                      style={{
                        flex: 1,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        opacity: e.disabled ? 0.5 : 1,
                      }}
                    >
                      {entryLabel(e)}
                    </span>
                    <span
                      style={{
                        fontSize: 10,
                        color: statusColor,
                        fontFamily: "'Share Tech Mono', monospace",
                        flexShrink: 0,
                      }}
                    >
                      {statusLabel}
                    </span>
                    <button
                      onClick={(ev) => {
                        ev.stopPropagation();
                        handleDeleteEntry(e.id);
                      }}
                      style={{
                        border: 'none',
                        background: 'transparent',
                        color: '#FF4444',
                        cursor: 'pointer',
                        fontSize: 16,
                      }}
                      title="删除"
                    >
                      ×
                    </button>
                  </li>
                );
              })}
            </ul>
            {draft.entries.length === 0 && (
              <div style={{ textAlign: 'center', color: 'var(--jjk-text-4)', padding: 24, fontSize: 13 }}>
                暂无条目,点上方按钮新建
              </div>
            )}
          </aside>

          <main style={{ flex: 1, overflowY: 'auto' }}>
            {selected ? (
              <EntryForm value={selected} onChange={handleEntryChange} />
            ) : (
              <div style={{ textAlign: 'center', color: 'var(--jjk-text-4)', padding: 60 }}>
                选择左侧条目或新建一条
              </div>
            )}
          </main>
        </div>

        <footer
          style={{
            padding: '8px 16px',
            borderTop: '1px solid rgba(170,0,0,0.2)',
            display: 'flex',
            gap: 16,
            fontSize: 12,
            color: 'var(--jjk-text-3)',
          }}
        >
          <label>
            <input
              type="checkbox"
              checked={draft.recursiveScanning}
              onChange={(e) =>
                setDraft((prev) => ({
                  ...prev,
                  recursiveScanning: e.target.checked,
                  updatedAt: Date.now(),
                }))
              }
            />
            递归扫描
          </label>
          <label>
            <input
              type="checkbox"
              checked={draft.caseSensitive}
              onChange={(e) =>
                setDraft((prev) => ({
                  ...prev,
                  caseSensitive: e.target.checked,
                  updatedAt: Date.now(),
                }))
              }
            />
            区分大小写
          </label>
          <label>
            <input
              type="checkbox"
              checked={draft.matchWholeWords}
              onChange={(e) =>
                setDraft((prev) => ({
                  ...prev,
                  matchWholeWords: e.target.checked,
                  updatedAt: Date.now(),
                }))
              }
            />
            全词匹配
          </label>
        </footer>
      </div>
    </div>
  );
}
