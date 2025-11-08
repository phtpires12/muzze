// Sistema de gamificação - pontos, níveis e troféus

export interface UserStats {
  totalPoints: number;
  level: number;
  streak: number;
  totalHours: number;
  scriptsCreated: number;
  shotListsCreated: number;
  ideasCreated: number;
  trophies: string[];
}

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
    points: 200,
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
    points: 150,
  },
];

export function calculateLevel(points: number): number {
  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (points >= LEVELS[i].minPoints) {
      return LEVELS[i].level;
    }
  }
  return 1;
}

export function getLevelInfo(level: number) {
  return LEVELS.find((l) => l.level === level) || LEVELS[0];
}

export function getNextLevelInfo(currentLevel: number) {
  return LEVELS.find((l) => l.level === currentLevel + 1);
}

export function getProgressToNextLevel(points: number, currentLevel: number): number {
  const currentLevelInfo = getLevelInfo(currentLevel);
  const nextLevelInfo = getNextLevelInfo(currentLevel);
  
  if (!nextLevelInfo) return 100;
  
  const pointsInCurrentLevel = points - currentLevelInfo.minPoints;
  const pointsNeededForNext = nextLevelInfo.minPoints - currentLevelInfo.minPoints;
  
  return Math.min(100, (pointsInCurrentLevel / pointsNeededForNext) * 100);
}

export function checkNewTrophies(stats: UserStats): Trophy[] {
  return TROPHIES.filter(
    (trophy) => trophy.requirement(stats) && !stats.trophies.includes(trophy.id)
  );
}

export function addPoints(currentPoints: number, pointsToAdd: number): number {
  return currentPoints + pointsToAdd;
}

export function getUserStats(): UserStats {
  const stored = localStorage.getItem("userStats");
  if (stored) {
    return JSON.parse(stored);
  }
  
  return {
    totalPoints: 0,
    level: 1,
    streak: 0,
    totalHours: 0,
    scriptsCreated: 0,
    shotListsCreated: 0,
    ideasCreated: 0,
    trophies: [],
  };
}

export function saveUserStats(stats: UserStats): void {
  localStorage.setItem("userStats", JSON.stringify(stats));
}

export function awardPoints(points: number, reason: string): UserStats {
  const stats = getUserStats();
  stats.totalPoints = addPoints(stats.totalPoints, points);
  stats.level = calculateLevel(stats.totalPoints);
  
  // Check for new trophies
  const newTrophies = checkNewTrophies(stats);
  newTrophies.forEach((trophy) => {
    stats.trophies.push(trophy.id);
    stats.totalPoints += trophy.points;
  });
  
  saveUserStats(stats);
  return stats;
}
