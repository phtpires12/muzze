-- Atualizar default de min_streak_minutes para 25 minutos
ALTER TABLE profiles 
ALTER COLUMN min_streak_minutes SET DEFAULT 25;

-- Atualizar usuários existentes que ainda têm 20 min
UPDATE profiles 
SET min_streak_minutes = 25 
WHERE min_streak_minutes = 20;