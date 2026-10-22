import type { BugCard } from '../types';
import { createSampleCards } from './samples';
import { migrateCard } from './docx';

export const STORAGE_KEY = 'bug-shelter-1024-cards';

function isBrowser(): boolean {
  return typeof window !== 'undefined' && !!window.localStorage;
}

function isValidCard(v: unknown): v is BugCard {
  if (!v || typeof v !== 'object') return false;
  const c = v as Partial<BugCard>;
  return typeof c.id === 'string' && typeof c.name === 'string' && typeof c.habitat === 'string';
}

/** 同名卡牌去重：只保留最新的一张，避免示例/重复收容造成刷屏 */
function dedupeByName(cards: BugCard[]): BugCard[] {
  const map = new Map<string, BugCard>();
  for (const c of cards) {
    const key = c.name.trim();
    const prev = map.get(key);
    if (!prev || c.createdAt > prev.createdAt) map.set(key, c);
  }
  return [...map.values()].sort((a, b) => b.createdAt - a.createdAt);
}

/** 读取图鉴；首次打开（无数据）或图鉴为空时自动写入示例卡 */
export function loadCards(): BugCard[] {
  if (!isBrowser()) return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw === null) {
      const samples = createSampleCards();
      saveCards(samples);
      return samples;
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    const list = dedupeByName(parsed.filter(isValidCard)).map(migrateCard);
    // 图鉴被清空时自动恢复一套默认示例，保证首次/评审打开就有内容
    if (list.length === 0) {
      const samples = createSampleCards();
      saveCards(samples);
      return samples;
    }
    return list;
  } catch {
    return [];
  }
}

export function saveCards(cards: BugCard[]): void {
  if (!isBrowser()) return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(cards));
  } catch {
    /* 存储失败（隐私模式 / 配额）时静默降级，不打断主流程 */
  }
}

export function clearCards(): void {
  if (!isBrowser()) return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify([]));
  } catch {
    /* ignore */
  }
}
