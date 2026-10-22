import type { BugCard } from '../types';
import { classifyRootCause } from './templates';
import { RARITY_LABEL } from './rarity';

/** 老数据迁移：补齐根因归类 / 防御建议 */
export function migrateCard(card: BugCard): BugCard {
  const g = card.guide;
  const needFix =
    !g ||
    !Array.isArray(g.steps) ||
    g.steps.length === 0 ||
    !g.review ||
    !Array.isArray(g.vaccines) ||
    !g.rootCategory ||
    !g.defense;
  if (!needFix) return card;

  const { rootCategory, defense } = classifyRootCause(
    card.name,
    Array.isArray(card.keywords) ? card.keywords : [],
    card.habitat,
  );
  return {
    ...card,
    guide: {
      steps: Array.isArray(g?.steps) ? g.steps : [],
      review:
        g?.review ?? { root: '', impact: '', prevention: '' },
      vaccines: Array.isArray(g?.vaccines) ? g.vaccines : [],
      rootCategory: g?.rootCategory || rootCategory,
      defense: g?.defense || defense,
    },
  };
}

function dayKey(ts: number): string {
  const d = new Date(ts);
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}

function statusOf(card: BugCard): string {
  return card.isSample ? '示例' : '已收容 · 待复盘';
}

/** 图鉴一键导出：结构化复盘文档（按日期 / 技术栈分组） */
export function buildCodexReport(cards: BugCard[]): string {
  const list = [...cards].sort((a, b) => b.createdAt - a.createdAt);
  const lines: string[] = [];

  lines.push('# Bug 收容所 · 复盘汇总');
  lines.push('');
  lines.push(`生成时间：${new Date().toLocaleString('zh-CN')}`);
  lines.push(`共收容 ${list.length} 只 Bug`);
  lines.push('');

  // 概览
  const byRarity: Record<string, BugCard[]> = {};
  for (const c of list) (byRarity[c.rarity] ??= []).push(c);
  lines.push('## 一、概览');
  lines.push('');
  lines.push('| 稀有度 | 数量 | 占比 |');
  lines.push('| --- | --- | --- |');
  (['SSR', 'SR', 'R', 'N'] as const).forEach((r) => {
    const n = byRarity[r]?.length ?? 0;
    const pct = list.length ? Math.round((n / list.length) * 100) : 0;
    lines.push(`| ${r}（${RARITY_LABEL[r].split(' · ')[1]}） | ${n} | ${pct}% |`);
  });
  lines.push('');

  // 按日期分组
  lines.push('## 二、按日期');
  lines.push('');
  const byDay = new Map<string, BugCard[]>();
  for (const c of list) {
    const k = dayKey(c.createdAt);
    (byDay.get(k) ?? byDay.set(k, []).get(k)!).push(c);
  }
  [...byDay.entries()]
    .sort((a, b) => (a[0] < b[0] ? 1 : -1))
    .forEach(([day, items]) => {
      lines.push(`### ${day}（${items.length} 只）`);
      lines.push('');
      lines.push('| 编号 | 名称 | 等级 | 根因归类 | 状态 |');
      lines.push('| --- | --- | --- | --- | --- |');
      items.forEach((c) => {
        lines.push(
          `| ${c.cardNo} | ${c.name} | ${c.rarity} | ${c.guide.rootCategory} | ${statusOf(c)} |`,
        );
      });
      lines.push('');
    });

  // 按技术栈分组
  lines.push('## 三、按技术栈');
  lines.push('');
  const byStack = new Map<string, BugCard[]>();
  for (const c of list) {
    const keys = c.stack.length ? c.stack : ['未标注'];
    keys.forEach((s) => {
      (byStack.get(s) ?? byStack.set(s, []).get(s)!).push(c);
    });
  }
  [...byStack.entries()]
    .sort((a, b) => b[1].length - a[1].length)
    .forEach(([stack, items]) => {
      lines.push(`### ${stack}（${items.length} 只）`);
      lines.push('');
      items.forEach((c) => {
        lines.push(`- **${c.name}**（${c.cardNo} · ${c.rarity}）`);
        lines.push(`  - 根因归类：${c.guide.rootCategory}`);
        lines.push(`  - 防御建议：${c.guide.defense}`);
        lines.push(`  - 状态：${statusOf(c)}`);
      });
      lines.push('');
    });

  // 明细
  lines.push('## 四、明细（含复盘三问）');
  lines.push('');
  list.forEach((c) => {
    lines.push(`### ${c.name} · ${c.cardNo}`);
    lines.push('');
    lines.push(`- 栖息地：${c.habitat}${c.isOnline ? '（线上）' : ''} · 技术栈：${c.stack.join('/') || '—'}`);
    lines.push(
      `- 危险 ${c.danger}/5 · 复现 ${c.reproduce}/5 · 影响 ${c.scope}/5 · 驯服 ${c.tamingDifficulty}/5 · 评分 ${c.score}（${c.rarity}）`,
    );
    lines.push(`- 根因归类：${c.guide.rootCategory}`);
    lines.push(`- 防御建议：${c.guide.defense}`);
    lines.push('');
    lines.push('排查步骤：');
    c.guide.steps.forEach((s, i) => lines.push(`${i + 1}. ${s}`));
    lines.push('');
    lines.push('复盘三问：');
    lines.push(`1. ${c.guide.review.root}`);
    lines.push(`2. ${c.guide.review.impact}`);
    lines.push(`3. ${c.guide.review.prevention}`);
    lines.push('');
  });

  lines.push('---');
  lines.push('由「Bug 收容所 · 1024 特别版」本地生成 · WorkBuddy 1024 造物挑战');
  return lines.join('\n');
}
