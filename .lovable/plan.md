

# Plano 4 de 5: Reformular Header e Botão Voltar

## Contexto

O botão de voltar e o header da Mesa de Edição não seguem o padrão visual das outras páginas de Session (como ShotListRecord e ShotListReview).

## Problema Atual

O header atual usa um estilo inconsistente com ícones e layout diferentes das outras páginas do fluxo de trabalho.

## Solução

Analisar o padrão visual de `ShotListRecord.tsx` e `ShotListReview.tsx` e aplicar o mesmo estilo ao header da Mesa de Edição.

## Arquivos a Analisar

| Arquivo | Motivo |
|---------|--------|
| `src/pages/ShotListRecord.tsx` | Referência de padrão visual |
| `src/pages/ShotListReview.tsx` | Referência de padrão visual |
| `src/pages/EditingWorkspace.tsx` | Aplicar as alterações |

## Resultado Esperado

O header da Mesa de Edição seguirá o mesmo padrão visual das outras páginas de Session.

---

## Próximos Problemas

| # | Problema | Status |
|---|----------|--------|
| 1 | Reposicionar Música acima do Shotlist | ✅ Concluído |
| 2 | Adicionar link de referência do roteiro | ✅ Concluído |
| 3 | Remover campo Notas de Edição | ✅ Concluído |
| 4 | Reformular header/botão voltar | 📋 Este plano |
| 5 | Bolinhas de progresso não funcionam | 📋 Pendente |
