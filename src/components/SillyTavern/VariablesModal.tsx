import { useState } from 'react';

function formatValue(value: any): string {
  if (value === null) return 'null';
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}

function parseValue(text: string): any {
  const trimmed = text.trim();
  if (trimmed === 'null') return null;
  if (trimmed === 'true') return true;
  if (trimmed === 'false') return false;
  if (trimmed === '') return '';
  const num = Number(trimmed);
  if (!Number.isNaN(num) && trimmed !== '') return num;
  try {
    return JSON.parse(trimmed);
  } catch {
    return trimmed;
  }
}

export function VariablesModal({
  variables,
  onUpdate,
  onClose,
}: {
  variables: Record<string, any>;
  onUpdate: (vars: Record<string, any>) => void;
  onClose: () => void;
}) {
  const vars = variables;
  const [draftKey, setDraftKey] = useState('');
  const [draftValue, setDraftValue] = useState('');

  const handleAdd = () => {
    const k = draftKey.trim();
    if (!k) return;
    if (vars[k] !== undefined) {
      alert('变量名已存在');
      return;
    }
    onUpdate({ ...vars, [k]: parseValue(draftValue) });
    setDraftKey('');
    setDraftValue('');
  };

  const handleEdit = (oldKey: string, newKey: string, newValue: string) => {
    const next: Record<string, any> = { ...vars };
    if (oldKey !== newKey) {
      delete next[oldKey];
    }
    next[newKey] = parseValue(newValue);
    onUpdate(next);
  };

  const handleDelete = (key: string) => {
    if (!confirm(`删除变量 "${key}"?`)) return;
    const next = { ...vars };
    delete next[key];
    onUpdate(next);
  };

  const inputStyle: React.CSSProperties = {
    padding: 6,
    background: 'rgba(28,28,28,0.8)',
    border: '1px solid rgba(170,0,0,0.3)',
    color: 'var(--jjk-text)',
    borderRadius: 4,
    outline: 'none',
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,.55)',
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
          width: 'min(560px, 95vw)',
          maxHeight: '85vh',
          display: 'flex',
          flexDirection: 'column',
          borderRadius: 6,
          overflow: 'hidden',
          border: '1px solid rgba(170,0,0,0.35)',
          color: 'var(--jjk-text)',
        }}
      >
        <header
          style={{
            padding: '12px 16px',
            borderBottom: '1px solid rgba(170,0,0,0.2)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <strong style={{ color: 'var(--jjk-gold)' }}>变量面板</strong>
          <button
            onClick={onClose}
            style={{
              color: 'var(--jjk-text-3)',
              background: 'transparent',
              border: 'none',
              fontSize: 18,
              cursor: 'pointer',
            }}
          >
            ×
          </button>
        </header>

        <main style={{ flex: 1, overflowY: 'auto', padding: 16 }}>
          <div
            style={{
              display: 'flex',
              gap: 8,
              marginBottom: 16,
              paddingBottom: 12,
              borderBottom: '1px solid rgba(170,0,0,0.15)',
            }}
          >
            <input
              type="text"
              placeholder="变量名"
              value={draftKey}
              onChange={(e) => setDraftKey(e.target.value)}
              style={{ ...inputStyle, flex: 1 }}
            />
            <input
              type="text"
              placeholder="值"
              value={draftValue}
              onChange={(e) => setDraftValue(e.target.value)}
              style={{ ...inputStyle, flex: 2 }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleAdd();
              }}
            />
            <button
              onClick={handleAdd}
              style={{
                padding: '6px 12px',
                background: 'var(--jjk-red)',
                color: '#fff',
                border: 'none',
                borderRadius: 4,
                cursor: 'pointer',
                fontSize: 13,
              }}
            >
              + 添加
            </button>
          </div>

          {Object.keys(vars).length === 0 ? (
            <div style={{ color: 'var(--jjk-text-4)', padding: 24, textAlign: 'center', fontSize: 13 }}>
              暂无变量。AI 回复中包含 <code style={{ color: 'var(--jjk-gold)' }}>{'<var name="hp" value="100" />'}</code> 时会自动提取。
            </div>
          ) : (
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {Object.entries(vars).map(([key, value]) => (
                <VariableRow
                  key={key}
                  varKey={key}
                  varValue={formatValue(value)}
                  onSave={handleEdit}
                  onDelete={() => handleDelete(key)}
                />
              ))}
            </ul>
          )}

          <div
            style={{
              marginTop: 16,
              padding: 12,
              background: 'rgba(170,0,0,0.06)',
              borderRadius: 4,
              fontSize: 12,
              color: 'var(--jjk-text-4)',
              border: '1px solid rgba(170,0,0,0.15)',
            }}
          >
            <strong style={{ color: 'var(--jjk-text-2)' }}>提示:</strong> 变量随当前对话保存。AI 回复包含
            <code style={{ color: 'var(--jjk-gold)', margin: '0 4px' }}>
              {'<vars>{"hp": 80}</vars>'}
            </code>
            块时也会自动合并。
          </div>
        </main>
      </div>
    </div>
  );
}

function VariableRow({
  varKey,
  varValue,
  onSave,
  onDelete,
}: {
  varKey: string;
  varValue: string;
  onSave: (oldKey: string, newKey: string, newValue: string) => void;
  onDelete: () => void;
}) {
  const [name, setName] = useState(varKey);
  const [value, setValue] = useState(varValue);
  const dirty = name !== varKey || value !== varValue;

  const inputStyle: React.CSSProperties = {
    padding: 4,
    background: 'rgba(28,28,28,0.8)',
    border: '1px solid rgba(170,0,0,0.25)',
    color: 'var(--jjk-text)',
    borderRadius: 3,
    outline: 'none',
  };

  return (
    <li
      style={{
        display: 'flex',
        gap: 8,
        alignItems: 'center',
        padding: '6px 0',
        borderBottom: '1px solid rgba(100,100,100,0.12)',
      }}
    >
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        style={{ ...inputStyle, flex: 1, fontFamily: 'monospace' }}
      />
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        style={{ ...inputStyle, flex: 2 }}
      />
      <button
        onClick={() => onSave(varKey, name.trim() || varKey, value)}
        disabled={!dirty || !name.trim()}
        style={{
          padding: '4px 10px',
          background: dirty && name.trim() ? 'rgba(0,150,70,0.8)' : 'rgba(60,60,60,0.4)',
          color: '#fff',
          border: 'none',
          borderRadius: 3,
          cursor: dirty && name.trim() ? 'pointer' : 'not-allowed',
          fontSize: 12,
        }}
      >
        保存
      </button>
      <button
        onClick={onDelete}
        style={{
          padding: '4px 8px',
          color: '#FF4444',
          background: 'transparent',
          border: '1px solid rgba(255,68,68,0.4)',
          borderRadius: 3,
          fontSize: 12,
          cursor: 'pointer',
        }}
      >
        删除
      </button>
    </li>
  );
}
