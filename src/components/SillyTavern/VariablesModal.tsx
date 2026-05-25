import { useState, useMemo } from 'react';

/* ---------- helpers ---------- */
function formatValue(v: any): string {
  if (v === null) return 'null';
  if (typeof v === 'object') return JSON.stringify(v, null, 2);
  return String(v);
}
function parseValue(text: string): any {
  const t = text.trim();
  if (t === 'null') return null;
  if (t === 'true') return true;
  if (t === 'false') return false;
  if (t === '') return '';
  const n = Number(t);
  if (!Number.isNaN(n) && t !== '') return n;
  try { return JSON.parse(t); } catch { return t; }
}
function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}
function getCombatRating(level: number): string {
  if (level <= 10) return '普通人';
  if (level <= 30) return '三级';
  if (level <= 50) return '二级';
  if (level <= 70) return '一级';
  if (level <= 90) return '准特级';
  if (level <= 95) return '特级';
  return '超特级';
}
function getProficiencyStage(val: number): string {
  if (val <= 40) return '入门';
  if (val <= 80) return '熟练';
  return '精通';
}
function setPath(obj: any, path: string, value: any): any {
  const keys = path.split('.');
  const out = Array.isArray(obj) ? [...obj] : { ...obj };
  let curr = out;
  for (let i = 0; i < keys.length - 1; i++) {
    const k = keys[i];
    curr[k] = Array.isArray(curr[k]) ? [...curr[k]] : { ...(curr[k] ?? {}) };
    curr = curr[k];
  }
  curr[keys[keys.length - 1]] = value;
  return out;
}
function delPath(obj: any, path: string): any {
  const keys = path.split('.');
  const out = Array.isArray(obj) ? [...obj] : { ...obj };
  let curr = out;
  for (let i = 0; i < keys.length - 1; i++) {
    const k = keys[i];
    if (!(k in curr)) return out;
    curr[k] = Array.isArray(curr[k]) ? [...curr[k]] : { ...curr[k] };
    curr = curr[k];
  }
  delete curr[keys[keys.length - 1]];
  return out;
}

/* ---------- styles ---------- */
const inputBase: React.CSSProperties = {
  padding: '5px 8px',
  background: 'rgba(28,28,28,0.8)',
  border: '1px solid rgba(170,0,0,0.3)',
  color: 'var(--jjk-text)',
  borderRadius: 4,
  outline: 'none',
  fontSize: 13,
};
const smallBtn: React.CSSProperties = {
  padding: '3px 8px',
  fontSize: 12,
  borderRadius: 3,
  border: 'none',
  cursor: 'pointer',
};

/* ============================================================ */
export function VariablesModal({
  variables,
  onUpdate,
  onClose,
}: {
  variables: Record<string, any>;
  onUpdate: (vars: Record<string, any>) => void;
  onClose: () => void;
}) {
  const [tab, setTab] = useState<'user' | 'system' | 'quests' | 'npcs' | 'raw'>('user');

  const v = variables || {};
  const user = v.user || {};
  const system = v.系统 || {};
  const quests = v.任务系统 || {};
  const npcs = v.人际档案 || {};

  const change = (path: string, value: any) => {
    onUpdate(setPath(v, path, value));
  };

  const tabs: { key: typeof tab; label: string }[] = [
    { key: 'user', label: `角色状态 ${Object.keys(user).length ? '●' : ''}` },
    { key: 'system', label: `系统 ${Object.keys(system).length ? '●' : ''}` },
    { key: 'quests', label: `任务 ${Object.keys(quests).length ? '●' : ''}` },
    { key: 'npcs', label: `人际 ${Object.keys(npcs).length ? '●' : ''}` },
    { key: 'raw', label: '原始' },
  ];

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,.6)',
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
          width: 'min(720px, 96vw)',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          borderRadius: 6,
          overflow: 'hidden',
          border: '1px solid rgba(170,0,0,0.35)',
          color: 'var(--jjk-text)',
        }}
      >
        {/* header */}
        <header
          style={{
            padding: '10px 14px',
            borderBottom: '1px solid rgba(170,0,0,0.2)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <strong style={{ color: 'var(--jjk-gold)' }}>变量面板</strong>
          <button onClick={onClose} style={{ color: 'var(--jjk-text-3)', background: 'transparent', border: 'none', fontSize: 20, cursor: 'pointer' }}>
            ×
          </button>
        </header>

        {/* tabs */}
        <div style={{ display: 'flex', gap: 2, padding: '8px 12px 0', borderBottom: '1px solid rgba(170,0,0,0.15)' }}>
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              style={{
                padding: '6px 12px',
                background: tab === t.key ? 'rgba(170,0,0,0.25)' : 'transparent',
                border: 'none',
                borderBottom: tab === t.key ? '2px solid var(--jjk-red)' : '2px solid transparent',
                color: tab === t.key ? 'var(--jjk-gold)' : 'var(--jjk-text-3)',
                cursor: 'pointer',
                fontSize: 13,
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* body */}
        <main style={{ flex: 1, overflowY: 'auto', padding: 14 }}>
          {tab === 'user' && <UserTab user={user} onChange={change} />}
          {tab === 'system' && <SystemTab system={system} onChange={change} />}
          {tab === 'quests' && <QuestsTab quests={quests} onChange={change} />}
          {tab === 'npcs' && <NpcsTab npcs={npcs} onChange={change} />}
          {tab === 'raw' && <RawTab variables={v} onUpdate={onUpdate} />}
        </main>
      </div>
    </div>
  );
}

/* ============================================================
   USER TAB
   ============================================================ */
function UserTab({ user, onChange }: { user: any; onChange: (path: string, v: any) => void }) {
  const u = user || {};
  const level = Number(u.等级) || 1;
  const exp = Number(u.EXP) || 0;
  const combat = getCombatRating(level);

  const 咒力 = u.咒力 && typeof u.咒力 === 'object' ? u.咒力 : { 当前值: 0, 最大值: 100 };
  const curCe = Number(咒力.当前值) ?? 0;
  const maxCe = Number(咒力.最大值) || 100;
  const cePct = clamp((curCe / maxCe) * 100, 0, 100);

  const 名望 = u.名望 && typeof u.名望 === 'object' ? u.名望 : { 正道: { 数值: 0, 称号: [] }, 邪道: { 数值: 0, 称号: [] } };
  const 服装 = u.当前服装 && typeof u.当前服装 === 'object' ? u.当前服装 : { 外套: '无', 内搭: '白色T恤', 下装: '运动裤', 足具: '运动鞋' };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* basic stats */}
      <Section title="基础属性">
        <Grid4>
          <NumField label="等级" value={level} onChange={(v) => onChange('user.等级', v)} />
          <NumField label="EXP" value={exp} onChange={(v) => onChange('user.EXP', v)} />
          <ReadOnly label="战力评级" value={combat} />
          <NumField label="持有金钱" value={u.持有金钱 ?? 0} onChange={(v) => onChange('user.持有金钱', v)} />
          <NumField label="KP" value={u.KP ?? 0} onChange={(v) => onChange('user.KP', v)} />
          <TextField label="肉搏等级" value={u.肉搏等级 ?? '未入门'} onChange={(v) => onChange('user.肉搏等级', v)} />
          <TextField label="身体状况" value={u.身体状况 ?? '健康'} onChange={(v) => onChange('user.身体状况', v)} />
          <TextField label="居住地" value={u.居住地 ?? '高专宿舍'} onChange={(v) => onChange('user.居住地', v)} />
        </Grid4>
        <div style={{ marginTop: 8 }}>
          <TextField label="永久损伤或疤痕" value={u.永久损伤或疤痕 ?? '无'} onChange={(v) => onChange('user.永久损伤或疤痕', v)} fullWidth />
        </div>
        <div style={{ marginTop: 6, fontSize: 12, color: 'var(--jjk-text-4)' }}>
          公开身份: {Array.isArray(u.公开身份) ? u.公开身份.join('、') : u.公开身份 || '咒术高专一年级学生'}
        </div>
      </Section>

      {/* cursed energy bar */}
      <Section title="咒力">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
          <span style={{ fontSize: 13, minWidth: 60 }}>当前值 / 最大值</span>
          <NumField label="" value={curCe} onChange={(v) => onChange('user.咒力.当前值', v)} />
          <span style={{ color: 'var(--jjk-text-4)' }}>/</span>
          <NumField label="" value={maxCe} onChange={(v) => onChange('user.咒力.最大值', v)} />
          <span style={{ fontSize: 12, color: 'var(--jjk-text-4)', marginLeft: 'auto' }}>
            {curCe} / {maxCe} ({Math.round(cePct)}%)
          </span>
        </div>
        <div style={{ width: '100%', height: 10, background: 'rgba(50,50,50,0.5)', borderRadius: 5, overflow: 'hidden' }}>
          <div
            style={{
              width: `${cePct}%`,
              height: '100%',
              background: cePct > 50 ? 'var(--jjk-red)' : cePct > 20 ? '#cc8800' : '#cc3333',
              transition: 'width .3s',
            }}
          />
        </div>
      </Section>

      {/* reputation */}
      <Section title="名望">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <ReputationCard
            label="正道"
            data={名望.正道}
            onChange={(path, v) => onChange(`user.名望.正道.${path}`, v)}
          />
          <ReputationCard
            label="邪道"
            data={名望.邪道}
            onChange={(path, v) => onChange(`user.名望.邪道.${path}`, v)}
          />
        </div>
      </Section>

      {/* clothing */}
      <Section title="当前服装">
        <Grid4>
          <TextField label="外套" value={服装.外套 ?? '无'} onChange={(v) => onChange('user.当前服装.外套', v)} />
          <TextField label="内搭" value={服装.内搭 ?? '白色T恤'} onChange={(v) => onChange('user.当前服装.内搭', v)} />
          <TextField label="下装" value={服装.下装 ?? '运动裤'} onChange={(v) => onChange('user.当前服装.下装', v)} />
          <TextField label="足具" value={服装.足具 ?? '运动鞋'} onChange={(v) => onChange('user.当前服装.足具', v)} />
        </Grid4>
      </Section>

      {/* skills */}
      <SkillRecord
        title="生得术式"
        pathPrefix="user.生得术式"
        data={u.生得术式}
        isSingle
        onChange={onChange}
      />

      <SkillRecord
        title="战技"
        pathPrefix="user.战技"
        data={u.战技}
        onChange={onChange}
      />

      <SkillRecord
        title="扩展术式"
        pathPrefix="user.扩展术式"
        data={u.扩展术式}
        onChange={onChange}
      />

      {/* inventory */}
      <ItemRecord
        title="行囊"
        pathPrefix="user.行囊"
        data={u.行囊}
        onChange={onChange}
      />

      {/* bindings */}
      <BindingRecord
        title="束缚"
        pathPrefix="user.束缚"
        data={u.束缚}
        onChange={onChange}
      />

      {/* special traits */}
      <StringRecord title="特殊体质" pathPrefix="user.特殊体质" data={u.特殊体质} onChange={onChange} />
      <StringRecord title="咒灵操术" pathPrefix="user.咒灵操术" data={u.咒灵操术} onChange={onChange} />
    </div>
  );
}

/* ============================================================
   SYSTEM TAB
   ============================================================ */
function SystemTab({ system, onChange }: { system: any; onChange: (path: string, v: any) => void }) {
  const s = system || {};
  const time = s.时间 || {};
  const loc = s.地点 || {};
  const sex = s.性爱状态 || {};

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <Section title="时间">
        <Grid4>
          <NumField label="年" value={time.年 ?? 2018} onChange={(v) => onChange('系统.时间.年', v)} />
          <TextField label="月日" value={time.月日 ?? '06-01'} onChange={(v) => onChange('系统.时间.月日', v)} />
          <TextField label="时分" value={time.时分 ?? '14:00'} onChange={(v) => onChange('系统.时间.时分', v)} />
          <TextField label="星期" value={time.星期 ?? '周五'} onChange={(v) => onChange('系统.时间.星期', v)} />
        </Grid4>
      </Section>
      <Section title="地点">
        <Grid4>
          <TextField label="国家" value={loc.国家 ?? '日本'} onChange={(v) => onChange('系统.地点.国家', v)} />
          <TextField label="地域" value={loc.地域 ?? '东京'} onChange={(v) => onChange('系统.地点.地域', v)} />
          <TextField label="场所" value={loc.场所 ?? '咒术高专'} onChange={(v) => onChange('系统.地点.场所', v)} />
          <TextField label="具体位置" value={loc.具体位置 ?? '操场'} onChange={(v) => onChange('系统.地点.具体位置', v)} />
        </Grid4>
      </Section>
      <Section title="性爱状态">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={!!sex.进行中}
              onChange={(e) => onChange('系统.性爱状态.进行中', e.target.checked)}
            />
            进行中
          </label>
          <TextField
            label="参与者"
            value={Array.isArray(sex.参与者) ? sex.参与者.join('、') : ''}
            onChange={(v) => onChange('系统.性爱状态.参与者', v.split('、').filter(Boolean))}
            fullWidth
          />
        </div>
      </Section>
    </div>
  );
}

/* ============================================================
   QUESTS TAB
   ============================================================ */
function QuestsTab({ quests, onChange }: { quests: any; onChange: (path: string, v: any) => void }) {
  const q = quests && typeof quests === 'object' ? quests : {};
  const ids = Object.keys(q);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {ids.length === 0 && <Empty text="暂无任务" />}
      {ids.map((id) => (
        <QuestCard key={id} id={id} data={q[id]} onChange={(sub, v) => onChange(`任务系统.${id}.${sub}`, v)} onDelete={() => onChange(`任务系统.${id}`, undefined)} />
      ))}
      <button
        onClick={() => {
          const newId = crypto.randomUUID().slice(0, 8);
          onChange(`任务系统.${newId}`, {
            任务名: '',
            任务等级: '三级',
            类型: '正道',
            委托人或势力: '',
            任务描述: '',
            完成条件: '',
            失败条件: '无',
            报酬: { 金钱: 0, 名望提升值: 0, 物品: {} },
          });
        }}
        style={{ ...smallBtn, background: 'var(--jjk-red)', color: '#fff', alignSelf: 'flex-start' }}
      >
        + 添加任务
      </button>
    </div>
  );
}

function QuestCard({ id, data, onChange, onDelete }: { id: string; data: any; onChange: (sub: string, v: any) => void; onDelete: () => void }) {
  const d = data || {};
  return (
    <div style={{ border: '1px solid rgba(170,0,0,0.2)', borderRadius: 5, padding: 10, background: 'rgba(20,16,14,0.6)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <span style={{ fontSize: 12, color: 'var(--jjk-text-4)' }}>ID: {id}</span>
        <button onClick={onDelete} style={{ ...smallBtn, color: '#ff4444', background: 'rgba(255,68,68,0.1)' }}>删除</button>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 8 }}>
        <TextField label="任务名" value={d.任务名 ?? ''} onChange={(v) => onChange('任务名', v)} />
        <select
          value={d.任务等级 ?? '三级'}
          onChange={(e) => onChange('任务等级', e.target.value)}
          style={{ ...inputBase, minWidth: 100 }}
        >
          {['特级', '一级', '二级', '三级', '特殊'].map((o) => (
            <option key={o} value={o}>{o}</option>
          ))}
        </select>
        <select
          value={d.类型 ?? '正道'}
          onChange={(e) => onChange('类型', e.target.value)}
          style={{ ...inputBase, minWidth: 100 }}
        >
          <option value="正道">正道</option>
          <option value="邪道">邪道</option>
        </select>
        <TextField label="委托人或势力" value={d.委托人或势力 ?? ''} onChange={(v) => onChange('委托人或势力', v)} />
        <TextField label="报酬金钱" value={d.报酬?.金钱 ?? 0} onChange={(v) => onChange('报酬.金钱', Number(v) || 0)} />
        <TextField label="名望提升值" value={d.报酬?.名望提升值 ?? 0} onChange={(v) => onChange('报酬.名望提升值', Number(v) || 0)} />
      </div>
      <TextField label="任务描述" value={d.任务描述 ?? ''} onChange={(v) => onChange('任务描述', v)} fullWidth />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 6 }}>
        <TextField label="完成条件" value={d.完成条件 ?? ''} onChange={(v) => onChange('完成条件', v)} />
        <TextField label="失败条件" value={d.失败条件 ?? '无'} onChange={(v) => onChange('失败条件', v)} />
      </div>
    </div>
  );
}

/* ============================================================
   NPCs TAB
   ============================================================ */
function NpcsTab({ npcs, onChange }: { npcs: any; onChange: (path: string, v: any) => void }) {
  const n = npcs && typeof npcs === 'object' ? npcs : {};
  const names = Object.keys(n);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {names.length === 0 && <Empty text="暂无角色档案" />}
      {names.map((name) => (
        <NpcCard
          key={name}
          name={name}
          data={n[name]}
          onChange={(sub, v) => onChange(`人际档案.${name}.${sub}`, v)}
          onDelete={() => onChange(`人际档案.${name}`, undefined)}
        />
      ))}
      <button
        onClick={() => {
          const name = prompt('输入角色名');
          if (!name) return;
          onChange(`人际档案.${name}`, { 好感数值: 0, 信任度: 0, 关系阶段: '陌路', 欲望值: 0 });
        }}
        style={{ ...smallBtn, background: 'var(--jjk-red)', color: '#fff', alignSelf: 'flex-start' }}
      >
        + 添加角色
      </button>
    </div>
  );
}

function NpcCard({ name, data, onChange, onDelete }: { name: string; data: any; onChange: (sub: string, v: any) => void; onDelete: () => void }) {
  const d = data || {};
  const favor = clamp(Number(d.好感数值) || 0, -100, 100);
  const trust = clamp(Number(d.信任度) || 0, -100, 100);
  const lust = clamp(Number(d.欲望值) || 0, 0, 100);

  return (
    <div style={{ border: '1px solid rgba(170,0,0,0.2)', borderRadius: 5, padding: 10, background: 'rgba(20,16,14,0.6)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <strong style={{ color: 'var(--jjk-gold)' }}>{name}</strong>
        <button onClick={onDelete} style={{ ...smallBtn, color: '#ff4444', background: 'rgba(255,68,68,0.1)' }}>删除</button>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <div>
          <label style={{ fontSize: 11, color: 'var(--jjk-text-4)' }}>好感数值 {favor}</label>
          <input
            type="range"
            min={-100}
            max={100}
            value={favor}
            onChange={(e) => onChange('好感数值', Number(e.target.value))}
            style={{ width: '100%' }}
          />
        </div>
        <div>
          <label style={{ fontSize: 11, color: 'var(--jjk-text-4)' }}>信任度 {trust}</label>
          <input
            type="range"
            min={-100}
            max={100}
            value={trust}
            onChange={(e) => onChange('信任度', Number(e.target.value))}
            style={{ width: '100%' }}
          />
        </div>
        <div>
          <label style={{ fontSize: 11, color: 'var(--jjk-text-4)' }}>欲望值 {lust}</label>
          <input
            type="range"
            min={0}
            max={100}
            value={lust}
            onChange={(e) => onChange('欲望值', Number(e.target.value))}
            style={{ width: '100%' }}
          />
        </div>
        <TextField label="关系阶段" value={d.关系阶段 ?? '陌路'} onChange={(v) => onChange('关系阶段', v)} />
      </div>
    </div>
  );
}

/* ============================================================
   RAW TAB
   ============================================================ */
function RawTab({ variables, onUpdate }: { variables: Record<string, any>; onUpdate: (vars: Record<string, any>) => void }) {
  const vars = variables;
  const [draftKey, setDraftKey] = useState('');
  const [draftValue, setDraftValue] = useState('');

  const handleAdd = () => {
    const k = draftKey.trim();
    if (!k) return;
    if (vars[k] !== undefined) { alert('变量名已存在'); return; }
    onUpdate({ ...vars, [k]: parseValue(draftValue) });
    setDraftKey(''); setDraftValue('');
  };

  return (
    <div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 12, paddingBottom: 12, borderBottom: '1px solid rgba(170,0,0,0.15)' }}>
        <input type="text" placeholder="变量名" value={draftKey} onChange={(e) => setDraftKey(e.target.value)} style={{ ...inputBase, flex: 1 }} />
        <input type="text" placeholder="值" value={draftValue} onChange={(e) => setDraftValue(e.target.value)} style={{ ...inputBase, flex: 2 }} onKeyDown={(e) => e.key === 'Enter' && handleAdd()} />
        <button onClick={handleAdd} style={{ ...smallBtn, background: 'var(--jjk-red)', color: '#fff' }}>+ 添加</button>
      </div>
      {Object.keys(vars).length === 0 ? <Empty text="暂无变量" /> : (
        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          {Object.entries(vars).map(([key, value]) => (
            <li key={key} style={{ display: 'flex', gap: 8, alignItems: 'center', padding: '6px 0', borderBottom: '1px solid rgba(100,100,100,0.12)' }}>
              <code style={{ flex: 1, fontSize: 12, color: 'var(--jjk-gold)' }}>{key}</code>
              <span style={{ flex: 2, fontSize: 12, color: 'var(--jjk-text-2)', wordBreak: 'break-all' }}>{formatValue(value)}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/* ============================================================
   SHARED UI
   ============================================================ */
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(true);
  return (
    <div style={{ border: '1px solid rgba(170,0,0,0.15)', borderRadius: 5, padding: '10px 12px', background: 'rgba(20,16,14,0.5)' }}>
      <div
        onClick={() => setOpen((o) => !o)}
        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', marginBottom: open ? 10 : 0 }}
      >
        <strong style={{ fontSize: 14, color: 'var(--jjk-red)' }}>{title}</strong>
        <span style={{ fontSize: 12, color: 'var(--jjk-text-4)' }}>{open ? '收起' : '展开'}</span>
      </div>
      {open && children}
    </div>
  );
}

function Grid4({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 8 }}>
      {children}
    </div>
  );
}

function TextField({ label, value, onChange, fullWidth }: { label: string; value: any; onChange: (v: string) => void; fullWidth?: boolean }) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 3, fontSize: 12, color: 'var(--jjk-text-3)', flex: fullWidth ? '1 1 100%' : undefined }}>
      {label}
      <input
        type="text"
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value)}
        style={{ ...inputBase, width: '100%' }}
      />
    </label>
  );
}

function NumField({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 3, fontSize: 12, color: 'var(--jjk-text-3)' }}>
      {label}
      <input
        type="number"
        value={value ?? 0}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{ ...inputBase, width: '100%' }}
      />
    </label>
  );
}

function ReadOnly({ label, value }: { label: string; value: string }) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 3, fontSize: 12, color: 'var(--jjk-text-3)' }}>
      {label}
      <div style={{ ...inputBase, opacity: 0.7, cursor: 'default' }}>{value}</div>
    </label>
  );
}

function ReputationCard({ label, data, onChange }: { label: string; data: any; onChange: (sub: string, v: any) => void }) {
  const d = data || {};
  const val = clamp(Number(d.数值) || 0, -100, 100);
  return (
    <div style={{ border: '1px solid rgba(170,0,0,0.15)', borderRadius: 4, padding: 10 }}>
      <strong style={{ fontSize: 13, color: 'var(--jjk-gold)' }}>{label}</strong>
      <div style={{ marginTop: 6 }}>
        <label style={{ fontSize: 11, color: 'var(--jjk-text-4)' }}>数值 {val}</label>
        <input
          type="range"
          min={-100}
          max={100}
          value={val}
          onChange={(e) => onChange('数值', Number(e.target.value))}
          style={{ width: '100%' }}
        />
      </div>
      <TextField label="称号" value={Array.isArray(d.称号) ? d.称号.join('、') : d.称号 || ''} onChange={(v) => onChange('称号', v.split('、').filter(Boolean))} />
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return <div style={{ color: 'var(--jjk-text-4)', padding: 24, textAlign: 'center', fontSize: 13 }}>{text}</div>;
}

/* ---------- record editors ---------- */
function SkillRecord({ title, pathPrefix, data, isSingle, onChange }: { title: string; pathPrefix: string; data: any; isSingle?: boolean; onChange: (path: string, v: any) => void }) {
  const [open, setOpen] = useState(true);

  if (isSingle) {
    const d = data && typeof data === 'object' ? data : {};
    const prof = Number(d.熟练度) || 0;
    const stage = getProficiencyStage(prof);
    return (
      <Section title={title}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: 8 }}>
          <TextField label="名称" value={d.名称 ?? ''} onChange={(v) => onChange(`${pathPrefix}.名称`, v)} />
          <TextField label="属性" value={d.属性 ?? ''} onChange={(v) => onChange(`${pathPrefix}.属性`, v)} />
          <NumField label="熟练度" value={prof} onChange={(v) => onChange(`${pathPrefix}.熟练度`, v)} />
          <ReadOnly label="阶段" value={stage} />
        </div>
        <TextField label="描述" value={d.描述 ?? ''} onChange={(v) => onChange(`${pathPrefix}.描述`, v)} fullWidth />
      </Section>
    );
  }

  const rec = data && typeof data === 'object' ? data : {};
  const ids = Object.keys(rec);
  return (
    <div style={{ border: '1px solid rgba(170,0,0,0.15)', borderRadius: 5, padding: '10px 12px', background: 'rgba(20,16,14,0.5)' }}>
      <div onClick={() => setOpen((o) => !o)} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}>
        <strong style={{ fontSize: 14, color: 'var(--jjk-red)' }}>{title} ({ids.length})</strong>
        <span style={{ fontSize: 12, color: 'var(--jjk-text-4)' }}>{open ? '收起' : '展开'}</span>
      </div>
      {open && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 10 }}>
          {ids.map((id) => {
            const d = rec[id];
            const prof = Number(d.熟练度) || 0;
            const stage = getProficiencyStage(prof);
            return (
              <div key={id} style={{ border: '1px solid rgba(100,100,100,0.15)', borderRadius: 4, padding: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <strong style={{ fontSize: 13, color: 'var(--jjk-gold)' }}>{id}</strong>
                  <button onClick={() => onChange(`${pathPrefix}.${id}`, undefined)} style={{ ...smallBtn, color: '#ff4444', background: 'rgba(255,68,68,0.1)' }}>删除</button>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                  <NumField label="熟练度" value={prof} onChange={(v) => onChange(`${pathPrefix}.${id}.熟练度`, v)} />
                  <ReadOnly label="阶段" value={stage} />
                  <TextField label="描述" value={d.描述 ?? ''} onChange={(v) => onChange(`${pathPrefix}.${id}.描述`, v)} />
                </div>
              </div>
            );
          })}
          <button
            onClick={() => {
              const name = prompt(`输入${title}名称`);
              if (!name) return;
              onChange(`${pathPrefix}.${name}`, { 熟练度: 0, 阶段: '入门', 描述: '' });
            }}
            style={{ ...smallBtn, background: 'var(--jjk-red)', color: '#fff', alignSelf: 'flex-start' }}
          >
            + 添加
          </button>
        </div>
      )}
    </div>
  );
}

function ItemRecord({ title, pathPrefix, data, onChange }: { title: string; pathPrefix: string; data: any; onChange: (path: string, v: any) => void }) {
  const rec = data && typeof data === 'object' ? data : {};
  const ids = Object.keys(rec);
  const [open, setOpen] = useState(true);

  return (
    <div style={{ border: '1px solid rgba(170,0,0,0.15)', borderRadius: 5, padding: '10px 12px', background: 'rgba(20,16,14,0.5)' }}>
      <div onClick={() => setOpen((o) => !o)} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}>
        <strong style={{ fontSize: 14, color: 'var(--jjk-red)' }}>{title} ({ids.length})</strong>
        <span style={{ fontSize: 12, color: 'var(--jjk-text-4)' }}>{open ? '收起' : '展开'}</span>
      </div>
      {open && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 10 }}>
          {ids.map((id) => {
            const d = rec[id];
            return (
              <div key={id} style={{ display: 'flex', gap: 8, alignItems: 'center', border: '1px solid rgba(100,100,100,0.15)', borderRadius: 4, padding: 8 }}>
                <span style={{ fontSize: 13, color: 'var(--jjk-gold)', minWidth: 80 }}>{id}</span>
                <NumField label="数量" value={Number(d.数量) || 0} onChange={(v) => onChange(`${pathPrefix}.${id}.数量`, v)} />
                <TextField label="描述" value={d.描述 ?? ''} onChange={(v) => onChange(`${pathPrefix}.${id}.描述`, v)} fullWidth />
                <button onClick={() => onChange(`${pathPrefix}.${id}`, undefined)} style={{ ...smallBtn, color: '#ff4444', background: 'rgba(255,68,68,0.1)' }}>删除</button>
              </div>
            );
          })}
          <button
            onClick={() => {
              const name = prompt('输入物品名称');
              if (!name) return;
              onChange(`${pathPrefix}.${name}`, { 数量: 1, 描述: '' });
            }}
            style={{ ...smallBtn, background: 'var(--jjk-red)', color: '#fff', alignSelf: 'flex-start' }}
          >
            + 添加物品
          </button>
        </div>
      )}
    </div>
  );
}

function BindingRecord({ title, pathPrefix, data, onChange }: { title: string; pathPrefix: string; data: any; onChange: (path: string, v: any) => void }) {
  const rec = data && typeof data === 'object' ? data : {};
  const ids = Object.keys(rec);
  const [open, setOpen] = useState(true);

  return (
    <div style={{ border: '1px solid rgba(170,0,0,0.15)', borderRadius: 5, padding: '10px 12px', background: 'rgba(20,16,14,0.5)' }}>
      <div onClick={() => setOpen((o) => !o)} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}>
        <strong style={{ fontSize: 14, color: 'var(--jjk-red)' }}>{title} ({ids.length})</strong>
        <span style={{ fontSize: 12, color: 'var(--jjk-text-4)' }}>{open ? '收起' : '展开'}</span>
      </div>
      {open && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 10 }}>
          {ids.map((id) => {
            const d = rec[id];
            return (
              <div key={id} style={{ display: 'flex', gap: 8, alignItems: 'center', border: '1px solid rgba(100,100,100,0.15)', borderRadius: 4, padding: 8 }}>
                <span style={{ fontSize: 13, color: 'var(--jjk-gold)', minWidth: 80 }}>{id}</span>
                <TextField label="代价" value={d.代价 ?? ''} onChange={(v) => onChange(`${pathPrefix}.${id}.代价`, v)} />
                <TextField label="恢复条件" value={d.恢复条件 ?? ''} onChange={(v) => onChange(`${pathPrefix}.${id}.恢复条件`, v)} />
                <button onClick={() => onChange(`${pathPrefix}.${id}`, undefined)} style={{ ...smallBtn, color: '#ff4444', background: 'rgba(255,68,68,0.1)' }}>删除</button>
              </div>
            );
          })}
          <button
            onClick={() => {
              const name = prompt('输入束缚名称');
              if (!name) return;
              onChange(`${pathPrefix}.${name}`, { 代价: '', 恢复条件: '' });
            }}
            style={{ ...smallBtn, background: 'var(--jjk-red)', color: '#fff', alignSelf: 'flex-start' }}
          >
            + 添加束缚
          </button>
        </div>
      )}
    </div>
  );
}

function StringRecord({ title, pathPrefix, data, onChange }: { title: string; pathPrefix: string; data: any; onChange: (path: string, v: any) => void }) {
  const rec = data && typeof data === 'object' ? data : {};
  const ids = Object.keys(rec);
  const [open, setOpen] = useState(true);

  return (
    <div style={{ border: '1px solid rgba(170,0,0,0.15)', borderRadius: 5, padding: '10px 12px', background: 'rgba(20,16,14,0.5)' }}>
      <div onClick={() => setOpen((o) => !o)} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}>
        <strong style={{ fontSize: 14, color: 'var(--jjk-red)' }}>{title} ({ids.length})</strong>
        <span style={{ fontSize: 12, color: 'var(--jjk-text-4)' }}>{open ? '收起' : '展开'}</span>
      </div>
      {open && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 10 }}>
          {ids.map((id) => (
            <div key={id} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <span style={{ fontSize: 13, color: 'var(--jjk-gold)', minWidth: 100 }}>{id}</span>
              <TextField label="" value={rec[id] ?? ''} onChange={(v) => onChange(`${pathPrefix}.${id}`, v)} fullWidth />
              <button onClick={() => onChange(`${pathPrefix}.${id}`, undefined)} style={{ ...smallBtn, color: '#ff4444', background: 'rgba(255,68,68,0.1)' }}>删除</button>
            </div>
          ))}
          <button
            onClick={() => {
              const name = prompt(`输入${title}名称`);
              if (!name) return;
              onChange(`${pathPrefix}.${name}`, '');
            }}
            style={{ ...smallBtn, background: 'var(--jjk-red)', color: '#fff', alignSelf: 'flex-start' }}
          >
            + 添加
          </button>
        </div>
      )}
    </div>
  );
}
