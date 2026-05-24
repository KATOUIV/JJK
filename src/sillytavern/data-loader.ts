/**
 * User Data Loader - Loads SillyTavern character card, lorebook, preset, and initial variables
 */

import type { Lorebook, ChatPreset, AppSettings } from './types';
import { importLorebook, importPreset } from './importer';

export interface UserDataBundle {
  characterName: string;
  characterDescription: string;
  characterPersonality: string;
  scenario: string;
  firstMessage: string;
  alternateGreetings: string[];
  lorebook: Lorebook;
  preset: ChatPreset;
  initialVariables: Record<string, any>;
}

export async function loadUserData(): Promise<UserDataBundle | null> {
  try {
    const [charRes, lbRes, presetRes, varsRes] = await Promise.all([
      fetch('/character.json'),
      fetch('/lorebook.json'),
      fetch('/preset.json'),
      fetch('/initial-vars.yaml'),
    ]);

    if (!charRes.ok || !lbRes.ok || !presetRes.ok) {
      console.warn('[DataLoader] Some user data files missing');
      return null;
    }

    const charJson = await charRes.json();
    const lbJson = await lbRes.json();
    const presetJson = await presetRes.json();
    const varsText = varsRes.ok ? await varsRes.text() : '';

    // Parse character card (v3 format)
    const data = charJson.data || charJson;
    const characterName = data.name || '宿傩';
    const characterDescription = data.description || '';
    const characterPersonality = data.personality || '';
    const scenario = data.scenario || '';
    const firstMessage = data.first_mes || '';
    const alternateGreetings = data.alternate_greetings || [];

    // Import lorebook
    const lorebookBase = importLorebook(lbJson);
    const lorebook: Lorebook = {
      ...lorebookBase,
      id: crypto.randomUUID(),
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    // Import preset and merge character data into preset settings
    const presetBase = importPreset(presetJson);
    const preset: ChatPreset = {
      ...presetBase,
      id: crypto.randomUUID(),
      createdAt: Date.now(),
      updatedAt: Date.now(),
      settings: {
        ...presetBase.settings,
        character_description: characterDescription,
        character_personality: characterPersonality,
        scenario: scenario,
        first_message: firstMessage,
        character_name: characterName,
        // Ensure prompt_order includes charDescription if not present
        prompt_order: ensurePromptOrder(presetBase.settings.prompt_order || []),
      },
    };

    // Parse initial variables from YAML-like text
    const initialVariables = parseInitialVariables(varsText);

    return {
      characterName,
      characterDescription,
      characterPersonality,
      scenario,
      firstMessage,
      alternateGreetings,
      lorebook,
      preset,
      initialVariables,
    };
  } catch (e) {
    console.error('[DataLoader] Failed to load user data:', e);
    return null;
  }
}

function ensurePromptOrder(order: any[]): any[] {
  const required = [
    { identifier: 'main', name: 'Main Prompt', role: 'system' },
    { identifier: 'worldInfoBefore', name: 'World Info (Before)', role: 'system' },
    { identifier: 'charDescription', name: 'Character Description', role: 'system' },
    { identifier: 'charPersonality', name: 'Character Personality', role: 'system' },
    { identifier: 'scenario', name: 'Scenario', role: 'system' },
    { identifier: 'personaDescription', name: 'Persona Description', role: 'system' },
    { identifier: 'dialogueExamples', name: 'Dialogue Examples', role: 'system' },
    { identifier: 'chatHistory', name: 'Chat History', role: 'system' },
    { identifier: 'worldInfoAfter', name: 'World Info (After)', role: 'system' },
    { identifier: 'groupNudge', name: 'Group Nudge', role: 'system' },
  ];

  const existingIds = new Set(order.map((o) => o.identifier));
  const merged = [...order];

  for (const item of required) {
    if (!existingIds.has(item.identifier)) {
      merged.push({ ...item, enabled: true });
    }
  }

  return merged;
}

function parseInitialVariables(text: string): Record<string, any> {
  try {
    // Simple YAML-to-object parser for the user's variable format
    const lines = text.split('\n');
    const result: Record<string, any> = {};
    let currentSection: string | null = null;
    let currentSubSection: string | null = null;
    let indentStack: { obj: any; key: string | null; indent: number }[] = [];

    for (const rawLine of lines) {
      const line = rawLine.trimEnd();
      if (!line.trim() || line.trim().startsWith('#')) continue;

      const indent = line.length - line.trimStart().length;
      const trimmed = line.trim();

      if (trimmed.endsWith(':') && !trimmed.includes(': ')) {
        // Section header
        const key = trimmed.slice(0, -1);
        if (indent === 0) {
          result[key] = {};
          currentSection = key;
          currentSubSection = null;
          indentStack = [{ obj: result, key: null, indent: -1 }, { obj: result[key], key, indent: 0 }];
        } else if (currentSection) {
          const parent = findParentAtIndent(indentStack, indent);
          parent.obj[key] = {};
          currentSubSection = key;
          pushIndent(indentStack, parent.obj[key], key, indent);
        }
      } else if (trimmed.includes(': ')) {
        const colonIdx = trimmed.indexOf(': ');
        const key = trimmed.slice(0, colonIdx);
        let value: any = trimmed.slice(colonIdx + 2).trim();

        // Try parse as number, boolean, array, or object
        if (value === 'true') value = true;
        else if (value === 'false') value = false;
        else if (value === '{}') value = {};
        else if (value === '[]') value = [];
        else if (!isNaN(Number(value)) && value !== '') value = Number(value);
        else if (value.startsWith('[') && value.endsWith(']')) {
          try { value = JSON.parse(value); } catch { /* keep string */ }
        }

        if (indent === 0) {
          result[key] = value;
          currentSection = key;
        } else if (indentStack.length > 0) {
          const parent = findParentAtIndent(indentStack, indent);
          parent.obj[key] = value;
        }
      } else if (trimmed.startsWith('- ')) {
        const value = trimmed.slice(2).trim();
        const parent = findParentAtIndent(indentStack, indent);
        if (Array.isArray(parent.obj)) {
          parent.obj.push(value);
        } else if (Object.keys(parent.obj).length === 0) {
          // Convert empty object placeholder to array
          const top = indentStack[indentStack.length - 1];
          if (top && top.obj === parent.obj && top.key !== null && indentStack.length >= 2) {
            const grandparent = indentStack[indentStack.length - 2];
            grandparent.obj[top.key] = [value];
            top.obj = grandparent.obj[top.key];
          } else {
            parent.obj = [value];
          }
        } else {
          // Parent is a non-empty object, can't append array item here
          continue;
        }
      }
    }

    return result;
  } catch (e) {
    console.error('[DataLoader] Failed to parse initial variables:', e);
    return {};
  }
}

function findParentAtIndent(stack: { obj: any; key: string | null; indent: number }[], indent: number) {
  while (stack.length > 1 && stack[stack.length - 1].indent >= indent) {
    stack.pop();
  }
  return stack[stack.length - 1];
}

function pushIndent(stack: { obj: any; key: string | null; indent: number }[], obj: any, key: string | null, indent: number) {
  while (stack.length > 1 && stack[stack.length - 1].indent >= indent) {
    stack.pop();
  }
  stack.push({ obj, key, indent });
}
