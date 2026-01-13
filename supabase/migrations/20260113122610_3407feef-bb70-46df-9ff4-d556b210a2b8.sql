-- Adicionar coluna para rastrear se houve pausa durante a sessão
ALTER TABLE stage_times ADD COLUMN had_pause boolean DEFAULT false;

-- Adicionar coluna para rastrear se sessão foi abandonada (aba fechada sem encerrar)
ALTER TABLE stage_times ADD COLUMN was_abandoned boolean DEFAULT false;