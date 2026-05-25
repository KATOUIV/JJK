import { createContext, useContext } from 'react';
import type {
  AppSettings,
  ChatPreset,
  ChatSession,
  ChatMessage,
  Lorebook,
  ParsedTags,
} from '../sillytavern/types';

export interface StreamState {
  maintext: string;
  options: string[];
  sum: string;
  varsRaw: string;
  thinking: string;
  done: boolean;
}

export interface SillytavernContextValue {
  // state
  settings: AppSettings | null;
  presets: ChatPreset[];
  lorebooks: Lorebook[];
  chats: ChatSession[];
  activeChat: ChatSession | null;
  activePreset: ChatPreset | null;
  secondaryPreset: ChatPreset | null;
  initialized: boolean;

  // chat actions
  createChat: (
    name: string,
    options?: {
      presetId?: string;
      lorebookIds?: string[];
      initialVariables?: Record<string, any>;
      characterName?: string;
      userName?: string;
      initialMessages?: ChatMessage[];
    }
  ) => Promise<string>;
  selectChat: (id: string) => void;
  removeChat: (id: string) => Promise<void>;
  sendMessage: (text: string, role?: ChatMessage['role']) => Promise<void>;
  deleteMessage: (messageId: string) => Promise<void>;
  editMessage: (messageId: string, newContent: string) => Promise<void>;
  rollbackTo: (messageId: string) => Promise<void>;

  // settings / lorebook / preset mutations
  updateSettings: (patch: Partial<AppSettings>) => Promise<void>;
  addPreset: (preset: ChatPreset) => Promise<void>;
  addLorebook: (book: Lorebook) => Promise<void>;
  toggleLorebook: (id: string) => void;
  updateLorebook: (book: Lorebook) => Promise<void>;
  deleteLorebook: (id: string) => Promise<void>;
  addLorebookFromDefault: (name: string) => Promise<Lorebook>;
  updatePreset: (preset: ChatPreset) => Promise<void>;
  deletePreset: (id: string) => Promise<void>;
  addPresetFromDefault: (name: string) => Promise<ChatPreset>;

  // v3 game mode
  sendGameMessage: (userText: string) => Promise<void>;
  jumpToFloor: (messageId: string) => Promise<void>;
  regenerateLast: () => Promise<void>;
  streamState: StreamState;
  abortStream: () => void;
  openSettings: () => void;
  openLorebooks: () => void;
  openPresets: () => void;
  openVariables: () => void;

  // modal states (for binding)
  showSettings: boolean;
  setShowSettings: (v: boolean) => void;
  showLorebooks: boolean;
  setShowLorebooks: (v: boolean) => void;
  showPresets: boolean;
  setShowPresets: (v: boolean) => void;
  showVariables: boolean;
  setShowVariables: (v: boolean) => void;

  // variables
  setChatVariables: (vars: Record<string, any>) => Promise<void>;

  // toast
  toast: string | null;
  showToast: (message: string) => void;
}

export const SillytavernContext = createContext<SillytavernContextValue | null>(null);

export function useSillytavern(): SillytavernContextValue {
  const ctx = useContext(SillytavernContext);
  if (!ctx) {
    throw new Error('useSillytavern must be used within a <SillytavernProvider>');
  }
  return ctx;
}
