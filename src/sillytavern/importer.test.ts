import { describe, it, expect } from 'vitest';
import { importMultipleLorebooks, renameLorebook, importPreset } from './importer';
import type { SillyTavernLorebookExport } from './types';

const stub = (name: string): SillyTavernLorebookExport => ({
  name,
  description: '',
  entries: {},
});

describe('importer multi/rename', () => {
  it('returns success and failure lists', () => {
    const results = importMultipleLorebooks([
      { fileName: 'a.json', json: stub('a') },
      { fileName: 'b.json', json: 'broken' as any },
    ]);
    expect(results.successes).toHaveLength(1);
    expect(results.failures).toHaveLength(1);
    expect(results.successes[0].lorebook.name).toBe('a');
    expect(results.failures[0].fileName).toBe('b.json');
  });

  it('renameLorebook replaces only the name', () => {
    const lb = { id: '1', name: 'old', entries: [], createdAt: 0, updatedAt: 0,
                 recursiveScanning: true, caseSensitive: false, matchWholeWords: false };
    const next = renameLorebook(lb, 'new');
    expect(next.name).toBe('new');
    expect(next.id).toBe('1');
    expect(next.updatedAt).toBeGreaterThanOrEqual(lb.updatedAt);
  });

  it('importPreset flattens nested prompt_order', () => {
    const imported = importPreset({
      name: 'Test Preset',
      prompt_order: [
        {
          character_id: 100001,
          order: [
            { identifier: 'main', enabled: true },
            { identifier: 'worldInfoBefore', enabled: true },
          ],
        },
      ],
      prompts: [
        { identifier: 'main', content: 'Hello' },
      ],
    });
    expect(imported.settings.prompt_order).toHaveLength(2);
    expect(imported.settings.prompt_order[0].identifier).toBe('main');
    expect(imported.settings.prompt_order[1].identifier).toBe('worldInfoBefore');
  });

  it('importPreset preserves flat prompt_order', () => {
    const imported = importPreset({
      name: 'Flat Preset',
      prompt_order: [
        { identifier: 'main', enabled: true },
      ],
    });
    expect(imported.settings.prompt_order).toHaveLength(1);
    expect(imported.settings.prompt_order[0].identifier).toBe('main');
  });
});
