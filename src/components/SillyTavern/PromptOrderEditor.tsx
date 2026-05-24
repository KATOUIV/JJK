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
  const setEnabled = (idx: number, enabled: boolean) => {
    const next = value.slice();
    next[idx] = { ...next[idx], enabled };
    onChange(next);
  };

  const move = (from: number, to: number) => {
    const next = movePromptItem(value, from, to);
    if (next !== value) onChange(next);
  };

  if (value.length === 0) {
    return (
      <div style={{ color: 'var(--jjk-text-4)', fontSize: 13, padding: 12 }}>
        当前预设没有 prompt_order 数组。导入 SillyTavern 预设或新建默认预设以获得标准顺序。
      </div>
    );
  }

  return (
    <ol style={{ listStyle: 'none', padding: 0, margin: 0 }}>
      {value.map((item, idx) => (
        <li
          key={item.identifier}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '6px 8px',
            borderBottom: '1px solid rgba(100,100,100,0.15)',
            color: 'var(--jjk-text-2)',
          }}
        >
          <input
            type="checkbox"
            checked={item.enabled !== false}
            onChange={(e) => setEnabled(idx, e.target.checked)}
          />
          <code style={{ fontSize: 12, color: 'var(--jjk-text-4)', minWidth: 140 }}>{item.identifier}</code>
          <span style={{ flex: 1 }}>{item.name ?? item.identifier}</span>
          <button
            disabled={idx === 0}
            onClick={() => move(idx, idx - 1)}
            style={{ padding: '2px 8px', background: 'rgba(28,28,28,0.6)', border: '1px solid rgba(170,0,0,0.3)', color: 'var(--jjk-text-3)', cursor: 'pointer' }}
            title="上移"
          >
            ↑
          </button>
          <button
            disabled={idx === value.length - 1}
            onClick={() => move(idx, idx + 1)}
            style={{ padding: '2px 8px', background: 'rgba(28,28,28,0.6)', border: '1px solid rgba(170,0,0,0.3)', color: 'var(--jjk-text-3)', cursor: 'pointer' }}
            title="下移"
          >
            ↓
          </button>
        </li>
      ))}
    </ol>
  );
}
