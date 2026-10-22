import type { BugCard, BugDraft, BugGuide, Habitat, SharedBug } from '../types';
import { calcRarity, calcScore, calcTamingDifficulty } from './rarity';
import { classifyRootCause, makeGuide, makeRoast } from './templates';

export function uid(): string {
  return `b_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

/** 卡牌编号：BUG-1024- + 4 位递增序号 */
export function makeCardNo(serial: number): string {
  return `BUG-1024-${String(serial).padStart(4, '0')}`;
}

/** 从已有卡牌里推导下一个序号（取历史最大值 + 1，保证递增且不重复） */
export function nextSerial(cards: BugCard[]): number {
  let max = 0;
  for (const c of cards) {
    const m = /BUG-1024-(\d+)/.exec(c.cardNo || '');
    if (m) max = Math.max(max, Number(m[1]));
  }
  return max + 1;
}

export function parseKeywords(raw: string): string[] {
  return raw
    .split(/[,，、;；\s]+/)
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 12);
}

export interface BuildOptions {
  serial: number;
  isSample?: boolean;
  /** 分享链接收容时保留外部传入的 roast / guide */
  preset?: Pick<BugCard, 'score' | 'rarity' | 'tamingDifficulty' | 'roast' | 'guide'>;
  createdAt?: number;
}

/** 由草稿生成完整卡牌 */
export function buildCard(draft: BugDraft, options: BuildOptions): BugCard {
  const score = calcScore(draft);
  const rarity = calcRarity(score);
  const tamingDifficulty = calcTamingDifficulty(draft.danger, draft.reproduce);
  const name = draft.name.trim() || '这只 Bug';
  const keywords = draft.keywords
    .split(/[,，、;；\s]+/)
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 12);

  return {
    id: uid(),
    cardNo: makeCardNo(options.serial),
    createdAt: options.createdAt ?? Date.now(),
    name: draft.name.trim() || '未命名 Bug',
    stack: draft.stack,
    habitat: draft.habitat,
    danger: draft.danger,
    reproduce: draft.reproduce,
    scope: draft.scope,
    isOnline: draft.isOnline,
    keywords,
    description: draft.description.trim(),
    score,
    rarity,
    tamingDifficulty,
    roast: options.preset?.roast ?? makeRoast(name, draft.habitat, rarity),
    guide: options.preset?.guide ?? makeGuide(name, draft.habitat, draft.isOnline, keywords),
    ...(options.isSample ? { isSample: true } : {}),
  };
}

/** 把外部（分享链接）传来的精简数据补成本地图鉴卡牌 */
export function cardFromShared(shared: SharedBug, serial: number): BugCard {
  return {
    id: uid(),
    cardNo: makeCardNo(serial),
    createdAt: Date.now(),
    name: shared.name,
    stack: Array.isArray(shared.stack) ? shared.stack : [],
    habitat: shared.habitat as Habitat,
    danger: clamp1to5(shared.danger),
    reproduce: clamp1to5(shared.reproduce),
    scope: clamp1to5(shared.scope),
    isOnline: !!shared.isOnline,
    keywords: Array.isArray(shared.keywords) ? shared.keywords : [],
    description: shared.description ?? '',
    score: Number(shared.score) || calcScore(shared),
    rarity: shared.rarity ?? calcRarity(Number(shared.score) || calcScore(shared)),
    tamingDifficulty:
      Number(shared.tamingDifficulty) ||
      calcTamingDifficulty(clamp1to5(shared.danger), clamp1to5(shared.reproduce)),
    roast: shared.roast || '这只 Bug 从链接里爬了出来，身份未知。',
    guide: normalizeGuide(shared),
  };
}

/** 分享数据可能来自旧版本或手动构造，缺失字段按规则补齐 */
export function normalizeGuide(shared: SharedBug): BugGuide {
  const g = shared.guide;
  const keywords = Array.isArray(shared.keywords) ? shared.keywords : [];
  const fresh = () => makeGuide(shared.name, shared.habitat, !!shared.isOnline, keywords);

  if (
    !g ||
    !Array.isArray(g.steps) ||
    g.steps.length === 0 ||
    !g.review ||
    typeof g.review.root !== 'string' ||
    !Array.isArray(g.vaccines) ||
    g.vaccines.length === 0
  ) {
    return fresh();
  }

  // 老版本卡牌补齐「根因归类 / 防御建议」
  if (!g.rootCategory || !g.defense) {
    const { rootCategory, defense } = classifyRootCause(shared.name, keywords, shared.habitat);
    return { ...g, rootCategory: g.rootCategory || rootCategory, defense: g.defense || defense };
  }
  return g;
}

function clamp1to5(n: number): number {
  const v = Number(n);
  if (!Number.isFinite(v)) return 3;
  return Math.min(5, Math.max(1, Math.round(v)));
}
