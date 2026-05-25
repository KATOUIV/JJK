import { useState, useMemo } from 'react';
import { Search } from 'lucide-react';
import { movePromptItem } from '../../sillytavern/editor-utils';

export interface PromptOrderItem {
  identifier: string;
  name?: string;
  role?: 'system' | 'user' | 'assistant';
  enabled?: boolean;
}

export function PromptOrderEditor({
  value,
  onChange,
}: {
  value: PromptOrderItem[];
  onChange: (next: PromptOrderItem[]) => void;
}) {
  const [searchQuery, setSearchQuery] = useState('');

  const setEnabled = (idx: number, enabled: boolean) => {
    const next = value.slice();
    next[idx] = { ...next[idx], enabled };
    onChange(next);
  };

  const move = (from: number, to: number) => {
    const next = movePromptItem(value, from, to);
    if (next !== value) onChange(next);
  };

  const filtered = useMemo(() => {
    if (!searchQuery.trim()) return value.map((item, originalIdx) => ({ item, originalIdx }));
    const q = searchQuery.trim().toLowerCase();
    return value
      .map((item, originalIdx) => ({ item, originalIdx }))
      .filter(({ item }) =>
        item.identifier.toLowerCase().includes(q) ||
        (item.name ?? '').toLowerCase().includes(q)
      );
  }, [value, searchQuery]);

  if (value.length === 0) {
    return (
      <div style={{ color: 'var(--jjk-text-4)', fontSize: 13, padding: 12 }}>
        当前预设没有 prompt_order 数组。导入 SillyTavern 预设或新建默认预设以获得标准顺序。
      </div>
    );
  }

  return (
    <div>
      <div style={{ position: 'relative', marginBottom: 12 }}>
        <Search size={14} style={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)', color: 'var(--jjk-text-4)' }} />
        <input
          type="text"
          placeholder="搜索 prompt 标识或名称..."
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
      <ol style={{ listStyle: 'none', padding: 0, margin: 0 }}>
        {filtered.map(({ item, originalIdx }) => (
          <li
            key={item.identifier}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '6px 8px',
              borderBottom: '1px solid rgba(100,100,100,0.15)',
              color: item.enabled !== false ? 'var(--jjk-text-2)' : 'var(--jjk-text-4)',
              opacity: item.enabled !== false ? 1 : 0.6,
            }}
          >
            <input
              type="checkbox"
              checked={item.enabled !== false}
              onChange={(e) => setEnabled(originalIdx, e.target.checked)}
            />
            <code style={{ fontSize: 12, color: 'var(--jjk-text-4)', minWidth: 140 }}>{item.identifier}</code>
            <span style={{ flex: 1 }}>{item.name ?? item.identifier}</span>
            {item.enabled === false && (
              <span style={{ fontSize: 10, color: '#888', fontFamily: 'monospace', flexShrink: 0 }}>未激活</span>
            )}
            {item.enabled !== false && (
              <span style={{ fontSize: 10, color: '#00CC66', fontFamily: 'monospace', flexShrink: 0 }}>已激活</span>
            )}
            <button
              disabled={originalIdx === 0}
              onClick={() => move(originalIdx, originalIdx - 1)}
              style={{ padding: '2px 8px', background: 'rgba(28,28,28,0.6)', border: '1px solid rgba(170,0,0,0.3)', color: 'var(--jjk-text-3)', cursor: 'pointer' }}
              title="上移"
            >
              ↑
            </button>
            <button
              disabled={originalIdx === value.length - 1}
              onClick={() => move(originalIdx, originalIdx + 1)}
              style={{ padding: '2px 8px', background: 'rgba(28,28,28,0.6)', border: '1px solid rgba(170,0,0,0.3)', color: 'var(--jjk-text-3)', cursor: 'pointer' }}
              title="下移"
            >
              ↓
            </button>
          </li>
        ))}
      </ol>
      {filtered.length === 0 && (
        <div style={{ textAlign: 'center', color: 'var(--jjk-text-4)', padding: 24, fontSize: 13 }}>
          无匹配 prompt
        </div>
      )}
    </div>
  );
}
