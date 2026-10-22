import type { Habitat } from '../types';

/**
 * 栖息地场景插画：纯 SVG + CSS 动画的霓虹终端风图形
 * 颜色跟随卡牌稀有度主色（CSS 变量 --card-color）
 */
export default function HabitatArt({ habitat }: { habitat: Habitat }) {
  return (
    <svg className="habitat-art" viewBox="0 0 200 120" aria-hidden="true">
      {habitat === '前端' && <FrontendArt />}
      {habitat === '后端' && <BackendArt />}
      {habitat === '数据库' && <DatabaseArt />}
      {habitat === '网络' && <NetworkArt />}
      {habitat === '构建/依赖' && <BuildArt />}
      {habitat === '玄学' && <MysticArt />}
    </svg>
  );
}

/* ---------------- 前端：浏览器窗口 + 故障闪烁 ---------------- */
function FrontendArt() {
  return (
    <g>
      <rect x="18" y="16" width="164" height="92" rx="9" className="ha-frame" />
      <line x1="18" y1="38" x2="182" y2="38" className="ha-frame" />
      <circle cx="32" cy="27" r="3.4" fill="#ff5c7a" />
      <circle cx="44" cy="27" r="3.4" fill="#ffd166" />
      <circle cx="56" cy="27" r="3.4" fill="#00e5ff" />
      {/* 故障内容条 */}
      <rect x="32" y="50" width="76" height="9" rx="2" className="ha-bar ha-glitch-a" />
      <rect x="32" y="66" width="112" height="9" rx="2" className="ha-bar ha-glitch-b" />
      <rect x="32" y="82" width="54" height="9" rx="2" className="ha-bar" />
      {/* 电流裂纹 */}
      <polyline
        points="142,44 128,60 146,64 130,84 150,80"
        className="ha-crack"
        fill="none"
      />
      <text x="150" y="102" className="ha-text ha-blink-slow">
        ERROR
      </text>
    </g>
  );
}

/* ---------------- 后端：机架服务器 + 指示灯 ---------------- */
function BackendArt() {
  return (
    <g>
      {[14, 48, 82].map((y, row) => (
        <g key={row}>
          <rect x="36" y={y} width="128" height="26" rx="5" className="ha-frame" />
          <circle cx="50" cy={y + 13} r="3.6" className="ha-led" style={{ animationDelay: `${row * 0.5}s` }} />
          <circle
            cx="62"
            cy={y + 13}
            r="3.6"
            fill="#ff5c7a"
            className="ha-led ha-led-warn"
            style={{ animationDelay: `${row * 0.5 + 0.25}s` }}
          />
          <line x1="78" y1={y + 9} x2="152" y2={y + 9} className="ha-slot" />
          <line x1="78" y1={y + 17} x2="132" y2={y + 17} className="ha-slot" />
        </g>
      ))}
      {/* 散热波纹 */}
      <path d="M172 20 q6 8 0 16" className="ha-wave" fill="none" />
      <path d="M180 24 q6 8 0 16" className="ha-wave ha-dim" fill="none" />
    </g>
  );
}

/* ---------------- 数据库：存储罐 + 悬浮磁盘 ---------------- */
function DatabaseArt() {
  return (
    <g>
      <ellipse cx="96" cy="26" rx="54" ry="15" className="ha-fill-soft" />
      <ellipse cx="96" cy="26" rx="54" ry="15" className="ha-frame" />
      <path d="M42 26 v58 a54 15 0 0 0 108 0 v-58" className="ha-frame" fill="none" />
      <path d="M42 49 a54 15 0 0 0 108 0" className="ha-frame ha-dim" fill="none" />
      <path d="M42 71 a54 15 0 0 0 108 0" className="ha-frame ha-dim" fill="none" />
      {/* 悬浮磁盘片 */}
      <g className="ha-float">
        <ellipse cx="168" cy="34" rx="14" ry="5" className="ha-frame" fill="none" />
        <ellipse cx="168" cy="31" rx="14" ry="5" className="ha-fill-soft" />
      </g>
      <g className="ha-float ha-float-late">
        <ellipse cx="26" cy="62" rx="12" ry="4.5" className="ha-frame" fill="none" />
        <ellipse cx="26" cy="59.5" rx="12" ry="4.5" className="ha-fill-soft" />
      </g>
      <text x="96" y="52" className="ha-text ha-text-center">
        SQL
      </text>
    </g>
  );
}

/* ---------------- 网络：星球 + 数据链路 ---------------- */
function NetworkArt() {
  return (
    <g>
      <circle cx="100" cy="60" r="44" className="ha-frame" fill="none" />
      <ellipse cx="100" cy="60" rx="44" ry="16" className="ha-frame ha-dim" fill="none" />
      <ellipse cx="100" cy="60" rx="16" ry="44" className="ha-frame ha-dim" fill="none" />
      <line x1="56" y1="60" x2="144" y2="60" className="ha-frame ha-dim" />
      {/* 链路节点 */}
      <line x1="30" y1="26" x2="74" y2="40" className="ha-link" />
      <line x1="170" y1="30" x2="128" y2="42" className="ha-link ha-dash-late" />
      <line x1="34" y1="98" x2="70" y2="82" className="ha-link ha-dash-late" />
      <circle cx="30" cy="26" r="5" className="ha-node" />
      <circle cx="170" cy="30" r="5" className="ha-node ha-node-warn" />
      <circle cx="34" cy="98" r="5" className="ha-node" />
      <circle cx="100" cy="60" r="6" className="ha-node ha-node-core" />
    </g>
  );
}

/* ---------------- 构建/依赖：包裹箱 + 版本标签 ---------------- */
function BuildArt() {
  return (
    <g>
      <rect x="58" y="42" width="84" height="58" rx="7" className="ha-frame" fill="none" />
      <line x1="100" y1="42" x2="100" y2="100" className="ha-frame ha-dim" />
      <polygon points="100,52 118,84 82,84" className="ha-warn" fill="none" />
      <line x1="100" y1="63" x2="100" y2="74" className="ha-warn-line" />
      <circle cx="100" cy="79" r="1.8" className="ha-warn-line" />
      {/* 悬浮版本标签 */}
      <g className="ha-float">
        <rect x="128" y="18" width="52" height="18" rx="9" className="ha-frame" fill="none" />
        <text x="154" y="31" className="ha-text ha-text-center">
          v3.0.0
        </text>
      </g>
      <g className="ha-float ha-float-late">
        <rect x="16" y="26" width="52" height="18" rx="9" className="ha-frame" fill="none" />
        <text x="42" y="39" className="ha-text ha-text-center">
          v2.3.1
        </text>
      </g>
      {/* 断开的链条 */}
      <circle cx="40" cy="94" r="6" className="ha-frame" fill="none" />
      <circle cx="54" cy="94" r="6" className="ha-frame" fill="none" />
      <circle cx="74" cy="94" r="6" className="ha-frame ha-dim" fill="none" />
    </g>
  );
}

/* ---------------- 玄学：水晶球 + 星轨 ---------------- */
function MysticArt() {
  return (
    <g>
      <rect x="72" y="92" width="56" height="12" rx="6" className="ha-frame" fill="none" />
      <circle cx="100" cy="56" r="38" className="ha-orb" />
      <circle cx="100" cy="56" r="38" className="ha-frame" fill="none" />
      <path d="M82 62 q10 -22 34 -12 q-20 2 -22 20 q-8 6 -12 -8z" className="ha-swirl" />
      {/* 星星闪烁 */}
      <path d="M64 22 l2.5 6 6 2.5 -6 2.5 -2.5 6 -2.5 -6 -6 -2.5 6 -2.5z" className="ha-star" />
      <path
        d="M148 40 l2 5 5 2 -5 2 -2 5 -2 -5 -5 -2 5 -2z"
        className="ha-star ha-star-late"
      />
      <path d="M156 76 l1.5 4 4 1.5 -4 1.5 -1.5 4 -1.5 -4 -4 -1.5 4 -1.5z" className="ha-star" />
      <text x="100" y="64" className="ha-text ha-text-center ha-mystery">
        ?
      </text>
    </g>
  );
}
