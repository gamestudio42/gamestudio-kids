// Motor do jogo: lê o projeto e roda um jogo de plataforma com vista de lado.
(function () {
  const T = GSK.TILE;
  const VIEW_W = 256, VIEW_H = 192; // 16 x 12 células
  const GRAVITY = 0.32, JUMP = -6.0, MAX_FALL = 6, SPEED = 1.5, ENEMY_SPEED = 0.5;
  const CONFETTI = ['#ffa8c0', '#ffd36e', '#a8e6b4', '#9fd0ff', '#cbb6ff', '#fffaf3'];
  const DUST = ['#ffffff', '#ffe3c8'];

  const input = { left: false, right: false, jump: false };
  let state = null;
  let raf = 0;
  let built = false;

  const app = () => GSK.app;

  function build() {
    if (built) return;
    built = true;
    const keys = { ArrowLeft: 'left', a: 'left', A: 'left', ArrowRight: 'right', d: 'right', D: 'right', ArrowUp: 'jump', w: 'jump', W: 'jump', ' ': 'jump' };
    document.addEventListener('keydown', (e) => {
      if (app().tab !== 'jogar' || !keys[e.key]) return;
      e.preventDefault();
      input[keys[e.key]] = true;
    });
    document.addEventListener('keyup', (e) => { if (keys[e.key]) input[keys[e.key]] = false; });
    document.querySelectorAll('.pad-btn').forEach((b) => {
      const k = b.dataset.key;
      const on = (e) => { e.preventDefault(); input[k] = true; b.classList.add('on'); };
      const off = (e) => { e.preventDefault(); input[k] = false; b.classList.remove('on'); };
      b.addEventListener('pointerdown', on);
      b.addEventListener('pointerup', off);
      b.addEventListener('pointerleave', off);
      b.addEventListener('pointercancel', off);
    });
  }

  function makeWorld(project) {
    const lv = project.level;
    const byId = {};
    project.sprites.forEach((s) => { byId[s.id] = s; });
    const w = {
      lv, byId,
      solid: new Uint8Array(lv.w * lv.h),
      tiles: [], coins: [], enemies: [], exits: [], hazards: [], springs: [],
      clouds: project.sprites.filter((s) => s.kind === 'ceu'), backs: project.sprites.filter((s) => s.kind === 'fundo'),
      hero: null, spawn: null, coinsTotal: 0, coinsGot: 0,
      camX: 0, done: false, t: 0, flash: 0,
      parts: [], texts: [], shake: 0, hurtFlash: 0, fade: 24,
    };
    lv.cells.forEach((id, i) => {
      const sp = id && byId[id];
      if (!sp) return;
      const x = (i % lv.w) * T, y = Math.floor(i / lv.w) * T;
      switch (sp.kind) {
        case 'chao': w.solid[i] = 1; w.tiles.push({ sp, x, y, frame: GSK.groundFrame(lv, i, (id2) => byId[id2]) }); break;
        case 'plataforma': w.solid[i] = 2; w.tiles.push({ sp, x, y }); break;
        case 'perigo': w.hazards.push({ sp, x: x + 2, y: y + 9, w: 12, h: 7, dx: x, dy: y }); break;
        case 'mola': w.springs.push({ sp, x: x + 1, y: y + 6, w: 14, h: 10, dx: x, dy: y, squash: 0 }); break;
        case 'voador': w.enemies.push({ sp, x: x + 2, y: y + 2, w: 12, h: 13, vx: -ENEMY_SPEED, vy: 0, alive: true, fly: true, x0: x + 2, y0: y + 2, phase: x / 40 }); break;
        case 'enfeite': w.tiles.push({ sp, x, y, sway: true }); break;
        case 'moeda': w.coins.push({ sp, x: x + 2, y: y + 2, w: 12, h: 12, got: false }); break;
        case 'saida': w.exits.push({ sp, x: x + 2, y, w: 12, h: 16 }); break;
        case 'inimigo': w.enemies.push({ sp, x: x + 1, y: y + 2, w: 14, h: 14, vx: -ENEMY_SPEED, vy: 0, alive: true, onGround: false }); break;
        case 'heroi': w.spawn = { x: x + 2, y: y + 1 }; w.heroSp = sp; break;
      }
    });
    w.coinsTotal = w.coins.length;
    if (w.spawn) w.hero = newHero(w.spawn);
    w.safe = w.spawn; // ponto de controle: o último lugar seguro onde o herói pisou
    return w;
  }

  function newHero(spawn) {
    return { x: spawn.x, y: spawn.y, w: 12, h: 15, vx: 0, vy: 0, onGround: false, face: 1, jumpHeld: false, sx: 1, sy: 1 };
  }

  // ---------- Efeitos ----------
  function burst(w, x, y, n, colors, speed, opts) {
    opts = opts || {};
    for (let i = 0; i < n; i++) {
      const a = opts.up ? -Math.PI / 2 + (Math.random() - 0.5) * 2.2 : Math.random() * Math.PI * 2;
      const s = speed * (0.4 + Math.random() * 0.8);
      const life = (opts.life || 30) * (0.6 + Math.random() * 0.6);
      w.parts.push({
        x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, grav: opts.grav === undefined ? 0.12 : opts.grav,
        life, max: life, color: colors[(Math.random() * colors.length) | 0], size: opts.size || (1 + (Math.random() * 2) | 0),
      });
    }
  }
  function floatText(w, x, y, text, color) { w.texts.push({ x, y, text, color, life: 45 }); }

  function solidAt(w, tx, ty) {
    if (tx < 0 || tx >= w.lv.w) return true; // paredes nas bordas
    if (ty < 0 || ty >= w.lv.h) return false;
    return w.solid[ty * w.lv.w + tx] === 1;
  }
  // chão ou plataforma: serve para pisar
  function standAt(w, tx, ty) {
    if (tx < 0 || tx >= w.lv.w || ty < 0 || ty >= w.lv.h) return false;
    return w.solid[ty * w.lv.w + tx] > 0;
  }

  function moveX(w, b) {
    b.x += b.vx;
    const top = Math.floor(b.y / T), bot = Math.floor((b.y + b.h - 0.01) / T);
    if (b.vx > 0) {
      const tx = Math.floor((b.x + b.w - 0.01) / T);
      for (let ty = top; ty <= bot; ty++) if (solidAt(w, tx, ty)) { b.x = tx * T - b.w; return true; }
    } else if (b.vx < 0) {
      const tx = Math.floor(b.x / T);
      for (let ty = top; ty <= bot; ty++) if (solidAt(w, tx, ty)) { b.x = (tx + 1) * T; return true; }
    }
    return false;
  }

  function moveY(w, b) {
    const prevBottom = b.y + b.h;
    b.vy = Math.min(b.vy + GRAVITY, MAX_FALL);
    b.y += b.vy;
    b.onGround = false;
    const left = Math.floor(b.x / T), right = Math.floor((b.x + b.w - 0.01) / T);
    if (b.vy > 0) {
      const ty = Math.floor((b.y + b.h - 0.01) / T);
      for (let tx = left; tx <= right; tx++) {
        if (tx < 0 || tx >= w.lv.w) continue;
        // plataforma: só segura quem vem de cima
        const plat = standAt(w, tx, ty) && !solidAt(w, tx, ty) && prevBottom <= ty * T + 0.5;
        if (solidAt(w, tx, ty) || plat) { b.y = ty * T - b.h; b.vy = 0; b.onGround = true; return; }
      }
    } else if (b.vy < 0) {
      const ty = Math.floor(b.y / T);
      for (let tx = left; tx <= right; tx++) {
        if (tx >= 0 && tx < w.lv.w && solidAt(w, tx, ty)) { b.y = (ty + 1) * T; b.vy = 0; return; }
      }
    }
  }

  // Lugar seguro: os dois pés em cima de chão e nenhum inimigo ou espinho por perto
  function safeHere(w, h) {
    const ty = Math.floor((h.y + h.h + 1) / T);
    if (!standAt(w, Math.floor(h.x / T), ty) || !standAt(w, Math.floor((h.x + h.w - 0.01) / T), ty)) return false;
    const near = (o) => Math.abs(o.x + o.w / 2 - (h.x + h.w / 2)) < 56 && Math.abs(o.y - h.y) < 48;
    return !w.enemies.some((e) => e.alive && near(e)) && !w.hazards.some(near);
  }

  const hit = (a, b) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;

  function respawn(w) {
    GSK.sound.hurt();
    const h = w.hero;
    burst(w, h.x + h.w / 2, h.y + h.h / 2, 18, ['#ffffff', GSK.mainColor(w.heroSp), '#ffd6e2'], 2.2);
    w.shake = 14;
    w.hurtFlash = 12;
    w.hero = newHero(w.safe || w.spawn); // volta para perto de onde estava, não para o começo
    w.flash = 90;
  }

  function step(w) {
    w.t++;
    if (w.flash > 0) w.flash--;
    if (w.shake > 0) w.shake--;
    if (w.hurtFlash > 0) w.hurtFlash--;
    if (w.fade > 0) w.fade--;

    for (const p of w.parts) { p.x += p.vx; p.y += p.vy; p.vy += p.grav; p.vx *= 0.98; p.life--; }
    w.parts = w.parts.filter((p) => p.life > 0);
    for (const t of w.texts) { t.y -= 0.5; t.life--; }
    w.texts = w.texts.filter((t) => t.life > 0);
    if (w.done && w.t % 3 === 0) burst(w, w.camX + Math.random() * VIEW_W, -4, 3, CONFETTI, 0.6, { grav: 0.03, life: 140, size: 2 });

    const h = w.hero;
    if (!h || w.done) return;

    h.vx = (input.right ? SPEED : 0) - (input.left ? SPEED : 0);
    if (h.vx) h.face = h.vx > 0 ? 1 : -1;
    const wasGround = h.onGround, fallSpeed = h.vy;
    if (input.jump && !h.jumpHeld && h.onGround) {
      h.vy = JUMP;
      h.sx = 0.7; h.sy = 1.3; // estica ao pular
      burst(w, h.x + h.w / 2, h.y + h.h, 6, DUST, 0.9, { up: true, grav: 0.02, life: 18 });
      GSK.sound.jump();
    }
    if (h.vy >= 0) h.boost = false;
    if (!input.jump && !h.boost && h.vy < -2) h.vy = -2; // soltar o botão = pulo mais baixo
    h.jumpHeld = input.jump;
    moveX(w, h);
    moveY(w, h);
    if (!wasGround && h.onGround && fallSpeed > 2) {
      h.sx = 1.3; h.sy = 0.72; // amassa ao cair
      burst(w, h.x + h.w / 2, h.y + h.h, 8, DUST, 1, { up: true, grav: 0.03, life: 16 });
    }
    if (h.onGround && h.vx && w.t % 9 === 0) burst(w, h.x + h.w / 2 - h.face * 5, h.y + h.h, 1, DUST, 0.4, { up: true, grav: 0, life: 14 });
    if (h.onGround && w.t % 15 === 0 && safeHere(w, h)) w.safe = { x: h.x, y: h.y };
    h.sx += (1 - h.sx) * 0.2;
    h.sy += (1 - h.sy) * 0.2;
    if (h.y > w.lv.h * T + 32) { respawn(w); return; }

    for (const s of w.springs) {
      if (s.squash > 0) s.squash--;
      if (hit(h, s) && h.vy > 0 && h.y + h.h - s.y < 10) {
        h.y = s.y - h.h;
        h.vy = JUMP * 1.35; // pulo bem alto
        h.boost = true;
        h.sx = 0.65; h.sy = 1.4;
        s.squash = 12;
        burst(w, s.x + s.w / 2, s.y, 10, [GSK.mainColor(s.sp), '#ffffff'], 1.6, { up: true, grav: 0.08 });
        GSK.sound.spring();
      }
    }
    for (const z of w.hazards) {
      if (w.flash === 0 && hit(h, z)) { respawn(w); return; }
    }

    for (const e of w.enemies) {
      if (!e.alive) continue;
      e.vx = e.vx || -ENEMY_SPEED;
      if (e.fly) {
        // voa de um lado para o outro, subindo e descendo
        if (moveX(w, e) || Math.abs(e.x - e.x0) > 48) { e.vx = -e.vx; e.x = Math.max(e.x0 - 48, Math.min(e.x0 + 48, e.x)); }
        e.y = e.y0 + Math.sin(w.t / 22 + e.phase) * 8;
      } else {
        if (moveX(w, e)) e.vx = -e.vx;
        moveY(w, e);
        if (e.onGround) {
          const aheadX = e.vx > 0 ? e.x + e.w + 1 : e.x - 1;
          const tx = Math.floor(aheadX / T), ty = Math.floor((e.y + e.h + 1) / T);
          if (!standAt(w, tx, ty)) e.vx = -e.vx; // não cai da beirada
        }
      }
      if (e.y > w.lv.h * T + 32) e.alive = false;
      if (w.flash === 0 && hit(h, e)) {
        if (h.vy > 0 && h.y + h.h - e.y < 8) {
          e.alive = false;
          h.vy = JUMP * 0.7;
          h.sx = 0.75; h.sy = 1.25;
          burst(w, e.x + e.w / 2, e.y + e.h / 2, 22, [GSK.mainColor(e.sp), '#ffffff', '#ffd36e'], 2.4);
          floatText(w, e.x + e.w / 2, e.y, 'POF!', '#ffd36e');
          w.shake = 8;
          GSK.sound.stomp();
        } else { respawn(w); return; }
      }
    }

    for (const c of w.coins) {
      if (!c.got && hit(h, c)) {
        c.got = true;
        w.coinsGot++;
        burst(w, c.x + 6, c.y + 6, 14, [GSK.mainColor(c.sp), '#ffffff'], 1.8, { grav: 0.05 });
        floatText(w, c.x + 6, c.y, '+1', GSK.mainColor(c.sp));
        GSK.sound.coin();
        updateHud(w, true);
      }
    }

    const reachedExit = w.exits.some((x) => hit(h, x));
    const allCoins = w.coinsTotal > 0 && w.coinsGot === w.coinsTotal;
    if (reachedExit || (!w.exits.length && allCoins)) win(w);

    const maxCam = Math.max(0, w.lv.w * T - VIEW_W);
    const target = Math.min(maxCam, Math.max(0, h.x + h.w / 2 - VIEW_W / 2 + h.face * 24)); // olha um pouco à frente
    w.camX += (target - w.camX) * 0.08;
  }

  // Colinas ao fundo, em duas camadas que andam mais devagar que a fase
  function hills(ctx, w, speed, base, amp, color, seed) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(0, VIEW_H);
    for (let x = 0; x <= VIEW_W; x += 4) {
      const wx = x + w.camX * speed;
      ctx.lineTo(x, base - Math.sin(wx / 37 + seed) * amp - Math.sin(wx / 13 + seed * 2) * amp * 0.3);
    }
    ctx.lineTo(VIEW_W, VIEW_H);
    ctx.fill();
  }

  // cor da última linha do desenho, para continuar o morro até embaixo
  function bottomColor(sp) {
    for (let y = 15; y >= 0; y--) {
      const v = sp.pixels[y * 16 + 8];
      if (v >= 0) return GSK.PALETTE[v];
    }
    return 'transparent';
  }

  function draw(ctx, w) {
    const g = ctx.createLinearGradient(0, 0, 0, VIEW_H);
    const sky = GSK.sky(app().project);
    g.addColorStop(0, sky[0]);
    g.addColorStop(1, sky[1]);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, VIEW_W, VIEW_H);
    // nuvens do céu: desenhos do tipo "Nuvem do céu", em dobro e andando devagar
    if (w.clouds.length) {
      for (let i = 0; i < 5; i++) {
        const sp = w.clouds[i % w.clouds.length];
        const span = VIEW_W + 80;
        const cx = ((i * 71 - w.camX * 0.15 + w.t * 0.06) % span + span) % span - 40;
        ctx.drawImage(GSK.spriteCanvas(sp), Math.round(cx), 6 + (i * 29) % 56, 32, 32);
      }
    } else {
      ctx.fillStyle = 'rgba(255,255,255,0.85)';
      for (let i = 0; i < 6; i++) {
        const cx = ((i * 97 - w.camX * 0.2 + w.t * 0.05) % (VIEW_W + 60) + VIEW_W + 60) % (VIEW_W + 60) - 30;
        const cy = 20 + (i * 37) % 50;
        ctx.fillRect(Math.round(cx), cy, 26, 6);
        ctx.fillRect(Math.round(cx) + 6, cy - 4, 14, 4);
      }
    }
    // morros: desenhos do tipo "Morro do fundo", repetidos lado a lado
    if (w.backs.length) {
      const base = 112, size = 32;
      const off = ((w.camX * 0.3) % (size * w.backs.length) + size * w.backs.length) % (size * w.backs.length);
      for (let x = -off, k = 0; x < VIEW_W; x += size, k++) {
        ctx.drawImage(GSK.spriteCanvas(w.backs[k % w.backs.length]), Math.round(x), base, size, size);
      }
      ctx.fillStyle = bottomColor(w.backs[0]);
      ctx.fillRect(0, base + size - 1, VIEW_W, VIEW_H);
    } else {
      hills(ctx, w, 0.25, 150, 14, '#cbb6ff', 1);
      hills(ctx, w, 0.5, 172, 12, '#a8e6b4', 4);
    }

    ctx.save();
    let sx = 0, sy = 0;
    if (w.shake > 0) { sx = (Math.random() - 0.5) * w.shake * 0.5; sy = (Math.random() - 0.5) * w.shake * 0.5; }
    ctx.translate(-Math.round(w.camX) + Math.round(sx), Math.round(sy));
    for (const t of w.tiles) {
      if (t.x + T < w.camX - 8 || t.x > w.camX + VIEW_W + 8) continue;
      if (t.sway) {
        ctx.save();
        ctx.translate(t.x + 8, t.y + 16);
        ctx.rotate(Math.sin((w.t + t.x) / 30) * 0.08);
        ctx.drawImage(GSK.spriteCanvas(t.sp), -8, -16);
        ctx.restore();
      } else ctx.drawImage(GSK.spriteCanvas(t.sp, t.frame), t.x, t.y);
    }
    for (const z of w.hazards) ctx.drawImage(GSK.spriteCanvas(z.sp), z.dx, z.dy);
    for (const s of w.springs) {
      const k = s.squash > 0 ? 1 - Math.sin((s.squash / 12) * Math.PI) * 0.35 : 1;
      ctx.save();
      ctx.translate(s.dx + 8, s.dy + 16);
      ctx.scale(1 + (1 - k) * 0.5, k);
      ctx.drawImage(GSK.spriteCanvas(s.sp), -8, -16);
      ctx.restore();
    }
    for (const x of w.exits) {
      ctx.save();
      ctx.translate(x.x - 2, x.y);
      ctx.transform(1, 0, Math.sin(w.t / 10) * 0.06, 1, 0, 0); // bandeira balançando
      ctx.drawImage(GSK.spriteCanvas(x.sp), 0, 0);
      ctx.restore();
    }
    for (const c of w.coins) {
      if (c.got) continue;
      const bob = Math.sin((w.t + c.x) / 12) * 1.5;
      const spin = Math.abs(Math.cos((w.t + c.x) / 20)) * 0.6 + 0.4;
      ctx.save();
      ctx.translate(c.x + 6, c.y + 6 + bob);
      ctx.scale(spin, 1);
      ctx.drawImage(GSK.spriteCanvas(c.sp), -8, -8);
      ctx.restore();
      if ((w.t + c.x * 7) % 90 === 0) burst(w, c.x + 2 + Math.random() * 8, c.y + Math.random() * 8, 1, ['#ffffff'], 0.2, { grav: 0, life: 20, size: 1 });
    }
    for (const e of w.enemies) {
      if (!e.alive) continue;
      const squish = 1 + Math.sin(w.t / 6) * 0.06;
      ctx.save();
      ctx.translate(Math.round(e.x + e.w / 2), Math.round(e.y + e.h));
      ctx.scale(e.vx > 0 ? -1 / squish : 1 / squish, squish);
      ctx.drawImage(GSK.spriteCanvas(e.sp, Math.floor(w.t / 12) % 2 + 1), -8, e.fly ? -15 : -16 + 2);
      ctx.restore();
    }
    const h = w.hero;
    if (h && (w.flash === 0 || w.t % 6 < 3)) {
      const breathe = h.onGround && !h.vx ? 1 + Math.sin(w.t / 18) * 0.03 : 1;
      ctx.save();
      ctx.translate(Math.round(h.x + h.w / 2), Math.round(h.y + h.h));
      ctx.scale(h.face * h.sx, h.sy * breathe);
      const walking = h.onGround && h.vx && Math.floor(w.t / 8) % 2;
      ctx.drawImage(GSK.spriteCanvas(w.heroSp, walking ? 2 : 1), -8, -16);
      ctx.restore();
    }
    for (const p of w.parts) {
      ctx.globalAlpha = Math.min(1, p.life / (p.max * 0.5));
      ctx.fillStyle = p.color;
      ctx.fillRect(Math.round(p.x), Math.round(p.y), p.size, p.size);
    }
    ctx.globalAlpha = 1;
    ctx.font = 'bold 10px Nunito, system-ui, sans-serif';
    ctx.textAlign = 'center';
    for (const t of w.texts) {
      ctx.globalAlpha = Math.min(1, t.life / 15);
      ctx.fillStyle = '#4a2f55';
      ctx.fillText(t.text, Math.round(t.x) + 1, Math.round(t.y) + 1);
      ctx.fillStyle = t.color;
      ctx.fillText(t.text, Math.round(t.x), Math.round(t.y));
    }
    ctx.globalAlpha = 1;
    ctx.restore();

    if (w.hurtFlash > 0) { ctx.fillStyle = `rgba(236, 115, 152, ${w.hurtFlash / 30})`; ctx.fillRect(0, 0, VIEW_W, VIEW_H); }
    if (w.fade > 0) { ctx.fillStyle = `rgba(255, 247, 236, ${w.fade / 24})`; ctx.fillRect(0, 0, VIEW_W, VIEW_H); }
  }

  function updateHud(w, pop) {
    const el = document.getElementById('hud-coins');
    el.textContent = w.coinsTotal ? `⭐ ${w.coinsGot} / ${w.coinsTotal}` : '';
    if (pop) { el.classList.remove('pop'); void el.offsetWidth; el.classList.add('pop'); }
  }

  function message(html) {
    const m = document.getElementById('play-msg');
    if (!html) { m.hidden = true; m.innerHTML = ''; return; }
    m.innerHTML = html;
    m.hidden = false;
  }

  function win(w) {
    w.done = true;
    GSK.sound.win();
    GSK.music.stop();
    for (let i = 0; i < 4; i++) burst(w, w.hero.x + 6, w.hero.y, 16, CONFETTI, 3, { grav: 0.08, life: 60, size: 2 });
    const stars = w.coinsTotal ? Math.max(1, Math.round((w.coinsGot / w.coinsTotal) * 3)) : 3;
    message(`<div class="msg-stars">${[1, 2, 3].map((i) => `<span class="star ${i <= stars ? 'on' : ''}" style="animation-delay:${i * 0.18}s">⭐</span>`).join('')}</div>
      <p><b>Você venceu!</b></p>
      ${w.coinsTotal ? `<p>⭐ ${w.coinsGot} de ${w.coinsTotal}</p>` : ''}
      <div class="msg-actions">
        <button class="chip green" data-act="again" type="button">🔁 <span class="label">Jogar de novo</span></button>
        <button class="chip" data-act="edit" type="button">🧱 <span class="label">Voltar a montar</span></button>
      </div>`);
    GSK.bus.emit('game:won', { coins: w.coinsGot });
  }

  document.addEventListener('click', (e) => {
    const b = e.target.closest('#play-msg [data-act]');
    if (!b) return;
    if (b.dataset.act === 'again') start();
    if (b.dataset.act === 'edit') app().setTab('montar');
  });

  function start() {
    stop();
    build();
    message(null);
    Object.keys(input).forEach((k) => { input[k] = false; });
    const w = makeWorld(app().project);
    state = w;
    updateHud(w);
    if (!w.hero) {
      message(`<div class="msg-big">🦸</div><p><b>Cadê o herói?</b></p><p>Coloque o herói na fase para jogar.</p>
        <div class="msg-actions"><button class="chip green" data-act="edit" type="button">🧱 <span class="label">Montar a fase</span></button></div>`);
    } else GSK.music.start();
    const canvas = document.getElementById('game-canvas');
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = false;
    let last = performance.now(), acc = 0;
    const loop = (now) => {
      acc += Math.min(100, now - last);
      last = now;
      while (acc >= 1000 / 60) { step(w); acc -= 1000 / 60; }
      draw(ctx, w);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
  }

  function stop() {
    cancelAnimationFrame(raf);
    raf = 0;
    state = null;
    GSK.music.stop();
  }

  GSK.Play = { show: start, stop, state: () => state, input };
})();
