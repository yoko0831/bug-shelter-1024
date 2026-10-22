import type { BugCard } from '../types';
import { RARITY_LABEL } from './rarity';

export const SHARE_W = 1080;
export const SHARE_H = 1440;

const EXPORT_TIMEOUT = 12000;

/** 图片解码后确认真实尺寸，避免导出「被裁一半还显示成功」 */
function probeSize(dataUrl: string): Promise<{ w: number; h: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve({ w: img.naturalWidth, h: img.naturalHeight });
    img.onerror = () => reject(new Error('image decode failed'));
    img.src = dataUrl;
  });
}

/** 渲染分享卡为 dataURL（失败或超时时降级 Canvas 绘制） */
export async function renderSharePng(node: HTMLElement, card: BugCard): Promise<string> {
  // 先把离屏容器按真实内容撑开：容器 height:auto + overflow:visible 时
  // html-to-image 才能量到完整高度，否则会被 1440 的初始高度裁掉底部。
  const stage = node.parentElement;
  const prevStage = stage
    ? { h: stage.style.height, o: stage.style.overflow, w: stage.style.width }
    : null;
  const prevNode = { h: node.style.height, min: node.style.minHeight };
  if (stage) {
    stage.style.width = `${SHARE_W}px`;
    stage.style.height = 'auto';
    stage.style.overflow = 'visible';
  }
  node.style.height = 'auto';
  node.style.minHeight = `${SHARE_H}px`;

  // 强制一次同步布局，拿到完整内容高度
  const contentH = Math.max(SHARE_H, Math.ceil(node.getBoundingClientRect().height), Math.ceil(node.scrollHeight));

  try {
    const { toPng } = await import('html-to-image');
    const rendered = toPng(node, {
      width: SHARE_W,
      height: contentH,
      pixelRatio: 1,
      cacheBust: false,
      skipFonts: true,
      backgroundColor: '#151033',
      style: {
        margin: '0',
        height: `${contentH}px`,
        minHeight: `${contentH}px`,
        overflow: 'visible',
      },
    });
    const timeout = new Promise<never>((_, reject) =>
      window.setTimeout(() => reject(new Error('html-to-image timeout')), EXPORT_TIMEOUT),
    );
    const dataUrl = await Promise.race([rendered, timeout]);
    const { h } = await probeSize(dataUrl);
    // 高度明显不足说明仍被裁切 → 交给 Canvas 兜底
    if (h < contentH - 8) throw new Error(`cropped: ${h} < ${contentH}`);
    return dataUrl;
  } catch {
    /* 依赖失败 / 超时 / 结果被裁 → Canvas 兜底 */
  } finally {
    if (stage && prevStage) {
      stage.style.height = prevStage.h;
      stage.style.overflow = prevStage.o;
      stage.style.width = prevStage.w;
    }
    node.style.height = prevNode.h;
    node.style.minHeight = prevNode.min;
  }
  return drawWithCanvas(card);
}

export type ShareOutcome = 'shared' | 'downloaded' | 'failed';

/** 移动端唤起系统分享，桌面端/不支持时直接下载 */
export async function shareOrDownload(dataUrl: string, card: BugCard): Promise<ShareOutcome> {
  const fileName = `bug-card-${card.cardNo}.png`;
  try {
    const blob = await (await fetch(dataUrl)).blob();
    // 仅移动端唤起系统分享；桌面端 canShare 也会返回 true，但 share() 可能长期挂起
    const isMobile = /Android|iPhone|iPad|iPod|Mobile|HarmonyOS/i.test(navigator.userAgent);
    if (isMobile) {
      const file = new File([blob], fileName, { type: 'image/png' });
      if (navigator.canShare?.({ files: [file] })) {
        try {
          await navigator.share({
            files: [file],
            title: `${card.name} · ${card.rarity}`,
            text: `我在 Bug 收容所收容了「${card.name}」（${card.rarity}）—— Bug 收容所 · 1024 特别版`,
          });
          return 'shared';
        } catch {
          /* 用户取消或分享失败 → 退化为下载 */
        }
      }
    }
    downloadBlob(blob, fileName);
    return 'downloaded';
  } catch {
    try {
      downloadDataUrl(dataUrl, fileName);
      return 'downloaded';
    } catch {
      return 'failed';
    }
  }
}

function downloadBlob(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.setTimeout(() => URL.revokeObjectURL(url), 2000);
}

function downloadDataUrl(dataUrl: string, fileName: string): void {
  const a = document.createElement('a');
  a.href = dataUrl;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

/** Canvas 兜底：完整长图（标题 + 卡牌 + 驯服步骤 + 根因 + 疫苗 + 页脚），高度自适应不裁切 */
function drawWithCanvas(card: BugCard): string {
  const W = SHARE_W;
  const pad = 72;
  const rarityColor = { SSR: '#ffd166', SR: '#b44dff', R: '#4fa8ff', N: '#8b98a5' }[card.rarity];

  // 先用一个测量画布算好总高度
  const probe = document.createElement('canvas').getContext('2d');
  if (!probe) throw new Error('no ctx');

  const bodyFont = '30px -apple-system, "Microsoft YaHei", sans-serif';
  const lineH = 46;
  const contentW = W - pad * 2;

  const measure = (text: string, font: string): number => {
    probe.font = font;
    return countLines(probe, text, contentW) * lineH;
  };

  // 卡牌框高度：名称 + 三行属性 + 吐槽
  const boxPad = 40;
  const nameFont = 'bold 64px -apple-system, "Microsoft YaHei", sans-serif';
  const boxH =
    boxPad * 2 + 70 + 62 + 3 * 44 + 24 + measure(card.roast, bodyFont) + 30;

  let cursor = 230 + boxH + 90;
  const stepH = card.guide.steps.reduce(
    (sum, s, i) => sum + measure(`${i + 1}. ${s}`, bodyFont) + 28,
    0,
  );
  cursor += 80 + stepH + 60;
  cursor += 80 + measure(`${card.guide.rootCategory}：${card.guide.defense}`, bodyFont) + 60;
  const vaccineH = card.guide.vaccines
    .slice(0, 3)
    .reduce((sum, v) => sum + measure(`· ${v}`, bodyFont) + 24, 0);
  cursor += 80 + vaccineH + 60;
  const H = Math.max(SHARE_H, Math.ceil(cursor + 120));

  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('no ctx');

  ctx.fillStyle = '#151033';
  ctx.fillRect(0, 0, W, H);

  // 顶部霓虹条
  ctx.fillStyle = '#00e5ff';
  ctx.fillRect(0, 0, W, 8);

  ctx.font = 'bold 44px -apple-system, "Microsoft YaHei", sans-serif';
  ctx.fillText('Bug 收容所 · 1024 特别版', pad, 130);
  ctx.fillStyle = '#7d8b9a';
  ctx.font = '26px -apple-system, "Microsoft YaHei", sans-serif';
  ctx.fillText('把事故变成卡牌，把复盘变成图鉴', pad, 180);

  // 卡牌框
  ctx.strokeStyle = rarityColor;
  ctx.lineWidth = 4;
  roundRect(ctx, pad, 230, contentW, boxH, 24);
  ctx.stroke();

  ctx.fillStyle = rarityColor;
  ctx.font = nameFont;
  ctx.fillText(card.name.slice(0, 14), pad + boxPad, 230 + boxPad + 56);

  ctx.font = 'bold 32px -apple-system, "Microsoft YaHei", sans-serif';
  ctx.fillText(`${card.rarity} · ${RARITY_LABEL[card.rarity]}`, pad + boxPad, 230 + boxPad + 118);

  ctx.fillStyle = '#e6edf3';
  ctx.font = bodyFont;
  let y = 230 + boxPad + 190;
  ctx.fillText(`${card.cardNo}   栖息地：${card.habitat}${card.isOnline ? ' · 线上' : ''}`, pad + boxPad, y);
  y += 44;
  ctx.fillText(`危险指数 ${card.danger}/5    影响范围 ${card.scope}/5`, pad + boxPad, y);
  y += 44;
  ctx.fillText(`复现难度 ${card.reproduce}/5    驯服难度 ${card.tamingDifficulty}/5`, pad + boxPad, y);
  y += 44;

  ctx.fillStyle = '#9fb0c0';
  wrapText(ctx, `“${card.roast}”`, pad + boxPad, y + 10, contentW - boxPad * 2, lineH);

  // 驯服指南
  let cy = 230 + boxH + 90;
  ctx.fillStyle = '#00e5ff';
  ctx.font = 'bold 36px -apple-system, "Microsoft YaHei", sans-serif';
  ctx.fillText('驯服指南 · 排查步骤', pad, cy);
  cy += 46;
  ctx.fillStyle = '#e6edf3';
  ctx.font = bodyFont;
  card.guide.steps.forEach((s, i) => {
    cy = wrapText(ctx, `${i + 1}. ${s}`, pad, cy, contentW, lineH) + 28;
  });

  // 根因归类
  cy += 30;
  ctx.fillStyle = '#b44dff';
  ctx.font = 'bold 36px -apple-system, "Microsoft YaHei", sans-serif';
  ctx.fillText('根因归类与防御', pad, cy);
  cy += 46;
  ctx.fillStyle = '#c7d5e2';
  ctx.font = bodyFont;
  cy = wrapText(ctx, `${card.guide.rootCategory}：${card.guide.defense}`, pad, cy, contentW, lineH) + 28;

  // 预防疫苗
  cy += 30;
  ctx.fillStyle = '#00e5ff';
  ctx.font = 'bold 36px -apple-system, "Microsoft YaHei", sans-serif';
  ctx.fillText('预防疫苗', pad, cy);
  cy += 46;
  ctx.fillStyle = '#c7d5e2';
  ctx.font = bodyFont;
  card.guide.vaccines.slice(0, 3).forEach((v) => {
    cy = wrapText(ctx, `· ${v}`, pad, cy, contentW, lineH) + 24;
  });

  // 页脚
  ctx.fillStyle = '#00e5ff';
  ctx.fillRect(0, H - 96, W, 4);
  ctx.fillStyle = '#7d8b9a';
  ctx.font = '26px -apple-system, "Microsoft YaHei", sans-serif';
  ctx.fillText('Bug 收容所 · 1024 特别版 · WorkBuddy 1024 造物挑战', pad, H - 44);

  return canvas.toDataURL('image/png');
}

/** 预估文字折行行数 */
function countLines(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): number {
  const chars = [...text];
  let line = '';
  let used = 1;
  for (const ch of chars) {
    const test = line + ch;
    if (ctx.measureText(test).width > maxWidth && line) {
      used += 1;
      line = ch;
    } else {
      line = test;
    }
  }
  return used;
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
): void {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

/** 简单折行（不截断，保证导出内容完整），返回绘制结束后的 y */
function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
): number {
  const chars = [...text];
  let line = '';
  let cur = y;
  for (const ch of chars) {
    const test = line + ch;
    if (ctx.measureText(test).width > maxWidth && line) {
      ctx.fillText(line, x, cur);
      cur += lineHeight;
      line = ch;
    } else {
      line = test;
    }
  }
  if (line) ctx.fillText(line, x, cur);
  return cur;
}
