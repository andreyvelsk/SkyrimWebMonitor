# SkyrimWebMonitor

A modern web monitoring application for Skyrim with real-time WebSocket communication, Vue 3, Vite, Pinia state management, Tailwind CSS, and PWA support.

## Features

- **Vue 3** - Progressive JavaScript framework with Composition API
- **Vite** - Next generation frontend tooling
- **Pinia** - State management
- **WebSocket** - Real-time bidirectional communication with auto-reconnect
- **Tailwind CSS** - Utility-first CSS framework for responsive design
- **PWA Support** - Progressive Web App capabilities
- **ESLint + Prettier** - Code quality and formatting with auto-fix on save
- **Hot Module Reload** - Instant updates during development

## Project Structure

```
src/
├── main.js              # Application entry point with PWA & Pinia init
├── App.vue              # Root component
├── style.css            # Global styles with Tailwind directives
├── config/
│   └── websocket.js     # WebSocket configuration settings
├── services/
│   └── websocket.js     # WebSocket client (singleton pattern)
├── stores/
│   ├── counter.js       # Example counter store
│   └── websocket.js     # WebSocket state management
└── components/
    ├── ConnectionStatus.vue  # Connection status display
    └── Messages.vue          # Messages list display
```

## WebSocket Architecture

### Configuration (`src/config/websocket.js`)
- **URL**: `ws://localhost:8080` (configurable via `VITE_WS_URL` env variable)
- **Reconnect Interval**: 3000ms
- **Max Reconnect Attempts**: 10
- **Heartbeat Interval**: 30000ms

### WebSocket Client (`src/services/websocket.js`)
- **Singleton Pattern**: Single connection instance across the app
- **Auto-Reconnect**: Automatically reconnects on connection loss
- **Heartbeat**: Sends ping messages to keep connection alive
- **Event System**: onOpen, onClose, onError, onMessage callbacks

### State Management (`src/stores/websocket.js`)
- Manages connection status (connecting, connected, disconnected)
- Stores received messages with timestamps
- Provides methods: `connect()`, `disconnect()`, `clearMessages()`, `sendMessage()`

### Components
- **ConnectionStatus**: Real-time connection status indicator
- **Messages**: Displays messages from server with timestamps

## Setup & Installation

### Install Dependencies

```bash
npm install
```

### Environment Variables

Create a `.env` file to configure WebSocket URL:

```env
VITE_WS_URL=ws://your-server:8080
```

## Running the Application

### Development Server

```bash
npm run dev
```

Development server runs on `http://localhost:5174/` (or next available port)

### Build for Production

```bash
npm run build
```

### Preview Production Build

```bash
npm run preview
```

### Linting & Formatting

```bash
# Lint with ESLint and auto-fix
npm run lint

# Format code with Prettier
npm run format
```

## Technologies Used

- **Vue.js** 3.5.32
- **Vite** 8.0.5
- **Pinia** 3.0.4
- **Tailwind CSS** 3.*
- **ESLint** 10.2.0
- **Prettier** 3.8.1
- **Vite PWA Plugin** 1.2.0

## Editor Setup

For the best development experience with automatic code fixing and formatting:

### VS Code Extensions
1. **ESLint** - by Dirk Baeumer
2. **Prettier** - by Esben Petersen
3. **Tailwind CSS IntelliSense** - by Bradleys (optional, for CSS autocomplete)

### VS Code Settings (auto-configured in `.vscode/settings.json`)
- Auto-format code on save with Prettier
- Auto-fix ESLint issues on save
- Validate Vue and JavaScript files with ESLint for Vue and JS respectively

## PWA Configuration

The application includes PWA support configured in `vite.config.js`.

### Add Icons
Place your app icons in the `public/` directory:
- `public/pwa-192x192.png` - 192x192 icon
- `public/pwa-512x512.png` - 512x512 icon

## Responsive Design

All components are built with Tailwind CSS for responsive design:

- **Mobile-first approach**: Optimized for small screens first
- **Fully responsive**: Works seamlessly on all screen sizes
- **Grid layouts**: Adaptive grid system that stacks on small screens
- **Utility classes**: No custom CSS, pure Tailwind styling

## API Reference

### WebSocketClient Methods

```javascript
import { getWebSocketClient } from '@/services/websocket'

const ws = getWebSocketClient()

// Connect to server
await ws.connect()

// Disconnect
ws.disconnect()

// Send message (string or object)
ws.send('message') // or ws.send({ type: 'action' })

// Check connection status
ws.isConnected() // boolean

// Register event listeners
ws.on('onOpen', () => console.log('Connected'))
ws.on('onMessage', (data) => console.log('Message:', data))
ws.on('onError', (error) => console.error('Error:', error))
ws.on('onClose', () => console.log('Disconnected'))
```

### Pinia Store

```javascript
import { useWebSocketStore } from '@/stores/websocket'

const wsStore = useWebSocketStore()

// Properties
wsStore.status           // 'connecting' | 'connected' | 'disconnected'
wsStore.messages         // array of messages
wsStore.error            // error message or null
wsStore.isConnected      // boolean
wsStore.isConnecting     // boolean
wsStore.messageCount     // number

// Methods
await wsStore.connect()
wsStore.disconnect()
wsStore.clearMessages()
wsStore.sendMessage(data)
```

## License

MIT

