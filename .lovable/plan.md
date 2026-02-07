
# Plano 1 de 5: Reposicionar Música acima do Shotlist

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
