import type { VarsPatch } from './types';

export function parseVarsBlock(raw: string): VarsPatch {
  const trimmed = raw.trim();
  if (!trimmed) return { merge: {} };

  // Try to extract JSONPatch from <UpdateVariable> format
  const jsonPatchMatch = trimmed.match(/<JSONPatch>([\s\S]*?)<\/JSONPatch>/i);
  if (jsonPatchMatch) {
    try {
      const patch = JSON.parse(jsonPatchMatch[1].trim());
      if (Array.isArray(patch)) {
        return { merge: {}, patch };
      }
    } catch { /* fall through */ }
  }

  // Fallback: try direct JSON parse (legacy <vars> format)
  try {
    const parsed = JSON.parse(trimmed);
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      return { merge: parsed as Record<string, any> };
    }
  } catch { /* fall through */ }

  return { merge: {} };
}

function getPath(obj: Record<string, any>, path: string): any {
  const keys = path.split('/').filter(Boolean);
  let curr = obj;
  for (const key of keys) {
    if (curr === undefined || curr === null) return undefined;
    curr = curr[key];
  }
  return curr;
}

function setPath(obj: Record<string, any>, path: string, value: any): void {
  const keys = path.split('/').filter(Boolean);
  let curr = obj;
  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i];
    if (!(key in curr) || typeof curr[key] !== 'object' || Array.isArray(curr[key])) {
      curr[key] = {};
    }
    curr = curr[key];
  }
  curr[keys[keys.length - 1]] = value;
}

function removePath(obj: Record<string, any>, path: string): void {
  const keys = path.split('/').filter(Boolean);
  let curr = obj;
  for (let i = 0; i < keys.length - 1; i++) {
    curr = curr[keys[i]];
    if (!curr) return;
  }
  delete curr[keys[keys.length - 1]];
}

function deepClone(obj: any): any {
  if (obj === null || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(deepClone);
  const out: Record<string, any> = {};
  for (const key of Object.keys(obj)) {
    out[key] = deepClone(obj[key]);
  }
  return out;
}

function applyJsonPatch(target: Record<string, any>, patch: any[]): Record<string, any> {
  const result = deepClone(target);
  for (const op of patch) {
    if (!op || typeof op !== 'object') continue;
    switch (op.op) {
      case 'replace':
      case 'insert': // insert behaves like replace/add
        if (op.path !== undefined) {
          setPath(result, op.path, op.value);
        }
        break;
      case 'delta': {
        if (op.path !== undefined) {
          const current = Number(getPath(result, op.path)) || 0;
          const delta = Number(op.value) || 0;
          setPath(result, op.path, current + delta);
        }
        break;
      }
      case 'remove':
        if (op.path !== undefined) {
          removePath(result, op.path);
        }
        break;
      case 'move':
        if (op.from !== undefined && op.path !== undefined) {
          const val = getPath(result, op.from);
          removePath(result, op.from);
          setPath(result, op.path, val);
        }
        break;
      case 'add': // standard JSON Patch add
        if (op.path !== undefined) {
          setPath(result, op.path, op.value);
        }
        break;
    }
  }
  return result;
}

function expandFlatKeys(obj: Record<string, any>): Record<string, any> {
  const flatExpanded: Record<string, any> = {};
  const nested: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (key.includes('.')) {
      const parts = key.split('.');
      let current = flatExpanded;
      for (let i = 0; i < parts.length - 1; i++) {
        if (!(parts[i] in current) || typeof current[parts[i]] !== 'object' || Array.isArray(current[parts[i]])) {
          current[parts[i]] = {};
        }
        current = current[parts[i]];
      }
      current[parts[parts.length - 1]] = value;
    } else {
      nested[key] = value;
    }
  }
  // Merge nested keys on top of flat-expanded keys so explicit nested objects win conflicts
  return deepMerge(flatExpanded, nested);
}

export function applyVarsPatch(
  existing: Record<string, any>,
  patch: VarsPatch,
): Record<string, any> {
  if (patch.patch && Array.isArray(patch.patch)) {
    return applyJsonPatch(existing, patch.patch);
  }
  const expandedMerge = expandFlatKeys(patch.merge || {});
  return deepMerge(existing, expandedMerge);
}

function deepMerge(target: Record<string, any>, source: Record<string, any>): Record<string, any> {
  const out: Record<string, any> = { ...target };
  for (const key of Object.keys(source)) {
    const sv = source[key];
    const tv = out[key];
    if (Array.isArray(sv)) {
      out[key] = [...sv];
    } else if (sv && typeof sv === 'object' && tv && typeof tv === 'object' && !Array.isArray(tv)) {
      out[key] = deepMerge(tv, sv);
    } else {
      out[key] = sv;
    }
  }
  return out;
}
