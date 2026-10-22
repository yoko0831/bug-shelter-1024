import type { BugCard, SharedBug } from '../types';

const HASH_PREFIX = '#bug=';

/** 只保留必要字段，不含 id / createdAt / cardNo */
export function toShared(card: BugCard): SharedBug {
  return {
    name: card.name,
    stack: card.stack,
    habitat: card.habitat,
    danger: card.danger,
    reproduce: card.reproduce,
    scope: card.scope,
    isOnline: card.isOnline,
    keywords: card.keywords,
    description: card.description,
    score: card.score,
    rarity: card.rarity,
    tamingDifficulty: card.tamingDifficulty,
    roast: card.roast,
    guide: card.guide,
  };
}

/** JSON → encodeURIComponent → btoa */
export function encodeShared(shared: SharedBug): string {
  const json = JSON.stringify(shared);
  return btoa(encodeURIComponent(json));
}

export function buildShareUrl(card: BugCard): string {
  const payload = encodeShared(toShared(card));
  const { origin, pathname, search } = window.location;
  return `${origin}${pathname}${search}${HASH_PREFIX}${payload}`;
}

export type DecodeResult =
  | { ok: true; data: SharedBug }
  | { ok: false; reason: 'empty' | 'invalid' };

/** btoa 逆过程：atob → decodeURIComponent → JSON.parse */
export function decodeShared(payload: string): DecodeResult {
  try {
    const json = decodeURIComponent(atob(payload));
    const parsed = JSON.parse(json) as Partial<SharedBug>;
    if (!parsed || typeof parsed !== 'object') return { ok: false, reason: 'invalid' };
    if (typeof parsed.name !== 'string' || !parsed.name.trim()) {
      return { ok: false, reason: 'invalid' };
    }
    return { ok: true, data: parsed as SharedBug };
  } catch {
    return { ok: false, reason: 'invalid' };
  }
}

/** 从 location.hash 解析 #bug=... */
export function readSharedFromHash(): DecodeResult {
  if (typeof window === 'undefined') return { ok: false, reason: 'empty' };
  const hash = window.location.hash || '';
  if (!hash.startsWith(HASH_PREFIX)) return { ok: false, reason: 'empty' };
  const payload = hash.slice(HASH_PREFIX.length).trim();
  if (!payload) return { ok: false, reason: 'empty' };
  return decodeShared(payload);
}

export function clearShareHash(): void {
  if (typeof window === 'undefined') return;
  try {
    history.replaceState(null, '', window.location.pathname + window.location.search);
  } catch {
    window.location.hash = '';
  }
}
