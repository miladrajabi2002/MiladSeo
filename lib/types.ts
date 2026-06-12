export interface ProjectSummary {
  id: number;
  name: string;
  domain: string;
  gscProperty: string;
  location: string;
  keywordCount: number;
  avgPosition: number | null;
  lastSyncAt: string | null;
  createdAt: string;
  /** keywords in the top 3 desktop positions */
  top3: number;
  /** keywords in the top 10 desktop positions */
  top10: number;
  /** keywords that improved week-over-week */
  improved: number;
  /** keywords that dropped week-over-week */
  dropped: number;
  /** unread alerts for this project */
  unreadAlerts: number;
  /** compact position distribution for the card mini-chart */
  distribution: DistributionBucket[];
}

export interface KeywordRow {
  id: number;
  text: string;
  urlPath: string | null;
  group: string | null;
  desktopPos: number | null;
  mobilePos: number | null;
  /** prevPos - nowPos for desktop; positive means the keyword improved */
  change: number | null;
  /** Last up-to-7 desktop positions, oldest first */
  trend: number[];
  clicks: number;
  impressions: number;
}

export interface DistributionBucket {
  bucket: string;
  count: number;
  color: string;
}

export interface OverviewStats {
  top10: number;
  top20: number;
  top50: number;
  avgDesktop: number | null;
  totalKeywords: number;
  distribution: DistributionBucket[];
  /** Top 5 best-ranking keywords by current desktop position */
  topKeywords: KeywordRow[];
}

export interface MoverRow {
  id: number;
  text: string;
  group: string | null;
  prevPos: number;
  nowPos: number;
  delta: number;
  trend: number[];
}

export interface MoversData {
  improved: MoverRow[];
  dropped: MoverRow[];
}

export interface MobileRow {
  id: number;
  text: string;
  group: string | null;
  mobilePos: number;
  desktopPos: number;
  /** mobilePos - desktopPos; negative means mobile ranks better */
  gap: number;
}

export interface MobileData {
  avgMobile: number | null;
  betterOnMobile: number;
  worseOnMobile: number;
  top10Mobile: number;
  rows: MobileRow[];
  topMobile: { id: number; text: string; group: string | null; mobilePos: number }[];
}

export interface AlertRow {
  id: number;
  keyword: string;
  type: "jumped" | "dropped";
  group: string | null;
  prevPos: number;
  nowPos: number;
  delta: number;
  isRead: boolean;
  createdAt: string;
}

export interface HistoryMatrix {
  dates: string[];
  rows: { text: string; positions: (number | null)[] }[];
}

export type ApiSuccess<T> = { data: T };
export type ApiError = { error: string; code: string };
