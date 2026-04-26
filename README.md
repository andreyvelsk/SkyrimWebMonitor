# SkyrimWebMonitor

A Vue 3 + Vite PWA companion app for **The Elder Scrolls V: Skyrim**. It connects to a running Skyrim session over WebSocket and shows the player state — stats, inventory, magic, and hotkeys — in real time, on a separate screen.

> **Live app:** https://andreyvelsk.github.io/SkyrimWebMonitor/

> Designed primarily for the **[AYN Thor](https://www.aynsmart.com/)** handheld as a second-screen Skyrim companion, but it runs on any modern browser (desktop, phone, tablet).

This is the **client** half of the project. The **server** half — the SKSE plugin that exposes Skyrim's game state over a WebSocket — lives in the companion repository:

> **[andreyvelsk/SkyrimWebSocket](https://github.com/andreyvelsk/SkyrimWebSocket)** — install it inside Skyrim first; without it the monitor has nothing to talk to.

## Features

- Real-time monitoring over WebSocket (stats, inventory, magic, hotkeys)
- Installable as a Progressive Web App (offline shell, home-screen launch)
- Multilingual UI (English / Russian) via `vue-i18n`
- Skyrim-themed responsive design, optimized for handhelds
- Works fully client-side — no backend besides the in-game plugin

## Quick start (use the public app)

1. Install the **[SkyrimWebSocket](https://github.com/andreyvelsk/SkyrimWebSocket)** SKSE plugin in your Skyrim Special Edition. Follow the install guide in that repo. By default it listens on `ws://127.0.0.1:8765`.
2. Launch Skyrim through `skse64_loader.exe` and load a save.
3. Open https://andreyvelsk.github.io/SkyrimWebMonitor/ in a browser on the same machine (or on a device on the same network if you set the plugin's `ListenAddress` to `0.0.0.0`).
4. Configure the WebSocket URL on first launch and connect.

## Install as a PWA

The app can be installed to the home screen / start menu like a native app — it then opens fullscreen and works offline (UI shell only; live data still requires Skyrim + the plugin to be running).

### Desktop — Chrome / Edge / Brave

1. Open https://andreyvelsk.github.io/SkyrimWebMonitor/.
2. Look for the install icon (**⊕** / monitor-with-arrow) in the address bar, or open the browser menu and choose **Install SkyrimWebMonitor…** / **Apps → Install this site as an app**.
3. Confirm. The app launches in its own window and gets a shortcut.

### Android — Chrome

1. Open the URL.
2. Tap the **⋮** menu → **Add to Home screen** (or **Install app**).
3. Confirm. Launch it from the home screen.

### iOS / iPadOS — Safari

1. Open the URL in **Safari** (not Chrome — only Safari can install PWAs on iOS).
2. Tap the **Share** button → **Add to Home Screen**.
3. Confirm. Launch from the home screen.

### AYN Thor / other Android handhelds

Use the Chrome / Android steps above. The layout is tuned for handheld aspect ratios and touch input.

> Updates are picked up automatically: the next time you open the app online, it fetches the new version transparently.

## Run locally / develop

Requirements: Node.js 20+ and npm.

```bash
git clone https://github.com/andreyvelsk/SkyrimWebMonitor.git
cd SkyrimWebMonitor
npm install

cp .env.example .env  # set VITE_WS_URL to your SkyrimWebSocket address
npm run dev           # http://localhost:5173/SkyrimWebMonitor/
```

Other useful scripts:

```bash
npm run build           # production build into dist/
npm run preview         # serve the production build
npm run tsc             # type-check
npm run lint            # ESLint with --fix
npm run lint:css        # Stylelint with --fix
npm run format          # Prettier + Stylelint
```

## Reporting bugs

If you run into a bug, please [open a GitHub issue](https://github.com/andreyvelsk/SkyrimWebMonitor/issues/new) and include:

1. A description of the problem and clear steps to reproduce it.
2. A **trace-level log from `SkyrimWebSocket`** captured during reproduction. Set `LogLevel=trace` in `Data/SKSE/Plugins/SkyrimWebSocket.ini`, reproduce the issue, then attach the log file:
   ```
   %USERPROFILE%\Documents\My Games\Skyrim Special Edition\SKSE\SkyrimWebSocket.log
   ```
3. If the game crashed, also attach the `.dmp` file found in the same folder.
4. Browser name + version, OS, and (if relevant) device — e.g. *AYN Thor, Android 14, Chrome 130*.
5. Browser DevTools console output (any errors / warnings) and, if applicable, the failing WebSocket frame.

The bug-report requirements mirror those of the [SkyrimWebSocket](https://github.com/andreyvelsk/SkyrimWebSocket#bug-reports) project — most of the data the app shows comes from there, so the plugin's trace log is what makes issues actionable.

## Tech stack

- [Vue 3](https://vuejs.org/) (Composition API) + TypeScript
- [Vite](https://vite.dev/) build tooling
- [Pinia](https://pinia.vuejs.org/) state management
- [vue-i18n](https://vue-i18n.intlify.dev/) internationalization
- [vite-plugin-pwa](https://vite-pwa-org.netlify.app/) (Workbox) PWA support
- ESLint, Stylelint, Prettier

## Credits

- Game icons by [game-icons.net](https://game-icons.net/) — used under the [CC BY 3.0](https://creativecommons.org/licenses/by/3.0/) license. Each icon retains its original author attribution; see folder names under `public/icons/`.
- Fonts: **Cinzel** and **Cormorant Garamond** via [Google Fonts](https://fonts.google.com/) (Open Font License).
- *The Elder Scrolls V: Skyrim* is © Bethesda Softworks / ZeniMax. This is an unofficial fan-made companion app and is not affiliated with or endorsed by Bethesda.

## License

Released under the [MIT License](LICENSE).
