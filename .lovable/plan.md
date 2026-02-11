
# Correcao: Scripts duplicados criados pelo auto-save do ScriptEditor

## Problema identificado

Quando voce cria um "Novo Roteiro" pelo botao central da navbar (sem scriptId), o **auto-save do ScriptEditor cria um novo script a cada 5 segundos** em vez de atualizar o mesmo.

### Causa raiz

No `ScriptEditor.tsx`, o auto-save (linha 265-349) funciona assim:

1. Se tem `scriptId` -> faz UPDATE (correto)
2. Se NAO tem `scriptId` -> faz INSERT (cria novo script)

Apos o INSERT, o componente atualiza a URL com `window.history.replaceState()` (linha 341), mas isso **nao atualiza o prop `scriptId`** que vem do componente pai (`Session.tsx`). O React Router nao detecta `replaceState` manual.

Resultado: a cada 5 segundos, o auto-save roda, ve que `scriptId` ainda e `undefined`, e cria OUTRO script. Isso explica os 15 scripts duplicados que encontrei no banco de dados de hoje.

### Evidencia no banco

15 scripts "Novo Roteiro" criados hoje entre 14:08 e 14:13, com intervalos de ~5 segundos entre eles. Todos sem `publish_date`, todos com status "draft".

## Solucao (Parte 1 - Duplicacao)

**Arquivo**: `src/components/ScriptEditor.tsx`

Adicionar um `state` local para rastrear o ID do script apos a primeira criacao:

1. Criar `const [createdScriptId, setCreatedScriptId] = useState<string | null>(null)`
2. Usar `const effectiveScriptId = scriptId || createdScriptId` em todo o componente
3. Apos o INSERT bem-sucedido, chamar `setCreatedScriptId(data.id)` -- isso garante que o proximo auto-save fara UPDATE em vez de INSERT
4. Manter o `replaceState` para que a URL tambem fique correta

Mudancas especificas:
- Linha ~51: adicionar state `createdScriptId`
- Linha ~87: criar `effectiveScriptId` derivado
- Linha ~133-137: usar `effectiveScriptId` no `loadScript`
- Linha ~267: usar `effectiveScriptId` na protecao de auto-save
- Linha ~316-342: usar `effectiveScriptId` no fluxo de save (if/else)
- Linha ~340: adicionar `setCreatedScriptId(data.id)` apos INSERT
- Todas as outras referencias a `scriptId` no componente devem usar `effectiveScriptId`

## Solucao (Parte 2 - Limite de 4 conteudos por dia)

**Arquivo**: `src/components/ScriptEditor.tsx` e `src/components/brainstorm/BrainstormWorkspace.tsx`

Antes de criar um novo script, verificar quantos scripts ja existem para aquele dia (hoje, se nao tem `publish_date`):

1. No `handleAutoSave` do ScriptEditor, antes do INSERT: consultar `scripts` filtrando por `publish_date = hoje` e contar. Se >= 4, mostrar toast e nao criar.
2. No `createIdea` do BrainstormWorkspace: mesma verificacao antes do INSERT.

**Arquivo**: `src/pages/CalendarioEditorial.tsx` (se existir logica de criacao la tambem)

Mesma verificacao de limite.

## Ordem de implementacao

Como voce pediu para ir aos poucos:

1. **Primeiro**: corrigir a duplicacao no ScriptEditor (causa raiz do bug principal)
2. **Depois**: adicionar limite de 4 conteudos por dia

Este plano cobre apenas a Parte 1 (correcao da duplicacao). A Parte 2 (limite de 4) sera feita em um proximo passo.
