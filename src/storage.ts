import type { StayId } from './data';

const PREFIX = 'rie-trip:';

function key(k: string): string {
  return PREFIX + k;
}

export function getConfirmation(stayId: StayId): string {
  return localStorage.getItem(key(`confirm:${stayId}`)) ?? '';
}

export function setConfirmation(stayId: StayId, value: string): void {
  const v = value.trim();
  if (!v) localStorage.removeItem(key(`confirm:${stayId}`));
  else localStorage.setItem(key(`confirm:${stayId}`), v);
}

export function getNotes(): string {
  return localStorage.getItem(key('notes')) ?? '';
}

export function setNotes(value: string): void {
  localStorage.setItem(key('notes'), value);
}

export function getManualStayOverride(): StayId | null {
  const v = localStorage.getItem(key('stayOverride'));
  if (v === 'bcn' || v === 'mad' || v === 'dxb') return v;
  return null;
}

export function setManualStayOverride(id: StayId | null): void {
  if (!id) localStorage.removeItem(key('stayOverride'));
  else localStorage.setItem(key('stayOverride'), id);
}

export interface CustomShortcut {
  id: string;
  name: string;
  url: string;
}

export function getCustomShortcuts(): CustomShortcut[] {
  try {
    const raw = localStorage.getItem(key('shortcuts'));
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter(
        (item): item is CustomShortcut =>
          !!item &&
          typeof item === 'object' &&
          typeof (item as CustomShortcut).id === 'string' &&
          typeof (item as CustomShortcut).name === 'string' &&
          typeof (item as CustomShortcut).url === 'string',
      )
      .map((item) => ({
        id: item.id,
        name: item.name,
        url: item.url,
      }));
  } catch {
    return [];
  }
}

export function setCustomShortcuts(list: CustomShortcut[]): void {
  localStorage.setItem(key('shortcuts'), JSON.stringify(list));
}

export function addCustomShortcut(name: string, url: string): CustomShortcut {
  const list = getCustomShortcuts();
  const item: CustomShortcut = {
    id: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
    name: name.trim(),
    url: url.trim(),
  };
  list.push(item);
  setCustomShortcuts(list);
  return item;
}

export function removeCustomShortcut(id: string): void {
  setCustomShortcuts(getCustomShortcuts().filter((s) => s.id !== id));
}
