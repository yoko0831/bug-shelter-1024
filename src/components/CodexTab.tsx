import { useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import type { BugCard, Rarity } from '../types';
import BugCardArt from './BugCardArt';
import CardModal from './CardModal';
import { buildReviewTemplate } from '../lib/review';
import { buildCodexReport } from '../lib/docx';
import { copyText } from '../lib/clipboard';

interface Props {
  cards: BugCard[];
  onDelete: (id: string) => void;
  onClear: () => void;
  onGoShelter: () => void;
  onEdit: (card: BugCard) => void;
  onExport: (card: BugCard) => Promise<void>;
  toast: (msg: string, tone?: 'ok' | 'warn' | 'err') => void;
}

type Filter = 'ALL' | Rarity | 'TODAY';

function isToday(ts: number): boolean {
  const d = new Date(ts);
  const now = new Date();
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  );
}

export default function CodexTab({
  cards,
  onDelete,
  onClear,
  onGoShelter,
  onEdit,
  onExport,
  toast,
}: Props) {
  const [filter, setFilter] = useState<Filter>('ALL');
  const [detailId, setDetailId] = useState<string | null>(null);
  const [confirmClear, setConfirmClear] = useState(false);
  const [report, setReport] = useState<string | null>(null);
  const [exportingId, setExportingId] = useState<string | null>(null);

  const stats = useMemo(() => {
    const s: Record<Rarity, number> = { SSR: 0, SR: 0, R: 0, N: 0 };
    let today = 0;
    for (const c of cards) {
      s[c.rarity] = (s[c.rarity] ?? 0) + 1;
      if (isToday(c.createdAt)) today += 1;
    }
    return { ...s, total: cards.length, today };
  }, [cards]);

  const visible = useMemo(() => {
    const list = [...cards].sort((a, b) => b.createdAt - a.createdAt);
    if (filter === 'ALL') return list;
    if (filter === 'TODAY') return list.filter((c) => isToday(c.createdAt));
    return list.filter((c) => c.rarity === filter);
  }, [cards, filter]);

  const statItems: { key: Filter; num: number; label: string; bg: string }[] = [
    { key: 'ALL', num: stats.total, label: '总收容数', bg: 'ALL' },
    { key: 'SSR', num: stats.SSR, label: 'SSR', bg: 'SSR' },
    { key: 'SR', num: stats.SR, label: 'SR', bg: 'SR' },
    { key: 'R', num: stats.R, label: 'R', bg: 'R' },
    { key: 'N', num: stats.N, label: 'N', bg: 'N' },
    { key: 'TODAY', num: stats.today, label: '今日收容', bg: 'NOW' },
  ];

  const detail = cards.find((c) => c.id === detailId) ?? null;

  async function copyReview(card: BugCard) {
    const ok = await copyText(buildReviewTemplate(card));
    toast(ok ? '复盘模板已复制' : '复制失败，请手动复制', ok ? 'ok' : 'err');
  }

  async function exportCardImage(card: BugCard) {
    setExportingId(card.id);
    await onExport(card);
    setExportingId(null);
  }

  function downloadReport() {
    const md = buildCodexReport(cards);
    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `bug-shelter-复盘汇总-${new Date().toISOString().slice(0, 10)}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.setTimeout(() => URL.revokeObjectURL(a.href), 2000);
    toast('复盘文档已下载', 'ok');
  }

  return (
    <div className="codex">
      <section className="panel">
        <div className="panel-head">
          <h2 className="panel-title">我的图鉴</h2>
          <div className="panel-head-side">
            <span className="panel-hint">本地保存 · 仅你可见 · 点击卡片筛选</span>
            <button
              type="button"
              className="btn btn-sm"
              onClick={() => setReport(buildCodexReport(cards))}
              disabled={cards.length === 0}
            >
              导出复盘
            </button>
            <button
              type="button"
              className="btn btn-danger btn-sm"
              onClick={() => setConfirmClear(true)}
              disabled={cards.length === 0}
            >
              清空图鉴
            </button>
          </div>
        </div>

        <div className="stats" role="group" aria-label="收容统计与筛选">
          {statItems.map((it) => (
            <button
              key={it.key}
              type="button"
              aria-pressed={filter === it.key}
              className={`stat stat-btn tone-${it.key} ${filter === it.key ? 'stat-active' : ''}`}
              onClick={() => setFilter(filter === it.key ? 'ALL' : it.key)}
            >
              <span className="stat-bg" aria-hidden="true">
                {it.bg}
              </span>
              <span className="stat-num">{it.num}</span>
              <span className="stat-label">{it.label}</span>
            </button>
          ))}
        </div>

      </section>

      {visible.length === 0 ? (
        <section className="panel empty-state">
          <div className="empty-emoji" aria-hidden="true">
            🫙
          </div>
          <h3>这里还空着</h3>
          <p>
            {cards.length === 0
              ? '去收容台抓第一只 Bug 吧'
              : filter === 'TODAY'
                ? '今天还没收容新的 Bug，继续加油'
                : `当前筛选（${filter}）下没有卡牌`}
          </p>
          {cards.length === 0 ? (
            <button type="button" className="btn btn-primary" onClick={onGoShelter}>
              去收容台
            </button>
          ) : (
            <button type="button" className="btn" onClick={() => setFilter('ALL')}>
              查看全部
            </button>
          )}
        </section>
      ) : (
        <div className="card-grid">
          {visible.map((c) => (
            <div
              key={c.id}
              className="grid-item"
              role="button"
              tabIndex={0}
              onClick={() => setDetailId(c.id)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  setDetailId(c.id);
                }
              }}
            >
              <BugCardArt card={c} compact />
              <button
                type="button"
                className="exp-btn"
                aria-label={`导出 ${c.name} 图片`}
                disabled={exportingId === c.id}
                onClick={(e) => {
                  e.stopPropagation();
                  void exportCardImage(c);
                }}
              >
                {exportingId === c.id ? '导出中…' : '导出图片'}
              </button>
              <button
                type="button"
                className="del-btn"
                aria-label={`删除 ${c.name}`}
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(c.id);
                  toast(
                    cards.length <= 1 ? '图鉴空了，已恢复默认示例卡' : '已从图鉴移除',
                    'ok',
                  );
                }}
              >
                删除
              </button>
            </div>
          ))}
        </div>
      )}
      {report
        ? createPortal(
            <div className="modal-mask" onClick={() => setReport(null)}>
              <div className="modal modal-report" onClick={(e) => e.stopPropagation()}>
                <h3>复盘汇总文档</h3>
                <p>共 {cards.length} 只 Bug，按日期与技术栈分组，可直接贴进周报。</p>
                <textarea className="report-preview" readOnly value={report} />
                <div className="modal-actions">
                  <button type="button" className="btn btn-primary" onClick={downloadReport}>
                    下载 Markdown
                  </button>
                  <button
                    type="button"
                    className="btn"
                    onClick={async () => {
                      const ok = await copyText(report);
                      toast(
                        ok ? '已复制 Markdown，可直接粘贴' : '复制失败，请手动选择复制',
                        ok ? 'ok' : 'err',
                      );
                    }}
                  >
                    复制到剪贴板
                  </button>
                  <button type="button" className="btn btn-ghost" onClick={() => setReport(null)}>
                    关闭
                  </button>
                </div>
              </div>
            </div>,
            document.body,
          )
        : null}

      {confirmClear
        ? createPortal(
            <div className="modal-mask" onClick={() => setConfirmClear(false)}>
              <div className="modal" onClick={(e) => e.stopPropagation()}>
                <h3>确认清空图鉴？</h3>
                <p>将删除全部 {cards.length} 张卡牌，并重新放入一套默认示例卡，此操作不可撤销。</p>
                <div className="modal-actions">
                  <button type="button" className="btn btn-ghost" onClick={() => setConfirmClear(false)}>
                    取消
                  </button>
                  <button
                    type="button"
                    className="btn btn-danger"
                    onClick={() => {
                      onClear();
                      setConfirmClear(false);
                      setDetailId(null);
                      toast('已清空并恢复默认示例卡', 'ok');
                    }}
                  >
                    确认清空
                  </button>
                </div>
              </div>
            </div>,
            document.body,
          )
        : null}

      {detail ? (
        <CardModal
          key={detail.id}
          card={detail}
          mode="open"
          onClose={() => setDetailId(null)}
          badge={`图鉴第 ${cards.findIndex((c) => c.id === detail.id) + 1} 张 · 点击空白处关闭`}
        >
          <div className="detail-meta">
            {detail.keywords.length ? (
              <p>
                <b>症状关键词：</b>
                {detail.keywords.join('、')}
              </p>
            ) : null}
            {detail.description ? (
              <p>
                <b>补充描述：</b>
                {detail.description}
              </p>
            ) : null}
            <p className="dim">
              <b>收容时间：</b>
              {new Date(detail.createdAt).toLocaleString('zh-CN')}
            </p>
          </div>

          <h3 className="sub-title">驯服指南 · 排查步骤</h3>
          <ol className="steps">
            {detail.guide.steps.map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ol>

          <h3 className="sub-title">根因归类</h3>
          <div className="root-box">
            <span className="root-tag">{detail.guide.rootCategory}</span>
            <p>{detail.guide.defense}</p>
          </div>

          <h3 className="sub-title">复盘三问</h3>
          <div className="review-box">
            <p>
              <b>根因：</b>
              {detail.guide.review.root}
            </p>
            <p>
              <b>影响：</b>
              {detail.guide.review.impact}
            </p>
            <p>
              <b>预防：</b>
              {detail.guide.review.prevention}
            </p>
          </div>

          <h3 className="sub-title">预防疫苗</h3>
          <ul className="vaccines">
            {detail.guide.vaccines.map((v, i) => (
              <li key={i}>{v}</li>
            ))}
          </ul>

          <div className="modal-actions">
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => {
                void exportCardImage(detail);
              }}
              disabled={exportingId === detail.id}
            >
              {exportingId === detail.id ? '导出中…' : '导出图片'}
            </button>
            <button type="button" className="btn" onClick={() => copyReview(detail)}>
              复制复盘模板
            </button>
            <button
              type="button"
              className="btn"
              onClick={() => {
                onEdit(detail);
                setDetailId(null);
              }}
            >
              编辑这张卡
            </button>
            <button
              type="button"
              className="btn btn-danger"
              onClick={() => {
                onDelete(detail.id);
                setDetailId(null);
                toast(cards.length <= 1 ? '图鉴空了，已恢复默认示例卡' : '已从图鉴移除', 'ok');
              }}
            >
              删除这张卡
            </button>
            <button type="button" className="btn btn-ghost" onClick={() => setDetailId(null)}>
              关闭
            </button>
          </div>
        </CardModal>
      ) : null}
    </div>
  );
}
