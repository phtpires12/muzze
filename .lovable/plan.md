

## Adicionar tipo de conteúdo "Anúncio"

O "Anúncio" funciona como Reels/TikTok — sem workflow especial, usa o workflow clássico por padrão e o usuário pode alterar livremente.

### Locais a alterar

**1. Listas de CONTENT_TYPES (3 arquivos):**
- `src/components/content/IdeaForm.tsx` — adicionar `{ value: "Anúncio", label: "Anúncio" }`
- `src/components/content/brainstorm/IdeaCard.tsx` — adicionar `{ value: "Anúncio", label: "Anúncio", icon: Megaphone }` (importar `Megaphone` do lucide-react)
- `src/components/content/brainstorm/IdeaDetail.tsx` — adicionar `"Anúncio"` ao array

**2. Filtros do calendário (`src/pages/calendario/CalendarioEditorialPage.tsx`):**
- Adicionar `<SelectItem value="Anúncio">Anúncio</SelectItem>` nos dois selects de filtro (desktop linha ~668, mobile linha ~702)

**3. Seletor de plataforma no onboarding (`src/components/content/onboarding/shared/PlatformSelector.tsx`):**
- Adicionar `{ id: "Anúncio", name: "Anúncio", icon: "📢" }` ao array PLATFORMS

Nenhuma mudança de banco de dados necessária — `content_type` é um campo text livre.

