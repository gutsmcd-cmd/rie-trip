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
