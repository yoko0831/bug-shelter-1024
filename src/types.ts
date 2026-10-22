export type Rarity = 'SSR' | 'SR' | 'R' | 'N';

export type Habitat =
  | '前端'
  | '后端'
  | '数据库'
  | '网络'
  | '构建/依赖'
  | '玄学';

export const STACK_OPTIONS = [
  'React',
  'Vue',
  'Node',
  'Java',
  'Go',
  'Python',
  'SQL',
  'Nginx',
  'Docker',
  '其他',
] as const;

export const HABITAT_OPTIONS: Habitat[] = [
  '前端',
  '后端',
  '数据库',
  '网络',
  '构建/依赖',
  '玄学',
];

export interface BugGuide {
  /** 三步排查建议 */
  steps: string[];
  /** 复盘三问 */
  review: {
    root: string;
    impact: string;
    prevention: string;
  };
  /** 预防疫苗 */
  vaccines: string[];
  /** 根因归类（空指针 / 并发 / 缓存 / 时区 …） */
  rootCategory: string;
  /** 针对该类根因的可复用防御建议 */
  defense: string;
}

export interface BugCard {
  id: string;
  /** 卡牌编号：BUG-1024-0001 */
  cardNo: string;
  createdAt: number;
  name: string;
  stack: string[];
  habitat: Habitat;
  /** 危险指数 1-5 */
  danger: number;
  /** 复现难度 1-5 */
  reproduce: number;
  /** 影响范围 1-5 */
  scope: number;
  isOnline: boolean;
  keywords: string[];
  description: string;
  score: number;
  rarity: Rarity;
  tamingDifficulty: number;
  roast: string;
  guide: BugGuide;
  isSample?: boolean;
}

/** 分享链接中携带的精简字段（不含 id / createdAt / cardNo） */
export type SharedBug = Omit<BugCard, 'id' | 'createdAt' | 'cardNo'>;

export interface BugDraft {
  name: string;
  stack: string[];
  habitat: Habitat;
  danger: number;
  reproduce: number;
  scope: number;
  isOnline: boolean;
  keywords: string;
  description: string;
}
