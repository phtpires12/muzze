// Sistema de gamificação - pontos, níveis e troféus

export interface Trophy {
  id: string;
  name: string;
  description: string;
  icon: string;
  requirement: (stats: UserStats) => boolean;
  points: number;
}

export const POINTS = {
  DAILY_LOGIN: 10,
  CREATE_SCRIPT: 50,
  CREATE_SHOTLIST: 30,
  CREATE_IDEA: 20,
  COMPLETE_SESSION: 25,
  STREAK_MILESTONE: 100,
  HOUR_MILESTONE: 75,
};

// XP System Constants
export const XP_PER_MINUTE = 2;
export const FREEZE_COST_MULTIPLIER = 2;
export const MAX_STREAK_FREEZES = 5;
export const MAX_STREAK_BONUS_DAYS = 365;

export function calculateXPFromMinutes(minutes: number): number {
  return Math.floor(minutes * XP_PER_MINUTE);
}

export function calculateFreezeCost(minStreakMinutes: number = 20): number {
  const dailyXP = calculateXPFromMinutes(minStreakMinutes);
  return dailyXP * FREEZE_COST_MULTIPLIER;
}

// Calcula o multiplicador de bônus baseado nos dias de streak
// Cada dia = +1% de bônus (máximo: 365% = 4.65x)
export function getStreakBonusMultiplier(streakDays: number): number {
  const cappedDays = Math.min(streakDays, MAX_STREAK_BONUS_DAYS);
  return 1 + (cappedDays / 100);
}

// Calcula XP com bônus de streak aplicado
export interface XPWithBonus {
  baseXP: number;
  bonusXP: number;
  totalXP: number;
  bonusPercent: number;
}

export function calculateXPWithStreakBonus(
  minutes: number, 
  streakDays: number
): XPWithBonus {
  const baseXP = Math.floor(minutes * XP_PER_MINUTE);
  const bonusPercent = Math.min(streakDays, MAX_STREAK_BONUS_DAYS);
  const multiplier = getStreakBonusMultiplier(streakDays);
  const totalXP = Math.floor(baseXP * multiplier);
  const bonusXP = totalXP - baseXP;
  
  return { baseXP, bonusXP, totalXP, bonusPercent };
}

export const LEVELS = [
  { level: 1, name: "Iniciante", minPoints: 0, color: "hsl(240 5.9% 64%)" },
  { level: 2, name: "Aprendiz", minPoints: 500, color: "hsl(142 76% 36%)" },
  { level: 3, name: "Criador", minPoints: 1500, color: "hsl(217 91% 60%)" },
  { level: 4, name: "Profissional", minPoints: 3500, color: "hsl(262 83% 58%)" },
  { level: 5, name: "Expert", minPoints: 7000, color: "hsl(33 100% 50%)" },
  { level: 6, name: "Mestre", minPoints: 12000, color: "hsl(0 84% 60%)" },
  { level: 7, name: "Lendário", minPoints: 20000, color: "hsl(280 100% 70%)" },
];

export const TROPHIES: Trophy[] = [
  // ============ CONQUISTAS EXISTENTES ============
  {
    id: "first_script",
    name: "Primeiro Roteiro",
    description: "Criou seu primeiro roteiro",
    icon: "🎬",
    requirement: (stats) => stats.scriptsCreated >= 1,
    points: 50,
  },
  {
    id: "streak_7",
    name: "Semana Constante",
    description: "Manteve 7 dias de sequência",
    icon: "🔥",
    requirement: (stats) => stats.streak >= 7,
    points: 100,
  },
  {
    id: "streak_30",
    name: "Mês Dedicado",
    description: "Manteve 30 dias de sequência",
    icon: "⚡",
    requirement: (stats) => stats.streak >= 30,
    points: 500,
  },
  {
    id: "scripts_10",
    name: "Roteirista",
    description: "Criou 10 roteiros",
    icon: "📝",
    requirement: (stats) => stats.scriptsCreated >= 10,
    points: 150,
  },
  {
    id: "scripts_50",
    name: "Roteirista Expert",
    description: "Criou 50 roteiros",
    icon: "✍️",
    requirement: (stats) => stats.scriptsCreated >= 50,
    points: 1000,
  },
  {
    id: "hours_10",
    name: "10 Horas",
    description: "Acumulou 10 horas criando",
    icon: "⏱️",
    requirement: (stats) => stats.totalHours >= 10,
    points: 100,
  },
  {
    id: "hours_50",
    name: "50 Horas",
    description: "Acumulou 50 horas criando",
    icon: "⏰",
    requirement: (stats) => stats.totalHours >= 50,
    points: 300,
  },
  {
    id: "hours_100",
    name: "Centena",
    description: "Acumulou 100 horas criando",
    icon: "🎯",
    requirement: (stats) => stats.totalHours >= 100,
    points: 750,
  },
  {
    id: "ideas_20",
    name: "Banco de Ideias",
    description: "Salvou 20 ideias",
    icon: "💡",
    requirement: (stats) => stats.ideasCreated >= 20,
    points: 120,
  },
  
  // ============ 🧠 CONQUISTAS DE PROCESSO ============
  {
    id: "first_real_session",
    name: "Primeira Sessão Real",
    description: "Criou por pelo menos 25 minutos em uma única sessão",
    icon: "🎯",
    requirement: (stats) => stats.sessionsOver25Min >= 1,
    points: 75,
  },
  {
    id: "focused_creator",
    name: "Criador Focado",
    description: "Criou por 25 minutos sem pausar a sessão",
    icon: "🧘",
    requirement: (stats) => stats.sessionsWithoutPause >= 1,
    points: 120,
  },
  {
    id: "no_distractions",
    name: "Sem Distrações",
    description: "Criou 3 sessões completas sem abandonar o app",
    icon: "🛡️",
    requirement: (stats) => stats.sessionsWithoutAbandon >= 3,
    points: 150,
  },
  
  // ============ 🔥 CONQUISTAS DE CONSTÂNCIA ============
  {
    id: "honorable_return",
    name: "Retorno Honroso",
    description: "Perdeu uma ofensiva e voltou no dia seguinte",
    icon: "🔄",
    requirement: (stats) => stats.hadStreakReset && stats.streak >= 1,
    points: 80,
  },
  {
    id: "three_days",
    name: "Trinca",
    description: "3 dias seguidos batendo a meta diária",
    icon: "3️⃣",
    requirement: (stats) => stats.streak >= 3,
    points: 60,
  },
  {
    id: "five_days",
    name: "Incendiando",
    description: "5 dias seguidos batendo a meta",
    icon: "🔥",
    requirement: (stats) => stats.streak >= 5,
    points: 120,
  },
  
  // ============ ⏱️ CONQUISTAS DE TEMPO ============
  {
    id: "hours_1",
    name: "Uma Hora",
    description: "Acumulou 1 hora criando",
    icon: "⏱️",
    requirement: (stats) => stats.totalHours >= 1,
    points: 40,
  },
  {
    id: "hours_5",
    name: "Cinco Horas",
    description: "Acumulou 5 horas criando",
    icon: "⏰",
    requirement: (stats) => stats.totalHours >= 5,
    points: 80,
  },
  
  // ============ ✍️ CONQUISTAS DE PRODUÇÃO ============
  {
    id: "first_completed",
    name: "Primeiro Projeto Finalizado",
    description: "Levou um conteúdo até a etapa final do processo",
    icon: "🏆",
    requirement: (stats) => stats.scriptsCompleted >= 1,
    points: 100,
  },
  {
    id: "creative_sequence",
    name: "Sequência Criativa",
    description: "Finalizou 3 conteúdos em sequência",
    icon: "🎬",
    requirement: (stats) => stats.scriptsCompleted >= 3,
    points: 180,
  },
  
  // ============ 💡 CONQUISTAS DE ORGANIZAÇÃO ============
  {
    id: "ideas_organized",
    name: "Ideias em Ordem",
    description: "Organizou 10 ideias em etapas",
    icon: "📋",
    requirement: (stats) => stats.ideasOrganized >= 10,
    points: 60,
  },
  {
    id: "full_flow",
    name: "Fluxo Completo",
    description: "Usou todas as etapas do fluxo pelo menos uma vez",
    icon: "♾️",
    requirement: (stats) => {
      const requiredStages = ['idea', 'script', 'review', 'record', 'edit'];
      return requiredStages.every(stage => stats.usedStages.includes(stage));
    },
    points: 120,
  },
];

export interface LevelDefinition {
  level: number;
  name: string;
  xpRequired: number;
  description: string;
  color: string;
  rewards: string[];
}

// ============================================
// META DIÁRIA POR NÍVEL (Rampa de Hábito)
// ============================================
// Esta é a ÚNICA fonte de verdade para meta mínima diária baseada em nível.
// Usada por: SessionContext, useSession, Ofensiva, check-streaks (cron), Stats.

/**
 * Retorna a meta diária mínima (em minutos) baseada no nível do usuário.
 * Implementa a "rampa de hábito" inspirada no Duolingo:
 * - Nível 1: 5 minutos (entrada fácil)
 * - Nível 2: 10 minutos
 * - Nível 3: 15 minutos
 * - Nível 4+: 25 minutos (meta padrão do app)
 * 
 * @param level - Nível do usuário (1-7+). Valores <= 0 são tratados como nível 1.
 * @returns Meta diária em minutos
 */
export function getDailyGoalMinutesForLevel(level: number): number {
  // Guard: garantir que level é um número válido
  const safeLevel = typeof level === 'number' && !isNaN(level) ? Math.floor(level) : 1;
  
  if (safeLevel <= 1) return 5;
  if (safeLevel === 2) return 10;
  if (safeLevel === 3) return 15;
  return 25; // Nível 4+
}

// ============================================
// CURVA DE XP (Progressão por Níveis)
// ============================================
// Curva otimizada para progressão rápida no início (níveis 1-4)
// Isso cria a "rampa de hábito" inspirada no Duolingo
// Nível 2: ~2 dias (50min), Nível 3: ~4 dias (150min), Nível 4: ~8 dias (350min)
export const XP_LEVELS: LevelDefinition[] = [
  { 
    level: 1, 
    name: "Criador Iniciante", 
    xpRequired: 0, 
    description: "Você começou sua jornada na Muzze.",
    color: "hsl(240 5.9% 64%)",
    rewards: []
  },
  { 
    level: 2, 
    name: "Criador Focado", 
    xpRequired: 100, // Era 1000 - agora ~50min de criação
    description: "Você está construindo sua constância.",
    color: "hsl(142 76% 36%)",
    rewards: ["Badge exclusivo"]
  },
  { 
    level: 3, 
    name: "Criador Consistente", 
    xpRequired: 300, // Era 3000 - agora ~150min de criação
    description: "Você cria mesmo sem motivação.",
    color: "hsl(217 91% 60%)",
    rewards: ["3 dias de Muzze PRO grátis"]
  },
  { 
    level: 4, 
    name: "Artista", 
    xpRequired: 700, // Era 7000 - agora ~350min de criação
    description: "Você transforma processo em hábito.",
    color: "hsl(262 83% 58%)",
    rewards: ["7 dias de Muzze PRO grátis"]
  },
  { 
    level: 5, 
    name: "Mestre da Criatividade", 
    xpRequired: 1500, // Era 15000 - ajustado proporcionalmente
    description: "Você cria sem falhar. Um exemplo raro.",
    color: "hsl(33 100% 50%)",
    rewards: ["15 dias de Muzze PRO grátis"]
  },
  { 
    level: 6, 
    name: "Talento Natural", 
    xpRequired: 3000, // Era 30000 - ajustado proporcionalmente
    description: "Criar é seu estado natural.",
    color: "hsl(0 84% 60%)",
    rewards: ["Acesso a material exclusivo"]
  },
  { 
    level: 7, 
    name: "Lenda Absoluta", 
    xpRequired: 6000, // Era 60000 - ajustado proporcionalmente
    description: "Você inspira milhares.",
    color: "hsl(280 100% 70%)",
    rewards: ["Call exclusiva com o fundador", "Badge dourado", "Desconto vitalício progressivo"]
  },
];

export function calculateLevel(points: number): number {
  for (let i = XP_LEVELS.length - 1; i >= 0; i--) {
    if (points >= XP_LEVELS[i].xpRequired) {
      return XP_LEVELS[i].level;
    }
  }
  return 1;
}

export function calculateLevelByXP(xp: number): number {
  for (let i = XP_LEVELS.length - 1; i >= 0; i--) {
    if (xp >= XP_LEVELS[i].xpRequired) {
      return XP_LEVELS[i].level;
    }
  }
  return 1;
}

// Retorna o nível efetivo considerando o highest_level (não regressivo)
export function getEffectiveLevel(xp: number, highestLevel: number): number {
  const calculatedLevel = calculateLevelByXP(xp);
  return Math.max(highestLevel, calculatedLevel);
}

// Calcula progresso para o próximo nível usando nível efetivo
export function getProgressToNextLevelEffective(xp: number, effectiveLevel: number): number {
  const currentLevelInfo = getLevelInfo(effectiveLevel);
  const nextLevelInfo = getNextLevelInfo(effectiveLevel);
  
  if (!nextLevelInfo) return 100;
  
  const xpInCurrentLevel = xp - currentLevelInfo.xpRequired;
  const xpNeededForNext = nextLevelInfo.xpRequired - currentLevelInfo.xpRequired;
  
  // Se XP está abaixo do nível atual (gastou XP), progresso pode ser negativo
  // Mostramos 0% nesse caso
  const progress = (xpInCurrentLevel / xpNeededForNext) * 100;
  return Math.max(0, Math.min(100, progress));
}

export function getLevelInfo(level: number) {
  return XP_LEVELS.find((l) => l.level === level) || XP_LEVELS[0];
}

export function getNextLevelInfo(currentLevel: number) {
  return XP_LEVELS.find((l) => l.level === currentLevel + 1);
}

export function getLevelByXP(xp: number): LevelDefinition {
  for (let i = XP_LEVELS.length - 1; i >= 0; i--) {
    if (xp >= XP_LEVELS[i].xpRequired) {
      return XP_LEVELS[i];
    }
  }
  return XP_LEVELS[0];
}

export function getProgressToNextLevel(points: number, currentLevel: number): number {
  const currentLevelInfo = getLevelInfo(currentLevel);
  const nextLevelInfo = getNextLevelInfo(currentLevel);
  
  if (!nextLevelInfo) return 100;
  
  const pointsInCurrentLevel = points - currentLevelInfo.xpRequired;
  const pointsNeededForNext = nextLevelInfo.xpRequired - currentLevelInfo.xpRequired;
  
  return Math.min(100, (pointsInCurrentLevel / pointsNeededForNext) * 100);
}

export function getProgressToNextLevelByXP(xp: number): number {
  const currentLevel = calculateLevelByXP(xp);
  const currentLevelInfo = getLevelInfo(currentLevel);
  const nextLevelInfo = getNextLevelInfo(currentLevel);
  
  if (!nextLevelInfo) return 100;
  
  const xpInCurrentLevel = xp - currentLevelInfo.xpRequired;
  const xpNeededForNext = nextLevelInfo.xpRequired - currentLevelInfo.xpRequired;
  
  return Math.min(100, (xpInCurrentLevel / xpNeededForNext) * 100);
}

export function checkNewTrophies(stats: UserStats): Trophy[] {
  return TROPHIES.filter(
    (trophy) => trophy.requirement(stats) && !stats.trophies.includes(trophy.id)
  );
}

export function addPoints(currentPoints: number, pointsToAdd: number): number {
  return currentPoints + pointsToAdd;
}

export interface UserStats {
  totalPoints: number;
  level: number;
  streak: number;
  longestStreak: number;
  totalHours: number;
  scriptsCreated: number;
  scriptsCompleted: number;
  shotListsCreated: number;
  ideasCreated: number;
  ideasOrganized: number;
  trophies: string[];
  totalXP: number;
  // Campos para conquistas de processo
  sessionsOver25Min: number;
  sessionsWithoutPause: number;
  sessionsWithoutAbandon: number;
  usedStages: string[];
  hadStreakReset: boolean;
}

// DEPRECATED: These functions are kept for backwards compatibility only
// All new code should use Supabase directly via useGamification hook

export function getUserStats(): UserStats {
  // Return empty stats - all data should come from Supabase now
  console.warn('getUserStats is deprecated - use useGamification hook instead');
  return {
    totalPoints: 0,
    level: 1,
    streak: 0,
    longestStreak: 0,
    totalHours: 0,
    scriptsCreated: 0,
    scriptsCompleted: 0,
    shotListsCreated: 0,
    ideasCreated: 0,
    ideasOrganized: 0,
    trophies: [],
    totalXP: 0,
    sessionsOver25Min: 0,
    sessionsWithoutPause: 0,
    sessionsWithoutAbandon: 0,
    usedStages: [],
    hadStreakReset: false,
  };
}

export function saveUserStats(stats: UserStats): void {
  // No-op - kept for backwards compatibility
  console.warn('saveUserStats is deprecated - XP is now saved directly to Supabase');
}

export function awardPoints(points: number, reason: string): UserStats {
  // No-op - kept for backwards compatibility
  console.warn('awardPoints is deprecated - use useProfile().addXP() instead');
  return getUserStats();
}

export function addXP(amount: number): { stats: UserStats; leveledUp: boolean; newLevel?: LevelDefinition } {
  // No-op - kept for backwards compatibility
  console.warn('addXP is deprecated - XP is now managed through Supabase in useSession');
  return { 
    stats: getUserStats(), 
    leveledUp: false
  };
}

export function checkAndAwardTrophies(): Trophy[] {
  // No-op - kept for backwards compatibility
  console.warn('checkAndAwardTrophies is deprecated - trophies are now calculated from Supabase data');
  return [];
}
