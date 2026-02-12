// Cluster types for personalization system
export type ConsistencyCluster = 1 | 2 | 3;
export type Screen12Variant = 'hurt' | 'path' | 'machine';

export interface OnboardingData {
  // Phase 0: Hook + Dream Outcome
  username?: string;
  content_goal?: string;
  preferred_platform?: string;
  daily_available_time?: string;
  preferred_creation_time?: string; // Format "HH:MM"
  previous_tools?: string[];
  
  // Phase 0: Pain Diagnosis
  sticking_points?: string[];
  months_trying?: number;
  current_post_count?: number;
  previous_attempts?: string[];
  inconsistency_impact?: {
    financial: number;
    emotional: number;
    professional: number;
  };
  
  // Behavioral Clusters System (used for personalization)
  posting_frequency?: string;           // ID of selected frequency option
  consistency_cluster?: ConsistencyCluster;  // Derived cluster (1=None, 2=Building, 3=High)
  screen12_variant?: Screen12Variant;   // Determines which variant of feedback screen to show
  
  // Phase 1: Configuration
  daily_goal_minutes?: number;
  creation_time?: string;
  commitment_level?: string;
  
  // Legacy fields (may be removed in future)
  calculated_lost_posts?: number;
  dream_outcome_importance?: {
    posts_30_days: number;
    clarity: number;
    consistent_identity: number;
  };
  resonating_features?: string[];
  
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
  HOOK_DREAM: 0,        // Welcome, HowWeHelp, Questionnaire (10 screens)
  CONFIGURATION: 1,     // BehavioralScience, DailyTime, CreationTime (3 screens)
  SIGNUP_PAYWALL: 2,    // Signup, Paywall, Install (3 screens)
} as const;

// Simplified to 3 phases: [10, 4, 3]
// Phase 0: 10 screens (Welcome through ClusterFeedback)
// Phase 1: 4 screens (BehavioralScience, DailyTime, CreationTime, Notifications)
// Phase 2: 3 screens (Signup, Paywall, Install)
export const SCREENS_PER_PHASE = [10, 4, 3];

// Posting frequency options with cluster mapping
// Cluster 1: No consistency - focus on reducing pressure, starting small
// Cluster 2: Building - focus on organizing process, increasing frequency
// Cluster 3: High consistency - focus on optimizing process, avoiding burnout
export const POSTING_FREQUENCY_OPTIONS = [
  {
    id: "super_consistent",
    label: "Sou super constante (pelo menos 3x na semana)",
    cluster: 3 as ConsistencyCluster,
    screen12Variant: "machine" as Screen12Variant,
  },
  {
    id: "almost_consistent",
    label: "Quase constante (1x na semana)",
    cluster: 2 as ConsistencyCluster,
    screen12Variant: "path" as Screen12Variant,
  },
  {
    id: "no_consistency",
    label: "Não tenho constância (1x a 2x por mês)",
    cluster: 1 as ConsistencyCluster,
    screen12Variant: "hurt" as Screen12Variant,
  },
  {
    id: "when_possible",
    label: "Posto quando dá",
    cluster: 1 as ConsistencyCluster,
    screen12Variant: "hurt" as Screen12Variant,
  },
] as const;

export const CONTENT_GOALS = [
  {
    id: "charge_more",
    emoji: "💰",
    label: "Cobrar muito mais caro",
    description: "Ser tão valorizado que você pode cobrar o preço que quiser"
  },
  {
    id: "speaking",
    emoji: "🎤",
    label: "Ser convidado pra palestrar",
    description: "Ser reconhecido como autoridade e estar nos maiores palcos"
  },
  {
    id: "millions",
    emoji: "📈",
    label: "Ter milhões de seguidores",
    description: "Construir uma audiência grande que te acompanha"
  },
  {
    id: "waiting_list",
    emoji: "🚀",
    label: "Ter fila de espera",
    description: "Que as pessoas briguem pra trabalhar com você"
  },
  {
    id: "reference",
    emoji: "✨",
    label: "Ser referência no seu nicho",
    description: "Quando falarem do seu tema, pensarem em você primeiro"
  }
] as const;

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

export const DAILY_TIME_OPTIONS = [
  { id: "15_30_min", label: "15-30 minutos", emoji: "⏱️" },
  { id: "30_60_min", label: "30-60 minutos", emoji: "⏱️" },
  { id: "more_than_1h", label: "Mais de 1 hora", emoji: "⏱️" },
  { id: "full_time", label: "Sou Creator Full-Time", emoji: "⏱️" },
] as const;
