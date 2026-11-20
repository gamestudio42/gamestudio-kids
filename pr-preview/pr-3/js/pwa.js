// App instalável: registra o service worker, mostra o botão Instalar e avisa quando a internet cai.
(function () {
  const MSG = {
    "install": "",
    "installed": "📲 Pronto! Agora o Game Studio está no seu aparelho.",
    "ios": "📲 Para instalar: toque em Compartilhar e depois em \"Adicionar à Tela de Início\".",
    "offline": "📴 Sem internet, mas pode continuar brincando!",
    "online": "📶 A internet voltou."
  };
  const $ = (id) => document.getElementById(id);
  const toast = (text) => (window.GSK && GSK.app && GSK.app.toast ? GSK.app.toast(text) : null);

  const standalone = () => matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
  const ios = /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

  if (!/^https?:$/.test(location.protocol) || !('serviceWorker' in navigator)) return;

  navigator.serviceWorker.register('sw.js').catch(() => {});
  if (navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(() => {});

  const btn = $('btn-install'), hint = $('install-hint'), card = $('install-card');
  let deferred = null;
  function show(withButton, text) {
    if (standalone()) return;
    if (card) card.hidden = false;
    if (btn) btn.hidden = !withButton;
    if (hint && text) { hint.textContent = text; hint.hidden = false; }
  }

  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferred = e;
    show(true, MSG.install);
  });
  if (btn) btn.addEventListener('click', async () => {
    if (!deferred) return;
    deferred.prompt();
    const choice = await deferred.userChoice.catch(() => null);
    deferred = null;
    if (choice && choice.outcome === 'accepted') { btn.hidden = true; if (card) card.hidden = true; if (hint) hint.hidden = true; }
  });
  window.addEventListener('appinstalled', () => { if (card) card.hidden = true; if (btn) btn.hidden = true; if (hint) hint.hidden = true; toast(MSG.installed); });
  if (ios && !standalone()) show(false, MSG.ios);

  window.addEventListener('offline', () => toast(MSG.offline));
  window.addEventListener('online', () => toast(MSG.online));
})();
