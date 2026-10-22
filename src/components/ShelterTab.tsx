import { useEffect, useState } from 'react';
import type { BugCard, BugDraft, Habitat } from '../types';
import { HABITAT_OPTIONS, STACK_OPTIONS } from '../types';
import { emptyDraft, presetDraft, PRESET_DRAFTS } from '../lib/samples';
import { calcRarity, calcScore, calcTamingDifficulty } from '../lib/rarity';
import { buildReviewTemplate } from '../lib/review';
import { buildShareUrl } from '../lib/share';
import { copyText } from '../lib/clipboard';
import CardModal from './CardModal';

interface Props {
  result: BugCard | null;
  editing: BugCard | null;
  /** 每次收容递增，用 key 强制重开一次开卡动画（即便同一张卡再收容一次也会播） */
  revealKey: number;
  onCreate: (draft: BugDraft, editingId?: string) => void;
  onCancelEdit: () => void;
  onExport: (card: BugCard) => Promise<void>;
  onEdit: (card: BugCard) => void;
  onReset: () => void;
  toast: (msg: string, tone?: 'ok' | 'warn' | 'err') => void;
}

export default function ShelterTab({
  result,
  editing,
  revealKey,
  onCreate,
  onCancelEdit,
  onExport,
  onEdit,
  onReset,
  toast,
}: Props) {
  const [draft, setDraft] = useState<BugDraft>(emptyDraft);
  const [nameError, setNameError] = useState('');
  const [exporting, setExporting] = useState(false);

  const previewScore = calcScore(draft);
  const previewRarity = calcRarity(previewScore);
  const previewTaming = calcTamingDifficulty(draft.danger, draft.reproduce);

  /* 编辑模式：把卡牌数据回填到表单 */
  useEffect(() => {
    if (!editing) return;
    setDraft({
      name: editing.name,
      stack: [...editing.stack],
      habitat: editing.habitat,
      danger: editing.danger,
      reproduce: editing.reproduce,
      scope: editing.scope,
      isOnline: editing.isOnline,
      keywords: editing.keywords.join('、'),
      description: editing.description,
    });
    setNameError('');
  }, [editing]);

  function toggleStack(s: string) {
    setDraft((d) => ({
      ...d,
      stack: d.stack.includes(s) ? d.stack.filter((x) => x !== s) : [...d.stack, s],
    }));
  }

  function applyPreset(label: string) {
    const p = presetDraft(label);
    if (!p) return;
    // 开始抓新 Bug 时收起上一轮的「收容完成」面板
    onReset();
    setDraft(p);
    setNameError('');
    toast(`已填入「${label}」，可修改后点「收容这只 Bug」`, 'ok');
    window.setTimeout(() => {
      document.getElementById('bug-name')?.focus({ preventScroll: false });
    }, 60);
  }

  function submit() {
    if (!draft.name.trim()) {
      setNameError('给这只 Bug 起个名字吧');
      toast('Bug 名称为必填项', 'warn');
      return;
    }
    setNameError('');
    onCreate(draft, editing?.id);
  }

  async function handleCopyReview() {
    if (!result) return;
    const ok = await copyText(buildReviewTemplate(result));
    toast(ok ? '复盘模板已复制到剪贴板' : '复制失败，请手动选择文本复制', ok ? 'ok' : 'err');
  }

  async function handleCopyLink() {
    if (!result) return;
    const url = buildShareUrl(result);
    const ok = await copyText(url);
    if (ok) {
      try {
        history.replaceState(null, '', `#bug=${url.split('#bug=')[1]}`);
      } catch {
        /* 忽略地址栏同步失败 */
      }
      toast('分享链接已复制（新标签打开即可查看）', 'ok');
    } else {
      toast('复制失败，请手动复制地址栏链接', 'err');
    }
  }

  async function handleExport() {
    if (!result) return;
    setExporting(true);
    await onExport(result);
    setExporting(false);
  }

  return (
    <div className="shelter">
      <section className="panel">
        <div className="panel-head">
          <h2 className="panel-title">收容台</h2>
          <div className="panel-head-side">
            <span className="panel-hint">填一填，把这只 Bug 登记在案</span>
            {editing ? (
              <button type="button" className="btn btn-sm btn-ghost" onClick={onCancelEdit}>
                取消编辑
              </button>
            ) : null}
          </div>
        </div>

        {editing ? (
          <div className="editing-banner">
            正在编辑 <b>{editing.cardNo}</b> · {editing.name} —— 修改后点「保存修改」，编号与收容时间保持不变
          </div>
        ) : null}

        <div className="field">
          <label className="field-label">快速样例</label>
          <div className="preset-row">
            {PRESET_DRAFTS.map((p) => (
              <button
                key={p.label}
                type="button"
                className="preset-btn"
                title={`填入示例：${p.label}`}
                onClick={() => applyPreset(p.label)}
              >
                <span className="preset-emoji" aria-hidden="true">
                  {p.emoji}
                </span>
                {p.label}
              </button>
            ))}
          </div>
          <p className="field-help">点击样例自动填表，内容可随意修改后再收容</p>
        </div>

        <div className="field">
          <label className="field-label" htmlFor="bug-name">
            Bug 名称 <span className="req">*</span>
          </label>
          <input
            id="bug-name"
            className={`input ${nameError ? 'input-error' : ''}`}
            value={draft.name}
            placeholder="例如：午夜空指针"
            onChange={(e) => {
              setDraft({ ...draft, name: e.target.value });
              if (e.target.value.trim()) setNameError('');
            }}
          />
          {nameError ? <p className="err-text">{nameError}</p> : null}
        </div>

        <div className="field">
          <label className="field-label">技术栈（可多选）</label>
          <div className="chips">
            {STACK_OPTIONS.map((s) => (
              <button
                key={s}
                type="button"
                aria-pressed={draft.stack.includes(s)}
                className={`chip chip-btn ${draft.stack.includes(s) ? 'chip-on' : ''}`}
                onClick={() => toggleStack(s)}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        <div className="field">
          <label className="field-label">栖息地</label>
          <div className="chips">
            {HABITAT_OPTIONS.map((h) => (
              <button
                key={h}
                type="button"
                aria-pressed={draft.habitat === h}
                className={`chip chip-btn ${draft.habitat === h ? 'chip-on' : ''}`}
                onClick={() => setDraft({ ...draft, habitat: h as Habitat })}
              >
                {h}
              </button>
            ))}
          </div>
        </div>

        <div className="field-row">
          <RangeField
            label="危险指数"
            value={draft.danger}
            onChange={(v) => setDraft({ ...draft, danger: v })}
          />
          <RangeField
            label="复现难度"
            value={draft.reproduce}
            onChange={(v) => setDraft({ ...draft, reproduce: v })}
          />
          <RangeField
            label="影响范围"
            value={draft.scope}
            onChange={(v) => setDraft({ ...draft, scope: v })}
          />
        </div>

        <div className="field">
          <label className="field-label">是否线上</label>
          <div className="chips">
            <button
              type="button"
              aria-pressed={draft.isOnline}
              className={`chip chip-btn ${draft.isOnline ? 'chip-on' : ''}`}
              onClick={() => setDraft({ ...draft, isOnline: true })}
            >
              是
            </button>
            <button
              type="button"
              aria-pressed={!draft.isOnline}
              className={`chip chip-btn ${!draft.isOnline ? 'chip-on' : ''}`}
              onClick={() => setDraft({ ...draft, isOnline: false })}
            >
              否
            </button>
          </div>
        </div>

        <div className="field">
          <label className="field-label" htmlFor="bug-kw">
            症状关键词（逗号分隔，可选）
          </label>
          <input
            id="bug-kw"
            className="input"
            value={draft.keywords}
            placeholder="例如：undefined, 凌晨, 白屏"
            onChange={(e) => setDraft({ ...draft, keywords: e.target.value })}
          />
          <p className="field-help">关键词会影响「根因归类」，建议填 2-3 个</p>
        </div>

        <div className="field">
          <label className="field-label" htmlFor="bug-desc">
            补充描述（可选）
          </label>
          <textarea
            id="bug-desc"
            className="input textarea"
            rows={3}
            value={draft.description}
            placeholder="简短描述现象即可，请勿粘贴密钥、完整代码或敏感日志"
            onChange={(e) => setDraft({ ...draft, description: e.target.value })}
          />
          <p className="field-help">🔒 隐私优先：内容只保存在你自己的浏览器里</p>
        </div>

        <div className="score-preview">
          <span>
            预估评分 <b>{previewScore}</b>
          </span>
          <span className={`rarity-tag rarity-tag-${previewRarity}`}>{previewRarity}</span>
          <span>驯服难度 {previewTaming}/5</span>
        </div>

        <button type="button" className="btn btn-primary btn-block" onClick={submit}>
          {editing ? '保存修改' : '收容这只 Bug'}
        </button>
      </section>

      {result ? (
        <CardModal
          key={revealKey}
          card={result}
          mode="reveal"
          onClose={onReset}
          badge="已自动保存到我的图鉴"
        >
          <ResultDetails
            card={result}
            exporting={exporting}
            onExport={handleExport}
            onCopyReview={handleCopyReview}
            onCopyLink={handleCopyLink}
            onReset={onReset}
            onEdit={() => onEdit(result)}
          />
        </CardModal>
      ) : null}
    </div>
  );
}

/* ------------------------------------------------------- 收容结果：翻牌层内详情 */

interface ResultDetailsProps {
  card: BugCard;
  exporting: boolean;
  onExport: () => void;
  onCopyReview: () => void;
  onCopyLink: () => void;
  onReset: () => void;
  onEdit: () => void;
}

function ResultDetails({
  card,
  exporting,
  onExport,
  onCopyReview,
  onCopyLink,
  onReset,
  onEdit,
}: ResultDetailsProps) {
  return (
    <div className="reveal-details">
      <div className="reveal-head">
        <span className="ok-dot">●</span>
        <b>收容完成</b>
        <span className="reveal-no">{card.cardNo}</span>
      </div>

      <div className="guide">
        <h3 className="sub-title">根因归类</h3>
        <div className="root-box">
          <span className="root-tag">{card.guide.rootCategory}</span>
          <p>{card.guide.defense}</p>
        </div>
      </div>

      <div className="guide">
        <h3 className="sub-title">驯服指南 · 排查步骤</h3>
        <ol className="steps">
          {card.guide.steps.map((s, i) => (
            <li key={i}>{s}</li>
          ))}
        </ol>
      </div>

      <div className="guide">
        <h3 className="sub-title">复盘三问</h3>
        <div className="review-box">
          <p>
            <b>根因：</b>
            {card.guide.review.root}
          </p>
          <p>
            <b>影响：</b>
            {card.guide.review.impact}
          </p>
          <p>
            <b>预防：</b>
            {card.guide.review.prevention}
          </p>
        </div>
      </div>

      <div className="guide">
        <h3 className="sub-title">预防疫苗</h3>
        <ul className="vaccines">
          {card.guide.vaccines.map((v, i) => (
            <li key={i}>{v}</li>
          ))}
        </ul>
      </div>

      <div className="actions">
        <button type="button" className="btn btn-primary" onClick={onExport} disabled={exporting}>
          {exporting ? '导出中…' : '导出图片'}
        </button>
        <button type="button" className="btn" onClick={onCopyReview}>
          复制复盘模板
        </button>
        <button type="button" className="btn" onClick={onCopyLink}>
          复制分享链接
        </button>
        <button type="button" className="btn btn-ghost" onClick={onEdit}>
          编辑这张卡
        </button>
        <button type="button" className="btn btn-ghost" onClick={onReset}>
          再收容一只
        </button>
      </div>
    </div>
  );
}

function RangeField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="range-field">
      <div className="range-head">
        <span className="field-label">{label}</span>
        <span className="range-value">{value}</span>
      </div>
      <input
        className="range"
        type="range"
        min={1}
        max={5}
        step={1}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        aria-label={label}
      />
      <div className="range-ticks" aria-hidden="true">
        {[1, 2, 3, 4, 5].map((i) => (
          <span key={i} className={i <= value ? 'tick on' : 'tick'} />
        ))}
      </div>
    </div>
  );
}
