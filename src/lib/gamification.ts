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
];

export interface LevelDefinition {
  level: number;
  name: string;
  xpRequired: number;
  description: string;
  color: string;
  rewards: string[];
}

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
    xpRequired: 1000, 
    description: "Você está construindo sua constância.",
    color: "hsl(142 76% 36%)",
    rewards: ["Badge exclusivo"]
  },
  { 
    level: 3, 
    name: "Criador Consistente", 
    xpRequired: 3000, 
    description: "Você cria mesmo sem motivação.",
    color: "hsl(217 91% 60%)",
    rewards: ["3 dias de Muzze PRO grátis"]
  },
  { 
    level: 4, 
    name: "Artista", 
    xpRequired: 7000, 
    description: "Você transforma processo em hábito.",
    color: "hsl(262 83% 58%)",
    rewards: ["7 dias de Muzze PRO grátis"]
  },
  { 
    level: 5, 
    name: "Mestre da Criatividade", 
    xpRequired: 15000, 
    description: "Você cria sem falhar. Um exemplo raro.",
    color: "hsl(33 100% 50%)",
    rewards: ["15 dias de Muzze PRO grátis"]
  },
  { 
    level: 6, 
    name: "Talento Natural", 
    xpRequired: 30000, 
    description: "Criar é seu estado natural.",
    color: "hsl(0 84% 60%)",
    rewards: ["Acesso a material exclusivo"]
  },
  { 
    level: 7, 
    name: "Lenda Absoluta", 
    xpRequired: 60000, 
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
  totalHours: number;
  scriptsCreated: number;
  shotListsCreated: number;
  ideasCreated: number;
  trophies: string[];
  totalXP: number;
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
    totalHours: 0,
    scriptsCreated: 0,
    shotListsCreated: 0,
    ideasCreated: 0,
    trophies: [],
    totalXP: 0,
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
