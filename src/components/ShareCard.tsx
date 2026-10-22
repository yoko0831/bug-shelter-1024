import { forwardRef } from 'react';
import type { BugCard } from '../types';
import { HABITAT_EMOJI } from '../lib/samples';
import { explainScore, RARITY_LABEL } from '../lib/rarity';

interface Props {
  card: BugCard | null;
}

/** 隐藏的 1080x1440 分享卡，供 html-to-image 导出 */
const ShareCard = forwardRef<HTMLDivElement, Props>(({ card }, ref) => {
  return (
    <div className="share-stage" aria-hidden="true">
      <div className="share-card" ref={ref}>
        {card ? (
          <>
            <div className="share-topbar" />
            <div className="share-title">Bug 收容所 · 1024 特别版</div>
            <div className="share-sub">把事故变成卡牌，把复盘变成图鉴</div>

            <div className={`share-card-box rarity-${card.rarity}`}>
              <div className="share-card-head">
                <span className="share-emoji">{HABITAT_EMOJI[card.habitat] ?? '🐛'}</span>
                <span className={`rarity-tag rarity-tag-${card.rarity}`}>{card.rarity}</span>
                <span className="share-card-no">{card.cardNo}</span>
              </div>
              <div className="share-name">{card.name}</div>
              <div className="share-line">
                栖息地：{card.habitat} · {card.isOnline ? '线上事故 ⚡' : '非线上'}
              </div>
              <div className="share-line">
                危险指数 {card.danger}/5 · 复现难度 {card.reproduce}/5 · 影响范围 {card.scope}/5 ·
                驯服难度 {card.tamingDifficulty}/5
              </div>
              <div className="share-line dim">{RARITY_LABEL[card.rarity]} · 战力评分 {card.score}</div>
              <div className="share-line dim score">{explainScore(card)}</div>
              <div className="share-roast">“{card.roast}”</div>
            </div>

            <div className="share-section-title">驯服指南 · 排查步骤</div>
            <ol className="share-steps">
              {card.guide.steps.map((s, i) => (
                <li key={i}>{s}</li>
              ))}
            </ol>

            <div className="share-section-title">根因归类与防御</div>
            <div className="share-root">
              <span className="share-root-tag">{card.guide.rootCategory}</span>
              <span className="share-defense">{card.guide.defense}</span>
            </div>

            <div className="share-section-title">预防疫苗</div>
            <ul className="share-vaccines">
              {card.guide.vaccines.slice(0, 3).map((v, i) => (
                <li key={i}>{v}</li>
              ))}
            </ul>

            <div className="share-footer">
              Bug 收容所 · 1024 特别版 · WorkBuddy 1024 造物挑战
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
});

ShareCard.displayName = 'ShareCard';
export default ShareCard;
