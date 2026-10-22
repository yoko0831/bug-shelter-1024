import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import type { BugCard } from '../types';
import BugCardArt from './BugCardArt';

/**
 * 翻牌弹层（赛博朋克版）：
 *  - mode="reveal"：充能(卡背抖动+解密百分比) → 3D 翻转(色差鬼影+光速) → 稀有度故障爆发
 *  - mode="open"  ：图鉴点开，跳过充能直接快速翻转
 * 背景常驻：霓虹网格 + 扫描线 + 上升粒子；翻完后卡面支持鼠标跟随全息倾斜。
 */

type Phase = 'charge' | 'flip' | 'done';

interface Props {
  card: BugCard;
  mode: 'reveal' | 'open';
  onClose: () => void;
  /** 卡面下方的内容（详情、指南、操作按钮） */
  children?: React.ReactNode;
  /** reveal 模式下「已自动保存」之类的角标文案 */
  badge?: string;
}

const TIMING = {
  reveal: { flipAt: 1150, doneAt: 2750 },
  open: { flipAt: 60, doneAt: 1620 },
};

const FX_COLORS = ['#00e5ff', '#ff2ea6', '#b44dff'];

export default function CardModal({ card, mode, onClose, children, badge }: Props) {
  const [phase, setPhase] = useState<Phase>(mode === 'reveal' ? 'charge' : 'flip');
  const [sidebarIn, setSidebarIn] = useState(mode === 'open');
  const [pct, setPct] = useState(mode === 'open' ? 100 : 0);
  const [tilt, setTilt] = useState({ rx: 0, ry: 0, gx: 50, gy: 50 });
  const sceneRef = useRef<HTMLDivElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);

  // 背景上升粒子（负 delay 让它们从半空中开始）
  const particles = useMemo(
    () =>
      Array.from({ length: 18 }, (_, i) => ({
        left: Math.random() * 100,
        size: 2 + Math.random() * 4,
        dur: 5 + Math.random() * 7,
        delay: -Math.random() * 12,
        drift: (Math.random() - 0.5) * 160,
        color: FX_COLORS[i % FX_COLORS.length],
      })),
    [],
  );

  useEffect(() => {
    const t = TIMING[mode];
    // 注意：这里刻意不响应 prefers-reduced-motion —— Windows「关闭动画效果」
    // 会命中该媒体查询，导致翻牌动画被整体跳过；翻牌是核心交互，始终播放。

    const timers: number[] = [];
    let pctTimer = 0;
    if (mode === 'reveal') {
      const startedAt = Date.now();
      pctTimer = window.setInterval(() => {
        const p = Math.min(100, Math.round(((Date.now() - startedAt) / t.flipAt) * 100));
        setPct(p);
      }, 50);
      timers.push(window.setTimeout(() => window.clearInterval(pctTimer), t.flipAt));
      timers.push(window.setTimeout(() => setPhase('flip'), t.flipAt));
    }
    timers.push(window.setTimeout(() => setPhase('done'), t.doneAt));
    timers.push(window.setTimeout(() => setSidebarIn(true), t.doneAt - 900));

    return () => {
      window.clearInterval(pctTimer);
      timers.forEach(window.clearTimeout);
    };
  }, [mode]);

  // 翻完后的全息倾斜：鼠标在卡面移动 → 轻微 3D 追随 + 眩光定位
  const onPointerMove = (e: React.PointerEvent) => {
    if (phase !== 'done') return;
    const el = sceneRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const px = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width));
    const py = Math.min(1, Math.max(0, (e.clientY - r.top) / r.height));
    setTilt({ rx: (0.5 - py) * 14, ry: (px - 0.5) * 18, gx: px * 100, gy: py * 100 });
  };
  const onPointerLeave = () => setTilt({ rx: 0, ry: 0, gx: 50, gy: 50 });

  return createPortal(
    <div
      className={`card-modal-mask mode-${mode} phase-${phase}`}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={`${card.name} · ${card.rarity}`}
    >
      {/* 常驻赛博背景：网格 + 扫描线 + 粒子 */}
      <span className="fx-grid" aria-hidden="true" />
      <span className="fx-scan" aria-hidden="true" />
      {particles.map((p, i) => (
        <span
          key={i}
          className="fx-particle"
          aria-hidden="true"
          style={
            {
              left: `${p.left}%`,
              width: p.size,
              height: p.size,
              '--dur': `${p.dur}s`,
              '--delay': `${p.delay}s`,
              '--drift': `${p.drift}px`,
              '--c': p.color,
            } as React.CSSProperties
          }
        />
      ))}

      <div className="card-modal" onClick={(e) => e.stopPropagation()} ref={bodyRef} tabIndex={-1}>
        <button type="button" className="card-modal-close" onClick={onClose} aria-label="关闭">
          ×
        </button>

        <div className={`card-modal-inner ${sidebarIn ? 'side-in' : ''}`}>
          <div
            className={`flip-scene rarity-${card.rarity}`}
            data-phase={phase}
            ref={sceneRef}
            onPointerMove={onPointerMove}
            onPointerLeave={onPointerLeave}
          >
            {/* HUD 四角框 */}
            <span className="fx-hud tl" aria-hidden="true" />
            <span className="fx-hud tr" aria-hidden="true" />
            <span className="fx-hud bl" aria-hidden="true" />
            <span className="fx-hud br" aria-hidden="true" />

            {/* 翻转时的横向光速 */}
            <span className="fx-streaks" aria-hidden="true">
              <i />
              <i />
              <i />
              <i />
              <i />
            </span>

            {/* 翻转时的红/青色差鬼影 */}
            <span className="fx-ghost g1" aria-hidden="true" />
            <span className="fx-ghost g2" aria-hidden="true" />

            <div
              className="tilt-box"
              style={
                {
                  '--rx': `${tilt.rx}deg`,
                  '--ry': `${tilt.ry}deg`,
                } as React.CSSProperties
              }
            >
              <div className="flip-card">
                <div className="flip-face flip-front">
                  <BugCardArt card={card} />
                  <span
                    className="fx-glare"
                    aria-hidden="true"
                    style={
                      {
                        '--gx': `${tilt.gx}%`,
                        '--gy': `${tilt.gy}%`,
                      } as React.CSSProperties
                    }
                  />
                </div>
                <div className="flip-face flip-reverse" aria-hidden="true">
                  <div className="card-back">
                    <span className="card-back-ring" />
                    <span className="card-back-mark">{'{}'}</span>
                    <span className="card-back-pct">{pct}%</span>
                    <span className="card-back-text">DECRYPTING BUG DATA</span>
                    <span className="card-back-hint">OPENING</span>
                  </div>
                </div>
              </div>
            </div>

            <span className="flip-flash" aria-hidden="true">
              {card.rarity}
            </span>
            <span className="flip-burst" aria-hidden="true" />
            <span className="flip-rays" aria-hidden="true" />
            <span className="fx-flash" aria-hidden="true" />
          </div>

          <div className={`card-modal-side ${sidebarIn ? 'in' : ''}`}>
            {badge ? <div className="card-modal-badge">{badge}</div> : null}
            {children}
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
