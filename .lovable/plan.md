

# Correcao de camadas e safe area no Paywall

## Problema atual
O mockup do iPhone (absolute dentro de flex-1) ainda pode sobrepor o texto "Sem cobranca agora" porque a Area 3 (CTA) usa flex-none mas nao tem protecao suficiente. Alem disso, o padding-bottom com safe area nao esta garantindo espaco para o home indicator.

## Mudancas em `Screen25Paywall.tsx`

### Estrutura: trocar flex-col para relative com footer absolute

O container raiz continua `h-[100dvh] overflow-hidden` mas agora o footer CTA sera **absolute bottom-0** em vez de flex-none. Isso garante que ele flutua sobre o mockup sem depender do flex para posicionamento.

```text
<div relative h-[100dvh] w-full overflow-hidden bg-violet-50 dark:bg-background px-6>
  style: paddingTop env(safe-area-inset-top)
  (sem paddingBottom no root - o footer cuida do seu proprio safe area)

  AREA 1 - Header + Titulo (relative z-20, pt-4)
  ├── Pular (Dev) | Restaurar compra
  ├── Logo Muzze
  └── Titulo (mesma posicao visual)

  AREA 2 - Mockup (relative z-10, flex justify-center, mt-2)
  ├── motion.img com:
  │   max-height: 56dvh
  │   width: auto, object-fit: contain
  │   pb-28 no wrapper para reservar espaco do footer
  └── Nao usa position absolute - usa tamanho responsivo controlado

  AREA 3 - Footer CTA (absolute left-0 right-0 bottom-0 z-30)
  ├── padding: px-6 pt-3 pb-[calc(env(safe-area-inset-bottom)+16px)]
  ├── "Sem cobranca agora" com:
  │   relative z-40
  │   inline-flex rounded-full px-4 py-1.5
  │   bg-violet-50 dark:bg-background (mascara opaca)
  ├── Botao "Experimente por R$0,00"
  └── Texto preco
</div>
```

### Detalhes tecnicos

**Container raiz**:
- Trocar `flex flex-col` por apenas `relative`
- Manter `h-[100dvh] overflow-hidden bg-violet-50 dark:bg-background px-6`
- paddingTop: `env(safe-area-inset-top, 0px)` (manter)
- Remover paddingBottom do root (footer cuida)

**Area 1 (Header + Titulo)**:
- Adicionar `relative z-20` (acima do mockup E do footer)
- Manter todo o conteudo igual

**Area 2 (Mockup)**:
- Trocar de `flex-1 relative overflow-hidden` para `relative z-10 flex justify-center`
- Mockup deixa de ser absolute e passa a ser inline com tamanho controlado:
  - `style={{ maxHeight: '56dvh' }}` no img
  - `width: auto, height: auto, objectFit: contain`
- Adicionar `pb-28` no wrapper para reservar espaco para o footer absolute
- O `overflow-hidden` do root ja corta qualquer excesso

**Area 3 (Footer CTA)**:
- Trocar de `flex-none relative z-10` para `absolute left-0 right-0 bottom-0 z-30`
- Adicionar `bg-violet-50 dark:bg-background` (ja tem)
- padding: `px-6 pt-3` + `paddingBottom: calc(env(safe-area-inset-bottom, 0px) + 16px)` via style
- Remover `rounded-t-2xl` (footer ja ocupa toda a largura)

**Mascara do "Sem cobranca agora"**:
- Envolver o texto em div com `relative z-40 inline-flex items-center gap-2 rounded-full px-4 py-1.5 bg-violet-50 dark:bg-background mx-auto`
- Isso cria uma "pilula" opaca atras do texto que cobre o mockup visualmente

### Resultado
- Header e titulo: z-20, sempre acima de tudo
- Mockup: z-10, tamanho controlado por dvh, nunca causa scroll
- Footer CTA: z-30 absolute, colado no bottom com safe area
- Texto "Sem cobranca agora": z-40 com mascara opaca, nunca coberto
- Zero scroll: root overflow-hidden + mockup com max-height em dvh
- Safe area: footer tem padding-bottom com env(safe-area-inset-bottom) + 16px

