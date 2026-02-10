
# Correcao do icone de lixeira no calendario + botao de excluir no Modo Visualizacao

## Problema 1: Icone de lixeira inconsistente no calendario

O botao de exclusao (lixeira) nos cards do calendario usa `opacity-0 group-hover/card:opacity-100`, o que deveria funcionar no hover. O problema provavel e que o container do carousel tem `overflow: hidden`, e o botao de lixeira esta posicionado com `position: absolute` no canto do card. Em celulas estreitas do calendario mensal, o icone pode estar sendo cortado pelo overflow do container pai.

### Solucao

- Mover o botao de lixeira para DENTRO do fluxo do card (nao absoluto), ou ajustar o posicionamento para garantir que fique visivel dentro da area do card sem ser cortado pelo overflow.
- Alternativa mais simples: trocar de `absolute` para inline no header do card (ao lado do titulo), garantindo que nunca seja cortado.

**Arquivo**: `src/components/calendar/CalendarDay.tsx`

Mudancas especificas:
- Reposicionar o botao de lixeira de `absolute top-1 right-1` para inline no layout do card, ao lado do emoji/titulo
- Manter o comportamento de `opacity-0 group-hover/card:opacity-100` para aparecer apenas no hover

## Problema 2: Botao de excluir na pagina Modo Visualizacao (ContentView)

Adicionar um botao de lixeira no canto superior direito do header da pagina `/content/view/:scriptId`, conforme indicado pelo quadrado verde na screenshot.

### Solucao

- Adicionar um botao com icone `Trash2` no header, ao lado direito (onde esta o espaco vazio atualmente)
- Ao clicar, abrir um `AlertDialog` de confirmacao (mesmo padrao usado no CalendarDay)
- Ao confirmar, deletar o script do banco de dados e redirecionar para `/calendario`

**Arquivo**: `src/pages/ContentView.tsx`

Mudancas especificas:
1. Importar `Trash2` do lucide-react
2. Adicionar estado `showDeleteConfirm` 
3. Adicionar botao de lixeira no header (linha 362-373), posicionado no flex-1 div ou apos ele
4. Adicionar AlertDialog de confirmacao com logica de exclusao (delete do supabase + toast + navigate)

## Detalhes tecnicos

### CalendarDay.tsx - Reposicionamento da lixeira

A lixeira vai sair de posicao absoluta para ficar inline no header do card, dentro do flex layout existente:

```text
Antes:  [emoji] [titulo............] 
         [lixeira absoluta no canto]

Depois: [emoji] [titulo...] [lixeira]
```

### ContentView.tsx - Botao de excluir no header

```text
[ <- ] [ Modo Visualizacao ] ............. [ lixeira ]
```

A logica de exclusao:
1. Mostrar AlertDialog de confirmacao
2. Chamar `supabase.from('scripts').delete().eq('id', scriptId)`
3. Toast de sucesso
4. `navigate('/calendario')`

## Arquivos afetados

| Arquivo | Mudanca |
|---------|---------|
| `src/components/calendar/CalendarDay.tsx` | Reposicionar lixeira de absoluto para inline no card |
| `src/pages/ContentView.tsx` | Adicionar botao de excluir no header + AlertDialog de confirmacao |
