export interface RecapComputedStats {
  stageBreakdown: Record<string, number>;
  bestDay: string | null;
  bestDayMinutes: number;
  weeklyGoalHitCount: number;
  totalWeeks: number;
  previousPeriodMinutes: number | null;
  favoriteStage: string | null;
}

export interface Recap {
  id: string;
  user_id: string;
  period_type: '30d' | '60d' | '90d' | '180d' | '365d';
  period_start: string;
  period_end: string;
  total_minutes: number;
  days_active: number;
  avg_daily_minutes: number;
  sessions_count: number;
  followers_count: number | null;
  had_viral: boolean | null;
  computed_stats: RecapComputedStats;
  is_eligible: boolean;
  viewed_at: string | null;
  created_at: string;
}

export const PERIOD_LABELS: Record<string, string> = {
  '30d': 'mensal',
  '60d': 'bimestral',
  '90d': 'trimestral',
  '180d': 'semestral',
  '365d': 'anual',
};

export const PERIOD_DAYS: Record<string, number> = {
  '30d': 30,
  '60d': 60,
  '90d': 90,
  '180d': 180,
  '365d': 365,
};
