// Editor de pixel art: lápis, borracha, balde, conta-gotas, espelho e desfazer.
(function () {
  const { PALETTE, KINDS, KIND_ORDER, bus } = GSK;
  const N = GSK.SIZE;

  let color = 3;
  let frame = 1; // 1 = primeiro desenho, 2 = segundo (andando, por baixo...)
  let tool = 'lapis';
  let mirror = false;
  let painting = false;
  let changed = false;
  let built = false;
  const undo = {}; // pilha de desfazer por desenho e quadro

  const cv = () => document.getElementById('pixel-canvas');
  const app = () => GSK.app;
  const sprite = () => app().sprite(app().spriteId);
  const hasFrames = () => !!KINDS[sprite().kind].frames;
  // pixels que estão sendo editados agora
  function px() {
    const sp = sprite();
    if (frame === 2 && hasFrames()) {
      if (!sp.pixels2) sp.pixels2 = sp.pixels.slice(); // começa como cópia do primeiro
      return sp.pixels2;
    }
    return sp.pixels;
  }
  const undoKey = () => sprite().id + ':' + (frame === 2 && hasFrames() ? 2 : 1);

  function build() {
    if (built) return;
    built = true;

    const pal = document.getElementById('palette');
    PALETTE.forEach((hex, i) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'swatch';
      b.style.background = hex;
      b.dataset.color = i;
      b.title = 'Cor ' + (i + 1);
      b.addEventListener('click', () => { color = i; if (tool !== 'balde') setTool('lapis'); syncUI(); GSK.sound.pop(); });
      pal.appendChild(b);
    });

    document.querySelectorAll('#tool-buttons .tool').forEach((b) => {
      b.addEventListener('click', () => setTool(b.dataset.tool));
    });
    document.getElementById('btn-mirror').addEventListener('click', () => { mirror = !mirror; syncUI(); draw(); });
    document.getElementById('btn-undo').addEventListener('click', doUndo);
    document.getElementById('btn-clear').addEventListener('click', () => {
      pushUndo();
      px().fill(-1);
      commit();
    });

    document.getElementById('btn-new-sprite').addEventListener('click', toggleKindPicker);
    document.getElementById('frame-tabs').addEventListener('click', (e) => {
      const b = e.target.closest('[data-frame]');
      if (!b) return;
      frame = Number(b.dataset.frame);
      syncUI();
      draw();
      GSK.sound.pop();
    });
    document.getElementById('btn-del-sprite').addEventListener('click', deleteSprite);

    const c = cv();
    c.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      c.setPointerCapture(e.pointerId);
      const p = cellAt(e);
      if (!p) return;
      if (tool !== 'conta') pushUndo();
      painting = true;
      changed = false;
      apply(p.x, p.y);
      draw();
    });
    c.addEventListener('pointermove', (e) => {
      if (!painting || (tool !== 'lapis' && tool !== 'borracha')) return;
      const p = cellAt(e);
      if (p) { apply(p.x, p.y); draw(); }
    });
    const end = () => {
      if (!painting) return;
      painting = false;
      if (changed) commit();
      else (undo[undoKey()] || []).pop(); // nada mudou: descarta o passo de desfazer
    };
    c.addEventListener('pointerup', end);
    c.addEventListener('pointercancel', end);

    window.addEventListener('resize', () => { if (app().tab === 'desenhar') resize(); });

    document.addEventListener('keydown', (e) => {
      if (app().tab === 'desenhar' && (e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') { e.preventDefault(); doUndo(); }
    });
  }

  function setTool(t) { tool = t; syncUI(); }

  function syncUI() {
    document.querySelectorAll('#tool-buttons .tool').forEach((b) => b.classList.toggle('on', b.dataset.tool === tool));
    document.getElementById('btn-mirror').classList.toggle('on', mirror);
    document.querySelectorAll('.swatch').forEach((b) => {
      b.classList.toggle('on', Number(b.dataset.color) === color);
      b.style.background = PALETTE[Number(b.dataset.color)];
    });
    const sp = sprite();
    const k = KINDS[sp.kind];
    document.getElementById('sprite-kind').innerHTML = `${k.icone} <span class="label">${k.nome}</span>`;
    const tabs = document.getElementById('frame-tabs');
    tabs.hidden = !k.frames;
    if (!k.frames) frame = 1;
    else {
      tabs.innerHTML = k.frames.map((name, i) =>
        `<button type="button" class="chip frame-tab${frame === i + 1 ? ' on' : ''}" data-frame="${i + 1}" title="${name}">${i + 1} <span class="label">${name}</span></button>`).join('');
    }
    document.getElementById('btn-del-sprite').hidden = sp.kind === 'heroi';
  }

  function cellAt(e) {
    const r = cv().getBoundingClientRect();
    const x = Math.floor(((e.clientX - r.left) / r.width) * N);
    const y = Math.floor(((e.clientY - r.top) / r.height) * N);
    if (x < 0 || y < 0 || x >= N || y >= N) return null;
    return { x, y };
  }

  function setPx(x, y, v) {
    const p = px();
    const i = y * N + x;
    if (p[i] !== v) { p[i] = v; changed = true; }
  }

  function apply(x, y) {
    if (tool === 'conta') {
      const v = px()[y * N + x];
      if (v >= 0) { color = v; setTool('lapis'); GSK.sound.pop(); }
      return;
    }
    if (tool === 'balde') { flood(x, y, color); return; }
    const v = tool === 'borracha' ? -1 : color;
    setPx(x, y, v);
    if (mirror) setPx(N - 1 - x, y, v);
  }

  function flood(x, y, v) {
    const p = px();
    const target = p[y * N + x];
    if (target === v) return;
    const stack = [[x, y]];
    while (stack.length) {
      const [cx, cy] = stack.pop();
      if (cx < 0 || cy < 0 || cx >= N || cy >= N || p[cy * N + cx] !== target) continue;
      p[cy * N + cx] = v;
      changed = true;
      stack.push([cx + 1, cy], [cx - 1, cy], [cx, cy + 1], [cx, cy - 1]);
    }
  }

  function pushUndo() {
    const id = undoKey();
    const st = (undo[id] = undo[id] || []);
    st.push(px().slice());
    if (st.length > 50) st.shift();
  }

  function doUndo() {
    const st = undo[undoKey()] || [];
    if (!st.length) return;
    const prev = st.pop();
    if (frame === 2 && hasFrames()) sprite().pixels2 = prev;
    else sprite().pixels = prev;
    commit(true);
  }

  function commit(silent) {
    draw();
    renderDrawer();
    app().save();
    const filled = px().filter((v) => v >= 0).length;
    if (!silent) bus.emit('pixel:painted', { kind: sprite().kind, filled });
  }

  function resize() {
    const stage = document.getElementById('pixel-stage');
    const r = stage.getBoundingClientRect();
    const side = Math.max(160, Math.min(r.width, r.height, 560));
    const cell = Math.floor(side / N);
    const c = cv();
    c.width = c.height = cell * N;
    draw();
  }

  function draw() {
    const c = cv();
    const ctx = c.getContext('2d');
    const cell = c.width / N;
    const sp = sprite();
    const pixels = px();
    const onion = frame === 2 && hasFrames() ? sp.pixels : null; // o primeiro desenho aparece clarinho atrás
    for (let y = 0; y < N; y++) {
      for (let x = 0; x < N; x++) {
        const i = y * N + x;
        const v = pixels[i];
        if (v >= 0) ctx.fillStyle = PALETTE[v];
        else ctx.fillStyle = (x + y) % 2 ? '#eef0f6' : '#ffffff';
        ctx.fillRect(x * cell, y * cell, cell, cell);
        if (v < 0 && onion && onion[i] >= 0) {
          ctx.globalAlpha = 0.22;
          ctx.fillStyle = PALETTE[onion[i]];
          ctx.fillRect(x * cell, y * cell, cell, cell);
          ctx.globalAlpha = 1;
        }
        if (v < 0 && sp.guide && frame === 1 && pixels.every((p) => p < 0) && GSK.HERO_GUIDE[i]) {
          ctx.fillStyle = 'rgba(120, 110, 160, 0.28)';
          ctx.fillRect(x * cell, y * cell, cell, cell);
        }
      }
    }
    ctx.strokeStyle = 'rgba(40, 40, 80, 0.12)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let i = 0; i <= N; i++) {
      ctx.moveTo(i * cell + 0.5, 0); ctx.lineTo(i * cell + 0.5, c.height);
      ctx.moveTo(0, i * cell + 0.5); ctx.lineTo(c.width, i * cell + 0.5);
    }
    ctx.stroke();
    if (mirror) {
      ctx.strokeStyle = 'rgba(255, 0, 77, 0.7)';
      ctx.lineWidth = 3;
      ctx.setLineDash([8, 6]);
      ctx.beginPath();
      ctx.moveTo(c.width / 2, 0); ctx.lineTo(c.width / 2, c.height);
      ctx.stroke();
      ctx.setLineDash([]);
    }
    GSK.drawPixels(document.getElementById('pixel-preview'), pixels);
  }

  function renderDrawer() {
    const list = document.getElementById('sprite-list');
    list.innerHTML = '';
    const sprites = app().project.sprites.slice().sort((a, b) => KIND_ORDER.indexOf(a.kind) - KIND_ORDER.indexOf(b.kind));
    sprites.forEach((sp) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'sprite-card' + (sp.id === app().spriteId ? ' on' : '');
      b.title = KINDS[sp.kind].nome;
      const thumb = document.createElement('canvas');
      thumb.width = thumb.height = 16;
      thumb.getContext('2d').drawImage(GSK.spriteCanvas(sp), 0, 0);
      b.appendChild(thumb);
      const tag = document.createElement('span');
      tag.className = 'kind-tag';
      tag.textContent = KINDS[sp.kind].icone;
      b.appendChild(tag);
      b.addEventListener('click', () => { app().spriteId = sp.id; frame = 1; syncUI(); draw(); renderDrawer(); });
      list.appendChild(b);
    });
  }

  function toggleKindPicker() {
    const box = document.getElementById('kind-picker');
    if (!box.hidden) { box.hidden = true; return; }
    box.innerHTML = '';
    const hasHero = app().project.sprites.some((s) => s.kind === 'heroi');
    KIND_ORDER.filter((k) => !(k === 'heroi' && hasHero)).forEach((k) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'chip';
      b.innerHTML = `${KINDS[k].icone} <span class="label">${KINDS[k].nome}</span>`;
      b.title = KINDS[k].nome;
      b.addEventListener('click', () => {
        const sp = GSK.newSprite(k, true); // novo desenho começa vazio
        app().project.sprites.push(sp);
        app().spriteId = sp.id;
        frame = 1;
        box.hidden = true;
        app().save();
        show();
      });
      box.appendChild(b);
    });
    box.hidden = false;
  }

  async function deleteSprite() {
    const sp = sprite();
    if (sp.kind === 'heroi') return;
    if (!(await GSK.ask({ icon: '🗑️', text: 'Apagar este desenho? Ele também sai da fase.' }))) return;
    const p = app().project;
    p.sprites = p.sprites.filter((s) => s.id !== sp.id);
    p.level.cells = p.level.cells.map((c) => (c === sp.id ? null : c));
    app().spriteId = p.sprites[0].id;
    app().save();
    show();
  }

  function show() {
    build();
    if (!sprite()) app().spriteId = app().project.sprites[0].id;
    frame = 1;
    document.getElementById('kind-picker').hidden = true;
    syncUI();
    renderDrawer();
    requestAnimationFrame(resize);
  }

  GSK.PixelEditor = { show };
})();
