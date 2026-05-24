import { useState, useEffect, useMemo } from 'react';
import { Search } from 'lucide-react';
import { useSillytavern } from '../../hooks/useSillytavern';
import { getDatabase } from '../../sillytavern/database';
import { importMultipleLorebooks, renameLorebook } from '../../sillytavern/importer';
import type { Lorebook } from '../../sillytavern/types';
import { LorebookEditorModal } from './LorebookEditorModal';

const db = getDatabase();

export function LorebookModal({ onClose }: { onClose: () => void }) {
  const { lorebooks, toggleLorebook, addLorebookFromDefault, deleteLorebook } = useSillytavern();
  const [list, setList] = useState<Lorebook[]>(lorebooks);
  const [activeIds, setActiveIds] = useState<Set<string>>(new Set());
  const [editing, setEditing] = useState<Lorebook | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    setList(lorebooks);
  }, [lorebooks]);

  // Derive active IDs from settings via a separate effect
  useEffect(() => {
    const fetchActive = async () => {
      const settings = await db.settings.toArray();
      const ids = settings[0]?.activeLorebookIds ?? [];
      setActiveIds(new Set(ids));
    };
    fetchActive();
  }, [db, lorebooks]);

  const filteredLorebooks = useMemo(() => {
    if (!searchQuery.trim()) return list;
    const q = searchQuery.trim().toLowerCase();
    return list.filter((lb) => lb.name.toLowerCase().includes(q));
  }, [list, searchQuery]);

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,.4)',
        zIndex: 100,
      }}
    >
      <aside
        onClick={(e) => e.stopPropagation()}
        style={{
          position: 'absolute',
          right: 0,
          top: 0,
          bottom: 0,
          width: 360,
          background: 'rgba(14,10,8,0.98)',
          padding: 16,
          overflowY: 'auto',
          borderLeft: '1px solid rgba(170,0,0,0.3)',
          color: 'var(--jjk-text)',
        }}
      >
        <header
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 16,
            borderBottom: '1px solid rgba(170,0,0,0.2)',
            paddingBottom: 12,
          }}
        >
          <strong style={{ color: 'var(--jjk-gold)' }}>世界书</strong>
          <button onClick={onClose} style={{ color: 'var(--jjk-text-3)', background: 'transparent', border: 'none', fontSize: 18 }}>×</button>
        </header>

        <div style={{ position: 'relative', marginBottom: 12 }}>
          <Search size={14} style={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)', color: 'var(--jjk-text-4)' }} />
          <input
            type="text"
            placeholder="搜索世界书..."
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

        <div style={{ marginBottom: 16 }}>
          <label
            style={{
              display: 'inline-block',
              padding: '8px 12px',
              background: 'rgba(28,28,28,0.6)',
              borderRadius: 4,
              cursor: 'pointer',
              fontSize: 14,
              border: '1px solid rgba(170,0,0,0.3)',
              color: 'var(--jjk-text-2)',
            }}
          >
            <input
              type="file"
              multiple
              accept=".json"
              style={{ display: 'none' }}
              onChange={async (e) => {
                const files = Array.from(e.target.files ?? []);
                if (files.length === 0) return;

                const inputs = await Promise.all(
                  files.map(async (f) => ({
                    fileName: f.name,
                    json: JSON.parse(await f.text()),
                  }))
                );

                const { successes, failures } = importMultipleLorebooks(inputs);

                for (const s of successes) {
                  const lorebook: Lorebook = {
                    ...s.lorebook,
                    id: crypto.randomUUID(),
                    createdAt: Date.now(),
                    updatedAt: Date.now(),
                  };
                  await db.lorebooks.add(lorebook);
                }

                if (failures.length) {
                  alert(
                    '导入失败：\n' +
                      failures.map((f) => `${f.fileName}: ${f.error}`).join('\n')
                  );
                }

                setList(await db.lorebooks.toArray());
                e.target.value = '';
              }}
            />
            批量导入 JSON
          </label>
          <span style={{ marginLeft: 8, fontSize: 12, color: 'var(--jjk-text-4)' }}>
            支持多选 .json 文件
          </span>
          <button
            onClick={async () => {
              const name = prompt('新世界书名称', '新世界书');
              if (!name) return;
              const lb = await addLorebookFromDefault(name);
              setList(await db.lorebooks.toArray());
              setEditing(lb);
            }}
            style={{
              marginLeft: 8,
              padding: '8px 12px',
              background: 'var(--jjk-red)',
              color: '#fff',
              border: 'none',
              borderRadius: 4,
              cursor: 'pointer',
              fontSize: 14,
            }}
          >
            + 新建
          </button>
        </div>

        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          {filteredLorebooks.map((lb) => {
            const isActive = activeIds.has(lb.id);
            return (
              <li
                key={lb.id}
                style={{
                  borderBottom: '1px solid rgba(100,100,100,0.15)',
                  padding: '10px 4px',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <label
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      cursor: 'pointer',
                      flex: 1,
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={isActive}
                      onChange={() => {
                        toggleLorebook(lb.id);
                        setActiveIds((prev) => {
                          const next = new Set(prev);
                          if (next.has(lb.id)) next.delete(lb.id);
                          else next.add(lb.id);
                          return next;
                        });
                      }}
                    />
                    <span
                      style={{
                        fontWeight: 500,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        color: isActive ? 'var(--jjk-text)' : 'var(--jjk-text-3)',
                      }}
                      title={lb.name}
                    >
                      {lb.name}
                    </span>
                    {isActive && (
                      <span style={{ fontSize: 10, color: '#00CC66', fontFamily: 'monospace', flexShrink: 0 }}>已激活</span>
                    )}
                    {!isActive && (
                      <span style={{ fontSize: 10, color: 'var(--jjk-text-4)', fontFamily: 'monospace', flexShrink: 0 }}>未激活</span>
                    )}
                  </label>
                </div>

                <div
                  style={{
                    display: 'flex',
                    gap: 8,
                    marginTop: 6,
                    paddingLeft: 24,
                    alignItems: 'center',
                  }}
                >
                  <select
                    value={lb.apiTarget || 'both'}
                    onChange={async (e) => {
                      const next: Lorebook = { ...lb, apiTarget: e.target.value as 'primary' | 'secondary' | 'both', updatedAt: Date.now() };
                      await db.lorebooks.put(next);
                      setList(await db.lorebooks.toArray());
                    }}
                    style={{
                      fontSize: 11,
                      padding: '2px 4px',
                      background: 'rgba(28,28,28,0.6)',
                      border: '1px solid rgba(170,0,0,0.25)',
                      color: 'var(--jjk-text-2)',
                      borderRadius: 3,
                      outline: 'none',
                    }}
                    title="选择该世界书注入哪个 API"
                  >
                    <option value="both">两者都给</option>
                    <option value="primary">只给主API</option>
                    <option value="secondary">只给副API</option>
                  </select>
                  <button
                    style={{ fontSize: 12, padding: '2px 8px' }}
                    onClick={async () => {
                      const v = prompt('新名称', lb.name);
                      if (!v || v === lb.name) return;

                      // Check for name conflict
                      const existing = await db.lorebooks
                        .where('name')
                        .equals(v)
                        .first();

                      if (existing && existing.id !== lb.id) {
                        const action = confirm(
                          `已存在名为 "${v}" 的世界书。\n确定 = 合并（覆盖）\n取消 = 重新输入`
                        );
                        if (action) {
                          // Merge: delete old, update current with new name
                          await db.lorebooks.delete(existing.id);
                          await db.lorebooks.put(renameLorebook(lb, v));
                        } else {
                          // Cancel - do nothing, user can retry
                          return;
                        }
                      } else {
                        await db.lorebooks.put(renameLorebook(lb, v));
                      }

                      setList(await db.lorebooks.toArray());
                    }}
                  >
                    重命名
                  </button>
                  <button
                    style={{ fontSize: 12, padding: '2px 8px' }}
                    onClick={() => setEditing(lb)}
                  >
                    ✎ 编辑
                  </button>
                  <button
                    style={{ fontSize: 12, padding: '2px 8px', color: '#c00' }}
                    onClick={async () => {
                      if (!confirm(`确定删除世界书 "${lb.name}"？`)) return;
                      await deleteLorebook(lb.id);
                      setList(await db.lorebooks.toArray());
                    }}
                  >
                    删除
                  </button>
                </div>
              </li>
            );
          })}
        </ul>

        {filteredLorebooks.length === 0 && (
          <div
            style={{
              textAlign: 'center',
              color: '#888',
              padding: '40px 0',
              fontSize: 14,
            }}
          >
            暂无世界书,请导入 JSON 文件或点击「+ 新建」
          </div>
        )}
      </aside>
      {editing && (
        <LorebookEditorModal
          lorebook={editing}
          onClose={async () => {
            setEditing(null);
            setList(await db.lorebooks.toArray());
          }}
        />
      )}
    </div>
  );
}
