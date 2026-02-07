
# Plano 2 de 5: Adicionar Link de Referência do Roteiro

## Contexto

O editor precisa de acesso ao link de referência que foi definido durante a criação do roteiro. Este campo (`reference_url`) já existe no banco de dados e é preenchido em outras etapas do workflow.

## Problema Atual

O campo `reference_url` existe na tabela `scripts`, mas não é carregado nem exibido na Mesa de Edição.

## Solução

1. Incluir `reference_url` na query de carregamento do script
2. Criar um componente simples para exibir o link de referência (similar ao MusicPanel)
3. Posicionar abaixo do MusicPanel

## Arquivos a Modificar

| Arquivo | Alteração |
|---------|-----------|
| `src/pages/EditingWorkspace.tsx` | Adicionar `reference_url` à query e criar seção de exibição |

## Resultado Esperado

O editor terá acesso direto ao link de referência do vídeo, podendo clicar e abrir a referência para seguir durante a edição.

---

## Próximos Problemas (armazenados para resolver depois)

| # | Problema | Status |
|---|----------|--------|
| 1 | Reposicionar Música acima do Shotlist | ✅ Concluído |
| 2 | Adicionar link de referência do roteiro | ✅ Este plano |
| 3 | Remover campo Notas de Edição | 📋 Pendente |
| 4 | Reformular header/botão voltar | 📋 Pendente |
| 5 | Bolinhas de progresso não funcionam | 📋 Pendente |

---

# ~~Plano 1 de 5: Reposicionar Música acima do Shotlist~~ ✅ CONCLUÍDO

## Contexto

A Mesa de Edição atualmente exibe os painéis na ordem:
1. Shotlist
2. Música
3. Notas de Edição

O usuário solicitou que a **Música fique acima do Shotlist**, pois é uma informação prioritária para entender o ritmo do vídeo antes de revisar as cenas.

## Problema Atual

No arquivo `src/pages/EditingWorkspace.tsx` (linhas 329-347):

```jsx
<div className="space-y-4">
  {/* Shotlist Panel */}
  <ShotlistPanel ... />

  {/* Music Panel */}
  <MusicPanel ... />

  {/* Notes Panel */}
  <EditingNotesPanel ... />
</div>
```

## Solução

Simplesmente inverter a ordem dos componentes:

```jsx
<div className="space-y-4">
  {/* Music Panel - AGORA PRIMEIRO */}
  <MusicPanel ... />

  {/* Shotlist Panel */}
  <ShotlistPanel ... />

  {/* Notes Panel */}
  <EditingNotesPanel ... />
</div>
```

## Arquivo a Modificar

| Arquivo | Alteração |
|---------|-----------|
| `src/pages/EditingWorkspace.tsx` | Mover `MusicPanel` para antes de `ShotlistPanel` |

## Resultado Esperado

A ordem visual dos painéis será:
1. **Música** (primeira posição - informação prioritária)
2. Shotlist
3. Notas de Edição

---

## Próximos Problemas (armazenados para resolver depois)

| # | Problema | Status |
|---|----------|--------|
| 1 | Reposicionar Música acima do Shotlist | ✅ Este plano |
| 2 | Adicionar link de referência do roteiro | 📋 Pendente |
| 3 | Remover campo Notas de Edição | 📋 Pendente |
| 4 | Reformular header/botão voltar | 📋 Pendente |
| 5 | Bolinhas de progresso não funcionam | 📋 Pendente |
