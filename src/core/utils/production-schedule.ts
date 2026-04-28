import { format, subDays, isBefore, isEqual } from 'date-fns';
import { CreativeStage } from '@/types/workspace';
import { StageSlaConfig } from '@/core/hooks/useProductionSettings';

export interface ScheduledStage {
  stage: CreativeStage;
  scheduled_date: string; // yyyy-MM-dd
}

export interface BackwardScheduleResult {
  schedule: ScheduledStage[];
  isCompressed: boolean; // true se o prazo é mais curto que a SLA total
  totalSLADays: number;
  availableDays: number;
}

/**
 * Calcula o "cronograma reverso" de um conteúdo.
 * 
 * A partir da data de publicação (publishDate) e dos dias de trabalho do usuário,
 * distribui cada etapa do workflow de trás pra frente.
 * 
 * @param publishDate - Data de publicação (yyyy-MM-dd)
 * @param stages - Etapas do workflow do conteúdo, na ordem normal (ex: ['script', 'review', 'recording', 'editing'])
 * @param slaConfig - Tempo médio (em dias) que cada etapa leva
 * @param workDays - Dias da semana que o usuário trabalha (0=Dom, 1=Seg, ... 6=Sáb)
 * @param today - Data atual (default: hoje)
 */
export function generateBackwardSchedule(
  publishDate: string,
  stages: CreativeStage[],
  slaConfig: StageSlaConfig,
  workDays: number[],
  today: Date = new Date()
): BackwardScheduleResult {
  // Remove 'ideation' da lista pois é a etapa de criação inicial (não é agendável)
  const schedulableStages = stages.filter(s => s !== 'ideation');

  if (schedulableStages.length === 0) {
    return { schedule: [], isCompressed: false, totalSLADays: 0, availableDays: 0 };
  }

  // Calcula o total de dias necessários contando apenas dias de trabalho
  const totalSLADays = schedulableStages.reduce((acc, stage) => {
    return acc + Math.max(1, slaConfig[stage] || 1);
  }, 0);

  // Gera o cronograma de trás pra frente
  const pubDate = parseLocalDate(publishDate);
  const todayDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());

  // Conta dias de trabalho disponíveis entre hoje e a data de publicação (exclusive)
  let availableDays = 0;
  let cursor = subDays(pubDate, 1);
  while (!isBefore(cursor, todayDate)) {
    if (workDays.includes(cursor.getDay())) {
      availableDays++;
    }
    cursor = subDays(cursor, 1);
  }

  const isCompressed = availableDays < totalSLADays;

  // Distribui as etapas de trás pra frente a partir da data anterior à publicação
  // Respeitando os dias de trabalho, de forma proporcional se comprimido
  const schedule: ScheduledStage[] = [];
  let currentDate = subDays(pubDate, 1);

  // Percorre as etapas de trás pra frente
  const reversedStages = [...schedulableStages].reverse();
  
  for (let i = 0; i < reversedStages.length; i++) {
    const stage = reversedStages[i];
    const stageBaseDays = Math.max(1, slaConfig[stage] || 1);

    // Se comprimido, calcula dias proporcionais para esta etapa
    const stageDays = isCompressed
      ? Math.max(1, Math.round((stageBaseDays / totalSLADays) * availableDays))
      : stageBaseDays;

    // Encontra o último dia de trabalho disponível para esta etapa
    // A etapa começa `stageDays` dias úteis antes do cursor
    for (let d = 0; d < stageDays; d++) {
      while (!workDays.includes(currentDate.getDay())) {
        currentDate = subDays(currentDate, 1);
      }
      if (d === 0) {
        // O primeiro dia útil livre é a data desta etapa (mais próxima da publicação)
        schedule.unshift({
          stage,
          scheduled_date: format(currentDate, 'yyyy-MM-dd'),
        });
      }
      if (d < stageDays - 1) {
        currentDate = subDays(currentDate, 1);
      }
    }
    // Avança um dia pra a próxima etapa
    currentDate = subDays(currentDate, 1);
  }

  return {
    schedule,
    isCompressed,
    totalSLADays,
    availableDays,
  };
}

/**
 * Parses a date string (yyyy-MM-dd) to a Date at midnight local time.
 * Avoids timezone shift issues from `new Date('yyyy-MM-dd')`.
 */
export function parseLocalDate(dateStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day);
}
