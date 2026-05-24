import { describe, it, expect } from 'vitest';
import { assemblePrompt } from './prompt-assembler';

describe('assemblePrompt formatPrompt injection', () => {
  it('injects formatPrompt as a system message', () => {
    const out = assemblePrompt({
      userInput: 'hi',
      history: [],
      preset: { id: 'p', name: 'p', settings: {}, createdAt: 0, updatedAt: 0 },
      lorebooks: [],
      userName: 'Alice',
      characterName: 'Bob',
      formatPrompt: 'FORMAT_INSTRUCTIONS_HERE',
      extraVariables: { hp: 100 },
    });
    const sysJoined = out.messages.filter(m => m.role === 'system').map(m => m.content).join('\n');
    expect(sysJoined).toContain('FORMAT_INSTRUCTIONS_HERE');
  });

  it('exposes extraVariables in system context', () => {
    const out = assemblePrompt({
      userInput: 'hi',
      history: [],
      preset: { id: 'p', name: 'p', settings: {}, createdAt: 0, updatedAt: 0 },
      lorebooks: [],
      userName: 'Alice',
      characterName: 'Bob',
      extraVariables: { hp: 42 },
    });
    const sysJoined = out.messages.filter(m => m.role === 'system').map(m => m.content).join('\n');
    expect(sysJoined).toMatch(/42/);
  });

  it('handles nested SillyTavern prompt_order format', () => {
    const out = assemblePrompt({
      userInput: 'hello',
      history: [],
      preset: {
        id: 'p',
        name: 'p',
        settings: {
          prompt_order: [
            {
              character_id: 100001,
              order: [
                { identifier: 'main', enabled: true },
                { identifier: 'worldInfoBefore', enabled: true },
                { identifier: 'chatHistory', enabled: true },
              ],
            },
          ],
          prompts: [
            { identifier: 'main', role: 'system', content: 'MAIN_PROMPT_TEXT' },
          ],
        },
        createdAt: 0,
        updatedAt: 0,
      },
      lorebooks: [],
      userName: 'Alice',
      characterName: 'Bob',
    });
    const sysJoined = out.messages.filter(m => m.role === 'system').map(m => m.content).join('\n');
    expect(sysJoined).toContain('MAIN_PROMPT_TEXT');
  });

  it('injects worldInfoBefore content when lorebooks match', () => {
    const out = assemblePrompt({
      userInput: 'test keyword',
      history: [],
      preset: {
        id: 'p',
        name: 'p',
        settings: {
          prompt_order: [
            {
              character_id: 100001,
              order: [
                { identifier: 'worldInfoBefore', enabled: true },
                { identifier: 'chatHistory', enabled: true },
              ],
            },
          ],
        },
        createdAt: 0,
        updatedAt: 0,
      },
      lorebooks: [
        {
          id: 'lb1',
          name: 'Test Book',
          entries: [
            {
              id: 'e1',
              keys: ['keyword'],
              secondaryKeys: [],
              content: 'LOREBOOK_ENTRY_CONTENT',
              order: 0,
              position: 'before_char',
              selective: false,
              selectiveLogic: 'and_any',
              constant: false,
              probability: 100,
              addMemo: false,
            },
          ],
          recursiveScanning: false,
          caseSensitive: false,
          matchWholeWords: false,
          createdAt: 0,
          updatedAt: 0,
        },
      ],
      userName: 'Alice',
      characterName: 'Bob',
    });
    const sysJoined = out.messages.filter(m => m.role === 'system').map(m => m.content).join('\n');
    expect(sysJoined).toContain('LOREBOOK_ENTRY_CONTENT');
  });
});
