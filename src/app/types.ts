export type AppView = "home" | "login" | "new-game" | "load-game" | "system-settings" | "game";
export type GamePanel = "character" | "tasks" | "npc" | "inventory" | "skills" | null;

// Character creation state
export interface CharacterCreation {
  step: 1 | 2 | 3 | 4 | 5;
  difficulty: string;
  difficultyPoints: number;
  name: string;
  age: string;
  gender: "男" | "女" | "未知";
  persona: string;
  attributes: { VIT: number; DEX: number; STR: number; CEP: number; APT: number; MND: number };
  remainingPoints: number;
  faction: string;
  technique: { name: string; attribute: string; description: string };
  extensions: string[];
  backstoryMode: "custom" | "auto";
  backstory: string;
}

export interface SaveFile {
  id: string;
  characterName: string;
  level: number;
  rating: string;
  location: string;
  savedAt: string;
  playtime: string;
  preview: string;
  updatedAt: number;
}

export interface ChatMessage {
  id: string;
  role: "system" | "user" | "assistant";
  content: string;
  timestamp: string;
  expGain?: number;
  kpGain?: number;
  rawContent?: string;
}

export interface GameState {
  系统: {
    时间: { 年: number; 月日: string; 时分: string; 星期: string };
    地点: { 国家: string; 地域: string; 场所: string; 具体位置: string };
    性爱状态: { 进行中: boolean; 参与者: string[] };
  };
  user: {
    名称: string;
    等级: number;
    EXP: number;
    战力评级: string;
    公开身份: string[];
    身体状况: string;
    生命值: { 当前值: number; 最大值: number };
    永久损伤或疤痕: string;
    持有金钱: number;
    居住地: string;
    KP: number;
    肉搏等级: string;
    名望: { 正道: { 数值: number; 称号: string[] }; 邪道: { 数值: number; 称号: string[] } };
    咒力: { 当前值: number; 最大值: number };
    当前服装: { 外套: string; 内搭: string; 下装: string; 足具: string };
    行囊: Record<string, { 数量: number; 描述: string }>;
    束缚: Record<string, { 代价: string; 恢复条件: string }>;
    战技: Record<string, { 熟练度: number; 阶段: string; 描述: string }>;
    生得术式: { 名称: string; 属性: string; 熟练度: number; 阶段: string; 描述: string };
    扩展术式: Record<string, { 熟练度: number; 阶段: string; 描述: string }>;
    特殊体质: Record<string, string>;
    咒灵操术: Record<string, string>;
    attributes: { VIT: number; DEX: number; STR: number; CEP: number; APT: number; MND: number };
    流派: string;
  };
  任务系统: Record<string, {
    任务名: string; 任务等级: string; 类型: string; 委托人或势力: string;
    任务描述: string; 完成条件: string; 失败条件: string;
    报酬: { 金钱: number; 名望提升值: number; 物品: Record<string, number> };
  }>;
  人际档案: Record<string, { 好感数值: number; 信任度: number; 关系阶段: string; 欲望值: number }>;
}
