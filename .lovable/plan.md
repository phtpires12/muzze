

## Deteccao global de feriados e periodos de ferias com notificacao proativa

### Visao geral

Sistema que detecta feriados e periodos de ferias relevantes para qualquer pais do mundo, usando a timezone do usuario para deduzir o pais e a API publica Nager.Date para buscar feriados. Exibe um dialog proativo na Home sugerindo que o usuario se programe.

### Arquitetura

O sistema funciona em 3 camadas:

1. **Mapeamento timezone para pais** -- Um dicionario interno mapeia timezones IANA para codigos ISO de pais (ex: `America/Sao_Paulo` para `BR`, `Asia/Tokyo` para `JP`). Cobre as principais timezones (~150 entradas). Nao precisa de biblioteca externa.

2. **Edge function como proxy para API de feriados** -- Uma edge function busca feriados na API Nager.Date e cacheia no banco. O frontend nunca chama a API diretamente (evita CORS e excesso de requests).

3. **Dialog proativo na Home** -- Hook verifica se ha feriados proximos e exibe o dialog com opcoes de acao.

### Componentes

**1. Tabela de cache de feriados**

Nova tabela `holiday_cache` para evitar chamadas repetidas a API:

```sql
CREATE TABLE public.holiday_cache (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  country_code TEXT NOT NULL,
  year INTEGER NOT NULL,
  holidays JSONB NOT NULL,
  fetched_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(country_code, year)
);

-- RLS: leitura publica (dados nao sao sensiveis)
ALTER TABLE public.holiday_cache ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read holiday cache"
  ON public.holiday_cache FOR SELECT USING (true);
```

**2. Edge function `get-holidays`**

Nova edge function que:
- Recebe `country_code` e `year` como query params
- Verifica se ja existe no `holiday_cache` (e se foi buscado ha menos de 30 dias)
- Se nao, chama `https://date.nager.at/api/v3/PublicHolidays/{year}/{countryCode}`
- Salva no cache e retorna os feriados
- Retorna array de `{ date, localName, name, types }`

**3. Mapeamento timezone para pais: `src/lib/timezone-country-map.ts`**

Dicionario hardcoded com as principais timezones IANA mapeadas para codigos ISO:
- `America/Sao_Paulo` para `BR`
- `America/New_York` para `US`
- `Europe/London` para `GB`
- `Asia/Tokyo` para `JP`
- `Europe/Lisbon` para `PT`
- (~150 entradas cobrindo todos os paises suportados pela Nager.Date)

Funcao `getCountryFromTimezone(tz: string): string | null` que retorna o codigo do pais.

**4. Periodos culturais de ferias: `src/lib/vacation-periods.ts`**

Dicionario por pais com periodos culturais de ferias conhecidos:
- `BR`: Ferias de julho (1-31 jul), Recesso de fim de ano (20 dez - 5 jan)
- `US`: Summer break (jun-ago), Holiday season (20 dez - 2 jan)
- `JP`: Golden Week (29 abr - 5 mai), Obon (13-16 ago), Year-end (28 dez - 3 jan)
- `PT`: Ferias de verao (jul-ago)
- E mais paises conforme a base de usuarios crescer

Funcao `getUpcomingVacationPeriod(countryCode: string, daysAhead: number)` que retorna o proximo periodo relevante.

**5. Hook `useHolidayAlert.ts`**

- Ao montar, detecta o pais via `profile.timezone` usando o mapeamento
- Chama a edge function para buscar feriados do ano atual
- Verifica se ha feriados nos proximos 5 dias ou feriadoes (feriado + fim de semana) nos proximos 7 dias
- Verifica se ha periodo de ferias se aproximando (14 dias de antecedencia)
- Usa `localStorage` para controle de dismissal (`muzze_holiday_dismissed_{alertId}`)
- Retorna `{ alert, dismiss, remindLater }`

**6. Componente `HolidayAlertDialog.tsx`**

Dialog com:
- Icone de calendario e titulo dinamico ("Feriado a vista!" / "Periodo de ferias se aproxima!")
- Nome do feriado/periodo e data(s) formatadas no idioma local
- Mensagem sugerindo adiantar conteudos
- Tres botoes:
  - "Quero me programar" -- navega para `/calendario`
  - "Ja estou preparado" -- dismiss permanente para esse alerta
  - "Lembrar depois" -- fecha sem gravar (reaparece na proxima sessao)

**7. Integracao na Home (Index.tsx)**

- Importar hook e componente
- Renderizar o dialog apos os modais de streak (prioridade menor)

### Logica de alertas

| Situacao | Antecedencia | Exemplo |
|---|---|---|
| Feriado isolado | 5 dias | "Tiradentes (21/04) esta chegando!" |
| Feriadao (feriado + fds) | 7 dias | "Feriadao de Corpus Christi (4 dias)!" |
| Periodo cultural de ferias | 14 dias | "Ferias de julho estao chegando!" |
| Dentro do periodo | Ao abrir app | "Estamos em periodo de ferias!" |

### Controle de frequencia

- Cada alerta tem ID unico: `holiday_{countryCode}_{date}` ou `vacation_{countryCode}_{period}`
- "Ja estou preparado" grava dismiss no localStorage por 30 dias
- "Lembrar depois" nao grava nada (reaparece na proxima sessao)

### Arquivos criados/alterados

| Arquivo | Acao |
|---|---|
| `src/lib/timezone-country-map.ts` | Criar -- mapeamento timezone IANA para ISO country |
| `src/lib/vacation-periods.ts` | Criar -- periodos culturais de ferias por pais |
| `supabase/functions/get-holidays/index.ts` | Criar -- proxy + cache para Nager.Date API |
| `src/hooks/useHolidayAlert.ts` | Criar -- deteccao e controle de alertas |
| `src/components/HolidayAlertDialog.tsx` | Criar -- componente de dialog |
| `src/pages/Index.tsx` | Alterar -- integrar dialog na Home |
| Migration SQL | Criar -- tabela `holiday_cache` |

### Por que isso funciona worldwide

- A timezone `Asia/Tokyo` mapeia para `JP`, que busca feriados japoneses na API
- A timezone `Europe/Lisbon` mapeia para `PT`, que busca feriados portugueses
- A timezone `America/Sao_Paulo` mapeia para `BR`, que busca feriados brasileiros
- Os periodos culturais sao configurados por pais, nao hardcoded para o Brasil
- A API Nager.Date suporta 100+ paises com feriados atualizados

### Sem dependencias externas no frontend

- O mapeamento timezone-pais e um simples dicionario JS (sem npm package)
- A API e chamada via edge function (sem CORS, com cache)
- Periodos culturais sao dados estaticos por pais
