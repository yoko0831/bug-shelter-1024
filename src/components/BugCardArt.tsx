import type { BugCard } from '../types';
import { explainScore, RARITY_LABEL } from '../lib/rarity';
import HabitatArt from './HabitatArt';

interface Props {
  card: BugCard;
  /** 紧凑模式用于图鉴网格 */
  compact?: boolean;
}

function Meter({ label, value }: { label: string; value: number }) {
  return (
    <div className="meter">
      <span className="meter-label">{label}</span>
      <span className="meter-bars" aria-label={`${label} ${value} / 5`}>
        {[1, 2, 3, 4, 5].map((i) => (
          <i key={i} className={`meter-bar ${i <= value ? 'on' : ''}`} />
        ))}
      </span>
      <span className="meter-value">{value}</span>
    </div>
  );
}

export default function BugCardArt({ card, compact = false }: Props) {
  return (
    <article className={`bug-card rarity-${card.rarity} ${compact ? 'bug-card-compact' : ''}`}>
      <span className="corner corner-tl" aria-hidden="true" />
      <span className="corner corner-tr" aria-hidden="true" />
      <span className="corner corner-bl" aria-hidden="true" />
      <span className="corner corner-br" aria-hidden="true" />
      <div className="card-glow" aria-hidden="true" />
      <div className="card-scan" aria-hidden="true" />
      {card.rarity === 'SSR' || card.rarity === 'SR' ? (
        <div className="card-holo" aria-hidden="true" />
      ) : null}
      <div className="card-watermark" aria-hidden="true">
        {card.rarity}
      </div>
      <div className="card-shine" aria-hidden="true" />

      <div className="card-hero">
        <div className="card-head">
          <span className="card-emoji" role="img" aria-label={card.habitat}>
            {habitatEmoji(card.habitat)}
          </span>
          <div className="card-head-text">
            <span className={`rarity-tag rarity-tag-${card.rarity}`}>{card.rarity}</span>
            <span className="card-no">{card.cardNo}</span>
            {card.isSample ? <span className="sample-badge">示例</span> : null}
          </div>
        </div>
        <HabitatArt habitat={card.habitat} />
      </div>

      <h3 className="card-name">{card.name}</h3>

      <div className="card-meta">
        <span className="chip chip-habitat">{card.habitat}</span>
        {card.isOnline ? (
          <span className="chip chip-online">线上 ⚡</span>
        ) : (
          <span className="chip">非线上</span>
        )}
        {card.stack.slice(0, compact ? 3 : 10).map((s) => (
          <span key={s} className="chip chip-stack">
            {s}
          </span>
        ))}
      </div>

      <div className="card-meters">
        <Meter label="危险指数" value={card.danger} />
        <Meter label="驯服难度" value={card.tamingDifficulty} />
        {!compact && <Meter label="复现难度" value={card.reproduce} />}
        {!compact && <Meter label="影响范围" value={card.scope} />}
      </div>

      <p className="card-roast">“{card.roast}”</p>

      <div className="card-score-note" title={explainScore(card)}>
        {explainScore(card)}
      </div>

      {!compact && (
        <div className="card-foot">
          <span>{RARITY_LABEL[card.rarity]}</span>
          <span>战力评分 {card.score}</span>
        </div>
      )}
    </article>
  );
}

function habitatEmoji(habitat: BugCard['habitat']): string {
  const map: Record<string, string> = {
    前端: '🖥️',
    后端: '⚙️',
    数据库: '🗄️',
    网络: '🌐',
    '构建/依赖': '📦',
    玄学: '🔮',
  };
  return map[habitat] ?? '🐛';
}
