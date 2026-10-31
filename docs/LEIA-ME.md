# Game Studio Kids (leia-me em português)

Engine de jogos 2D para crianças a partir de 5 anos, rodando no navegador.
Esta versão cobre o ciclo básico do roteiro: **desenhar → montar a fase → jogar**, com o tour interativo do mascote Pixo.

## Como abrir

Não precisa instalar nada. Abra o `index.html` no navegador (Chrome, Edge, Firefox ou Safari).

Para testar no tablet na mesma rede, sirva a pasta e abra o endereço do computador:

```bash
python3 -m http.server 8000
# no tablet: http://IP-DO-COMPUTADOR:8000
```

## O que tem

- **Tela inicial:** "Novo jogo" com "Começar com o tour" marcado por padrão, lista de jogos salvos, exportar (📤) e importar arquivos `.gsk`.
- **Tour do Pixo:** 7 passos que só avançam quando a criança faz a ação, com mãozinha apontando, voz em português e botão para ouvir de novo. Pode ser pulado e refeito pelo botão ❓.
- **Desenhar:** pixel art 16x16 com lápis, borracha, balde, conta-gotas, espelho, desfazer (também Ctrl+Z) e limpar; paleta de 16 cores do estilo Nuvem (projetos antigos continuam com a paleta clássica). Todo desenho do jogo pode ser mudado, e dá para criar novos escolhendo o tipo.
  - **Tipos:** herói, chão, plataforma (dá para subir por baixo), coisa para pegar, inimigo que anda, inimigo que voa, espinho, mola (pulo bem alto), chegada, enfeite, nuvem do céu e morro do fundo. Os dois últimos não vão na fase: aparecem no cenário.
  - **Segundo desenho:** herói (parado e andando), inimigos (dois passos) e chão (em cima e por baixo: o chão que tem outro chão em cima usa o desenho "por baixo"). O primeiro desenho aparece clarinho atrás para ajudar.
- **Montar:** fase de 40x12 células; escolher um desenho e tocar ou arrastar na grade; apagar; "Encher o chão"; botões para rolar a fase.
- **Jogar:** plataforma com vista de lado. Setas ou A/D andam, seta para cima, W ou espaço pulam; botões na tela para tablet. Pegar estrelas soma pontos, pular em cima do inimigo derrota ele, encostar nele, no espinho ou cair volta ao começo, a mola joga o herói bem alto, a chegada vence (sem chegada, pegar tudo vence).
- **Modo grande / pequeno:** botão 🔤/👶 mostra ou esconde os textos dos botões (modo pequeno = só ícones).

- **Acabamento ("juice"):** partículas ao pegar moedas, pular, cair e derrotar inimigos; "+1" e "POW!" flutuando; tela treme ao levar dano; herói estica ao pular e amassa ao cair; colinas e nuvens em camadas; moedas girando, bandeira e flores balançando; confete e até 3 estrelas na vitória; música de fundo com botão 🎵 para desligar; botões e telas com animação. Quem ativa "reduzir movimento" no sistema vê tudo sem animação.

Tudo é salvo automaticamente no próprio navegador (`localStorage`). Depois de carregada, a página funciona sem internet; só a fonte Nunito vem da internet, e sem ela o app usa a fonte do sistema.

## Ajudas para os pequenos

- **Desfazer e refazer na aba Montar** (botões ↩️ ↪️, ou Ctrl+Z e Ctrl+Y), inclusive depois de "Limpar fase" e "Encher o chão".
- **Ponto de controle automático:** ao encostar num inimigo, num espinho ou cair num buraco, o herói volta ao último chão seguro onde pisou, e não ao começo da fase. Depois ele pisca por um tempo e não se machuca.
- **Perguntas com ícones:** apagar um jogo, apagar um desenho ou limpar a fase mostra um ícone grande, lê a pergunta em voz alta e tem botões ✅ e ❌.
- **Lembrete de cópia:** quando um jogo com mais de 10 minutos de trabalho muda, a tela inicial sugere "Guardar cópia". Isso baixa todos os jogos num arquivo `.gsk` só, que volta inteiro pelo "Importar jogo". "Depois" esconde o lembrete por um dia.
- **Tour dos mundos prontos:** jogar primeiro, depois pintar o herói, mudar a fase e jogar de novo. "Do zero" mantém o tour de montar a primeira fase.

## Mundos (modelos de projeto)

Na tela inicial, a criança escolhe um cartão com desenho: **Nuvem** (Pom), **Bosque** (Broto) ou **Noite** (Bip). Cada mundo tem a sua paleta, o seu céu, todos os desenhos prontos e uma fase montada para jogar e mudar, com buracos, mola, plataformas, estrelas, inimigos, espinhos e chegada. **Do zero** abre o mundo Nuvem com a fase vazia. O tour funciona em qualquer cartão.

## Estilo Nuvem

Personagens e cenário próprios: o Pom (herói), o Espeto (inimigo), o Buu (fantasminha que voa), estrela, balão de chegada, flor, plataforma de nuvem, espinhos, cogumelo-mola, nuvens e morros lilás. Cores pastel com contorno ameixa em vez de preto. Quem pinta o herói começa em cima do Pom e deixa ele do seu jeito.

## Estrutura

```
index.html          telas e botões
css/style.css       visual (toque grande, tablet em pé e deitado)
js/data.js          paleta, tipos, desenhos iniciais, modelo do projeto, salvamento, sons e voz
js/pixel-editor.js  editor de pixel art
js/level-editor.js  editor de fase
js/game.js          motor do jogo (física simples de plataforma)
js/tour.js          tour interativo do Pixo
js/app.js           liga tudo: início, abas, modos, importar e exportar
```

O projeto da criança é um único JSON (`desenhos`, `fase` e configurações), igual ao descrito no documento de arquitetura. A fase guarda `view: 'lado'` para receber outras vistas (cima, isométrico, low poly) depois.

## Diferenças em relação ao documento

- Para abrir com dois cliques e sem instalar nada, o protótipo usa JavaScript puro sem etapa de build (o documento propõe TypeScript + Vite). Dá para migrar quando o protótipo for validado com crianças.
- O salvamento usa `localStorage` em vez de IndexedDB, suficiente para jogos deste tamanho.
- Os blocos de comportamento (etapa 3) ainda não existem: cada tipo de desenho já tem um comportamento pronto.

## Instalar como app (funciona sem internet)

Para instalar, o Game Studio precisa ser aberto por um endereço `http://` ou `https://` (abrindo o arquivo direto, ele funciona, mas não instala).

1. Nesta pasta: `python3 -m http.server 8000`, ou publique a pasta em qualquer hospedagem de site estático.
2. Abra `http://localhost:8000` (no computador) ou `http://IP-DO-COMPUTADOR:8000` (no tablet).
3. Toque em **📲 Instalar no aparelho** na tela inicial (Chrome, Edge, Android). No iPad/iPhone: Compartilhar > Adicionar à Tela de Início.

Depois de aberto uma vez, o app abre pelo ícone e funciona sem internet. Os jogos continuam salvos no aparelho.
Fora do `localhost`, instalar no tablet exige `https://` (por exemplo, uma hospedagem gratuita de site estático).
Arquivos: `manifest.webmanifest`, `sw.js` (guarda os arquivos), `js/pwa.js` (botão Instalar e aviso de internet), `icons/`.
