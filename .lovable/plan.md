

## Plano: Scroll Seletivo + Ajuste para iPhone 16 com Dynamic Island

### Objetivo
Reestruturar a Tela 13 (BehavioralScience) para que:
1. A imagem do cérebro fique **sempre fixa no topo** (não scrollável)
2. Apenas os **cards de métodos científicos** sejam scrolláveis
3. O botão "Continuar" fique **fixo no rodapé**
4. As proporções se adaptem perfeitamente ao **iPhone 16 Pro com Dynamic Island**

---

### Estrutura Visual Proposta

```text
+------------------------------------------+
|  <- (back button)                        |  FIXO (não scrolla)
+------------------------------------------+
|                                          |
|   Aqui você Cria Conteúdo com base       |  FIXO
|   na Ciência Comportamental.             |
|                                          |
|           [BRAIN IMAGE]                  |  FIXO
|                                          |
+------------------------------------------+
|  +------------------------------------+  |
|  | Método Pomodoro                    |  |  SCROLLÁVEL
|  | Ciclos de 5-25 minutos...          |  |  (apenas esta área)
|  +------------------------------------+  |
|  +------------------------------------+  |
|  | Hábitos Atômicos                   |  |
|  | Micro-compromissos diários...      |  |
|  +------------------------------------+  |
|  +------------------------------------+  |
|  | O Ato Criativo                     |  |
|  | Criatividade surge quando há...    |  |
|  +------------------------------------+  |
+------------------------------------------+
|  +------------------------------------+  |
|  |           Continuar                |  |  FIXO (não scrolla)
|  +------------------------------------+  |
+------------------------------------------+
   ^-- pb-safe para iPhone home indicator
```

---

### Modificações em Screen11BehavioralScience.tsx

**1. Container principal**
- Usar `h-[100dvh]` (altura dinâmica da viewport)
- Adicionar `overflow-hidden` para prevenir scroll no container pai
- Estrutura em flex column com 3 seções distintas

**2. Seção superior (FIXA)**
- Botão voltar
- Título em gradiente
- Imagem do cérebro (light/dark)
- Classe `shrink-0` para não comprimir

**3. Seção central (SCROLLÁVEL)**
- Usar `ScrollArea` do Radix UI (já disponível no projeto)
- Ou simplesmente `overflow-y-auto` com `flex-1 min-h-0`
- Contém apenas os 3 cards de métodos

**4. Seção inferior (FIXA)**
- Botão "Continuar"
- Padding bottom com `pb-safe` para iPhone home indicator
- Classe `shrink-0` para não comprimir

---

### Código Proposto

```tsx
import { ScrollArea } from "@/components/ui/scroll-area";

export const Screen11BehavioralScience = ({
  onContinue,
  onBack,
}: Screen11BehavioralScienceProps) => {
  return (
    <div className="h-[100dvh] bg-secondary/50 dark:bg-background flex flex-col overflow-hidden">
      
      {/* ===== SEÇÃO FIXA: Header + Título + Imagem ===== */}
      <div className="shrink-0 px-6 pt-12 sm:pt-16">
        {/* Back button */}
        <button onClick={onBack} className="...">
          <ChevronLeft className="w-6 h-6" />
        </button>
        
        {/* Title */}
        <motion.h1 className="text-2xl font-bold italic text-center bg-gradient-to-r from-purple-600 to-violet-500 bg-clip-text text-transparent mt-2 mb-4">
          Aqui você Cria Conteúdo com base na Ciência Comportamental.
        </motion.h1>
        
        {/* Brain illustration */}
        <motion.div className="flex justify-center mb-4">
          <img src={brainScienceLight} className="w-full max-w-[200px] dark:hidden" />
          <img src={brainScienceDark} className="w-full max-w-[200px] hidden dark:block" />
        </motion.div>
      </div>
      
      {/* ===== SEÇÃO SCROLLÁVEL: Cards ===== */}
      <ScrollArea className="flex-1 min-h-0 px-6">
        <div className="space-y-3 pb-4">
          {SCIENCE_METHODS.map((method, index) => (
            <Card key={index} className="p-4">
              <h3 className="font-semibold">{method.title}</h3>
              <p className="text-sm text-muted-foreground">{method.description}</p>
              {method.credibility && (
                <p className="text-xs text-muted-foreground/70 italic">{method.credibility}</p>
              )}
            </Card>
          ))}
        </div>
      </ScrollArea>
      
      {/* ===== SEÇÃO FIXA: Botão Continuar ===== */}
      <div className="shrink-0 px-6 pt-4 pb-6 pb-safe">
        <Button onClick={onContinue} variant="gradient-pill" size="lg" className="w-full">
          Continuar
        </Button>
      </div>
      
    </div>
  );
};
```

---

### Ajustes Específicos para iPhone 16 Pro + Dynamic Island

| Aspecto | Solução |
|---------|---------|
| **Dynamic Island** | `pt-12 sm:pt-16` no header (já implementado) |
| **Home Indicator** | `pb-safe` no container do botão |
| **Altura da viewport** | `h-[100dvh]` (viewport dinâmica, exclui barras do browser) |
| **Prevenção de scroll global** | `overflow-hidden` no container pai |
| **Imagem menor** | Reduzir de `max-w-xs` para `max-w-[200px]` para dar mais espaço aos cards |

---

### Diagrama de Comportamento

```text
iPhone 16 Pro (393 x 852 pontos)

+-----------------+
| Dynamic Island  |  <- pt-12/pt-16 compensa isso
+-----------------+
|   [Back] [Title]|
|   [Brain Image] |  <- FIXO (não scrolla)
+-----------------+
|                 |
| [Card 1]    ↑   |
| [Card 2]  scroll|  <- APENAS esta área scrolla
| [Card 3]    ↓   |
|                 |
+-----------------+
| [Continuar]     |  <- FIXO
+-----------------+
| Home Indicator  |  <- pb-safe compensa isso
+-----------------+
```

---

### Arquivos a Modificar

| Arquivo | Ação |
|---------|------|
| `src/components/onboarding/screens/phase1/Screen11BehavioralScience.tsx` | **MODIFICAR** - Reestruturar layout com scroll seletivo |

---

### Seção Técnica

**Por que usar ScrollArea do Radix?**
- Componente já disponível no projeto (`@/components/ui/scroll-area`)
- Scrollbar customizável e consistente entre browsers
- Melhor suporte a touch em dispositivos móveis
- Padrão visual consistente com o resto do app

**Alternativa sem ScrollArea:**
```tsx
<div className="flex-1 min-h-0 overflow-y-auto px-6">
  {/* cards aqui */}
</div>
```

Ambas as abordagens funcionam. O ScrollArea oferece uma scrollbar mais elegante.

**Redução do tamanho da imagem:**
- De `max-w-xs` (320px) para `max-w-[200px]`
- Isso deixa mais espaço vertical para os cards
- A imagem ainda fica bem visível e legível

