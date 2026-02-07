

# Plano 3 de 5: Remover Campo Notas de Edição

## Contexto

O campo "Notas de Edição" foi considerado redundante pelo usuário, pois anotações podem ser feitas diretamente nas cenas individuais.

## Problema Atual

O componente `EditingNotesPanel` está sendo exibido na Mesa de Edição, ocupando espaço sem agregar valor.

## Solução

1. Remover a importação do `EditingNotesPanel`
2. Remover o estado e handlers relacionados a `editing_notes`
3. Remover a renderização do componente

## Arquivos a Modificar

| Arquivo | Alteração |
|---------|-----------|
| `src/pages/EditingWorkspace.tsx` | Remover referências ao EditingNotesPanel |

## Resultado Esperado

A Mesa de Edição ficará mais limpa, sem o painel de Notas de Edição.

---

## Próximos Problemas (armazenados para resolver depois)

| # | Problema | Status |
|---|----------|--------|
| 1 | Reposicionar Música acima do Shotlist | ✅ Concluído |
| 2 | Adicionar link de referência do roteiro | ✅ Concluído |
| 3 | Remover campo Notas de Edição | 📋 Este plano |
| 4 | Reformular header/botão voltar | 📋 Pendente |
| 5 | Bolinhas de progresso não funcionam | 📋 Pendente |
