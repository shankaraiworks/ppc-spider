export interface MarketOverview {
  industryType: string;
  marketCap: string;
}

export interface Keyword {
  term: string;
  avgMonthlySearches: number;
  trend: number[];
  cpcBidRange?: string;
  competition?: 'Low' | 'Medium' | 'High';
}

export interface KeywordAnalysis {
  keywords: Keyword[];
}

export interface KeywordRankingComparison {
  keyword: string;
  rankings: {
    name: string;
    position: number | string; // Can be a number or "N/A"
  }[];
}

export interface MonthlyTraffic {
    total: string;
    organic: string;
    paid: string;
    direct: string;
    referral: string;
    social: string;
    email: string;
}

export interface CompanyProfile {
  name: string;
  website: string;
  about: string;
  companySize: string;
  yearFounded: number;
  monthlyTraffic: MonthlyTraffic;
}

export interface Competitor {
  name: string;
  website: string;
  about: string;
  activeAdPlatforms: string[];
  estimatedSpend: string;
  companySize: string;
  yearFounded: number;
  monthlyTraffic: MonthlyTraffic;
  topKeywords: {
    keyword: string;
    estimatedCPC: string;
  }[];
}

export interface CompetitorAnalysis {
  competitorsSuggested: boolean;
  competitors: Competitor[];
  keywordRankingComparison: KeywordRankingComparison[];
  opportunityGaps: string[];
}

export interface PlatformRecommendation {
  name: string;
  reasoning: string;
  suggestedBudgetAllocation: number;
}

export interface AdTypeRecommendation {
  name: string;
  platform: string;
  reasoning: string;
}

export interface Recommendations {
  platforms: PlatformRecommendation[];
  adTypes: AdTypeRecommendation[];
}

export interface PerformanceProjection {
  timeframe: string; // e.g., "3 Months"
  metrics: {
    metric: string;
    value: string;
  }[];
}


export interface InitialCampaignStrategy {
  recommendedInitialSpend: string;
  estimatedPerformance: {
    metric: string;
    value: string;
  }[];
  performanceProjections?: PerformanceProjection[];
  recommendedLocation: string;
}

export interface DashboardData {
  companyProfile: CompanyProfile;
  marketOverview: MarketOverview;
  keywordAnalysis: KeywordAnalysis;
  competitorAnalysis?: CompetitorAnalysis;
  recommendations: Recommendations;
  initialCampaignStrategy: InitialCampaignStrategy;
}

export interface FormValue {
  companyName: string;
  targetLocation: string;
  adSpend: number;
  campaignObjective: string;
  competitors: string;
  keywords?: string;
  currency: string;
}