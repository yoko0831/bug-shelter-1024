import type { BugCard } from '../types';
import { RARITY_LABEL } from './rarity';

/** 复盘模板：卡牌编号 / 名称 / 栖息地 / 稀有度 / 危险指数 / 驯服难度 / 三步排查 / 复盘三问 / 预防疫苗 */
export function buildReviewTemplate(card: BugCard): string {
  const lines: string[] = [];
  lines.push('# 事故复盘模板 · Bug 收容所 1024');
  lines.push('');
  lines.push(`卡牌编号：${card.cardNo}`);
  lines.push(`Bug 名称：${card.name}`);
  lines.push(`栖息地：${card.habitat}${card.isOnline ? '（线上）' : '（非线上）'}`);
  lines.push(`稀有度：${card.rarity}（${RARITY_LABEL[card.rarity]}） · 战力评分 ${card.score}`);
  lines.push(`危险指数：${card.danger}/5 · 复现难度：${card.reproduce}/5 · 影响范围：${card.scope}/5`);
  lines.push(`驯服难度：${card.tamingDifficulty}/5`);
  if (card.stack.length) lines.push(`技术栈：${card.stack.join(' / ')}`);
  if (card.keywords.length) lines.push(`症状关键词：${card.keywords.join('、')}`);
  if (card.description) lines.push(`补充描述：${card.description}`);
  lines.push('');
  lines.push('## 驯服指南 · 排查步骤');
  card.guide.steps.forEach((s, i) => lines.push(`${i + 1}. ${s}`));
  lines.push('');
  lines.push('## 复盘三问');
  lines.push(`1. 根因：${stripPrefix(card.guide.review.root)}`);
  lines.push(`2. 影响：${stripPrefix(card.guide.review.impact)}`);
  lines.push(`3. 预防：${stripPrefix(card.guide.review.prevention)}`);
  lines.push('');
  lines.push('## 预防疫苗');
  card.guide.vaccines.forEach((v, i) => lines.push(`${i + 1}. ${v}`));
  lines.push('');
  lines.push('---');
  lines.push(`生成时间：${new Date(card.createdAt).toLocaleString('zh-CN')}`);
  lines.push('由「Bug 收容所 · 1024 特别版」本地生成，未上传任何数据。');
  return lines.join('\n');
}

/** 去掉模板里的「根因是什么？—— 」这类引导前缀，只保留问题本体 */
function stripPrefix(text: string): string {
  return text.includes('——') ? text.split('——').slice(1).join('——').trim() : text;
}
