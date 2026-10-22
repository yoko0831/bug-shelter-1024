import { useMemo } from 'react';
import type { SharedBug } from '../types';
import { cardFromShared } from '../lib/card';
import BugCardArt from './BugCardArt';

interface Props {
  shared: SharedBug;
  onAdopt: () => void;
  onDismiss: () => void;
}

export default function IncomingCard({ shared, onAdopt, onDismiss }: Props) {
  // 仅用于预览，编号在真正收容时重新生成
  const preview = useMemo(() => cardFromShared(shared, 0), [shared]);

  return (
    <section className="panel incoming">
      <div className="panel-head">
        <h2 className="panel-title">📨 你收到一只 Bug</h2>
        <span className="panel-hint">来自分享链接 · 只读预览</span>
      </div>

      <BugCardArt card={preview} />

      <div className="guide">
        <h3 className="sub-title">驯服指南 · 排查步骤</h3>
        <ol className="steps">
          {preview.guide.steps.map((s, i) => (
            <li key={i}>{s}</li>
          ))}
        </ol>
      </div>

      <div className="actions">
        <button type="button" className="btn btn-primary" onClick={onAdopt}>
          收容到我的图鉴
        </button>
        <button type="button" className="btn btn-ghost" onClick={onDismiss}>
          忽略
        </button>
      </div>
    </section>
  );
}
