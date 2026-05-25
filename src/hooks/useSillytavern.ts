import { useCallback, useEffect, useMemo, useState } from 'react';
import { useStreamParser } from './useStreamParser';
import { useApiRouter } from './useApiRouter';
import { StreamTagParser } from '../sillytavern/stream-parser';
import { applyParsedToChat, aggregateEvents } from '../sillytavern/variables';
import { assemblePrompt, assembleSecondaryPrompt } from '../sillytavern/prompt-assembler';
import {
  DEFAULT_TAGS,
  DEFAULT_OPAQUE_TAGS,
  DEFAULT_SETTINGS,
  type AppSettings,
  type ChatPreset,
  type ChatSession,
  type ChatMessage,
  type Lorebook,
} from '../sillytavern/types';
import {
  getDatabase,
  initializeDatabase,
  getLorebooks,
  getPresets,
  getSettings,
  getChats,
  saveLorebook,
  savePreset,
  saveSettings,
  saveChat,
  deleteChat,
  deleteLorebook as deleteLorebookDb,
  deletePreset as deletePresetDb,
} from '../sillytavern/database';
import { createDefaultLorebook } from '../sillytavern/editor-utils';
import { createDefaultPreset } from '../sillytavern/types';
import { importPreset, importLorebook } from '../sillytavern/importer';

const db = getDatabase();

export function useSillytavern() {
  // ---- core state ----
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [presets, setPresets] = useState<ChatPreset[]>([]);
  const [lorebooks, setLorebooks] = useState<Lorebook[]>([]);
  const [chats, setChats] = useState<ChatSession[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [initialized, setInitialized] = useState(false);

  // ---- modal toggles ----
  const [showSettings, setShowSettings] = useState(false);
  const [showLorebooks, setShowLorebooks] = useState(false);
  const [showPresets, setShowPresets] = useState(false);
  const [showVariables, setShowVariables] = useState(false);

  // ---- toast ----
  const [toast, setToast] = useState<string | null>(null);
  const showToast = useCallback((message: string) => {
    setToast(message);
    setTimeout(() => setToast(null), 2000);
  }, []);

  // ---- derived ----
  const activeChat = useMemo(
    () => chats.find((c) => c.id === activeChatId) ?? null,
    [chats, activeChatId]
  );
  const activePreset = useMemo(
    () => presets.find((p) => p.id === settings?.activePresetId) ?? presets.filter((p) => p.apiTarget === 'primary' || p.apiTarget === 'both' || !p.apiTarget)[0] ?? presets[0] ?? null,
    [presets, settings]
  );

  const secondaryPreset = useMemo(
    () => presets.find((p) => p.id === settings?.secondaryPresetId) ?? presets.filter((p) => p.apiTarget === 'secondary' || p.apiTarget === 'both')[0] ?? null,
    [presets, settings]
  );

  // ---- init ----
  useEffect(() => {
    let cancelled = false;
    (async () => {
      await initializeDatabase();
      let [l, p, s, c] = await Promise.all([
        getLorebooks(),
        getPresets(),
        getSettings(),
        getChats(),
      ]);

      // Migrate old presets with nested SillyTavern prompt_order format [{character_id, order:[...]}]
      let migratedPresets = false;
      for (const preset of p) {
        const raw = preset.settings.prompt_order;
        if (Array.isArray(raw) && raw.length > 0 && raw[0] && Array.isArray(raw[0].order)) {
          preset.settings = {
            ...preset.settings,
            prompt_order: raw[0].order,
          };
          await savePreset(preset);
          migratedPresets = true;
        }
      }
      if (migratedPresets) {
        p = await getPresets();
      }

      // Auto-import default resources if database is empty
      if (p.length === 0) {
        try {
          const presetRes = await fetch('/default-resources/preset.json');
          if (presetRes.ok) {
            const presetData = await presetRes.json();
            const imported = importPreset(presetData);
            const preset: ChatPreset = {
              ...imported,
              id: crypto.randomUUID(),
              createdAt: Date.now(),
              updatedAt: Date.now(),
              apiTarget: 'primary',
            };
            await savePreset(preset);
            p = await getPresets();
          }
        } catch {
          // ignore import errors
        }
      }

      // Auto-import secondary preset if missing and dual mode is available
      const hasSecondary = p.some((preset) => preset.apiTarget === 'secondary');
      if (!hasSecondary) {
        try {
          const secRes = await fetch('/default-resources/secondary-preset.json');
          if (secRes.ok) {
            const secData = await secRes.json();
            const imported = importPreset(secData);
            const preset: ChatPreset = {
              ...imported,
              id: crypto.randomUUID(),
              createdAt: Date.now(),
              updatedAt: Date.now(),
              apiTarget: 'secondary',
            };
            await savePreset(preset);
            p = await getPresets();
          }
        } catch {
          // ignore import errors
        }
      }

      if (l.length === 0) {
        try {
          const lbRes = await fetch('/default-resources/lorebook.json');
          if (lbRes.ok) {
            const lbData = await lbRes.json();
            const imported = importLorebook(lbData);
            const lorebook: Lorebook = {
              ...imported,
              id: crypto.randomUUID(),
              createdAt: Date.now(),
              updatedAt: Date.now(),
              apiTarget: 'both',
            };
            await saveLorebook(lorebook);
            l = await getLorebooks();
          }
        } catch {
          // ignore import errors
        }
      }

      if (cancelled) return;
      setLorebooks(l);
      setPresets(p);
      const mergedSettings = s ? { ...DEFAULT_SETTINGS, ...s } : { ...DEFAULT_SETTINGS };

      // Ensure customTags is up-to-date with latest defaults
      const requiredTags = new Set(DEFAULT_SETTINGS.customTags);
      const currentTags = new Set(mergedSettings.customTags ?? []);
      if (mergedSettings.customTags && ![...requiredTags].every((t) => currentTags.has(t))) {
        mergedSettings.customTags = [...new Set([...mergedSettings.customTags, ...DEFAULT_SETTINGS.customTags])];
        await saveSettings(mergedSettings);
      }

      // Auto-activate first primary preset if none selected
      const primaryPresets = p.filter((preset) => preset.apiTarget === 'primary' || preset.apiTarget === 'both' || !preset.apiTarget);
      if (!mergedSettings.activePresetId && primaryPresets.length > 0) {
        mergedSettings.activePresetId = primaryPresets[0].id;
        await saveSettings(mergedSettings);
      }

      // Auto-activate first secondary preset if none selected and dual mode
      const secondaryPresets = p.filter((preset) => preset.apiTarget === 'secondary' || preset.apiTarget === 'both');
      if (!mergedSettings.secondaryPresetId && secondaryPresets.length > 0) {
        mergedSettings.secondaryPresetId = secondaryPresets[0].id;
        await saveSettings(mergedSettings);
      }

      // Auto-activate all lorebooks if none selected
      if ((!mergedSettings.activeLorebookIds || mergedSettings.activeLorebookIds.length === 0) && l.length > 0) {
        mergedSettings.activeLorebookIds = l.map((b) => b.id);
        await saveSettings(mergedSettings);
      }

      setSettings(mergedSettings);
      setChats(c);
      if (c.length > 0) setActiveChatId(c[0].id);
      setInitialized(true);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // ---- chat helpers ----
  const createChat = useCallback(
    async (name: string, options?: { presetId?: string; lorebookIds?: string[]; initialVariables?: Record<string, any>; characterName?: string; userName?: string; initialMessages?: ChatMessage[] }) => {
      const chat: ChatSession = {
        id: crypto.randomUUID(),
        name,
        messages: options?.initialMessages ?? [],
        characterName: options?.characterName ?? settings?.characterName ?? DEFAULT_SETTINGS.characterName,
        userName: options?.userName ?? settings?.userName ?? DEFAULT_SETTINGS.userName,
        presetId: options?.presetId ?? settings?.activePresetId ?? null,
        lorebookIds: options?.lorebookIds ?? settings?.activeLorebookIds ?? [],
        variables: options?.initialVariables ?? {},
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      await saveChat(chat);
      setChats((prev) => [...prev, chat]);
      setActiveChatId(chat.id);
      return chat.id;
    },
    [settings]
  );

  const selectChat = useCallback((id: string) => setActiveChatId(id), []);

  const removeChat = useCallback(
    async (id: string) => {
      await deleteChat(id);
      setChats((prev) => prev.filter((c) => c.id !== id));
      if (activeChatId === id) {
        const remaining = chats.filter((c) => c.id !== id);
        setActiveChatId(remaining[0]?.id ?? null);
      }
    },
    [activeChatId, chats]
  );

  const sendMessage = useCallback(
    async (text: string, role: ChatMessage['role'] = 'user') => {
      if (!activeChat) return;
      const msg: ChatMessage = {
        id: crypto.randomUUID(),
        role,
        content: text,
        timestamp: Date.now(),
      };
      const next = { ...activeChat, messages: [...activeChat.messages, msg], updatedAt: Date.now() };
      await saveChat(next);
      setChats((prev) => prev.map((c) => (c.id === next.id ? next : c)));
    },
    [activeChat]
  );

  const deleteMessage = useCallback(
    async (messageId: string) => {
      if (!activeChat) return;
      const next = {
        ...activeChat,
        messages: activeChat.messages.filter((m) => m.id !== messageId),
        updatedAt: Date.now(),
      };
      await saveChat(next);
      setChats((prev) => prev.map((c) => (c.id === next.id ? next : c)));
    },
    [activeChat]
  );

  const editMessage = useCallback(
    async (messageId: string, newContent: string) => {
      if (!activeChat) return;
      const next = {
        ...activeChat,
        messages: activeChat.messages.map((m) =>
          m.id === messageId ? { ...m, content: newContent } : m
        ),
        updatedAt: Date.now(),
      };
      await saveChat(next);
      setChats((prev) => prev.map((c) => (c.id === next.id ? next : c)));
    },
    [activeChat]
  );

  const rollbackTo = useCallback(
    async (messageId: string) => {
      if (!activeChat) return;
      const idx = activeChat.messages.findIndex((m) => m.id === messageId);
      if (idx < 0) return;
      const next = {
        ...activeChat,
        messages: activeChat.messages.slice(0, idx + 1),
        updatedAt: Date.now(),
      };
      await saveChat(next);
      setChats((prev) => prev.map((c) => (c.id === next.id ? next : c)));
    },
    [activeChat]
  );

  // ---- settings / preset / lorebook mutations ----
  const updateSettings = useCallback(async (patch: Partial<AppSettings>) => {
    setSettings((prev) => {
      if (!prev) return prev;
      const next = { ...prev, ...patch };
      saveSettings(next);
      return next;
    });
  }, []);

  const addPreset = useCallback(async (preset: ChatPreset) => {
    await savePreset(preset);
    setPresets((prev) => [...prev, preset]);
  }, []);

  const addLorebook = useCallback(async (book: Lorebook) => {
    await saveLorebook(book);
    setLorebooks((prev) => [...prev, book]);
  }, []);

  const updateLorebook = useCallback(async (book: Lorebook) => {
    const next: Lorebook = { ...book, updatedAt: Date.now() };
    await saveLorebook(next);
    setLorebooks((prev) => prev.map((b) => (b.id === next.id ? next : b)));
  }, []);

  const deleteLorebook = useCallback(async (id: string) => {
    await deleteLorebookDb(id);
    setLorebooks((prev) => prev.filter((b) => b.id !== id));
    setSettings((prev) => {
      if (!prev) return prev;
      if (!prev.activeLorebookIds?.includes(id)) return prev;
      const next = {
        ...prev,
        activeLorebookIds: prev.activeLorebookIds.filter((x) => x !== id),
      };
      saveSettings(next);
      return next;
    });
  }, []);

  const addLorebookFromDefault = useCallback(async (name: string) => {
    const book = createDefaultLorebook(name);
    await saveLorebook(book);
    setLorebooks((prev) => [...prev, book]);
    return book;
  }, []);

  const updatePreset = useCallback(async (preset: ChatPreset) => {
    const next: ChatPreset = { ...preset, updatedAt: Date.now() };
    await savePreset(next);
    setPresets((prev) => prev.map((p) => (p.id === next.id ? next : p)));
  }, []);

  const deletePreset = useCallback(async (id: string) => {
    await deletePresetDb(id);
    setPresets((prev) => prev.filter((p) => p.id !== id));
    setSettings((prev) => {
      if (!prev) return prev;
      if (prev.activePresetId !== id) return prev;
      const next = { ...prev, activePresetId: null };
      saveSettings(next);
      return next;
    });
  }, []);

  const addPresetFromDefault = useCallback(async (name: string) => {
    const base = createDefaultPreset();
    const preset: ChatPreset = {
      id: crypto.randomUUID(),
      createdAt: Date.now(),
      updatedAt: Date.now(),
      ...base,
      name,
    };
    await savePreset(preset);
    setPresets((prev) => [...prev, preset]);
    return preset;
  }, []);

  const toggleLorebook = useCallback(
    (id: string) => {
      setSettings((prev) => {
        if (!prev) return prev;
        const ids = new Set(prev.activeLorebookIds ?? []);
        if (ids.has(id)) ids.delete(id);
        else ids.add(id);
        const next = { ...prev, activeLorebookIds: Array.from(ids) };
        saveSettings(next);
        return next;
      });
    },
    []
  );

  // ---- v3 game mode: streaming + parser + variables ----
  const parser = useStreamParser(
    settings?.customTags ?? [...DEFAULT_TAGS],
    [...DEFAULT_OPAQUE_TAGS]
  );
  const router = useApiRouter(settings?.api ?? DEFAULT_SETTINGS.api);

  const sendGameMessage = useCallback(
    async (userText: string) => {
      if (!activeChat || !settings) return;

      const userMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'user',
        content: userText,
        timestamp: Date.now(),
      };
      const updatedChat: ChatSession = {
        ...activeChat,
        messages: [...activeChat.messages, userMsg],
        updatedAt: Date.now(),
      };
      await db.chats.put(updatedChat);
      setChats((prev) => prev.map((c) => (c.id === updatedChat.id ? updatedChat : c)));

      const activeLorebookIds = new Set(settings.activeLorebookIds ?? []);
      const isDual = settings.apiMode === 'dual';

      const activeLorebooks = lorebooks.filter((l) => activeLorebookIds.has(l.id));
      const primaryLorebooks = activeLorebooks.filter(
        (l) => l.apiTarget === 'primary' || l.apiTarget === 'both' || !l.apiTarget
      );
      const secondaryLorebooks = activeLorebooks.filter(
        (l) => l.apiTarget === 'secondary' || l.apiTarget === 'both'
      );

      // 1. Assemble primary prompt
      const { messages: primaryMessages } = assemblePrompt({
        userInput: userText,
        history: updatedChat.messages,
        preset: activePreset!,
        lorebooks: primaryLorebooks,
        userName: settings.userName,
        characterName: settings.characterName,
        extraVariables: updatedChat.variables,
        formatPrompt: settings.formatPromptTemplate,
        apiMode: isDual ? 'dual' : 'single',
        apiTarget: 'primary',
      });

      let rawResponse = '';
      parser.start();
      try {
        await router.sendStream({
          task: 'story',
          messages: primaryMessages,
          onChunk: (delta) => {
            rawResponse += delta;
            parser.feed(delta);
          },
        });
      } catch (e) {
        parser.reset();
        throw e;
      }

      const { events, parsed: primaryParsed } = parser.finish();
      const primaryMaintext = primaryParsed.maintext;

      let mergedParsed = primaryParsed;
      let apiUsed: 'primary' | 'secondary' = 'primary';

      // 2. Dual API mode: call secondary API for variables
      if (isDual && primaryMaintext && secondaryPreset) {
        try {
          const secondaryMessages = assembleSecondaryPrompt({
            maintext: primaryMaintext,
            preset: secondaryPreset,
            userName: settings.userName,
            characterName: settings.characterName,
            variables: updatedChat.variables,
            formatPrompt: settings.formatPromptTemplate,
            lorebooks: secondaryLorebooks,
          });

          const secondaryText = await router.sendRaw({
            task: 'vars',
            messages: secondaryMessages,
          });

          // Parse vars from secondary response
          const secondaryParser = new StreamTagParser(
            settings?.customTags ?? [...DEFAULT_TAGS],
            [...DEFAULT_OPAQUE_TAGS]
          );
          const secondaryEvents = secondaryParser.feed(secondaryText);
          secondaryEvents.push(...secondaryParser.finish());
          const secondaryParsed = aggregateEvents(secondaryEvents);

          // Merge: keep primary's story tags, override with secondary's vars
          mergedParsed = {
            ...primaryParsed,
            varsRaw: secondaryParsed.varsRaw,
            varsCommands: secondaryParsed.varsCommands,
          };
          apiUsed = 'secondary';
        } catch (e) {
          // If secondary fails, fall back to primary's parsed vars
          console.warn('Secondary API failed, falling back to primary vars:', e);
        }
      }

      const { nextVariables, snapshot } = applyParsedToChat(
        updatedChat.variables ?? {},
        mergedParsed
      );

      const assistantMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: rawResponse, // 保留完整原始 XML（含标签），供前端正则提取与铅笔查看
        timestamp: Date.now(),
        parsed: mergedParsed,
        variablesAfter: snapshot,
        apiUsed,
      };
      const finalChat: ChatSession = {
        ...updatedChat,
        messages: [...updatedChat.messages, assistantMsg],
        variables: nextVariables,
        updatedAt: Date.now(),
      };
      await db.chats.put(finalChat);
      setChats((prev) => prev.map((c) => (c.id === finalChat.id ? finalChat : c)));
    },
    [activeChat, settings, lorebooks, activePreset, secondaryPreset, parser, router]
  );

  const jumpToFloor = useCallback(
    async (messageId: string) => {
      if (!activeChat) return;
      const idx = activeChat.messages.findIndex((m) => m.id === messageId);
      if (idx < 0) return;
      const truncated = activeChat.messages.slice(0, idx + 1);
      const target = truncated[truncated.length - 1];
      const restoredVars =
        target?.role === 'assistant' && target.variablesAfter
          ? target.variablesAfter
          : activeChat.variables ?? {};
      const next: ChatSession = {
        ...activeChat,
        messages: truncated,
        variables: restoredVars,
        updatedAt: Date.now(),
      };
      await db.chats.put(next);
      setChats((prev) => prev.map((c) => (c.id === next.id ? next : c)));
    },
    [activeChat]
  );

  const regenerateLast = useCallback(async () => {
    if (!activeChat) return;
    const lastUserIdx = [...activeChat.messages]
      .reverse()
      .findIndex((m) => m.role === 'user');
    if (lastUserIdx < 0) return;
    const targetIdx = activeChat.messages.length - 1 - lastUserIdx;
    const truncated = activeChat.messages.slice(0, targetIdx);
    const next: ChatSession = {
      ...activeChat,
      messages: truncated,
      updatedAt: Date.now(),
    };
    await db.chats.put(next);
    setChats((prev) => prev.map((c) => (c.id === next.id ? next : c)));
    await sendGameMessage(activeChat.messages[targetIdx].content);
  }, [activeChat, sendGameMessage]);

  const setChatVariables = useCallback(
    async (vars: Record<string, any>) => {
      if (!activeChat) return;
      const next: ChatSession = {
        ...activeChat,
        variables: vars,
        updatedAt: Date.now(),
      };
      await db.chats.put(next);
      setChats((prev) => prev.map((c) => (c.id === next.id ? next : c)));
    },
    [activeChat]
  );

  return {
    // state
    settings,
    presets,
    lorebooks,
    chats,
    activeChat,
    activePreset,
    secondaryPreset,
    initialized,

    // chat actions
    createChat,
    selectChat,
    removeChat,
    sendMessage,
    deleteMessage,
    editMessage,
    rollbackTo,

    // settings / lorebook / preset mutations
    updateSettings,
    addPreset,
    addLorebook,
    toggleLorebook,
    updateLorebook,
    deleteLorebook,
    addLorebookFromDefault,
    updatePreset,
    deletePreset,
    addPresetFromDefault,

    // v3 game mode
    sendGameMessage,
    jumpToFloor,
    regenerateLast,
    streamState: parser.state,
    abortStream: router.abort,
    openSettings: () => setShowSettings(true),
    openLorebooks: () => setShowLorebooks(true),
    openPresets: () => setShowPresets(true),
    openVariables: () => setShowVariables(true),

    // modal states (for binding)
    showSettings,
    setShowSettings,
    showLorebooks,
    setShowLorebooks,
    showPresets,
    setShowPresets,
    showVariables,
    setShowVariables,

    // variables
    setChatVariables,

    // toast
    toast,
    showToast,
  };
}
