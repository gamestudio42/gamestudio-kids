// Dados fixos, modelo do projeto, salvamento, sons e voz.
// Scripts clássicos (sem módulos) para funcionar abrindo o index.html direto.
(function () {
  const GSK = (window.GSK = {});

  GSK.SIZE = 16; // desenhos de 16x16
  GSK.TILE = 16; // cada célula da fase tem 16 pixels

  // Paletas de 16 cores. Projetos novos usam "nuvem"; os antigos continuam com "classica".
  GSK.PALETTES = {
    nuvem: [
      '#4a2f55', '#2a1d33', '#fffaf3', '#ffa8c0',
      '#ec7398', '#ffd6e2', '#ffd36e', '#f0a23c',
      '#a8e6b4', '#62b88d', '#ffe3c8', '#f2b896',
      '#cbb6ff', '#9278e0', '#9fd0ff', '#6b9be0',
    ],
    bosque: [
      '#2b1e16', '#1a120c', '#fff6e0', '#a8743f',
      '#7a4f2a', '#d9a066', '#8fc94f', '#4f8a3a',
      '#c6e87a', '#e0533a', '#a3302a', '#a9a395',
      '#6f6a60', '#ffd45e', '#e8932c', '#3d5a3a',
    ],
    noite: [
      '#0d0b1e', '#000000', '#ffffff', '#38f2ff',
      '#1b8fb8', '#b8ff5c', '#5fbf2a', '#ff4fd8',
      '#a12ca8', '#e6e8ff', '#9aa0c8', '#3a3566',
      '#262247', '#ffe45c', '#ff9d2e', '#1a1733',
    ],
    classica: [
      '#000000', '#1d2b53', '#7e2553', '#008751',
      '#ab5236', '#5f574f', '#c2c3c7', '#fff1e8',
      '#ff004d', '#ffa300', '#ffec27', '#00e436',
      '#29adff', '#83769c', '#ff77a8', '#ffccaa',
    ],
  };
  // A paleta em uso: o mesmo array é atualizado ao abrir um projeto
  GSK.PALETTE = GSK.PALETTES.nuvem.slice();
  GSK.paletteName = 'nuvem';
  GSK.usePalette = function (name) {
    if (!GSK.PALETTES[name]) name = 'classica';
    GSK.paletteName = name;
    GSK.PALETTE.splice(0, 16, ...GSK.PALETTES[name]);
  };

  // frames: nome do segundo desenho, quando o tipo tem um. cenario: não vai na fase, aparece no fundo.
  GSK.KINDS = {
    heroi: { icone: '🦸', nome: 'Herói', frames: ['Parado', 'Andando'] },
    chao: { icone: '🧱', nome: 'Chão', frames: ['Em cima', 'Por baixo'] },
    plataforma: { icone: '☁️', nome: 'Plataforma' },
    moeda: { icone: '⭐', nome: 'Para pegar' },
    inimigo: { icone: '👾', nome: 'Inimigo', frames: ['Passo 1', 'Passo 2'] },
    voador: { icone: '👻', nome: 'Inimigo que voa', frames: ['Voo 1', 'Voo 2'] },
    perigo: { icone: '🌵', nome: 'Espinho' },
    mola: { icone: '🍄', nome: 'Mola' },
    saida: { icone: '🎈', nome: 'Chegada' },
    enfeite: { icone: '🌼', nome: 'Enfeite' },
    ceu: { icone: '🌥️', nome: 'Nuvem do céu', cenario: true },
    fundo: { icone: '⛰️', nome: 'Morro do fundo', cenario: true },
  };
  GSK.KIND_ORDER = ['heroi', 'chao', 'plataforma', 'moeda', 'inimigo', 'voador', 'perigo', 'mola', 'saida', 'enfeite', 'ceu', 'fundo'];

  // Converte linhas de texto em pixels: '.' = transparente, 0-f = cor da paleta
  function fromRows(rows) {
    const px = [];
    for (const r of rows) for (const ch of r) px.push(ch === '.' ? -1 : parseInt(ch, 16));
    return px;
  }
  GSK.fromRows = fromRows;

  const HERO_GUIDE_ROWS = [
    '................',
    '................',
    '.....xxxxxx.....',
    '....xxxxxxxx....',
    '....xxxxxxxx....',
    '....xxxxxxxx....',
    '.....xxxxxx.....',
    '......xxxx......',
    '...xxxxxxxxxx...',
    '...xxxxxxxxxx...',
    '...xxxxxxxxxx...',
    '....xxxxxxxx....',
    '....xxxxxxxx....',
    '....xxx..xxx....',
    '....xxx..xxx....',
    '...xxxx..xxxx...',
  ];
  GSK.HERO_GUIDE = HERO_GUIDE_ROWS.join('').split('').map((c) => (c === 'x' ? 1 : 0));

  // Desenhos iniciais no estilo Nuvem (cores da paleta "nuvem"). b = segundo desenho.
  const STARTERS = {
    heroi: {
      a: [
        '................',
        '...00......00...',
        '..0440....0440..',
        '..034300003430..',
        '.03533333333440.',
        '.05333333333330.',
        '0533333312331240',
        '0333333311331140',
        '0333333443333340',
        '0333333333303340',
        '0333333333333340',
        '.04333333333440.',
        '.04433333334440.',
        '..044444444440..',
        '...0440..0440...',
        '....00....00....',
      ],
      b: [
        '................',
        '................',
        '...00......00...',
        '..0440....0440..',
        '..034300003430..',
        '.03533333333440.',
        '0533333312331240',
        '0333333311331140',
        '0333333443333340',
        '0333333333303340',
        '0333333333333340',
        '.04333333333440.',
        '.04433333334440.',
        '..044444444440..',
        '..0440....0440..',
        '...00......00...',
      ],
    },
    chao: {
      a: [
        '0000000000000000',
        '0888888888888880',
        '8888888888888888',
        '9889888998889889',
        '9999999999999999',
        '0990099909990090',
        'aa0aaa00aaaaa0aa',
        'aaaaaaaaaaaaaaaa',
        'aaabaaaaaaabaaaa',
        'aabbaaaaaabbaaaa',
        'aaaaaaaaaaaaaaaa',
        'aaaaaabaaaaaaaaa',
        'aaaaabbaaaaaaaba',
        'aaaaaaaaaaaaabba',
        'aaaaaaaaaaaaaaaa',
        'baaaaaaabaaaaaab',
      ],
      b: [
        'aaaaaaaaaaaaaaaa',
        'aaabaaaaaaabaaaa',
        'aabbaaaaaabbaaaa',
        'aaaaaaaaaaaaaaaa',
        'aaaaaabaaaaaaaaa',
        'aaaaabbaaaaaaaba',
        'aaaaaaaaaaaaabba',
        'aaaaaaaaaaaaaaaa',
        'abaaaaaaaaaaaaaa',
        'bbaaaaabaaaaaaaa',
        'aaaaaabbaaaaabaa',
        'aaaaaaaaaaaabbaa',
        'aaaaaaaaaaaaaaaa',
        'aaabaaaaaaaaaaaa',
        'aabbaaaaabaaaaaa',
        'aaaaaaaabbaaaaaa',
      ],
    },
    plataforma: {
      a: [
        '..0000....0000..',
        '.02222000022220.',
        '0222222222222220',
        '0222222222222c20',
        '0222222222222cc0',
        '.0cc222ccc22cc0.',
        '..00ccc000ccc0..',
        '....0000..000...',
        '................',
        '................',
        '................',
        '................',
        '................',
        '................',
        '................',
        '................',
      ],
    },
    moeda: {
      a: [
        '................',
        '.......00.......',
        '......0660......',
        '......0660......',
        '.....066670.....',
        '0000062666700000',
        '0666626666677770',
        '.06666666666770.',
        '..066666666670..',
        '...0666666670...',
        '...0666776670...',
        '..066670076670..',
        '..06670..07670..',
        '.06770....07770.',
        '.000........000.',
        '................',
      ],
    },
    inimigo: {
      a: [
        '................',
        '.......0........',
        '...0..0c0..0....',
        '...0c00cc00c00..',
        '..0cccccccccc0..',
        '.00cccccccccd00.',
        '0ccc11cccc11cdd0',
        '.0cc21cccc12cd0.',
        '0ccc11cccc11cdd0',
        '.0cccccccccccd0.',
        '0cccc000000cddd0',
        '.0cccccccccddd0.',
        '..0dddddddddd0..',
        '...000dddd000...',
        '....0bb0.0bb0...',
        '....0000.0000...',
      ],
      b: [
        '................',
        '.......0........',
        '...0..0c0..0....',
        '...0c00cc00c00..',
        '..0cccccccccc0..',
        '.00cccccccccd00.',
        '0ccc11cccc11cdd0',
        '.0cc21cccc12cd0.',
        '0ccc11cccc11cdd0',
        '.0cccccccccccd0.',
        '0cccc000000cddd0',
        '.0cccccccccddd0.',
        '..0dddddddddd0..',
        '...000dddd000...',
        '...0bb0..0bb0...',
        '...0000..0000...',
      ],
    },
    voador: {
      a: [
        '................',
        '.....000000.....',
        '....02222220....',
        '...02222222e0...',
        '..0222222222e0..',
        '..0221222122e0..',
        '..0221122112e0..',
        '..0222222222e0..',
        '..0224222242e0..',
        '..0222200222e0..',
        '..0222222222e0..',
        '..0e22222222e0..',
        '..0ee2eee2eee0..',
        '..0ee0ee0ee0e0..',
        '...00.00.00.0...',
        '................',
      ],
      b: [
        '................',
        '.....000000.....',
        '....02222220....',
        '...02222222e0...',
        '..0222222222e0..',
        '..0221222122e0..',
        '..0221122112e0..',
        '..0222222222e0..',
        '..0224222242e0..',
        '..0222200222e0..',
        '..0222222222e0..',
        '..0e22222222e0..',
        '..0ee2eee2eee0..',
        '..0e0ee0ee0ee0..',
        '...0.00.00.00...',
        '................',
      ],
    },
    perigo: {
      a: [
        '................',
        '................',
        '................',
        '................',
        '................',
        '................',
        '................',
        '..0....0....0...',
        '.050..050..050..',
        '.0540.0540.0540.',
        '053400534005340.',
        '0534405344053440',
        '0533405334053340',
        '0000000000000000',
        '0999999999999990',
        '0000000000000000',
      ],
    },
    mola: {
      a: [
        '................',
        '................',
        '................',
        '................',
        '................',
        '................',
        '....00000000....',
        '..005335333300..',
        '.05322333322340.',
        '0533223333223440',
        '0444444444444440',
        '.00000000000000.',
        '.....066660.....',
        '....07777770....',
        '.....066660.....',
        '....00000000....',
      ],
    },
    saida: {
      a: [
        '.......0000.....',
        '......0eeee0....',
        '.....0e2eeee0...',
        '.....0eeeeef0...',
        '.....0eeeeff0...',
        '......0ffff0....',
        '.......0ff0.....',
        '........00......',
        '........0.......',
        '.........0......',
        '........0.......',
        '.........0......',
        '........0.......',
        '.......000......',
        '......09990.....',
        '.....0999990....',
      ],
    },
    enfeite: {
      a: [
        '................',
        '....00....00....',
        '...0660..0660...',
        '..067760067760..',
        '..067760067760..',
        '...0660..0660...',
        '....00.00.00....',
        '.......090......',
        '...00..090..00..',
        '..0890.090.0980.',
        '..0889009009880.',
        '...08899999880..',
        '....008898800...',
        '......08880.....',
        '.......090......',
        '................',
      ],
    },
    ceu: {
      a: [
        '................',
        '................',
        '................',
        '................',
        '.....eeee.......',
        '....e2222e.ee...',
        '..eee22222e22e..',
        '.e222222222222e.',
        'e22222222222222e',
        'e22222222222222e',
        '.e522225522252e.',
        '..eeeeeeeeeeee..',
        '................',
        '................',
        '................',
        '................',
      ],
    },
    fundo: {
      a: [
        '................',
        '................',
        '................',
        '................',
        '................',
        '................',
        '......cccc......',
        '....cccccccc....',
        '..cccccccccccc..',
        '.ccccccccccccccc',
        'cccccccccccccccc',
        'ccccccdccccccccc',
        'ccccccccccccdccc',
        'ccdccccccccccccc',
        'cccccccccdcccccc',
        'cccccccccccccccc',
      ],
    },
  };

  const STARTERS_BOSQUE = {
    heroi: {
      a: [
        '........00......',
        '.......0860.....',
        '...00.08670.....',
        '..08600670......',
        '..0667070.......',
        '...000000000....',
        '...0555555530...',
        '..055555555530..',
        '..0555512551230.',
        '..0555511551130.',
        '..0555555555330.',
        '...05555500030..',
        '...04333333340..',
        '....043333340...',
        '....0440.0440...',
        '....000...000...',
      ],
      b: [
        '................',
        '........00......',
        '.......0860.....',
        '...00.08670.....',
        '..08600670......',
        '..0667070.......',
        '...000000000....',
        '...0555555530...',
        '..055555555530..',
        '..0555512551230.',
        '..0555511551130.',
        '..0555555555330.',
        '...05555500030..',
        '...04333333340..',
        '...0440..0440...',
        '...000....000...',
      ],
    },
    chao: {
      a: [
        '..00...00....00.',
        '.0680.0680..0680',
        '0666606666006666',
        '6666666666666666',
        '6766667666667666',
        '7776777776777767',
        '0770770777077070',
        'bbb0bbbbb0bbb0bb',
        'bbbbbbbbbbbbbbbb',
        'bbcbbbbbbbbcbbbb',
        'bcc0bbbbbbbcc0bb',
        'bbbbbbbbbbbbbbbb',
        '0000000000000000',
        'bbbbbbbb0bbbbbbb',
        'bbbcbbbbbbbbbcbb',
        'bbccbbb0bbbbccbb',
      ],
      b: [
        'bbbbbbbb0bbbbbbb',
        'bbbcbbbbbbbbbcbb',
        'bbccbbb0bbbbccbb',
        'bbbbbbbbbbbbbbbb',
        '0000000000000000',
        'bbbbb0bbbbbbb0bb',
        'bbcbbbbbbcbbbbbb',
        'bccbbbbbccbbbbbb',
        'bbbbbbbbbbbbbbbb',
        '0000000000000000',
        'bbbbbbbb0bbbbbbb',
        'bbbbbcbbbbbbcbbb',
        'bbbbccbbbbbccbbb',
        'bbbbbbbbbbbbbbbb',
        '0000000000000000',
        'bbb0bbbbbbb0bbbb',
      ],
    },
    plataforma: {
      a: [
        '0000000000000000',
        '0555555555555350',
        '0333333333333330',
        '0000000000000000',
        '.03.........30..',
        '.00.........00..',
        '................',
        '................',
        '................',
        '................',
        '................',
        '................',
        '................',
        '................',
        '................',
        '................',
      ],
    },
    moeda: {
      a: [
        '................',
        '........00......',
        '.......030......',
        '.....0004000....',
        '....033333330...',
        '...03535353530..',
        '...04444444440..',
        '....0000000000..',
        '....035555540...',
        '....055255540...',
        '....052555540...',
        '....055555440...',
        '.....0555440....',
        '......05440.....',
        '.......000......',
        '................',
      ],
    },
    inimigo: {
      a: [
        '................',
        '................',
        '................',
        '.....000000.....',
        '...0099999a00...',
        '..09929999aaa0..',
        '.0929999a99aaa0.',
        '.0999999a99aaa0.',
        '00999999a999aa00',
        '0110000000000000',
        '0121cccccccccc0.',
        '01110cccccccc0..',
        '.000.00000000...',
        '...010.010.010..',
        '..010.010.010...',
        '................',
      ],
      b: [
        '................',
        '................',
        '................',
        '.....000000.....',
        '...0099999a00...',
        '..09929999aaa0..',
        '.0929999a99aaa0.',
        '.0999999a99aaa0.',
        '00999999a999aa00',
        '0110000000000000',
        '0121cccccccccc0.',
        '01110cccccccc0..',
        '.000.00000000...',
        '..010.010.010...',
        '.010.010.010....',
        '................',
      ],
    },
    voador: {
      a: [
        '................',
        '................',
        '..00........00..',
        '.0dd0......0dd0.',
        '0dedd0.00.0dded0',
        '0ddedd0330ddedd0',
        '.0dddd0330dddd0.',
        '..0ddd0330ddd0..',
        '...00003300000..',
        '..0ddd0330ddd0..',
        '.0dedd0.00.0ded0',
        '.0ddd0......0dd0',
        '..000........00.',
        '................',
        '................',
        '................',
      ],
      b: [
        '................',
        '................',
        '................',
        '................',
        '...00.00.00.....',
        '..0de003300de0..',
        '..0ddd0330ddd0..',
        '..0ddd0330ddd0..',
        '...00003000000..',
        '..0ddd0330ddd0..',
        '..0ded0.00.0de0.',
        '...000......00..',
        '................',
        '................',
        '................',
        '................',
      ],
    },
    perigo: {
      a: [
        '................',
        '................',
        '................',
        '................',
        '................',
        '................',
        '................',
        '..0....0....0...',
        '.080..080..080..',
        '.0870.0870.0870.',
        '086700867008670.',
        '0867708677086770',
        '0866708667086670',
        '0000000000000000',
        '0444444444444440',
        '0000000000000000',
      ],
    },
    mola: {
      a: [
        '................',
        '................',
        '................',
        '................',
        '................',
        '................',
        '....00000000....',
        '..002dd2dddd00..',
        '.02d22dddd22de0.',
        '02dd22dddd22dee0',
        '0eeeeeeeeeeeeee0',
        '.00000000000000.',
        '.....055550.....',
        '....03333330....',
        '.....055550.....',
        '....00000000....',
      ],
    },
    saida: {
      a: [
        '....00000000....',
        '...0333333330...',
        '..044444444440..',
        '...0000000000...',
        '....0ddddde0....',
        '....0d2ddde0....',
        '....0ddddde0....',
        '....0edddee0....',
        '...0000000000...',
        '......0440......',
        '......0340......',
        '......0340......',
        '......0340......',
        '......0340......',
        '.....033440.....',
        '....00000000....',
      ],
    },
    enfeite: {
      a: [
        '................',
        '................',
        '......0000......',
        '....00999900....',
        '...0992299990...',
        '..0999299929a0..',
        '..0999999999a0..',
        '..0a9929999aa0..',
        '...0000000000...',
        '.....022220.....',
        '.....0222c0.....',
        '.....0222c0.....',
        '.....0222c0.....',
        '...67022cc076...',
        '..677700007776..',
        '................',
      ],
    },
    ceu: {
      a: [
        '................',
        '................',
        '................',
        '................',
        '.....bbbb.......',
        '....b2222b.bb...',
        '..bbb22222b22b..',
        '.b222222222222b.',
        'b22222222222222b',
        'b22222222222222b',
        '.b22222bb222b2b.',
        '..bbbbbbbbbbbb..',
        '................',
        '................',
        '................',
        '................',
      ],
    },
    fundo: {
      a: [
        '....7...........',
        '...777..........',
        '...777.......7..',
        '..77777.....777.',
        '..77777.....777.',
        '.7777777...77777',
        '.7777777...77777',
        '777777777.777777',
        '7777777777777777',
        '7777f77777777777',
        '77777777777f7777',
        '7777777777777777',
        '7f77777777777777',
        '7777777f77777777',
        '7777777777777777',
        '7777777777777777',
      ],
    },
  };

  const STARTERS_NOITE = {
    heroi: {
      a: [
        '................',
        '.......00.......',
        '.......07.......',
        '....00000000....',
        '...099999999a0..',
        '...090000000a0..',
        '...090333230a0..',
        '...090333340a0..',
        '...090000000a0..',
        '...0a999999aa0..',
        '....000aa00000..',
        '...0bbbbbbbbb0..',
        '..09b3bbbb3bbba0',
        '...0bbbbbbbb0...',
        '...0aa0..0aa0...',
        '...000....000...',
      ],
      b: [
        '................',
        '................',
        '.......00.......',
        '.......07.......',
        '....00000000....',
        '...099999999a0..',
        '...090000000a0..',
        '...090333230a0..',
        '...090333340a0..',
        '...090000000a0..',
        '...0a999999aa0..',
        '....000aa00000..',
        '..09bbbbbbbbba0.',
        '...0b3bbbb3bb0..',
        '....0aa0.0aa0...',
        '....000..000....',
      ],
    },
    chao: {
      a: [
        '3333333333333333',
        '4444444444444444',
        'bbbbbbbcbbbbbbbc',
        'bbbbbbbcbbbbbbbc',
        'bbbbbbbcbbbbbbbc',
        'cccccccccccccccc',
        'bbbcbbbbbbbcbbbb',
        'bbbcbbbbbbbcbbbb',
        'bbbcbbbbbbbcbbbb',
        'cccccccccccccccc',
        'bbbbbbbcbbbbbbbc',
        'bbbbbbbcbbbbbbbc',
        'bbbbbbbcbbbbbbbc',
        'cccccccccccccccc',
        'bbbcbbbbbbbcbbbb',
        'bbbcbbbbbbbcbbbb',
      ],
      b: [
        'bbbcbbbbbbbcbbbb',
        'bbbcbbbbbbbcbbbb',
        'cccccccccccccccc',
        'bbbbbbbcbbbbbbbc',
        'bbbbbbbcbbbbbbbc',
        'bbbbbbbcbbbbbbbc',
        'cccccccccccccccc',
        'bbbcbbbbbbbcbbbb',
        'bbbcbbbbbbbcbbbb',
        'bbbcbbbbbbbcbbbb',
        'cccccccccccccccc',
        'bbbbbbbcbbbbbbbc',
        'bbbbbbbcbbbbbbbc',
        'bbbbbbbcbbbbbbbc',
        'cccccccccccccccc',
        'bbbcbbbbbbbcbbbb',
      ],
    },
    plataforma: {
      a: [
        '3333333333333333',
        '0444444444444440',
        '0999999999999990',
        '0aaaaaaaaaaaaaa0',
        '.00..........00.',
        '................',
        '................',
        '................',
        '................',
        '................',
        '................',
        '................',
        '................',
        '................',
        '................',
        '................',
      ],
    },
    moeda: {
      a: [
        '................',
        '.......00.......',
        '......0560......',
        '.....055660.....',
        '.....025660.....',
        '....02556660....',
        '....05555660....',
        '...0255566660...',
        '...0555566660...',
        '....05566660....',
        '....05566660....',
        '.....056660.....',
        '.....056660.....',
        '......0660......',
        '.......00.......',
        '................',
      ],
    },
    inimigo: {
      a: [
        '................',
        '................',
        '................',
        '.......00.......',
        '......0d0.......',
        '.......0........',
        '.....000000.....',
        '...00777777700..',
        '..0777777777770.',
        '..0771277127770.',
        '.07711771177780.',
        '.07777777777880.',
        '.08777777777880.',
        '..088888888880..',
        '...0000000000...',
        '................',
      ],
      b: [
        '................',
        '................',
        '................',
        '................',
        '.......00.......',
        '......0d0.......',
        '.......0........',
        '...0000000000...',
        '..0777777777780.',
        '.07771277127770.',
        '.07711771177780.',
        '.07777777777880.',
        '0887777777778880',
        '0888888888888880',
        '.00000000000000.',
        '................',
      ],
    },
    voador: {
      a: [
        '................',
        '...00......00...',
        '..0780....0870..',
        '...0880000080...',
        '....08888880....',
        '...0882222880...',
        '..088222222880..',
        '..082221122280..',
        '..082211112280..',
        '..082221122280..',
        '..088222222880..',
        '...0888888880...',
        '....00088000....',
        '......0780......',
        '.......00.......',
        '................',
      ],
      b: [
        '................',
        '................',
        '...00......00...',
        '..0780....0870..',
        '...0880000080...',
        '....08888880....',
        '...0882222880...',
        '..088222222880..',
        '..082221122280..',
        '..082211112280..',
        '..082221122280..',
        '..088222222880..',
        '...0888888880...',
        '....00088000....',
        '......0780......',
        '.......00.......',
      ],
    },
    perigo: {
      a: [
        '................',
        '................',
        '................',
        '................',
        '................',
        '................',
        '................',
        '..0....0....0...',
        '.020..020..020..',
        '.0240.0240.0240.',
        '023400234002340.',
        '0234402344023440',
        '0233402334023340',
        '0000000000000000',
        '0bbbbbbbbbbbbbb0',
        '0000000000000000',
      ],
    },
    mola: {
      a: [
        '................',
        '................',
        '................',
        '................',
        '................',
        '................',
        '....00000000....',
        '..002772777700..',
        '.02722777722780.',
        '0277227777227880',
        '0888888888888880',
        '.00000000000000.',
        '.....0dddd0.....',
        '....0eeeeee0....',
        '.....0dddd0.....',
        '....00000000....',
      ],
    },
    saida: {
      a: [
        '.....000000.....',
        '...0077777700...',
        '..077000000770..',
        '.0700......0070.',
        '.070........070.',
        '070..........070',
        '070..........070',
        '070..........070',
        '070..........070',
        '070..........070',
        '070..........070',
        '.070........070.',
        '.0700......0070.',
        '..077000000770..',
        '...0888888880...',
        '..0aaaaaaaaaa0..',
      ],
    },
    enfeite: {
      a: [
        '.......00.......',
        '......0dd0......',
        '......0de0......',
        '.......00.......',
        '.......00.......',
        '.......0a0......',
        '.......0a0......',
        '.......0a0......',
        '.......0a0......',
        '.......0a0......',
        '.......0a0......',
        '.......0a0......',
        '.......0a0......',
        '......0aaa0.....',
        '.....0aaaaa0....',
        '....00000000....',
      ],
    },
    ceu: {
      a: [
        '................',
        '..d.........d...',
        '................',
        '......0000......',
        '.....0dddd0.....',
        '....0ddde0......',
        '....0dde0.......',
        '....0dde0.......',
        '....0ddde0......',
        '.....0dddd0.....',
        '......0000......',
        '..........d.....',
        '..d.............',
        '................',
        '................',
        '................',
      ],
    },
    fundo: {
      a: [
        '................',
        '................',
        '..bb............',
        '..bb......cc....',
        '.bbbb.....cc....',
        '.b7bb....cccc...',
        '.bbbb....cdcc...',
        '.bb7b.bb.cccc...',
        '.bbbb.bb.ccdc.bb',
        '.b7bbbbbbbccccbb',
        'bbbbbb7bbbccccbb',
        'bbbbbbbbbbbcdcbb',
        'bb7bbbbbbbbcccbb',
        'bbbbbbb7bbbbbbbb',
        'bbbbbbbbbbbbbbbb',
        'bbbbbbbbbbbbbbbb',
      ],
    },
  };

  // Mundos: cada um tem paleta, céu e desenhos iniciais próprios
  GSK.WORLDS = {
    nuvem: { nome: 'Nuvem', heroi: 'Pom', chegada: 'o balão', sky: ['#c9e6ff', '#ffe1ef'], starters: STARTERS },
    bosque: { nome: 'Bosque', heroi: 'Broto', chegada: 'a lanterna', sky: ['#bfe3d6', '#f6e3b8'], starters: STARTERS_BOSQUE },
    noite: { nome: 'Noite', heroi: 'Bip', chegada: 'o portal', sky: ['#120f2e', '#3b1a5e'], starters: STARTERS_NOITE },
  };
  GSK.WORLD_ORDER = ['nuvem', 'bosque', 'noite'];
  GSK.sky = (p) => (GSK.WORLDS[p && p.mundo] || GSK.WORLDS.nuvem).sky;

  // Pixo, o mascote do tour, desenhado com a paleta Nuvem
  GSK.MASCOT = fromRows([
    '......00........',
    '.....0670.......',
    '......00........',
    '.......0........',
    '....00000000....',
    '...0eeeeeeee0...',
    '..0e5eeeeeeef0..',
    '.0e5eeeeeeeeef0.',
    '.0eee12eee12ef0.',
    '.0eee11eee11ef0.',
    '.0e4eeeeeee4ef0.',
    '.0eeeee001eeef0.',
    '..0eeeeeeeeef0..',
    '...0ffeeeeff0...',
    '....0f0..0f0....',
    '....000..000....',
  ]);

  GSK.uid = () => Math.random().toString(36).slice(2, 10);
  GSK.blankPixels = () => new Array(GSK.SIZE * GSK.SIZE).fill(-1);

  GSK.newSprite = function (kind, blank, world) {
    const st = !blank && (GSK.WORLDS[world] || GSK.WORLDS.nuvem).starters[kind];
    const sp = { id: GSK.uid(), kind, pixels: st ? fromRows(st.a) : GSK.blankPixels(), guide: kind === 'heroi' };
    if (GSK.KINDS[kind].frames) sp.pixels2 = st && st.b ? fromRows(st.b) : null;
    return sp;
  };

  // Novo projeto. Com "pronto", já vem uma fase montada para jogar e mudar.
  GSK.newProject = function (name, world, pronto) {
    world = GSK.WORLDS[world] ? world : 'nuvem';
    const w = 40, h = 12;
    const sprites = GSK.KIND_ORDER.map((k) => GSK.newSprite(k, false, world));
    const level = { w, h, view: 'lado', cells: new Array(w * h).fill(null) };
    if (pronto) buildLevel(level, (k) => sprites.find((s) => s.kind === k).id);
    return {
      id: GSK.uid(),
      name,
      version: 1,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      tourDone: false,
      paleta: world,
      mundo: world,
      pronto: !!pronto,
      sprites,
      level,
    };
  };

  // Fase pronta: chão com buracos, mola, plataformas, estrelas, inimigos, espinhos e chegada
  function buildLevel(lv, id) {
    const put = (x, y, k) => { lv.cells[y * lv.w + x] = id(k); };
    const ground = (x0, x1) => { for (let x = x0; x <= x1; x++) { put(x, 10, 'chao'); put(x, 11, 'chao'); } };
    ground(0, 13); ground(17, 27); ground(30, 39);
    put(2, 9, 'heroi');
    [[4, 9], [20, 9], [37, 9]].forEach(([x, y]) => put(x, y, 'enfeite'));
    [[6, 9], [7, 9], [8, 9], [14, 4], [15, 4], [24, 9], [34, 5]].forEach(([x, y]) => put(x, y, 'moeda'));
    put(11, 9, 'mola');
    for (let x = 13; x <= 16; x++) put(x, 5, 'plataforma');
    for (let x = 32; x <= 35; x++) put(x, 6, 'plataforma');
    put(22, 9, 'inimigo');
    put(26, 6, 'voador');
    put(33, 9, 'perigo'); put(34, 9, 'perigo');
    put(38, 9, 'saida');
  }

  // ---------- Salvamento no navegador ----------
  const KEY = 'gsk.projects';
  function readAll() {
    try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { return {}; }
  }
  function writeAll(all) {
    try { localStorage.setItem(KEY, JSON.stringify(all)); return true; } catch (e) { return false; }
  }
  GSK.Storage = {
    list() { return Object.values(readAll()).sort((a, b) => b.updatedAt - a.updatedAt); },
    get(id) { return readAll()[id] || null; },
    save(p) { const all = readAll(); all[p.id] = p; return writeAll(all); },
    remove(id) { const all = readAll(); delete all[id]; writeAll(all); },
    pref(name, value) {
      try {
        if (value === undefined) return localStorage.getItem('gsk.' + name);
        localStorage.setItem('gsk.' + name, value);
      } catch (e) { return null; }
    },
  };

  // Confere se um arquivo importado tem o formato de um projeto
  GSK.validProject = function (p) {
    return p && typeof p === 'object' && Array.isArray(p.sprites) && p.level &&
      Array.isArray(p.level.cells) && p.level.cells.length === p.level.w * p.level.h &&
      p.sprites.every((s) => GSK.KINDS[s.kind] && Array.isArray(s.pixels) && s.pixels.length === 256 &&
        (!s.pixels2 || (Array.isArray(s.pixels2) && s.pixels2.length === 256)));
  };

  // ---------- Eventos ----------
  const handlers = {};
  GSK.bus = {
    on(name, fn) { (handlers[name] = handlers[name] || []).push(fn); },
    off(name, fn) { handlers[name] = (handlers[name] || []).filter((f) => f !== fn); },
    emit(name, data) { (handlers[name] || []).slice().forEach((fn) => fn(data)); },
  };

  // ---------- Desenho dos sprites ----------
  const cache = new Map();
  // frame 2 usa pixels2 quando existe; senão, o primeiro desenho
  GSK.spriteCanvas = function (sprite, frame) {
    const two = frame === 2 && sprite.pixels2 && sprite.pixels2.some((v) => v >= 0);
    const pixels = two ? sprite.pixels2 : sprite.pixels;
    const empty = pixels.every((v) => v < 0);
    const key = GSK.paletteName + (empty ? 'guide' : pixels.join(','));
    const ck = sprite.id + (two ? ':2' : '');
    const hit = cache.get(ck);
    if (hit && hit.key === key) return hit.canvas;
    const c = document.createElement('canvas');
    c.width = c.height = GSK.SIZE;
    const ctx = c.getContext('2d');
    for (let i = 0; i < 256; i++) {
      let v = pixels[i];
      if (v < 0 && empty && sprite.guide && GSK.HERO_GUIDE[i]) v = 13; // herói vazio usa o contorno
      if (v < 0) continue;
      ctx.fillStyle = GSK.PALETTE[v];
      ctx.fillRect(i % 16, Math.floor(i / 16), 1, 1);
    }
    cache.set(ck, { key, canvas: c });
    return c;
  };

  // Chão com outro chão em cima usa o desenho "por baixo"
  GSK.groundFrame = function (lv, i, find) {
    const sp = find(lv.cells[i]);
    if (!sp || sp.kind !== 'chao' || i < lv.w) return 1;
    const above = lv.cells[i - lv.w] && find(lv.cells[i - lv.w]);
    return above && above.kind === 'chao' ? 2 : 1;
  };

  // Cor que mais aparece no desenho, para as partículas combinarem com ele
  GSK.mainColor = function (sprite) {
    const n = {};
    sprite.pixels.forEach((v) => { if (v > 1) n[v] = (n[v] || 0) + 1; });
    const best = Object.keys(n).sort((a, b) => n[b] - n[a])[0];
    return best === undefined ? '#ffffff' : GSK.PALETTE[best];
  };

  GSK.drawPixels = function (canvas, pixels, palette) {
    palette = palette || GSK.PALETTE;
    const ctx = canvas.getContext('2d');
    const k = canvas.width / 16;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (let i = 0; i < 256; i++) {
      if (pixels[i] < 0) continue;
      ctx.fillStyle = palette[pixels[i]];
      ctx.fillRect((i % 16) * k, Math.floor(i / 16) * k, k, k);
    }
  };


  // ---------- Sons ----------
  let actx = null;
  function beep(freq, dur, type, slideTo, vol) {
    if (GSK.Storage.pref('som') === 'off') return;
    try {
      actx = actx || new (window.AudioContext || window.webkitAudioContext)();
      const t = actx.currentTime;
      const o = actx.createOscillator();
      const g = actx.createGain();
      o.type = type || 'square';
      o.frequency.setValueAtTime(freq, t);
      if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
      g.gain.setValueAtTime(vol || 0.08, t);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(g).connect(actx.destination);
      o.start(t);
      o.stop(t + dur);
    } catch (e) { /* sem áudio */ }
  }
  GSK.sound = {
    jump: () => beep(300, 0.18, 'square', 600),
    coin: () => { beep(988, 0.08); setTimeout(() => beep(1319, 0.15), 80); },
    hurt: () => beep(220, 0.3, 'sawtooth', 80),
    stomp: () => beep(500, 0.12, 'triangle', 150, 0.12),
    pop: () => beep(660, 0.05, 'triangle', null, 0.05),
    spring: () => beep(260, 0.25, 'triangle', 900, 0.1),
    win: () => [523, 659, 784, 1047].forEach((f, i) => setTimeout(() => beep(f, 0.2, 'square'), i * 130)),
  };

  // ---------- Música de fundo ----------
  // Sequenciador simples: melodia e baixo em notas MIDI (0 = pausa), 8 colcheias por compasso
  const MELODY = [72, 0, 76, 0, 79, 0, 76, 0, 74, 0, 77, 0, 81, 0, 77, 0, 72, 0, 76, 0, 79, 0, 84, 0, 83, 0, 79, 0, 74, 0, 0, 0];
  const BASS = [48, 48, 53, 53, 48, 48, 55, 55];
  const STEP = 60 / 132 / 2; // colcheia a 132 bpm
  const hz = (m) => 440 * Math.pow(2, (m - 69) / 12);
  let musicTimer = 0, nextAt = 0, stepN = 0;
  function tone(freq, t, dur, type, vol) {
    const o = actx.createOscillator(), g = actx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, t);
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(actx.destination);
    o.start(t);
    o.stop(t + dur + 0.02);
  }
  GSK.music = {
    on: () => GSK.Storage.pref('musica') !== 'off',
    start() {
      GSK.music.stop();
      if (!GSK.music.on()) return;
      try {
        actx = actx || new (window.AudioContext || window.webkitAudioContext)();
        if (actx.state === 'suspended') actx.resume();
      } catch (e) { return; }
      nextAt = actx.currentTime + 0.1;
      stepN = 0;
      musicTimer = setInterval(() => {
        while (nextAt < actx.currentTime + 0.25) {
          const m = MELODY[stepN % MELODY.length];
          if (m) tone(hz(m), nextAt, STEP * 0.9, 'square', 0.025);
          if (stepN % 4 === 0) tone(hz(BASS[(stepN / 4) % BASS.length]), nextAt, STEP * 3.5, 'triangle', 0.05);
          nextAt += STEP;
          stepN++;
        }
      }, 60);
    },
    stop() { clearInterval(musicTimer); musicTimer = 0; },
    playing: () => !!musicTimer,
  };

  // ---------- Voz ----------
  GSK.say = function (text) {
    if (!('speechSynthesis' in window) || GSK.Storage.pref('voz') === 'off') return;
    try {
      speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text.replace(/[^\p{L}\p{N}\s.,!?]/gu, ''));
      u.lang = 'pt-BR';
      u.rate = 0.95;
      u.pitch = 1.2;
      const v = speechSynthesis.getVoices().find((x) => x.lang && x.lang.toLowerCase().startsWith('pt'));
      if (v) u.voice = v;
      speechSynthesis.speak(u);
    } catch (e) { /* sem voz */ }
  };
  GSK.hush = function () { try { speechSynthesis.cancel(); } catch (e) { /* nada */ } };
})();
