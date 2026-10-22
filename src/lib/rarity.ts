import type { Habitat, Rarity } from '../types';

/**
 * score = danger*12 + scope*10 + reproduce*6 + (isOnline?10:0) + (habitat==='玄学'?8:0)
 */
export function calcScore(input: {
  danger: number;
  scope: number;
  reproduce: number;
  isOnline: boolean;
  habitat: Habitat;
}): number {
  return (
    input.danger * 12 +
    input.scope * 10 +
    input.reproduce * 6 +
    (input.isOnline ? 10 : 0) +
    (input.habitat === '玄学' ? 8 : 0)
  );
}

export function calcRarity(score: number): Rarity {
  if (score >= 120) return 'SSR';
  if (score >= 95) return 'SR';
  if (score >= 65) return 'R';
  return 'N';
}

export function calcTamingDifficulty(danger: number, reproduce: number): number {
  return Math.min(5, Math.ceil((danger + reproduce) / 2));
}

/** 评分规则透明化：把 SSR 的来历写成一行公式 */
export function explainScore(card: {
  danger: number;
  scope: number;
  reproduce: number;
  isOnline: boolean;
  habitat: Habitat;
  score: number;
  rarity: Rarity;
}): string {
  const parts = [
    `危险 ${card.danger}×12`,
    `影响 ${card.scope}×10`,
    `复现 ${card.reproduce}×6`,
  ];
  if (card.isOnline) parts.push('线上 +10');
  if (card.habitat === '玄学') parts.push('玄学 +8');
  return `${parts.join(' + ')} = ${card.score} → ${card.rarity}`;
}

export const RARITY_ORDER: Rarity[] = ['SSR', 'SR', 'R', 'N'];

export const RARITY_LABEL: Record<Rarity, string> = {
  SSR: 'SSR · 传说级事故',
  SR: 'SR · 严重事故',
  R: 'R · 常规事故',
  N: 'N · 小麻烦',
};
