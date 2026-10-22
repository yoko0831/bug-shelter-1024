interface Props {
  active: 'shelter' | 'codex';
  onChange: (tab: 'shelter' | 'codex') => void;
  total: number;
}

export default function Header({ active, onChange, total }: Props) {
  return (
    <header className="app-header">
      <div className="header-top">
        <div className="brand">
          <span className="brand-mark" aria-hidden="true">
            {'{}'}
          </span>
          <div>
            <h1 className="brand-title">
              Bug 收容所 <span className="brand-1024">· 1024 特别版</span>
            </h1>
            <p className="brand-sub">把事故变成卡牌，把复盘变成图鉴</p>
          </div>
        </div>
        <div className="privacy" role="note">
          <span className="privacy-icon" aria-hidden="true">
            🔒
          </span>
          <span>
            全程本地运行 · 请勿粘贴真实密钥、完整代码或敏感日志
          </span>
        </div>
      </div>

      <nav className="tabs" role="tablist" aria-label="主导航">
        <button
          type="button"
          role="tab"
          aria-selected={active === 'shelter'}
          className={`tab ${active === 'shelter' ? 'tab-active' : ''}`}
          onClick={() => onChange('shelter')}
        >
          收容台
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={active === 'codex'}
          className={`tab ${active === 'codex' ? 'tab-active' : ''}`}
          onClick={() => onChange('codex')}
        >
          我的图鉴
          <span className="tab-badge">{total}</span>
        </button>
      </nav>
    </header>
  );
}
