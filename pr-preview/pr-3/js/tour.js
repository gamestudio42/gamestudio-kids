// Tour interativo: o mascote Pixo guia a criança, e cada passo só avança quando ela faz a ação.
(function () {
  const { bus } = GSK;

  let steps = [];
  let index = -1;
  let raf = 0;
  let listener = null;
  let built = false;
  let groundCount = 0;

  const STEPS = [
    {
      text: 'Oi! Eu sou o Pixo. Vamos fazer o seu primeiro jogo juntos? Toque no pincel para desenhar!',
      target: '#tab-desenhar',
      wait: 'tab:desenhar',
    },
    {
      text: 'Este é o seu herói! Escolha uma cor e pinte em cima dele para deixar do seu jeito.',
      target: '#pixel-canvas',
      wait: 'pixel:painted',
      when: (d) => d.kind === 'heroi',
    },
    {
      text: 'Ficou lindo! Agora toque nos tijolos para montar a fase.',
      target: '#tab-montar',
      wait: 'tab:montar',
    },
    {
      text: 'Toque no seu herói aqui, e depois toque na fase para colocar ele lá.',
      target: '[data-pal-kind="heroi"]',
      wait: 'level:placed',
      when: (d) => d.kind === 'heroi',
      then: '#level-canvas',
    },
    {
      text: 'Agora escolha o chão e coloque três blocos embaixo do herói.',
      target: '[data-pal-kind="chao"]',
      wait: 'level:placed',
      when: (d) => { if (d.kind === 'chao') groundCount += d.many ? 3 : 1; return groundCount >= 3; },
      then: '#level-canvas',
    },
    {
      text: 'Tudo pronto! Toque no botão verde para jogar o seu jogo.',
      target: '#tab-jogar',
      wait: 'tab:jogar',
    },
    {
      text: 'Use as setas para andar e a seta para cima para pular. Você fez um jogo!',
      target: '.touch-controls',
      next: true,
      finish: true,
    },
  ];

  // Tour para mundos que já vêm com a fase pronta: jogar primeiro, depois mudar
  function stepsPronto(p) {
    const w = GSK.WORLDS[p.mundo] || GSK.WORLDS.nuvem;
    return [
      {
        text: `Oi! Eu sou o Pixo. Este jogo já está pronto! Toque no botão verde para jogar.`,
        target: '#tab-jogar',
        wait: 'tab:jogar',
      },
      {
        text: `Use as setas para andar e a seta para cima para pular. Pegue as estrelas e chegue até ${w.chegada}!`,
        target: '.touch-controls',
        next: true,
      },
      {
        text: 'Agora vamos deixar o jogo do seu jeito. Toque no pincel.',
        target: '#tab-desenhar',
        wait: 'tab:desenhar',
      },
      {
        text: `Este é o ${w.heroi}, o seu herói. Escolha uma cor e pinte em cima dele.`,
        target: '#pixel-canvas',
        wait: 'pixel:painted',
        when: (d) => d.kind === 'heroi',
      },
      {
        text: 'Ficou lindo! Agora toque nos tijolos para mudar a fase.',
        target: '#tab-montar',
        wait: 'tab:montar',
      },
      {
        text: 'Escolha um desenho aqui do lado e toque na fase para colocar onde quiser.',
        target: '#level-palette',
        wait: 'level:placed',
        then: '#level-canvas',
      },
      {
        text: 'Toque no botão verde e veja como ficou!',
        target: '#tab-jogar',
        wait: 'tab:jogar',
      },
      {
        text: 'Você mudou o seu jogo! Pode desenhar e montar quanto quiser.',
        target: '.touch-controls',
        next: true,
        finish: true,
      },
    ];
  }

  const $ = (id) => document.getElementById(id);

  function build() {
    if (built) return;
    built = true;
    GSK.drawPixels($('mascot-canvas'), GSK.MASCOT, GSK.PALETTES.nuvem);
    $('tour-skip').addEventListener('click', () => stop(true));
    $('tour-speak').addEventListener('click', () => { if (steps[index]) GSK.say(steps[index].text); });
    $('tour-next').addEventListener('click', () => advance());
  }

  function start() {
    build();
    const p = GSK.app.project;
    steps = p && p.pronto ? stepsPronto(p) : STEPS;
    groundCount = 0;
    $('tour').hidden = false;
    document.body.classList.add('touring');
    window.dispatchEvent(new Event('resize'));
    index = -1;
    advance();
    cancelAnimationFrame(raf);
    const follow = () => { position(); raf = requestAnimationFrame(follow); };
    raf = requestAnimationFrame(follow);
  }

  function advance() {
    if (listener) { bus.off(listener.name, listener.fn); listener = null; }
    const prev = steps[index];
    if (prev && prev.finish) { finish(); return; }
    index++;
    const s = steps[index];
    if (!s) { finish(); return; }
    $('tour-text').textContent = s.text;
    $('tour-next').hidden = !s.next;
    $('tour-next').textContent = s.finish ? '⭐ Terminar' : '👍 Continuar';
    $('tour-panel').classList.remove('pop');
    void $('tour-panel').offsetWidth;
    $('tour-panel').classList.add('pop');
    GSK.say(s.text);
    if (s.wait) {
      const fn = (data) => {
        if (s.when && !s.when(data || {})) return;
        bus.off(s.wait, fn); // avança uma vez só, mesmo que o evento se repita
        listener = null;
        GSK.sound.pop();
        setTimeout(advance, 350);
      };
      listener = { name: s.wait, fn };
      bus.on(listener.name, listener.fn);
    }
  }

  // Para onde a mãozinha aponta: depois que a criança escolhe na paleta, aponta para a fase
  function pointAt(s) {
    if (s.then) {
      const picked = document.querySelector(s.target);
      if (picked && (picked.classList.contains('on') || picked.querySelector('.on'))) return s.then;
    }
    return s.target;
  }

  function position() {
    const s = steps[index];
    const ring = $('tour-ring'), hand = $('tour-hand');
    const el = s && document.querySelector(pointAt(s));
    if (!el || el.offsetParent === null) { ring.style.display = 'none'; hand.style.display = 'none'; return; }
    const r = el.getBoundingClientRect();
    ring.style.display = hand.style.display = 'block';
    ring.style.left = r.left - 6 + 'px';
    ring.style.top = r.top - 6 + 'px';
    ring.style.width = r.width + 12 + 'px';
    ring.style.height = r.height + 12 + 'px';
    // alvo grande (a tela de desenho ou a fase): a mão fica no meio dele; alvo pequeno: logo abaixo
    const big = r.width > 220 || r.height > 220;
    hand.style.left = r.left + r.width / 2 - 18 + 'px';
    hand.style.top = (big ? r.top + r.height / 2 : r.bottom + 4) + 'px';
  }

  function finish() {
    const p = GSK.app.project;
    if (p) { p.tourDone = true; GSK.app.save(); }
    stop(false);
    GSK.app.toast('⭐ Primeiro jogo feito! Parabéns!');
    GSK.sound.win();
  }

  function stop(skipped) {
    if (listener) { bus.off(listener.name, listener.fn); listener = null; }
    cancelAnimationFrame(raf);
    index = -1;
    $('tour').hidden = true;
    document.body.classList.remove('touring');
    window.dispatchEvent(new Event('resize'));
    GSK.hush();
    if (skipped && GSK.app.project) { GSK.app.project.tourDone = true; GSK.app.save(); }
  }

  GSK.Tour = { start, stop, active: () => index >= 0 };
})();
