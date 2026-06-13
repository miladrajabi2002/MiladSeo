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

/** One day of history for a single keyword (trend modal) */
export interface KeywordHistoryPoint {
  date: string;
  desktopPos: number | null;
  mobilePos: number | null;
  clicks: number;
  impressions: number;
}

export interface KeywordHistory {
  id: number;
  text: string;
  urlPath: string | null;
  group: string | null;
  points: KeywordHistoryPoint[];
  annotations: AnnotationRow[];
}

/** Aggregate metrics for one period of the comparison view */
export interface PeriodStats {
  label: string;
  avgPosition: number | null;
  top3: number;
  top10: number;
  clicks: number;
  impressions: number;
  ctr: number | null;
}

export interface ComparisonData {
  range: "week" | "month";
  current: PeriodStats;
  previous: PeriodStats;
}

export interface TrafficPoint {
  date: string;
  clicks: number;
  impressions: number;
  ctr: number | null;
}

export interface OpportunityRow {
  id: number;
  text: string;
  urlPath: string | null;
  group: string | null;
  position: number | null;
  impressions: number;
  clicks: number;
  ctr: number;
  /** rough CTR expected for this position; ctr far below this = opportunity */
  expectedCtr: number;
}

export interface TrafficData {
  series: TrafficPoint[];
  totalClicks: number;
  totalImpressions: number;
  avgCtr: number | null;
  opportunities: OpportunityRow[];
}

export interface PageRow {
  urlPath: string;
  keywordCount: number;
  bestPosition: number | null;
  avgPosition: number | null;
  clicks: number;
  impressions: number;
  /** avg position over the last up-to-14 days, oldest first */
  trend: number[];
  /** change of avg position vs ~7 days ago; positive = improved */
  change: number | null;
  topKeywords: { id: number; text: string; position: number | null }[];
}

export interface VisibilityPoint {
  date: string;
  /** 0-100 share-of-voice style score */
  score: number;
}

export interface VisibilityData {
  series: VisibilityPoint[];
  current: number | null;
  /** score change vs ~7 days ago */
  weekChange: number | null;
  annotations: AnnotationRow[];
}

export interface CannibalizationGroup {
  text: string;
  /** pages competing for this query, best position first */
  pages: {
    keywordId: number;
    urlPath: string;
    position: number | null;
    clicks: number;
    impressions: number;
  }[];
}

export interface AnnotationRow {
  id: number;
  date: string;
  title: string;
  note: string | null;
}

export interface IndexStatusRow {
  urlPath: string;
  verdict: string | null;
  coverageState: string | null;
  indexingState: string | null;
  robotsState: string | null;
  fetchState: string | null;
  lastCrawlTime: string | null;
  googleCanonical: string | null;
  checkedAt: string | null;
}

export interface PageSpeedRow {
  urlPath: string;
  strategy: "mobile" | "desktop";
  score: number;
  lcpMs: number | null;
  cls: number | null;
  inpMs: number | null;
  fcpMs: number | null;
  ttfbMs: number | null;
  checkedAt: string;
}

export interface ShareLinkInfo {
  token: string;
  url: string;
  createdAt: string;
}

/** Everything the public read-only dashboard needs in one payload */
export interface PublicDashboard {
  projectName: string;
  domain: string;
  lastSyncAt: string | null;
  overview: OverviewStats;
  visibility: VisibilityData;
  traffic: TrafficPoint[];
  movers: MoversData;
}

// ---------------------------------------------------------------------------
// AI SEO assistant
// ---------------------------------------------------------------------------

export type AiProvider = "anthropic" | "openai";

export interface AiConfigStatus {
  configured: boolean;
  provider: AiProvider | null;
  model: string | null;
}

export interface AiRecommendation {
  title: string;
  category: "content" | "technical" | "keywords" | "performance" | "onpage" | "links";
  priority: "high" | "medium" | "low";
  impact: string;
  effort: "low" | "medium" | "high";
  detail: string;
}

export interface AiAnalysis {
  healthScore: number;
  summary: string;
  recommendations: AiRecommendation[];
  quickWins: string[];
  risks: string[];
  generatedAt: string;
  provider: AiProvider;
  model: string;
}

export type ApiSuccess<T> = { data: T };
export type ApiError = { error: string; code: string };
