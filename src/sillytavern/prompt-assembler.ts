/**
 * Prompt Assembler
 */

import type { ChatPreset, Lorebook, ChatMessage, MatchedEntry } from './types';
import { createLorebookEngine } from './lorebook-engine';
import { formatVariablesForPrompt } from './variables';

export type ApiMode = 'single' | 'dual';
export type ApiTarget = 'primary' | 'secondary';

export interface AssembleOptions {
  userInput: string;
  history: ChatMessage[];
  preset: ChatPreset;
  lorebooks: Lorebook[];
  userName: string;
  characterName: string;
  variables?: Record<string, string | number>;
  extraVariables?: Record<string, any>;
  formatPrompt?: string;
  apiMode?: ApiMode;
  apiTarget?: ApiTarget;
}

export interface AssembleResult {
  messages: { role: 'system' | 'user' | 'assistant'; content: string }[];
  matchedEntries: MatchedEntry[];
  systemPrompt: string;
}

// Identifiers for special format requirement prompts that are auto-toggled by apiMode
const SINGLE_API_FORMAT_ID = 'single_api_format_req';
const DUAL_MAIN_FORMAT_ID = 'dual_main_format_req';
const DUAL_VAR_FORMAT_ID = 'dual_var_format_req';
const VAR_UPDATE_RULES_ID = 'var_update_rules';
const VAR_LIST_ID = 'var_list';
const VAR_OUTPUT_FORMAT_ID = 'var_output_format';

const VAR_RELATED_IDS = new Set([
  VAR_UPDATE_RULES_ID,
  VAR_LIST_ID,
  VAR_OUTPUT_FORMAT_ID,
]);

function getPromptOrder(preset: ChatPreset): Array<{
  identifier: string;
  name?: string;
  role?: 'system' | 'user' | 'assistant';
  enabled?: boolean;
}> {
  const raw = preset.settings.prompt_order;
  if (!Array.isArray(raw)) return [];
  // Handle nested SillyTavern format: [{ character_id, order: [...] }]
  if (raw.length > 0 && raw[0] && Array.isArray(raw[0].order)) {
    return raw[0].order;
  }
  return raw;
}

function shouldIncludePrompt(identifier: string, apiMode: ApiMode = 'single', apiTarget: ApiTarget = 'primary'): boolean {
  if (apiMode === 'single') {
    // Single API: enable single format + var rules, disable dual formats
    if (identifier === DUAL_MAIN_FORMAT_ID || identifier === DUAL_VAR_FORMAT_ID) return false;
    return true;
  }
  // Dual API
  if (apiTarget === 'primary') {
    // Primary: enable dual main format, disable single format + all var-related
    if (identifier === SINGLE_API_FORMAT_ID) return false;
    if (VAR_RELATED_IDS.has(identifier)) return false;
    if (identifier === DUAL_VAR_FORMAT_ID) return false;
    return true;
  }
  // Secondary: only var-related + dual_var_format_req should be included
  // (handled separately in assembleSecondaryPrompt)
  return true;
}

export function assemblePrompt(options: AssembleOptions): AssembleResult {
  const { userInput, history, preset, lorebooks, userName, characterName, variables, extraVariables, formatPrompt, apiMode, apiTarget } = options;

  const allMatchedEntries: MatchedEntry[] = [];
  const scanText = userInput + ' ' + history.slice(-3).map(m => m.content).join(' ');

  for (const book of lorebooks) {
    const engine = createLorebookEngine(book);
    const matches = engine.recursiveScan(scanText, 3);
    allMatchedEntries.push(...matches);
  }

  const uniqueEntries = Array.from(
    new Map(allMatchedEntries.map(e => [e.entry.id, e])).values()
  ).sort((a, b) => a.score - b.score);

  // Cap max context to a reasonable value to avoid sending huge prompts
  const MAX_REASONABLE_CONTEXT = 32768;
  const maxContextTokens = Math.min(
    preset.settings.openai_max_context || preset.settings.max_length || 4096,
    MAX_REASONABLE_CONTEXT
  );
  let currentTokens = 0;

  const recentHistory: { role: 'system' | 'user' | 'assistant'; content: string }[] = [];
  for (let i = history.length - 1; i >= 0; i--) {
    const msg = history[i];
    if (msg.role === 'system') continue;
    const msgTokens = msg.content.length / 4;
    if (currentTokens + msgTokens > maxContextTokens * 0.8) break;
    recentHistory.unshift({ role: msg.role, content: msg.content });
    currentTokens += msgTokens;
  }

  const promptOrder = getPromptOrder(preset);

  const prompts = (preset.settings.prompts || []) as Array<{
    identifier: string;
    role?: 'system' | 'user' | 'assistant';
    content?: string;
  }>;

  function resolvePromptContent(identifier: string): string | null {
    // Dynamic content for world info
    if (identifier === 'worldInfoBefore' || identifier === 'worldInfoAfter') {
      const content = uniqueEntries.map(e => e.entry.content).join('\n\n');
      return content || null;
    }
    // Character / scenario placeholders (can be filled when character cards are implemented)
    if (identifier === 'charDescription') {
      return preset.settings.character_description || null;
    }
    if (identifier === 'charPersonality') {
      return preset.settings.character_personality || null;
    }
    if (identifier === 'scenario') {
      return preset.settings.scenario || null;
    }
    if (identifier === 'personaDescription') {
      return preset.settings.persona_description || null;
    }
    if (identifier === 'dialogueExamples') {
      return preset.settings.dialogue_examples || null;
    }
    if (identifier === 'groupNudge') {
      return preset.settings.group_nudge_prompt || null;
    }
    if (identifier === 'impersonate') {
      return preset.settings.impersonation_prompt || null;
    }
    if (identifier === 'quietPrompt') {
      return preset.settings.quiet_prompt || null;
    }
    if (identifier === 'bias') {
      return null;
    }
    // Custom prompts array
    const custom = prompts.find(p => p.identifier === identifier);
    if (custom?.content) return custom.content;
    // Direct preset fields (main, nsfw, jailbreak, enhanceDefinitions, etc.)
    const direct = preset.settings[identifier];
    if (typeof direct === 'string' && direct.trim()) return direct;
    return null;
  }

  const assembledMessages: { role: 'system' | 'user' | 'assistant'; content: string }[] = [];
  let systemAccumulator = '';
  let hasChatHistory = false;

  for (const item of promptOrder) {
    if (item.enabled === false) continue;
    if (!shouldIncludePrompt(item.identifier, apiMode, apiTarget)) continue;

    if (item.identifier === 'chatHistory') {
      hasChatHistory = true;
      if (systemAccumulator) {
        assembledMessages.push({ role: 'system', content: systemAccumulator });
        systemAccumulator = '';
      }
      assembledMessages.push(...recentHistory);
      continue;
    }

    const rawContent = resolvePromptContent(item.identifier);
    if (!rawContent) continue;

    let content = replaceMacros(rawContent, { userName, characterName, userInput, variables });
    if (!content.trim()) continue;

    const role = item.role || 'system';
    if (role === 'system') {
      systemAccumulator += (systemAccumulator ? '\n\n' : '') + content;
    } else {
      if (systemAccumulator) {
        assembledMessages.push({ role: 'system', content: systemAccumulator });
        systemAccumulator = '';
      }
      assembledMessages.push({ role, content });
    }
  }

  const variablesBlock = formatVariablesForPrompt(variables || {});
  if (variablesBlock) {
    systemAccumulator += (systemAccumulator ? '\n\n' : '') + variablesBlock;
  }

  if (extraVariables && Object.keys(extraVariables).length > 0) {
    const extraBlock = formatVariablesForPrompt(extraVariables);
    if (extraBlock) {
      systemAccumulator += (systemAccumulator ? '\n\n' : '') + extraBlock;
    }
  }

  if (formatPrompt) {
    systemAccumulator += (systemAccumulator ? '\n\n' : '') + formatPrompt;
  }

  if (systemAccumulator) {
    assembledMessages.unshift({ role: 'system', content: systemAccumulator });
  }

  // Fallback: append history if prompt_order didn't include it
  if (!hasChatHistory) {
    assembledMessages.push(...recentHistory);
  }

  // Always append the current user input as the final message
  assembledMessages.push({ role: 'user', content: userInput });

  const systemPrompt = assembledMessages
    .filter(m => m.role === 'system')
    .map(m => m.content)
    .join('\n\n');

  return {
    messages: assembledMessages,
    matchedEntries: uniqueEntries,
    systemPrompt,
  };
}

interface MacroContext {
  userName: string;
  characterName: string;
  userInput: string;
  variables?: Record<string, string | number>;
}

export function replaceMacros(template: string, context: MacroContext): string {
  let result = template
    .replace(/\{\{user\}\}/g, context.userName)
    .replace(/\{\{char\}\}/g, context.characterName)
    .replace(/\{\{original\}\}/g, context.userInput);

  if (context.variables) {
    result = result.replace(/\{\{([^{}]+)\}\}/g, (match, key) => {
      const value = context.variables?.[key.trim()];
      return value !== undefined ? String(value) : match;
    });
  }

  return result;
}

export const SUPPORTED_MACROS = [
  { name: '{{user}}', description: '用户名' },
  { name: '{{char}}', description: 'AI角色名' },
  { name: '{{original}}', description: '用户原始输入' },
  { name: '{{变量名}}', description: '自定义变量（例如 {{hp}}）' },
] as const;

export interface SecondaryPromptOptions {
  maintext: string;
  preset: ChatPreset;
  userName: string;
  characterName: string;
  variables?: Record<string, any>;
  formatPrompt?: string;
  lorebooks?: Lorebook[];
}

export function assembleSecondaryPrompt(options: SecondaryPromptOptions): Array<{ role: 'system' | 'user' | 'assistant'; content: string }> {
  const { maintext, preset, userName, characterName, variables, formatPrompt, lorebooks } = options;

  const prompts = (preset.settings.prompts || []) as Array<{
    identifier: string;
    role?: 'system' | 'user' | 'assistant';
    content?: string;
  }>;

  // Collect secondary-specific prompts
  const varFormat = prompts.find(p => p.identifier === DUAL_VAR_FORMAT_ID)?.content ?? '';
  const updateRules = prompts.find(p => p.identifier === VAR_UPDATE_RULES_ID)?.content ?? '';
  const varList = prompts.find(p => p.identifier === VAR_LIST_ID)?.content ?? '';
  const outputFormat = prompts.find(p => p.identifier === VAR_OUTPUT_FORMAT_ID)?.content ?? '';

  const parts: string[] = [];
  if (varFormat) parts.push(varFormat);
  if (updateRules) parts.push(updateRules);
  if (varList) parts.push(varList);
  if (outputFormat) parts.push(outputFormat);

  // Also include any direct preset fields that match var-related identifiers
  for (const id of [DUAL_VAR_FORMAT_ID, VAR_UPDATE_RULES_ID, VAR_LIST_ID, VAR_OUTPUT_FORMAT_ID]) {
    const direct = preset.settings[id];
    if (typeof direct === 'string' && direct.trim()) {
      parts.push(direct);
    }
  }

  // Scan lorebooks matched by the generated maintext and inject their content for secondary API
  if (lorebooks && lorebooks.length > 0) {
    const allMatchedEntries: MatchedEntry[] = [];
    for (const book of lorebooks) {
      const engine = createLorebookEngine(book);
      const matches = engine.recursiveScan(maintext, 3);
      allMatchedEntries.push(...matches);
    }
    const uniqueEntries = Array.from(
      new Map(allMatchedEntries.map(e => [e.entry.id, e])).values()
    ).sort((a, b) => a.score - b.score);
    if (uniqueEntries.length > 0) {
      const worldInfoContent = uniqueEntries.map(e => e.entry.content).join('\n\n');
      if (worldInfoContent) {
        parts.push(`【相关世界书条目】\n${worldInfoContent}`);
      }
    }
  }

  let systemContent = parts.join('\n\n');

  if (variables && Object.keys(variables).length > 0) {
    const varsBlock = formatVariablesForPrompt(variables);
    if (varsBlock) {
      systemContent += (systemContent ? '\n\n' : '') + varsBlock;
    }
  }

  if (formatPrompt) {
    systemContent += (systemContent ? '\n\n' : '') + formatPrompt;
  }

  const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [];

  if (systemContent) {
    messages.push({
      role: 'system',
      content: replaceMacros(systemContent, { userName, characterName, userInput: '' }),
    });
  }

  messages.push({
    role: 'user',
    content: `【刚刚生成的剧情正文】\n${maintext}\n\n请根据上述正文和变量规则，输出更新后的变量。`,
  });

  return messages;
}
