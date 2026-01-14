-- Adicionar plan_type na tabela profiles
ALTER TABLE profiles 
ADD COLUMN plan_type TEXT NOT NULL DEFAULT 'free'
CHECK (plan_type IN ('free', 'pro', 'team'));

CREATE INDEX idx_profiles_plan_type ON profiles(plan_type);

COMMENT ON COLUMN profiles.plan_type IS 'Plano do usuário: free, pro, team';

-- Criar tabela plan_limits para configuração dos planos
CREATE TABLE plan_limits (
  plan_type TEXT PRIMARY KEY,
  weekly_scripts INTEGER NOT NULL,
  cards_per_content INTEGER NOT NULL,
  can_schedule_future BOOLEAN DEFAULT false,
  can_invite_users BOOLEAN DEFAULT false,
  max_guests INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Inserir configurações dos planos
INSERT INTO plan_limits VALUES
  ('free', 3, 3, false, false, 0, now()),
  ('pro', -1, -1, true, true, 3, now()),
  ('team', -1, -1, true, true, 10, now());

-- RLS: Leitura pública (configuração do sistema)
ALTER TABLE plan_limits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read plan limits" ON plan_limits FOR SELECT USING (true);