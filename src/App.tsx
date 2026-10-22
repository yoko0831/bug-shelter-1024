import { useCallback, useEffect, useRef, useState } from 'react';
import type { BugCard, BugDraft, SharedBug } from './types';
import Header from './components/Header';
import ShelterTab from './components/ShelterTab';
import CodexTab from './components/CodexTab';
import IncomingCard from './components/IncomingCard';
import ShareCard from './components/ShareCard';
import { buildCard, cardFromShared, nextSerial } from './lib/card';
import { createSampleCards } from './lib/samples';
import { clearShareHash, readSharedFromHash } from './lib/share';
import { loadCards, saveCards } from './lib/storage';
import { renderSharePng, shareOrDownload } from './lib/exportImage';

type Tab = 'shelter' | 'codex';
type Toast = { msg: string; tone: 'ok' | 'warn' | 'err' } | null;

export default function App() {
  const [cards, setCards] = useState<BugCard[]>([]);
  const [tab, setTab] = useState<Tab>('shelter');
  const [result, setResult] = useState<BugCard | null>(null);
  const [editing, setEditing] = useState<BugCard | null>(null);
  const [incoming, setIncoming] = useState<SharedBug | null>(null);
  const [revealKey, setRevealKey] = useState(0);
  const [toast, setToast] = useState<Toast>(null);
  const [exportCard, setExportCard] = useState<BugCard | null>(null);
  const timer = useRef<number | null>(null);
  const shareRef = useRef<HTMLDivElement>(null);

  const showToast = useCallback((msg: string, tone: 'ok' | 'warn' | 'err' = 'ok') => {
    setToast({ msg, tone });
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setToast(null), 2600);
  }, []);

  // 初始化：读取本地图鉴 + 解析分享链接
  useEffect(() => {
    setCards(loadCards());
    const res = readSharedFromHash();
    if (res.ok) {
      setIncoming(res.data);
    } else if (res.reason === 'invalid') {
      showToast('分享链接无效或已损坏', 'err');
      clearShareHash();
    }
  }, [showToast]);

  const persist = useCallback((next: BugCard[]) => {
    setCards(next);
    saveCards(next);
  }, []);

  /** 通用导出：把目标卡渲染进离屏分享卡后导出 PNG，移动端唤起系统分享 */
  const exportCardPng = useCallback(
    async (card: BugCard) => {
      setExportCard(card);
      // 等离屏分享卡完成一帧渲染
      await new Promise<void>((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
      );
      try {
        const dataUrl = await renderSharePng(shareRef.current!, card);
        const outcome = await shareOrDownload(dataUrl, card);
        showToast(
          outcome === 'shared'
            ? '已唤起系统分享'
            : outcome === 'downloaded'
              ? `分享卡已保存：bug-card-${card.cardNo}.png`
              : '导出失败，可截图保存',
          outcome === 'failed' ? 'err' : 'ok',
        );
      } catch {
        showToast('导出失败，可截图保存', 'err');
      }
    },
    [showToast],
  );

  const handleCreate = useCallback(
    (draft: BugDraft, editingId?: string) => {
      if (editingId) {
        const old = cards.find((c) => c.id === editingId);
        if (!old) return;
        const fresh = buildCard(draft, { serial: nextSerial(cards) });
        const updated: BugCard = {
          ...fresh,
          id: old.id,
          cardNo: old.cardNo,
          createdAt: old.createdAt,
        };
        persist(
          cards.map((c) => (c.id === editingId ? updated : c))
            .filter((c) => c.id === editingId || c.name.trim() !== updated.name.trim()),
        );
        setResult(updated);
        setRevealKey((k) => k + 1);
        setEditing(null);
        showToast(`已更新 ${updated.cardNo}`, 'ok');
        return;
      }

      const card = buildCard(draft, { serial: nextSerial(cards) });
      const name = card.name.trim();
      // 同名卡牌不重复入库：新卡替换旧的，图鉴永远一张一 Bug
      const hadSame = cards.some((c) => c.name.trim() === name);
      persist([card, ...cards.filter((c) => c.name.trim() !== name)]);
      setResult(card);
      setRevealKey((k) => k + 1);
      showToast(
        hadSame
          ? `图鉴中已有同名卡牌，已更新为 ${card.cardNo}`
          : `收容成功 ${card.cardNo} · 已自动保存到图鉴`,
        'ok',
      );
    },
    [cards, persist, showToast],
  );

  const handleAdopt = useCallback(() => {
    if (!incoming) return;
    const card = cardFromShared(incoming, nextSerial(cards));
    const name = card.name.trim();
    persist([card, ...cards.filter((c) => c.name.trim() !== name)]);
    setIncoming(null);
    clearShareHash();
    setTab('codex');
    showToast(`已收容到图鉴 ${card.cardNo}`, 'ok');
  }, [cards, incoming, persist, showToast]);

  const startEdit = useCallback((card: BugCard) => {
    setEditing(card);
    setResult(null);
    setTab('shelter');
  }, []);

  return (
    <div className="app">
      <div className="bg-grid" aria-hidden="true" />
      <Header active={tab} onChange={setTab} total={cards.length} />

      <main className="main">
        {incoming ? (
          <IncomingCard
            shared={incoming}
            onAdopt={handleAdopt}
            onDismiss={() => {
              setIncoming(null);
              clearShareHash();
            }}
          />
        ) : null}

        {tab === 'shelter' ? (
          <ShelterTab
            result={result}
            editing={editing}
            revealKey={revealKey}
            onCreate={handleCreate}
            onCancelEdit={() => setEditing(null)}
            onExport={exportCardPng}
            onEdit={startEdit}
            onReset={() => setResult(null)}
            toast={showToast}
          />
        ) : (
          <CodexTab
            cards={cards}
            onDelete={(id) => {
              const next = cards.filter((c) => c.id !== id);
              // 删到空时自动补一套默认示例，保证图鉴不空
              persist(next.length === 0 ? createSampleCards() : next);
            }}
            onClear={() => persist(createSampleCards())}
            onGoShelter={() => setTab('shelter')}
            onEdit={startEdit}
            onExport={exportCardPng}
            toast={showToast}
          />
        )}
      </main>

      <footer className="app-footer">
        <span>数据保存在浏览器 localStorage，不上传任何服务器</span>
        <span>WorkBuddy 1024 造物挑战</span>
      </footer>

      {/* 离屏 1080×1440 分享卡，供任意卡牌导出 */}
      <ShareCard ref={shareRef} card={exportCard} />

      {toast ? <div className={`toast toast-${toast.tone}`}>{toast.msg}</div> : null}
    </div>
  );
}
