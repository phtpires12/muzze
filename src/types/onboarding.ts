export interface OnboardingData {
  // Phase 1: Hook + Dream Outcome
  username?: string;
  preferred_platform?: string;
  
  // Phase 2: Pain Diagnosis
  sticking_points?: string[];
  months_trying?: number;
  current_post_count?: number;
  previous_attempts?: string[];
  inconsistency_impact?: {
    financial: number;
    emotional: number;
    professional: number;
  };
  
  // Phase 3: Confrontation + Opportunity
  calculated_lost_posts?: number;
  dream_outcome_importance?: {
    posts_30_days: number;
    clarity: number;
    consistent_identity: number;
  };
  
  // Phase 4: Personalized Solution
  resonating_features?: string[];
  
  // Phase 5: Commitment + Configuration
  daily_goal_minutes?: number;
  creation_time?: string;
  commitment_level?: string;
  
  // Metadata
  completed_at?: string;
  version?: string;
  current_phase?: number;
  current_screen?: number;
}

export interface OnboardingState {
  phase: number;
  screen: number;
  data: OnboardingData;
  loading: boolean;
  totalPhases: number;
  screensPerPhase: number[];
}

export const ONBOARDING_PHASES = {
  HOOK_DREAM: 0,
  PAIN_DIAGNOSIS: 1,
  CONFRONTATION: 2,
  SOLUTION: 3,
  COMMITMENT: 4,
  SIGNUP_PAYWALL: 5,
} as const;

export const SCREENS_PER_PHASE = [4, 5, 5, 5, 2, 5];

export const STICKING_POINTS = [
  "Não sei o que postar",
  "Não consigo terminar o que começo",
  "Tenho ideias mas não executo",
  "Não sei por onde começar",
  "Me distraio facilmente",
  "Perfeccionismo me paralisa",
] as const;

export const PREVIOUS_ATTEMPTS = [
  "Cursos de produtividade",
  "Apps generalistas (Notion, Trello)",
  "Agendas físicas",
  "Grupos de accountability",
  "Tentei sozinho(a)",
  "Nunca tentei nada",
] as const;

export const RESONATING_FEATURES = [
  "Timer integrado",
  "Workflow guiado",
  "Gamificação e streaks",
  "Calendário editorial",
  "Shot list organizado",
] as const;
