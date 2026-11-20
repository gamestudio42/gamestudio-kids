import { app, BrowserWindow, Menu, protocol, session } from 'electron';
import { existsSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * Desktop window for the Game Studio Kids site.
 * Serves the copied studio files from gsk://app/ and refuses every other request,
 * so the studio boots offline with no CDN and no extra telemetry.
 */

const DIST_SCHEME = 'gsk';
const DIST_HOST = 'app';
const ORIGIN = `${DIST_SCHEME}://${DIST_HOST}`;

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json',
  '.webmanifest': 'application/manifest+json',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
};

const here = path.dirname(fileURLToPath(import.meta.url));
const smoke = process.argv.includes('--smoke');
const distDir = path.resolve(here, 'www');

protocol.registerSchemesAsPrivileged([
  {
    scheme: DIST_SCHEME,
    privileges: {
      standard: true,
      secure: true,
      supportFetchAPI: true,
      corsEnabled: true,
      stream: true,
    },
  },
]);

app.setName('Game Studio Kids');

/**
 * Map a gsk://app/ request onto a file inside the studio directory.
 * Returns null for any other host, a missing file, or a path that escapes the directory.
 */
function resolveDistFile(requestUrl) {
  let url;
  try {
    url = new URL(requestUrl);
  } catch {
    return null;
  }
  if (url.protocol !== `${DIST_SCHEME}:` || url.hostname !== DIST_HOST) return null;

  let pathname;
  try {
    pathname = decodeURIComponent(url.pathname);
  } catch {
    return null;
  }
  if (pathname === '' || pathname === '/') pathname = '/index.html';

  const relative = pathname.replace(/^\/+/, '');
  if (!relative || relative.includes('\0')) return null;

  const root = path.resolve(distDir);
  const resolved = path.resolve(root, relative);
  if (resolved !== root && !resolved.startsWith(root + path.sep)) return null;
  if (!existsSync(resolved) || !statSync(resolved).isFile()) return null;
  return resolved;
}

/** Requests the page is allowed to make. Anything else (fonts, counters, CDNs) is cancelled. */
function allowShellRequest(requestUrl) {
  return (
    requestUrl.startsWith(`${DIST_SCHEME}:`) ||
    requestUrl.startsWith('blob:') ||
    requestUrl.startsWith('data:') ||
    requestUrl.startsWith('devtools:')
  );
}

function serve(request) {
  const file = resolveDistFile(request.url);
  if (!file) return new Response('Not found', { status: 404 });
  const type = MIME[path.extname(file)] ?? 'application/octet-stream';
  return new Response(readFileSync(file), {
    status: 200,
    headers: { 'Content-Type': type },
  });
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 1024,
    minHeight: 640,
    title: 'Game Studio Kids',
    backgroundColor: '#fff7ec',
    show: !smoke,
    autoHideMenuBar: true,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      webSecurity: true,
    },
  });
  win.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
  win.webContents.on('will-navigate', (event, url) => {
    const next = new URL(url);
    if (next.protocol !== `${DIST_SCHEME}:` || next.hostname !== DIST_HOST) event.preventDefault();
  });
  win.webContents.on('before-input-event', (event, input) => {
    if (input.type === 'keyDown' && input.key === 'F11') {
      win.setFullScreen(!win.isFullScreen());
      event.preventDefault();
    }
  });
  void win.loadURL(`${ORIGIN}/index.html`);
  return win;
}

/** `--smoke`: open the studio hidden, check the home screen booted, print the result and exit. */
async function runSmoke(win) {
  const deadline = Date.now() + 60_000;
  let result = null;
  const probe = `(() => {
    const worlds = [...document.querySelectorAll('#worlds [data-world]')];
    const home = document.getElementById('home');
    return {
      ready: !!(window.GSK && window.GSK.app && home && !home.hidden && worlds.length === 3 && worlds.every((node) => node.style.background.includes('gradient'))),
      href: location.href,
    };
  })()`;
  while (Date.now() < deadline) {
    result = await win.webContents.executeJavaScript(probe).catch(() => null);
    if (result?.ready) break;
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  console.log(`SMOKE ${JSON.stringify(result)}`);
  app.exit(result?.ready === true ? 0 : 1);
}

const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.exit(0);
} else {
  let win = null;

  app.on('second-instance', () => {
    if (!win) return;
    if (win.isMinimized()) win.restore();
    win.focus();
  });

  app.whenReady().then(() => {
    Menu.setApplicationMenu(null);
    protocol.handle(DIST_SCHEME, serve);
    session.defaultSession.webRequest.onBeforeRequest({ urls: ['<all_urls>'] }, (details, callback) => {
      callback({ cancel: !allowShellRequest(details.url) });
    });
    session.defaultSession.setPermissionRequestHandler((_contents, _permission, callback) => {
      callback(false);
    });

    if (!existsSync(path.join(distDir, 'index.html'))) {
      console.error(`Studio files were not found at ${distDir}.`);
      app.exit(1);
      return;
    }

    win = createWindow();
    if (smoke) void runSmoke(win);
  });

  app.on('window-all-closed', () => {
    app.quit();
  });
}
