

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

## Detalhes Técnicos

### 1. Atualizar interface ScriptData

```typescript
interface ScriptData {
  id: string;
  title: string;
  shot_list: string[] | null;
  music_reference: MusicReference | null;
  editing_notes: string | null;
  reference_url: string | null;  // NOVO
}
```

### 2. Atualizar query de carregamento

```typescript
const { data, error } = await supabase
  .from('scripts')
  .select('id, title, shot_list, workflow_template, reference_url')  // ADICIONAR reference_url
  .eq('id', scriptId)
  .single();
```

### 3. Criar seção de exibição do link de referência

```tsx
{/* Reference Link Panel - Se existir */}
{script.reference_url && (
  <div className="bg-card border border-border rounded-lg p-4">
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <ExternalLink className="w-4 h-4 text-blue-500" />
        <span className="text-sm font-medium">Referência</span>
      </div>
      <a
        href={script.reference_url}
        target="_blank"
        rel="noopener noreferrer"
        className="text-sm text-blue-500 hover:text-blue-400 underline truncate max-w-[200px]"
      >
        Abrir referência
      </a>
    </div>
  </div>
)}
```

## Layout Final

```text
┌─────────────────────────────────────────────────────────────────────────┐
│  Header (Mesa de Edição - Process as art)                               │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ 🎵 Música                                    [Abrir no YouTube]  │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ 🔗 Referência                               [Abrir referência]   │   │  ← NOVO
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ 📋 Shotlist                                                      │   │
│  │    [cards das cenas...]                                          │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ [✓ Marcar como Editado]                                          │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

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

