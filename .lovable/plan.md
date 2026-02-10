

# Fix: Mover script de limpeza do head para o body

## Problema

O plugin `vite-plugin-pwa` usa o parser `parse5` para injetar tags no HTML (manifest, SW registration). Esse parser esta tendo problemas ao processar o `<script>` inline dentro do `<head>`, gerando o erro `end-tag-without-matching-open-element` no `</head>`.

## Solucao

Mover o script de limpeza de emergencia de dentro do `<head>` para o inicio do `<body>`, antes do `<div id="root">`. Isso resolve o conflito com o parse5 e o script continua executando antes de qualquer modulo JS.

## Mudanca

### `index.html`

- Remover o bloco `<script>...</script>` das linhas 36-55 (dentro do `<head>`)
- Adicionar o mesmo bloco logo apos `<body>`, antes de `<div id="root">`

Resultado:

```html
  </head>
  <body>
    <script>
    // Emergency SW cleanup v1 - runs before ANY JS modules
    (function(){
      if(!('serviceWorker' in navigator))return;
      navigator.serviceWorker.getRegistrations().then(function(regs){
        var dominated=false;
        for(var i=0;i<regs.length;i++){
          if(regs[i].active&&regs[i].active.scriptURL&&
             regs[i].active.scriptURL.indexOf('firebase-messaging-sw.js')!==-1){
            dominated=true;regs[i].unregister();
          }
        }
        if(dominated&&'caches' in window){
          caches.keys().then(function(n){
            return Promise.all(n.map(function(k){return caches.delete(k);}));
          }).then(function(){location.reload();});
        }else if(dominated){location.reload();}
      });
    })();
    </script>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
```

O script continua executando antes do React montar, mantendo a mesma funcionalidade de limpeza de emergencia.

## Arquivo modificado

| Arquivo | Mudanca |
|---------|---------|
| `index.html` | Mover script inline do `<head>` para o inicio do `<body>` |

