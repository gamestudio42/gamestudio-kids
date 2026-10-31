<p align="center">
  <img src="icons/icon-192.png" width="88" alt="Game Studio Kids icon">
</p>

<h1 align="center">Game Studio Kids</h1>

<p align="center"><strong>Draw it. Build it. Play it.</strong></p>

<p align="center">
  <a href="https://gamestudio42.github.io/gamestudio-kids/"><img src="https://img.shields.io/badge/Play_in_browser-3fa97a?style=for-the-badge&labelColor=4a2f55&color=3fa97a" alt="Play Game Studio Kids"></a>
  <a href="https://github.com/gamestudio42/gamestudio-kids/deployments/github-pages"><img src="https://img.shields.io/github/deployments/gamestudio42/gamestudio-kids/github-pages?style=for-the-badge&labelColor=4a2f55&label=Pages" alt="GitHub Pages deployment status"></a>
  <a href="https://github.com/gamestudio42/gamestudio-kids/stargazers"><img src="https://img.shields.io/github/stars/gamestudio42/gamestudio-kids?style=for-the-badge&labelColor=4a2f55&color=e05584" alt="GitHub stars"></a>
  <a href="https://github.com/gamestudio42"><img src="https://img.shields.io/badge/Game_Studio_42-4a2f55?style=for-the-badge&labelColor=4a2f55&color=8a6fe0" alt="Game Studio 42"></a>
</p>

<p align="center">
  A 2D game maker for children aged five and up, for tablets and computers. Children paint
  their own pixel-art characters, place them in a level and play the game they made. Pixo, a
  friendly mascot, guides the first game step by step and reads every instruction aloud.
  No installation or account is needed, and it works offline once opened.
</p>

<p align="center">
  <a href="https://gamestudio42.github.io/gamestudio-kids/">
    <img src="docs/screenshots/play.svg" alt="Play Game Studio Kids in the browser" height="56">
  </a>
</p>

<p align="center">
  <a href="https://gamestudio42.github.io/gamestudio-kids/">
    <img src="docs/screenshots/play.png" alt="Broto, a little sprout, jumps over a gap in the forest world while collecting acorns" width="920">
  </a>
</p>

## From a drawing to a game

1. **Pick a world.** Nuvem (Pom, a pastel cloud cat), Bosque (Broto, a forest sprout) and Noite
   (Bip, a night-time robot) each open with every drawing and a level ready to play. "Do zero"
   starts with an empty level.
2. **Draw.** Paint on a 16×16 grid with pencil, eraser, bucket, colour picker, mirror and undo.
   Every drawing in the game can be changed, and new ones get a type: hero, ground, platform,
   collectable, walking or flying enemy, spikes, spring, finish, decoration, sky cloud or hill.
3. **Build.** Tap or drag a drawing onto the 40×12 level. Fill the ground in one tap, scroll the
   level and undo or redo any change.
4. **Play.** Run, jump and collect stars. Jump on enemies to defeat them, bounce high on springs
   and reach the finish. A fall or a hit sends the hero back to the last safe ground.

Heroes, enemies and ground have a second drawing for walking and edges; the first drawing shows
faintly behind it as a guide. Questions such as "delete this game?" use large icons and are read
aloud, so children who cannot read yet can still answer.

## See the studio

<p align="center">
  <img src="docs/screenshots/home.png" alt="The home screen with the Nuvem, Bosque, Noite and Do zero world cards" width="920">
</p>

<table>
<tr>
<td align="center" width="50%" valign="top">
<img src="docs/screenshots/draw.png" alt="The pixel editor with Broto on a 16 by 16 grid, the tools and the drawing box" width="460"><br>
Paint any drawing, with a second frame for walking.
</td>
<td align="center" width="50%" valign="top">
<img src="docs/screenshots/build.png" alt="The level editor with the forest level, its palette of drawings and the undo buttons" width="460"><br>
Place drawings on the level, then press play.
</td>
</tr>
</table>

## Play

Open **[gamestudio42.github.io/gamestudio-kids](https://gamestudio42.github.io/gamestudio-kids/)**.
The interface is in Brazilian Portuguese, with large icons and spoken instructions.

| Action                    | Keys                          |
| ------------------------- | ----------------------------- |
| Walk                      | `←` `→` or `A` `D`            |
| Jump                      | `↑`, `W` or `Space`           |
| Undo / redo (draw, build) | `Ctrl+Z` / `Ctrl+Y`           |

On a tablet, large on-screen buttons walk and jump. 🔤 switches between big buttons with labels
and an icon-only mode for the youngest players; 🎵 turns the music off.

Games save themselves in the browser. **Guardar cópia** downloads every game as one `.gsk` file,
and **Importar jogo** brings them back; the home screen reminds you when a game has changed
since the last copy. To install the studio as an app, open the site and choose
**📲 Instalar no aparelho** (Chrome, Edge, Android) or *Share → Add to Home Screen* (iPad, iPhone).

## Develop

There is no build step: the studio is plain JavaScript, HTML and CSS, and `index.html` also
opens straight from disk. To test on a tablet on the same network, serve the folder:

```sh
python3 -m http.server 8000   # then open http://YOUR-COMPUTER-IP:8000
```

| Path                  | Purpose                                                       |
| --------------------- | ------------------------------------------------------------- |
| `js/data.js`          | Palettes, drawing types, worlds, starter art, saving, sounds  |
| `js/pixel-editor.js`  | Pixel editor with frames and onion skin                       |
| `js/level-editor.js`  | Level editor with undo and redo                               |
| `js/game.js`          | Platform engine: physics, enemies, springs, checkpoints       |
| `js/tour.js`          | Pixo's interactive tour                                       |
| `js/app.js`           | Home screen, tabs, questions, backup, import and export       |
| `sw.js`, `js/pwa.js`  | Offline cache and the install button                          |

GitHub Pages serves the `main` branch as it is. A project is a single JSON document, so the
level already records its view (`lado`, side-on) to make room for top-down levels later.
For older children there is a companion studio with rules, several levels and HTML export.
The original Portuguese notes are in [docs/LEIA-ME.md](docs/LEIA-ME.md).

## Licence

Game Studio Kids is free software under the GNU Affero General Public License, version 3 or any
later version ([`AGPL-3.0-or-later`](LICENSE)), following the
[Game Studio 42](https://github.com/gamestudio42) default for complete games. If you run a modified
version for other people, including as a website or over a network, you must offer them its source
under the same licence. Copyright (c) 2026 Marcel Savegnago.

Its code, pixel art, sound and music are original.
