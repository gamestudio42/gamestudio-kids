// Liga as telas: início, abas do estúdio, modo pequeno/grande, salvar, importar e exportar.
(function () {
  const { Storage, bus } = GSK;
  const $ = (id) => document.getElementById(id);

  let saveTimer = 0;
  let playFrom = 'montar';
  const playMq = window.matchMedia('(max-width: 820px), (max-height: 540px)');
  const app = (GSK.app = {
    project: null,
    tab: null,
    spriteId: null,
    sprite: (id) => app.project.sprites.find((s) => s.id === id),
    save() {
      clearTimeout(saveTimer);
      saveTimer = setTimeout(() => {
        if (!app.project) return;
        app.project.updatedAt = Date.now();
        if (!Storage.save(app.project)) app.toast('⚠️ Não consegui salvar neste navegador.');
      }, 300);
    },
    setTab,
    toast,
  });

  // ---------- Modo pequeno (só ícones) e grande (ícones com texto) ----------
  function applyMode() {
    const big = Storage.pref('modo') !== 'pequeno';
    document.body.classList.toggle('modo-grande', big);
    const label = big ? '🔤 Modo grande' : '👶 Modo pequeno';
    $('mode-toggle-home').textContent = label;
    $('mode-toggle').textContent = big ? '🔤' : '👶';
    $('mode-toggle').title = label;
  }
  function applyMusic() {
    const on = GSK.music.on();
    $('music-toggle').textContent = on ? '🎵' : '🔇';
    $('music-toggle').title = on ? 'Desligar a música' : 'Ligar a música';
    $('music-toggle').classList.toggle('off', !on);
  }
  function toggleMusic() {
    GSK.Storage.pref('musica', GSK.music.on() ? 'off' : 'on');
    applyMusic();
    if (!GSK.music.on()) GSK.music.stop();
    else if (app.tab === 'jogar' && GSK.Play.state() && GSK.Play.state().hero && !GSK.Play.state().done) GSK.music.start();
  }

  function toggleMode() {
    Storage.pref('modo', Storage.pref('modo') === 'pequeno' ? 'grande' : 'pequeno');
    applyMode();
  }

  // ---------- Tela inicial ----------
  function showHome() {
    GSK.Play.stop();
    app.tab = null;
    document.body.classList.remove('play-focus');
    GSK.Tour.stop(false);
    app.project = null;
    $('studio').hidden = true;
    $('home').hidden = false;
    renderHome();
  }

  // Lembrete de cópia: aparece quando um jogo com mais de 10 minutos de trabalho mudou desde a última cópia
  const DAY = 24 * 60 * 60 * 1000;
  function needsBackup(p) { return p.updatedAt - p.createdAt > 10 * 60 * 1000 && p.updatedAt > (p.exportedAt || 0); }
  function renderBackup(projects) {
    const later = Number(Storage.pref('lembrete')) || 0;
    $('backup').hidden = !(projects.some(needsBackup) && Date.now() - later > DAY);
  }

  function renderHome() {
    const list = $('project-list');
    list.innerHTML = '';
    const projects = Storage.list();
    renderBackup(projects);
    $('project-empty').hidden = projects.length > 0;
    projects.forEach((p) => {
      const card = document.createElement('div');
      card.className = 'project-card';
      const open = document.createElement('button');
      open.type = 'button';
      open.className = 'project-open';
      const thumb = document.createElement('canvas');
      thumb.width = thumb.height = 16;
      const hero = p.sprites.find((s) => s.kind === 'heroi') || p.sprites[0];
      GSK.usePalette(p.paleta || 'classica');
      if (hero) thumb.getContext('2d').drawImage(GSK.spriteCanvas(hero), 0, 0);
      open.appendChild(thumb);
      const name = document.createElement('span');
      name.textContent = p.name;
      open.appendChild(name);
      open.addEventListener('click', () => openProject(p, false));
      card.appendChild(open);

      const actions = document.createElement('div');
      actions.className = 'project-actions';
      const exp = document.createElement('button');
      exp.type = 'button';
      exp.className = 'icon-btn small';
      exp.title = 'Exportar';
      exp.textContent = '📤';
      exp.addEventListener('click', () => exportProject(p));
      const del = document.createElement('button');
      del.type = 'button';
      del.className = 'icon-btn small';
      del.title = 'Apagar';
      del.textContent = '🗑️';
      del.addEventListener('click', async () => {
        if (!(await GSK.ask({ icon: '🗑️', text: `Apagar o jogo "${p.name}"?` }))) return;
        Storage.remove(p.id);
        renderHome();
      });
      actions.append(exp, del);
      card.appendChild(actions);
      list.appendChild(card);
    });
  }

  // world: mundo com fase pronta; sem world, começa do zero (Nuvem, fase vazia)
  function newProject(world) {
    const n = Storage.list().length + 1;
    const p = GSK.newProject(`Meu jogo ${n}`, world || 'nuvem', !!world);
    Storage.save(p);
    openProject(p, $('chk-tour').checked);
  }

  function openProject(p, withTour) {
    GSK.usePalette(p.paleta || 'classica');
    app.project = p;
    app.spriteId = (p.sprites.find((s) => s.kind === 'heroi') || p.sprites[0]).id;
    $('home').hidden = true;
    $('studio').hidden = false;
    $('project-name').textContent = p.name;
    // com o tour, começa na fase vazia para o Pixo mostrar o caminho até o pincel
    setTab(withTour ? 'montar' : 'desenhar');
    if (withTour) GSK.Tour.start();
  }

  // ---------- Abas ----------
  function wantsPlayFocus() {
    return app.tab === 'jogar' && !document.body.classList.contains('touring') && playMq.matches;
  }

  function syncPlayFocus() {
    document.body.classList.toggle('play-focus', wantsPlayFocus());
  }

  function setTab(t) {
    if (t === 'jogar' && app.tab && app.tab !== 'jogar') playFrom = app.tab;
    if (app.tab === 'jogar' && t !== 'jogar') GSK.Play.stop();
    app.tab = t;
    ['desenhar', 'montar', 'jogar'].forEach((name) => {
      $('view-' + name).hidden = name !== t;
      $('tab-' + name).classList.toggle('on', name === t);
      $('tab-' + name).setAttribute('aria-selected', name === t);
    });
    if (t === 'desenhar') GSK.PixelEditor.show();
    if (t === 'montar') GSK.LevelEditor.show();
    if (t === 'jogar') GSK.Play.show();
    syncPlayFocus();
    bus.emit('tab:' + t);
  }

  // The other phone can open http(s) addresses that are not this machine's loopback.
  function addressStaysOnThisDevice() {
    if (location.protocol !== 'http:' && location.protocol !== 'https:') return true;
    const host = location.hostname.replace(/^\[|\]$/g, '');
    return host === 'localhost' || host === '127.0.0.1' || host === '::1';
  }

  function openShare() {
    const url = location.href;
    const localOnly = addressStaysOnThisDevice();
    const canvas = $('share-qr');
    $('share-url').textContent = url;
    $('share-text').textContent = localOnly
      ? 'Este endereço só abre neste aparelho.'
      : 'Aponte a câmera do outro celular para este desenho.';
    if (localOnly || !GSK.qr.draw(canvas, url)) {
      canvas.hidden = true;
      if (!localOnly) $('share-text').textContent = 'Este endereço é longo demais para o desenho.';
    } else canvas.hidden = false;
    $('share-send').hidden = localOnly || typeof navigator.share !== 'function';
    if (GSK.Play && GSK.Play.input) {
      GSK.Play.input.left = false;
      GSK.Play.input.right = false;
      GSK.Play.input.jump = false;
    }
    $('share').hidden = false;
    $('share-close').focus();
  }

  function closeShare() {
    $('share').hidden = true;
  }

  async function sendShare() {
    try {
      await navigator.share({ title: 'Game Studio Kids', url: location.href });
    } catch (e) {
      if (!e || e.name !== 'AbortError') app.toast('⚠️ Não consegui enviar o endereço.');
    }
  }

  // ---------- Importar e exportar ----------
  function download(data, name) {
    const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = name;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
  }
  function markExported(list) {
    const now = Date.now();
    list.forEach((p) => { p.exportedAt = now; Storage.save(p); });
  }
  function exportProject(p) {
    const { exportedAt, ...data } = p;
    download(data, p.name.replace(/[^\p{L}\p{N} _-]/gu, '').trim().replace(/\s+/g, '_') + '.gsk');
    markExported([p]);
    renderHome();
  }
  // Todos os jogos num arquivo só (um "pacote" .gsk)
  function exportAll() {
    const projects = Storage.list();
    if (!projects.length) return;
    download({ format: 'gsk-pack', version: 1, projects: projects.map(({ exportedAt, ...p }) => p) },
      `Meus_jogos_${new Date().toISOString().slice(0, 10)}.gsk`);
    markExported(projects);
    renderHome();
    toast('💾 Cópia guardada! Ela está na pasta de downloads.');
  }

  function importFile(file) {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result);
        const list = data && data.format === 'gsk-pack' && Array.isArray(data.projects) ? data.projects : [data];
        if (!list.length || !list.every(GSK.validProject)) throw new Error('formato');
        list.forEach((p) => {
          if (Storage.get(p.id)) p.id = GSK.uid(); // não sobrescreve um jogo que já existe
          p.updatedAt = p.exportedAt = Date.now();
          Storage.save(p);
        });
        renderHome();
        toast(list.length > 1 ? `📥 ${list.length} jogos voltaram!` : '📥 Jogo importado!');
      } catch (e) {
        toast('⚠️ Este arquivo não é um jogo do Game Studio Kids.');
      }
    };
    reader.readAsText(file);
  }

  // ---------- Pergunta com ícones ----------
  // Troca o confirm() do navegador: ícone grande, texto lido em voz alta e botões ✅ / ❌
  GSK.ask = function (o) {
    return new Promise((resolve) => {
      const box = $('ask');
      $('ask-icon').textContent = o.icon || '❓';
      $('ask-text').textContent = o.text;
      box.hidden = false;
      GSK.say(o.text);
      GSK.sound.pop();
      const done = (v) => {
        box.hidden = true;
        $('ask-yes').onclick = $('ask-no').onclick = box.onclick = null;
        GSK.hush();
        resolve(v);
      };
      $('ask-yes').onclick = () => done(true);
      $('ask-no').onclick = () => done(false);
      box.onclick = (e) => { if (e.target === box) done(false); };
      $('ask-no').focus();
    });
  };

  // ---------- Aviso rápido ----------
  let toastTimer = 0;
  function toast(text) {
    const t = $('toast');
    t.textContent = text;
    t.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { t.hidden = true; }, 3200);
  }

  // ---------- Início ----------
  function init() {
    applyMode();
    $('mode-toggle-home').addEventListener('click', toggleMode);
    $('mode-toggle').addEventListener('click', toggleMode);
    applyMusic();
    $('music-toggle').addEventListener('click', toggleMusic);
    $('btn-new').addEventListener('click', () => newProject());
    $('btn-backup').addEventListener('click', exportAll);
    $('btn-backup-later').addEventListener('click', () => { Storage.pref('lembrete', Date.now()); renderHome(); });
    document.querySelectorAll('#worlds [data-world]').forEach((b) => {
      const w = b.dataset.world;
      const sky = GSK.WORLDS[w].sky;
      b.style.background = `linear-gradient(${sky[0]}, ${sky[1]})`;
      if (w === 'noite') b.classList.add('dark');
      // desenha o herói do mundo no cartão
      GSK.usePalette(w);
      const hero = GSK.newSprite('heroi', false, w);
      GSK.drawPixels(b.querySelector('canvas'), hero.pixels);
      b.addEventListener('click', () => newProject(w));
    });
    $('btn-home').addEventListener('click', showHome);
    $('btn-share').addEventListener('click', openShare);
    $('btn-share-studio').addEventListener('click', openShare);
    $('share-close').addEventListener('click', closeShare);
    $('share-send').addEventListener('click', sendShare);
    $('share').addEventListener('click', (e) => { if (e.target === $('share')) closeShare(); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !$('share').hidden) closeShare(); });
    $('btn-play-back').addEventListener('click', () => setTab(playFrom || 'montar'));
    window.addEventListener('resize', syncPlayFocus);
    playMq.addEventListener('change', syncPlayFocus);
    $('btn-tour').addEventListener('click', () => { if (GSK.Tour.active()) GSK.Tour.stop(false); else GSK.Tour.start(); });
    $('project-name').addEventListener('click', () => {
      const name = prompt('Nome do jogo:', app.project.name);
      if (!name || !name.trim()) return;
      app.project.name = name.trim().slice(0, 40);
      $('project-name').textContent = app.project.name;
      app.save();
    });
    document.querySelectorAll('.tab').forEach((b) => b.addEventListener('click', () => setTab(b.dataset.tab)));
    $('file-import').addEventListener('change', (e) => {
      if (e.target.files[0]) importFile(e.target.files[0]);
      e.target.value = '';
    });
    // salva na hora se a página for fechada
    window.addEventListener('pagehide', () => { if (app.project) Storage.save(app.project); });
    renderHome();
  }

  init();
})();
