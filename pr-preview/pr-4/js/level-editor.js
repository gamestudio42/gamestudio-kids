// Editor de fase: escolher um desenho na paleta e tocar na grade para colocar.
(function () {
  const { KINDS, KIND_ORDER, TILE, bus } = GSK;

  let selected = null; // id do desenho ou 'apagar'
  let painting = false;
  let built = false;
  let cell = 40;
  // desfazer e refazer: fotos da fase antes de cada mudança, por projeto
  const history = {};
  const hist = () => (history[app().project.id] = history[app().project.id] || { undo: [], redo: [] });
  let stroke = null; // foto tirada no começo de um toque, guardada só se algo mudar

  function snapshot() { return level().cells.slice(); }
  function remember(cells) {
    const h = hist();
    h.undo.push(cells);
    if (h.undo.length > 60) h.undo.shift();
    h.redo.length = 0;
    syncUndo();
  }
  function restore(from, to) {
    const h = hist();
    if (!h[from].length) return;
    h[to].push(snapshot());
    level().cells = h[from].pop();
    app().save();
    draw();
    syncUndo();
    GSK.sound.pop();
  }
  function syncUndo() {
    const h = hist();
    document.getElementById('btn-level-undo').disabled = !h.undo.length;
    document.getElementById('btn-level-redo').disabled = !h.redo.length;
  }

  const app = () => GSK.app;
  const level = () => app().project.level;
  const cv = () => document.getElementById('level-canvas');

  function build() {
    if (built) return;
    built = true;
    const c = cv();
    c.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      c.setPointerCapture(e.pointerId);
      painting = true;
      stroke = snapshot();
      if (!placeAt(e)) return;
      if (stroke) { remember(stroke); stroke = null; }
    });
    c.addEventListener('pointermove', (e) => {
      if (!painting) return;
      const sp = app().sprite(selected);
      if (sp && sp.kind === 'heroi') return; // o herói é um só
      if (placeAt(e) && stroke) { remember(stroke); stroke = null; }
    });
    const end = () => { painting = false; stroke = null; };
    c.addEventListener('pointerup', end);
    c.addEventListener('pointercancel', end);

    const scroll = document.getElementById('level-scroll');
    document.getElementById('btn-scroll-left').addEventListener('click', () => scroll.scrollBy({ left: -scroll.clientWidth * 0.6, behavior: 'smooth' }));
    document.getElementById('btn-scroll-right').addEventListener('click', () => scroll.scrollBy({ left: scroll.clientWidth * 0.6, behavior: 'smooth' }));
    document.getElementById('btn-fill-ground').addEventListener('click', fillGround);
    document.getElementById('btn-level-undo').addEventListener('click', () => restore('undo', 'redo'));
    document.getElementById('btn-level-redo').addEventListener('click', () => restore('redo', 'undo'));
    document.addEventListener('keydown', (e) => {
      if (app().tab !== 'montar' || !(e.ctrlKey || e.metaKey)) return;
      const k = e.key.toLowerCase();
      if (k === 'z' && !e.shiftKey) { e.preventDefault(); restore('undo', 'redo'); }
      if (k === 'y' || (k === 'z' && e.shiftKey)) { e.preventDefault(); restore('redo', 'undo'); }
    });
    document.getElementById('btn-clear-level').addEventListener('click', async () => {
      if (!(await GSK.ask({ icon: '🗑️', text: 'Limpar a fase inteira?' }))) return;
      remember(snapshot());
      level().cells.fill(null);
      app().save();
      draw();
    });
    window.addEventListener('resize', () => { if (app().tab === 'montar') resize(); });
  }

  function renderPalette() {
    const box = document.getElementById('level-palette');
    box.innerHTML = '';
    const sprites = app().project.sprites.filter((s) => !KINDS[s.kind].cenario).sort((a, b) => KIND_ORDER.indexOf(a.kind) - KIND_ORDER.indexOf(b.kind));
    if (!selected || (selected !== 'apagar' && !app().sprite(selected))) {
      const hero = sprites.find((s) => s.kind === 'heroi');
      selected = (hero || sprites[0]).id;
    }
    const seen = {};
    sprites.forEach((sp) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'pal-item' + (selected === sp.id ? ' on' : '');
      b.title = KINDS[sp.kind].nome;
      if (!seen[sp.kind]) { b.dataset.palKind = sp.kind; seen[sp.kind] = true; }
      const thumb = document.createElement('canvas');
      thumb.width = thumb.height = 16;
      thumb.getContext('2d').drawImage(GSK.spriteCanvas(sp), 0, 0);
      b.appendChild(thumb);
      const lab = document.createElement('span');
      lab.className = 'pal-label';
      lab.innerHTML = `${KINDS[sp.kind].icone} <span class="label">${KINDS[sp.kind].nome}</span>`;
      b.appendChild(lab);
      b.addEventListener('click', () => { selected = sp.id; renderPalette(); GSK.sound.pop(); });
      box.appendChild(b);
    });
    const er = document.createElement('button');
    er.type = 'button';
    er.className = 'pal-item eraser' + (selected === 'apagar' ? ' on' : '');
    er.title = 'Apagar';
    er.dataset.palKind = 'apagar';
    er.innerHTML = '<span class="big-emoji">🧽</span><span class="pal-label"><span class="label">Apagar</span></span>';
    er.addEventListener('click', () => { selected = 'apagar'; renderPalette(); });
    box.appendChild(er);
  }

  function placeAt(e) {
    const r = cv().getBoundingClientRect();
    const lv = level();
    const x = Math.floor(((e.clientX - r.left) / r.width) * lv.w);
    const y = Math.floor(((e.clientY - r.top) / r.height) * lv.h);
    if (x < 0 || y < 0 || x >= lv.w || y >= lv.h) return false;
    const i = y * lv.w + x;
    const value = selected === 'apagar' ? null : selected;
    if (lv.cells[i] === value) return false;
    const sp = value && app().sprite(value);
    if (sp && sp.kind === 'heroi') {
      lv.cells = lv.cells.map((c) => (c === value ? null : c));
    }
    lv.cells[i] = value;
    app().save();
    draw();
    GSK.sound.pop();
    bus.emit('level:placed', { kind: sp ? sp.kind : 'apagar' });
    return true;
  }

  function fillGround() {
    const lv = level();
    const ground = app().project.sprites.find((s) => s.kind === 'chao');
    if (!ground) return;
    const y = lv.h - 1;
    remember(snapshot());
    for (let x = 0; x < lv.w; x++) if (!lv.cells[y * lv.w + x]) lv.cells[y * lv.w + x] = ground.id;
    app().save();
    draw();
    GSK.sound.coin();
    bus.emit('level:placed', { kind: 'chao', many: true });
  }

  function resize() {
    const scroll = document.getElementById('level-scroll');
    const lv = level();
    const h = scroll.clientHeight - 16;
    cell = Math.max(24, Math.min(56, Math.floor(h / lv.h)));
    const c = cv();
    c.width = lv.w * cell;
    c.height = lv.h * cell;
    draw();
  }

  function draw() {
    const c = cv();
    const ctx = c.getContext('2d');
    const lv = level();
    ctx.imageSmoothingEnabled = false;
    const g = ctx.createLinearGradient(0, 0, 0, c.height);
    const sky = GSK.sky(app().project);
    g.addColorStop(0, sky[0]);
    g.addColorStop(1, sky[1]);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, c.width, c.height);
    ctx.strokeStyle = 'rgba(29, 43, 83, 0.12)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let x = 0; x <= lv.w; x++) { ctx.moveTo(x * cell + 0.5, 0); ctx.lineTo(x * cell + 0.5, c.height); }
    for (let y = 0; y <= lv.h; y++) { ctx.moveTo(0, y * cell + 0.5); ctx.lineTo(c.width, y * cell + 0.5); }
    ctx.stroke();
    for (let i = 0; i < lv.cells.length; i++) {
      const id = lv.cells[i];
      if (!id) continue;
      const sp = app().sprite(id);
      if (!sp) continue;
      ctx.drawImage(GSK.spriteCanvas(sp, GSK.groundFrame(lv, i, app().sprite)), (i % lv.w) * cell, Math.floor(i / lv.w) * cell, cell, cell);
    }
  }

  function show() {
    build();
    renderPalette();
    syncUndo();
    requestAnimationFrame(resize);
  }

  GSK.LevelEditor = { show, TILE };
})();
