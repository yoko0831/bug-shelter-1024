import type { BugCard, BugDraft, Habitat } from '../types';
import { buildCard, makeCardNo, nextSerial } from './card';

/** 预置示例表单值（覆盖全部 6 种栖息地，方便直接看效果） */
export const PRESET_DRAFTS: { label: string; emoji: string; draft: BugDraft }[] = [
  {
    label: '午夜空指针',
    emoji: '🌙',
    draft: {
      name: '午夜空指针',
      stack: ['React'],
      habitat: '前端',
      danger: 4,
      reproduce: 3,
      scope: 4,
      isOnline: true,
      keywords: 'undefined, 凌晨, 白屏',
      description: '凌晨流量低谷时偶发白屏，白天几乎无法复现，怀疑和异步数据未就绪有关。',
    },
  },
  {
    label: '缓存雪崩',
    emoji: '❄️',
    draft: {
      name: '缓存雪崩',
      stack: ['Node', 'Docker'],
      habitat: '后端',
      danger: 5,
      reproduce: 2,
      scope: 5,
      isOnline: true,
      keywords: 'Redis, 过期, 流量',
      description: '大量缓存同一时刻集体过期，请求直接打到数据库，接口响应时间从 20ms 涨到 5s。',
    },
  },
  {
    label: '时区幽灵',
    emoji: '👻',
    draft: {
      name: '时区幽灵',
      stack: ['Java', 'SQL'],
      habitat: '玄学',
      danger: 3,
      reproduce: 5,
      scope: 3,
      isOnline: false,
      keywords: '时区, UTC, 差8小时',
      description: '报表日期总是差 8 小时，本地和生产表现不一致，怀疑是存储与展示的时区约定不统一。',
    },
  },
  {
    label: 'CSS 层级黑洞',
    emoji: '🕳️',
    draft: {
      name: 'CSS 层级黑洞',
      stack: ['Vue'],
      habitat: '前端',
      danger: 2,
      reproduce: 4,
      scope: 3,
      isOnline: false,
      keywords: 'z-index, 遮挡, 弹窗',
      description: '弹窗被某个绝对定位元素盖住，z-index 已经加到 9999 依然无效。',
    },
  },
  {
    label: '依赖地狱',
    emoji: '🐍',
    draft: {
      name: '依赖地狱',
      stack: ['Node', 'Docker'],
      habitat: '构建/依赖',
      danger: 4,
      reproduce: 2,
      scope: 4,
      isOnline: true,
      keywords: 'lock, 版本冲突, 构建失败',
      description: 'CI 构建失败但本地正常，lock 文件未变更，怀疑是间接依赖升级引入不兼容。',
    },
  },
  {
    label: '内存泄漏',
    emoji: '🫠',
    draft: {
      name: '内存泄漏',
      stack: ['React', 'Node'],
      habitat: '前端',
      danger: 4,
      reproduce: 3,
      scope: 4,
      isOnline: true,
      keywords: '内存, GC, 越跑越慢',
      description: '页面挂一整天后明显卡顿，任务管理器里内存曲线只涨不跌，刷新后立刻恢复正常。',
    },
  },
  {
    label: '竞态双胞胎',
    emoji: '🏁',
    draft: {
      name: '竞态双胞胎',
      stack: ['React'],
      habitat: '前端',
      danger: 3,
      reproduce: 5,
      scope: 3,
      isOnline: false,
      keywords: '竞态, 异步, 顺序',
      description: '快速切换筛选条件时，列表偶尔显示上一次请求的结果，慢响应覆盖了新数据。',
    },
  },
  {
    label: '正则回溯地狱',
    emoji: '⏳',
    draft: {
      name: '正则回溯地狱',
      stack: ['Java', 'Nginx'],
      habitat: '后端',
      danger: 4,
      reproduce: 2,
      scope: 4,
      isOnline: true,
      keywords: 'ReDoS, CPU, 卡死',
      description: '某段用户输入让校验正则陷入指数级回溯，单核 CPU 直接打满，接口全部超时。',
    },
  },
  {
    label: '跨域拦路虎',
    emoji: '🚧',
    draft: {
      name: '跨域拦路虎',
      stack: ['React', 'Nginx'],
      habitat: '前端',
      danger: 2,
      reproduce: 3,
      scope: 2,
      isOnline: false,
      keywords: 'CORS, 预检, OPTIONS',
      description: '控制台一片 CORS 报错，预检请求全部 403，后端说「我这边明明配了允许」。',
    },
  },
  {
    label: '证书过期倒计时',
    emoji: '🔐',
    draft: {
      name: '证书过期倒计时',
      stack: ['Nginx'],
      habitat: '网络',
      danger: 4,
      reproduce: 1,
      scope: 5,
      isOnline: true,
      keywords: 'HTTPS, 证书, 到期',
      description: '周一早上全员收到浏览器「不安全」警告，HTTPS 证书在周末静默过期，无人收到提醒。',
    },
  },
  {
    label: 'DNS 灵异事件',
    emoji: '🕸️',
    draft: {
      name: 'DNS 灵异事件',
      stack: ['Nginx', 'Go'],
      habitat: '网络',
      danger: 3,
      reproduce: 4,
      scope: 4,
      isOnline: true,
      keywords: '解析, 超时, 抽风',
      description: '部分用户打不开站点，其余一切正常；换 DNS 服务器立刻恢复，像是运营商缓存抽风。',
    },
  },
  {
    label: '幽灵依赖',
    emoji: '🧟',
    draft: {
      name: '幽灵依赖',
      stack: ['Node', 'Docker'],
      habitat: '构建/依赖',
      danger: 3,
      reproduce: 4,
      scope: 3,
      isOnline: true,
      keywords: 'phantom, node_modules, 本地能跑',
      description: '代码里 import 了一个没写进 package.json 的包，本地靠提升的依赖活着，CI 直接报错。',
    },
  },
  {
    label: '慢查询泥潭',
    emoji: '🐌',
    draft: {
      name: '慢查询泥潭',
      stack: ['SQL', 'Python'],
      habitat: '数据库',
      danger: 3,
      reproduce: 2,
      scope: 4,
      isOnline: true,
      keywords: '慢查询, 全表扫描, EXPLAIN',
      description: '一张百万行大表的统计接口越来越慢，EXPLAIN 一看竟然在做全表扫描。',
    },
  },
  {
    label: '死锁双人舞',
    emoji: '⚰️',
    draft: {
      name: '死锁双人舞',
      stack: ['SQL', 'Java'],
      habitat: '数据库',
      danger: 4,
      reproduce: 2,
      scope: 4,
      isOnline: true,
      keywords: '死锁, 事务, 锁等待',
      description: '两个批处理任务互相持有对方需要的行锁，数据库日志里出现 DEADLOCK，任务集体失败。',
    },
  },
  {
    label: '循环引用迷宫',
    emoji: '🌀',
    draft: {
      name: '循环引用迷宫',
      stack: ['Node'],
      habitat: '构建/依赖',
      danger: 3,
      reproduce: 3,
      scope: 3,
      isOnline: false,
      keywords: '循环引用, require, 堆栈',
      description: 'A 引用 B，B 又引用 A，模块初始化顺序随缘，偶尔拿到 undefined。',
    },
  },
  {
    label: '生产手滑侠',
    emoji: '💀',
    draft: {
      name: '生产手滑侠',
      stack: ['Docker', 'Nginx'],
      habitat: '玄学',
      danger: 5,
      reproduce: 5,
      scope: 5,
      isOnline: true,
      keywords: '误操作, 生产库, 回滚',
      description: '本想清理测试环境，终端窗口开太多，一条命令落在了生产机器上。事故已写进复盘，人没事。',
    },
  },
];

export const EMPTY_DRAFT: BugDraft = {
  name: '',
  stack: [],
  habitat: '前端',
  danger: 3,
  reproduce: 3,
  scope: 3,
  isOnline: false,
  keywords: '',
  description: '',
};

export function emptyDraft(): BugDraft {
  return { ...EMPTY_DRAFT, stack: [] };
}

export function presetDraft(label: string): BugDraft | undefined {
  const found = PRESET_DRAFTS.find((p) => p.label === label);
  return found ? { ...found.draft, stack: [...found.draft.stack] } : undefined;
}

/**
 * 首次打开（localStorage 无数据）时写入 5 张示例卡
 * 配置：SSR×1 + SR×2 + R×1 + N×1，覆盖后端/前端/玄学/构建依赖等栖息地
 */
const SAMPLE_LABELS = [
  '缓存雪崩', // SSR 132 · 后端
  '午夜空指针', // SR 116 · 前端
  '时区幽灵', // SR 104 · 玄学
  '循环引用迷宫', // R 84 · 构建/依赖
  '跨域拦路虎', // N 62 · 前端
];

export function createSampleCards(): BugCard[] {
  const base = Date.now() - 1000 * 60 * 60 * 24 * 14;
  return SAMPLE_LABELS.map((label, i) => {
    const draft = presetDraft(label)!;
    return buildCard(draft, {
      serial: i + 1,
      isSample: true,
      createdAt: base + i * 1000 * 60 * 60 * 20,
    });
  });
}

/**
 * 补齐缺失的示例卡：已存在同名卡牌的不再重复添加
 * 用于「清空图鉴后恢复默认」或手动恢复
 */
export function missingSampleCards(existing: BugCard[]): BugCard[] {
  const have = new Set(existing.map((c) => c.name.trim()));
  const samples = createSampleCards().filter((c) => !have.has(c.name));
  const start = nextSerial(existing);
  return samples.map((c, i) => ({ ...c, cardNo: makeCardNo(start + i) }));
}

export const HABITAT_EMOJI: Record<Habitat, string> = {
  前端: '🖥️',
  后端: '⚙️',
  数据库: '🗄️',
  网络: '🌐',
  '构建/依赖': '📦',
  玄学: '🔮',
};
