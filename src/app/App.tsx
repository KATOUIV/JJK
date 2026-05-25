import { useState, useCallback, useEffect, useMemo } from "react";
import { AnimatePresence } from "motion/react";

import { NotificationProvider, useNotification } from "./components/NotificationSystem";
import { HomePage } from "./components/HomePage";
import { LoginPage } from "./components/LoginPage";
import { NewGameFlow } from "./components/NewGameFlow";
import { LoadGamePage } from "./components/LoadGamePage";
import { SystemSettingsPage } from "./components/SystemSettingsPage";
import { GameView } from "./components/GameView";

import { useSillytavern } from "../hooks/useSillytavern";
import { SettingsModal } from "../components/SillyTavern/SettingsModal";
import { LorebookModal } from "../components/SillyTavern/LorebookModal";
import { PresetModal } from "../components/SillyTavern/PresetModal";
import { VariablesModal } from "../components/SillyTavern/VariablesModal";
import { testConnection } from "../sillytavern/api-tools";
import { switchUserDatabase } from "../sillytavern/database";

import type { AppView, ChatMessage, GameState, CharacterCreation } from "./types";

// ===== DEFAULT GAME STATE (fallback) =====
const defaultGameState: GameState = {
  系统: {
    时间: { 年: 2018, 月日: "06-01", 时分: "14:00", 星期: "周五" },
    地点: { 国家: "日本", 地域: "东京", 场所: "咒术高专", 具体位置: "操场" },
    性爱状态: { 进行中: false, 参与者: [] },
  },
  user: {
    名称: "玩家",
    等级: 1,
    EXP: 0,
    战力评级: "普通人",
    公开身份: ["咒术高专一年级学生"],
    身体状况: "健康",
    生命值: { 当前值: 100, 最大值: 100 },
    永久损伤或疤痕: "无",
    持有金钱: 10000,
    居住地: "高专宿舍",
    KP: 0,
    肉搏等级: "未入门",
    名望: {
      正道: { 数值: 0, 称号: ["寂寂无名的路人"] },
      邪道: { 数值: 0, 称号: ["无人知晓的普通人"] },
    },
    咒力: { 当前值: 100, 最大值: 100 },
    当前服装: { 外套: "无", 内搭: "白色T恤", 下装: "运动裤", 足具: "运动鞋" },
    行囊: {},
    束缚: {},
    战技: {},
    生得术式: { 名称: "", 属性: "无", 熟练度: 0, 阶段: "入门", 描述: "" },
    扩展术式: {},
    特殊体质: {},
    咒灵操术: {},
    attributes: { VIT: 10, DEX: 10, STR: 10, CEP: 10, APT: 10, MND: 10 },
    流派: "东京高专",
  },
  任务系统: {},
  人际档案: {
    虎杖悠仁: { 好感数值: 0, 信任度: 0, 关系阶段: "陌路", 欲望值: 0 },
    伏黑惠: { 好感数值: 0, 信任度: 0, 关系阶段: "陌路", 欲望值: 0 },
    钉崎野蔷薇: { 好感数值: 0, 信任度: 0, 关系阶段: "陌路", 欲望值: 0 },
  },
};

function variablesToGameState(variables: Record<string, any> | undefined): GameState {
  if (!variables) return defaultGameState;
  return {
    系统: {
      时间: variables.系统?.时间 ?? defaultGameState.系统.时间,
      地点: variables.系统?.地点 ?? defaultGameState.系统.地点,
      性爱状态: variables.系统?.性爱状态 ?? defaultGameState.系统.性爱状态,
    },
    user: {
      名称: variables.user?.名称 ?? defaultGameState.user.名称,
      等级: variables.user?.等级 ?? defaultGameState.user.等级,
      EXP: variables.user?.EXP ?? defaultGameState.user.EXP,
      战力评级: variables.user?.战力评级 ?? defaultGameState.user.战力评级,
      公开身份: variables.user?.公开身份 ?? defaultGameState.user.公开身份,
      身体状况: variables.user?.身体状况 ?? defaultGameState.user.身体状况,
      生命值: variables.user?.生命值 ?? defaultGameState.user.生命值,
      永久损伤或疤痕: variables.user?.永久损伤或疤痕 ?? defaultGameState.user.永久损伤或疤痕,
      持有金钱: variables.user?.持有金钱 ?? defaultGameState.user.持有金钱,
      居住地: variables.user?.居住地 ?? defaultGameState.user.居住地,
      KP: variables.user?.KP ?? defaultGameState.user.KP,
      肉搏等级: variables.user?.肉搏等级 ?? defaultGameState.user.肉搏等级,
      名望: variables.user?.名望 ?? defaultGameState.user.名望,
      咒力: variables.user?.咒力 ?? defaultGameState.user.咒力,
      当前服装: variables.user?.当前服装 ?? defaultGameState.user.当前服装,
      行囊: variables.user?.行囊 ?? defaultGameState.user.行囊,
      束缚: variables.user?.束缚 ?? defaultGameState.user.束缚,
      战技: variables.user?.战技 ?? defaultGameState.user.战技,
      生得术式: variables.user?.生得术式 ?? defaultGameState.user.生得术式,
      扩展术式: variables.user?.扩展术式 ?? defaultGameState.user.扩展术式,
      特殊体质: variables.user?.特殊体质 ?? defaultGameState.user.特殊体质,
      咒灵操术: variables.user?.咒灵操术 ?? defaultGameState.user.咒灵操术,
      attributes: variables.user?.attributes ?? defaultGameState.user.attributes,
      流派: variables.user?.流派 ?? defaultGameState.user.流派,
    },
    任务系统: variables.任务系统 ?? defaultGameState.任务系统,
    人际档案: variables.人际档案 ?? defaultGameState.人际档案,
  };
}

/**
 * 从 assistant 的原始输出中提取剧情正文。
 * 策略：移除已知的系统/元数据标签及其内容，然后取第一个剩余 XML 标签之前的纯文本。
 */
function extractStoryText(raw: string): string {
  // 纯 JSON Patch / 系统标记 → 直接隐藏
  if (
    /^\s*\{\s*"op"\s*:/.test(raw) ||
    /^\s*【时间经过】/.test(raw) ||
    /^\s*【变量更新】/.test(raw) ||
    /^\s*Variables\s+updated/i.test(raw)
  ) {
    return '';
  }

  // 移除已知的成对系统/元数据标签及其内部内容
  let cleaned = raw
    .replace(/<story_driver\b[^>]*>[\s\S]*?<\/story_driver>/gi, '')
    .replace(/<npc_driver\b[^>]*>[\s\S]*?<\/npc_driver>/gi, '')
    .replace(/<combat_driver\b[^>]*>[\s\S]*?<\/combat_driver>/gi, '')
    .replace(/<UpdateVariable\b[^>]*>[\s\S]*?<\/UpdateVariable>/gi, '')
    .replace(/<vars\b[^>]*>[\s\S]*?<\/vars>/gi, '')
    .replace(/<wlog\b[^>]*>[\s\S]*?<\/wlog>/gi, '')
    .replace(/<details\b[^>]*>[\s\S]*?<\/details>/gi, '')
    .replace(/<summary\b[^>]*>[\s\S]*?<\/summary>/gi, '')
    .replace(/<thinking\b[^>]*>[\s\S]*?<\/thinking>/gi, '')
    .replace(/<think\b[^>]*>[\s\S]*?<\/think>/gi, '')
    .replace(/<sum\b[^>]*>[\s\S]*?<\/sum>/gi, '')
    .replace(/<content\b[^>]*>[\s\S]*?<\/content>/gi, '')
    .replace(/<options\b[^>]*>[\s\S]*?<\/options>/gi, '')
    .replace(/<option\b[^>]*>[\s\S]*?<\/option>/gi, '');

  // 循环移除开头的 XML 标签对，直到遇到纯文本或无法继续
  while (true) {
    const firstTagIndex = cleaned.search(/<[a-zA-Z_][\w]*\b[^>]*>/);
    if (firstTagIndex > 0) {
      cleaned = cleaned.slice(0, firstTagIndex);
      break;
    } else if (firstTagIndex === 0) {
      const next = cleaned.replace(/<[a-zA-Z_][\w]*\b[^>]*>([\s\S]*?)<\/[a-zA-Z_][\w]*>/, '$1').trim();
      if (next === cleaned) break; // 无法移除，防止无限循环
      cleaned = next;
    } else {
      break;
    }
  }

  // 清理遗落的孤立结束标签（如 </wlog>）并去空
  return cleaned.replace(/<\/[a-zA-Z_][\w]*>/g, '').trim();
}

function tavernMessageToAppMessage(msg: {
  id: string;
  role: "system" | "user" | "assistant";
  content: string;
  timestamp: number;
  parsed?: any;
  variablesAfter?: any;
}): ChatMessage {
  const date = new Date(msg.timestamp);
  const h = date.getHours().toString().padStart(2, "0");
  const m = date.getMinutes().toString().padStart(2, "0");

  // For assistant and system messages, show ONLY <maintext> in chat.
  // All other tags (vars, UpdateVariable, option, sum, thinking, etc.) are hidden
  // unless the user clicks the pencil icon to view rawContent.
  let displayContent = msg.content;
  let rawContent: string | undefined;
  if (msg.role === "assistant" || msg.role === "system") {
    rawContent = msg.content;
    // 核心策略：优先从完整原始 XML 正则提取 <maintext>，不依赖可能丢失的 parsed 对象
    // 允许标签带属性，如 <maintext class="story">
    const maintextMatch = msg.content.match(/<maintext\b[^>]*>([\s\S]*?)<\/maintext>/i);
    const contentMatch = msg.content.match(/<content\b[^>]*>([\s\S]*?)<\/content>/i);
    if (maintextMatch) {
      displayContent = maintextMatch[1].trim();
    } else if (contentMatch) {
      displayContent = contentMatch[1].trim();
    } else if (msg.parsed && typeof msg.parsed.maintext === 'string' && msg.parsed.maintext.length > 0) {
      // 备用：数据库里的 parsed 对象若完好，直接用它
      displayContent = msg.parsed.maintext;
    } else if (msg.role === 'system') {
      // System 消息没有 <maintext> 一律视为内部 prompt，彻底隐藏
      displayContent = '';
    } else {
      // Assistant 兜底：剥离系统标签后提取纯文本剧情
      displayContent = extractStoryText(msg.content);
    }
  }

  const appMsg: ChatMessage = {
    id: msg.id,
    role: msg.role,
    content: displayContent,
    timestamp: `${h}:${m}`,
    rawContent,
  };

  // Extract EXP/KP gains from parsed vars if available
  if (msg.variablesAfter?.user) {
    const user = msg.variablesAfter.user;
    if (typeof user.EXP === "number" && typeof msg.variablesAfter?.__prevEXP === "number") {
      const gain = user.EXP - msg.variablesAfter.__prevEXP;
      if (gain > 0) appMsg.expGain = gain;
    }
    if (typeof user.KP === "number" && typeof msg.variablesAfter?.__prevKP === "number") {
      const gain = user.KP - msg.variablesAfter.__prevKP;
      if (gain > 0) appMsg.kpGain = gain;
    }
  }

  return appMsg;
}

function buildOpeningSystemMessage(data: CharacterCreation): { role: 'system'; content: string; timestamp: number; id: string } {
  const lines = [
    `【角色初始化资料】`,
    `姓名：${data.name}`,
    `年龄：${data.age}`,
    `性别：${data.gender}`,
    `流派：${data.faction}`,
    `难度/战力评级：${data.difficulty}`,
    `生得术式：${data.technique.name}（属性：${data.technique.attribute}）`,
    `术式描述：${data.technique.description}`,
    `扩展术式：${data.extensions.join('、') || '无'}`,
    `角色人设：${data.persona || '未填写'}`,
    `过往经历：${data.backstory || '未填写'}`,
    ``,
    `请基于以上资料为玩家生成一个引人入胜的开场白。开场白应该包含场景描写、氛围营造和角色的初始状态。`,
    `输出必须包含 <maintext> 标签包裹的剧情正文、<option> 标签给出的初始选项、<sum> 标签的摘要。`,
  ];
  return {
    id: crypto.randomUUID(),
    role: 'system',
    content: lines.join('\n'),
    timestamp: Date.now(),
  };
}

function characterCreationToVariables(data: CharacterCreation): Record<string, any> {
  const extObj: Record<string, { 熟练度: number; 阶段: string; 描述: string }> = {};
  for (const ext of data.extensions) {
    extObj[ext] = { 熟练度: 0, 阶段: "入门", 描述: "" };
  }

  return {
    user: {
      名称: data.name,
      等级: 1,
      EXP: 0,
      战力评级: data.difficulty,
      公开身份: [data.faction],
      身体状况: "健康",
      生命值: { 当前值: 100, 最大值: 100 },
      永久损伤或疤痕: "无",
      持有金钱: 10000,
      居住地: data.faction.includes("高专") ? "高专宿舍" : "民间住所",
      KP: 0,
      肉搏等级: "未入门",
      名望: {
        正道: { 数值: 0, 称号: ["寂寂无名的路人"] },
        邪道: { 数值: 0, 称号: ["无人知晓的普通人"] },
      },
      咒力: { 当前值: 100, 最大值: 100 },
      当前服装: { 外套: "无", 内搭: "白色T恤", 下装: "运动裤", 足具: "运动鞋" },
      行囊: {},
      束缚: {},
      战技: {},
      生得术式: {
        名称: data.technique.name,
        属性: data.technique.attribute,
        熟练度: 0,
        阶段: "入门",
        描述: data.technique.description,
      },
      扩展术式: extObj,
      特殊体质: {},
      咒灵操术: {},
      attributes: data.attributes,
      流派: data.faction,
      __角色人设: data.persona,
      __年龄: data.age,
      __性别: data.gender,
      __过往经历: data.backstory,
    },
    系统: {
      时间: { 年: 2018, 月日: "06-01", 时分: "14:00", 星期: "周五" },
      地点: { 国家: "日本", 地域: "东京", 场所: "咒术高专", 具体位置: "操场" },
      性爱状态: { 进行中: false, 参与者: [] },
    },
    任务系统: {},
    人际档案: {
      虎杖悠仁: { 好感数值: 0, 信任度: 0, 关系阶段: "陌路", 欲望值: 0 },
      伏黑惠: { 好感数值: 0, 信任度: 0, 关系阶段: "陌路", 欲望值: 0 },
      钉崎野蔷薇: { 好感数值: 0, 信任度: 0, 关系阶段: "陌路", 欲望值: 0 },
    },
  };
}

function InnerApp() {
  const { addNotification } = useNotification();
  const [view, setView] = useState<AppView>("home");
  const [pendingInit, setPendingInit] = useState<{ chatId: string; text: string } | null>(null);

  const st = useSillytavern();
  const {
    activeChat,
    initialized,
    sendGameMessage,
    streamState,
    createChat,
    openSettings,
    openLorebooks,
    openPresets,
    openVariables,
    showSettings,
    setShowSettings,
    showLorebooks,
    setShowLorebooks,
    showPresets,
    setShowPresets,
    showVariables,
    setShowVariables,
    settings,
    updateSettings,
    presets,
    lorebooks,
    addPreset,
    updatePreset,
    deletePreset,
    addPresetFromDefault,
    addLorebook,
    addLorebookFromDefault,
    updateLorebook,
    deleteLorebook,
    toggleLorebook,
    chats,
    selectChat,
    removeChat,
    regenerateLast,
    jumpToFloor,
  } = st;

  const gameState = useMemo(() => {
    return variablesToGameState(activeChat?.variables);
  }, [activeChat?.variables]);

  // Extract parsed data from last assistant message for thinking/sum panels
  const lastAssistantParsed = useMemo(() => {
    if (streamState.isStreaming) {
      return {
        thinking: streamState.thinking,
        sum: streamState.sum,
        options: streamState.options,
        varsRaw: streamState.varsRaw,
      };
    }
    const lastAssistant = [...(activeChat?.messages ?? [])]
      .reverse()
      .find((m) => m.role === "assistant");
    return {
      thinking: lastAssistant?.parsed?.thinking ?? "",
      sum: lastAssistant?.parsed?.sum ?? "",
      options: lastAssistant?.parsed?.options ?? [],
      varsRaw: lastAssistant?.parsed?.varsRaw ?? "",
    };
  }, [activeChat?.messages, streamState]);

  const messages = useMemo(() => {
    const base = (activeChat?.messages || []).map(tavernMessageToAppMessage);
    // If streaming, append a temporary assistant message with current maintext
    if (streamState.isStreaming) {
      base.push({
        id: "streaming",
        role: "assistant",
        content: streamState.maintext || "",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      });
    }
    return base;
  }, [activeChat?.messages, streamState]);

  const isTyping = streamState.isStreaming;

  // API connection status
  const [apiConnected, setApiConnected] = useState(false);
  useEffect(() => {
    if (!settings?.api) return;
    let cancelled = false;
    testConnection({
      baseUrl: settings.api.baseUrl,
      apiKey: settings.api.apiKey,
      model: settings.api.model,
    }).then((res) => {
      if (!cancelled) setApiConnected(res.ok);
    });
    return () => { cancelled = true; };
  }, [settings?.api.baseUrl, settings?.api.apiKey, settings?.api.model]);

  const handleNavigate = useCallback((v: AppView) => {
    const email = localStorage.getItem('jjk_current_user_email');
    if (v !== 'login' && v !== 'home' && !email) {
      addNotification({ type: 'warning', title: '需要登录', message: '请先注册或登录咒术档案', duration: 3000 });
      setView('login');
      return;
    }
    setView(v);
  }, [addNotification]);

  const handleSendMessage = useCallback(
    async (text: string) => {
      if (!initialized) return;
      try {
        await sendGameMessage(text);
      } catch (e: any) {
        addNotification({
          type: "error",
          title: "发送失败",
          message: e?.message || "无法连接到 AI 服务",
          duration: 5000,
        });
      }
    },
    [initialized, sendGameMessage, addNotification]
  );

  // Auto-create chat when entering game if none exists, or select first chat if activeChat is lost
  useEffect(() => {
    if (view === "game" && initialized) {
      if (!activeChat && chats.length === 0) {
        createChat("咒术高专 - 新游戏");
      } else if (!activeChat && chats.length > 0) {
        selectChat(chats[0].id);
      }
    }
  }, [view, initialized, activeChat, chats, chats.length, createChat, selectChat]);

  // Auto-send opening initialization when new game chat is ready
  useEffect(() => {
    if (pendingInit && activeChat?.id === pendingInit.chatId && initialized && !isTyping) {
      handleSendMessage(pendingInit.text);
      setPendingInit(null);
    }
  }, [pendingInit, activeChat, initialized, isTyping, handleSendMessage]);

  // Dev shortcut: Ctrl+Shift+G to jump directly to game
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'G') {
        e.preventDefault();
        setView('game');
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // Welcome notification when entering game
  useEffect(() => {
    if (view === "game") {
      const t = setTimeout(() => {
        addNotification({
          type: "info",
          title: "世界线加载完毕",
          message: "欢迎回到 SANCTUM · 咒術高専剧本",
          duration: 5000,
        });
      }, 800);
      return () => clearTimeout(t);
    }
  }, [view, addNotification]);

  return (
    <>
      <AnimatePresence mode="wait">
        {view === "home" && (
          <HomePage
            key="home"
            onNavigate={handleNavigate}
            userEmail={localStorage.getItem('jjk_current_user_email')}
            onLogout={() => {
              localStorage.removeItem('jjk_current_user_email');
              switchUserDatabase('');
              window.location.reload();
            }}
          />
        )}
        {view === "login" && (
          <LoginPage
            key="login"
            onClose={() => setView("home")}
            onNavigate={handleNavigate}
            onLogin={(email) => {
              switchUserDatabase(email);
              window.location.reload();
            }}
          />
        )}
        {view === "new-game" && (
          <NewGameFlow
            key="new-game"
            onBack={() => setView("home")}
            onComplete={async (data) => {
              const initMsg = buildOpeningSystemMessage(data);
              const chatId = await createChat("咒术高专 - 新游戏", {
                initialVariables: characterCreationToVariables(data),
                userName: data.name || DEFAULT_SETTINGS.userName,
                characterName: data.name || DEFAULT_SETTINGS.characterName,
                initialMessages: [initMsg],
              });
              setPendingInit({ chatId, text: "【降生】" });
              setView("game");
            }}
          />
        )}
        {view === "load-game" && (
          <LoadGamePage
            key="load-game"
            onNavigate={handleNavigate}
            onLoadSave={(saveId) => {
              selectChat(saveId);
              setView("game");
            }}
          />
        )}
        {view === "system-settings" && (
          <SystemSettingsPage
            key="system-settings"
            onNavigate={handleNavigate}
            onOpenLorebooks={openLorebooks}
            onOpenPresets={openPresets}
          />
        )}
        {view === "game" && (
          <GameView
            key="game"
            gameState={gameState}
            messages={messages}
            isTyping={isTyping}
            onSendMessage={handleSendMessage}
            onNavigate={handleNavigate}
            onOpenSettings={openSettings}
            onOpenLorebooks={openLorebooks}
            onOpenPresets={openPresets}
            onOpenVariables={openVariables}
            streamOptions={lastAssistantParsed.options}
            onSelectOption={(opt) => handleSendMessage(opt)}
            apiConnected={apiConnected}
            thinking={lastAssistantParsed.thinking}
            sum={lastAssistantParsed.sum}
          />
        )}
      </AnimatePresence>

      {/* SillyTavern Management Modals */}
      {showSettings && settings && (
        <SettingsModal
          settings={settings}
          updateSettings={updateSettings}
          onClose={() => setShowSettings(false)}
        />
      )}
      {showLorebooks && (
        <LorebookModal onClose={() => setShowLorebooks(false)} />
      )}
      {showPresets && (
        <PresetModal onClose={() => setShowPresets(false)} />
      )}
      {showVariables && activeChat && (
        <VariablesModal
          variables={activeChat.variables || {}}
          onUpdate={(vars) => st.setChatVariables(vars)}
          onClose={() => setShowVariables(false)}
        />
      )}
    </>
  );
}

export default function App() {
  return (
    <NotificationProvider>
      <InnerApp />
    </NotificationProvider>
  );
}
