# 🎰 Ruleta Bot

Bot de ruleta para grupos de Telegram con puntos virtuales. Rápido, justo, y con animaciones que dan esa sensación de casino.

## 🎮 Cómo apostar

10 tipos de apuesta con pagos variables:

| Apuesta | Paga | Probabilidad |
|---------|------|-------------|
| 🔴 Rojo | x2 | 48.6% |
| ⚫ Negro | x2 | 48.6% |
| 🟢 Verde (0) | x14 | 2.7% |
| 🔄 Par | x2 | 48.6% |
| 🔄 Impar | x2 | 48.6% |
| 📊 1-18 | x2 | 48.6% |
| 📊 19-36 | x2 | 48.6% |
| 📦 1-12 | x3 | 32.4% |
| 📦 13-24 | x3 | 32.4% |
| 📦 25-36 | x3 | 32.4% |

Tocás un botón, elegís el monto, apostás. A los 30 segundos la ruleta gira con animación de desaceleración y se revela el resultado.

## 📋 Comandos

| Comando | Descripción |
|---------|-------------|
| `/start` | Registrarte y recibir 100 puntos iniciales |
| `/ruleta` | Iniciar una ronda de ruleta |
| `/balance` | Ver tu saldo de puntos |
| `/daily` | Reclamar 50 puntos gratis cada 24 horas |
| `/top` | Ranking de jugadores con rondas jugadas |

## 🚀 Setup rápido

### 1. Crear el bot en Telegram

Abrí [@BotFather](https://t.me/BotFather) y mandá:

```
/newbot
```

Seguí las instrucciones. Al final te da un token.

### 2. Desactivar Privacy Mode

Para que el bot funcione bien en grupos:

```
/setprivacy → elegí tu bot → Disable
```

### 3. Configurar

```powershell
# Windows (PowerShell)
$env:BOT_TOKEN="tu-token-aqui"

# Linux / macOS
export BOT_TOKEN="tu-token-aqui"
```

### 4. Instalar y correr

```powershell
npm install
npm run dev
```

> **Nota**: `npm run dev` usa tsx para correr TypeScript directo. Para producción, hacé `npm run build && npm start`.

### 5. Agregar el bot al grupo

Agregalo como administrador con permisos de:
- Enviar mensajes
- Editar mensajes de otros

## 📂 Estructura

```
src/
├── index.ts           # Entry point, polling, graceful shutdown
├── bot.ts             # Grammy bot factory, middleware
├── types.ts           # TypeScript types
├── utils/
│   └── errors.ts      # Telegram error helpers
├── commands/
│   ├── start.ts       # /start
│   ├── ruleta.ts      # /ruleta (inicia ronda)
│   ├── balance.ts     # /balance
│   ├── top.ts         # /top (leaderboard)
│   ├── daily.ts       # /daily (+50 pts/24h)
│   └── callbacks.ts   # Inline keyboard handlers
├── game/
│   ├── roulette.ts    # Lógica pura: spin, evaluar apuestas
│   ├── keyboards.ts   # Builders de inline keyboards
│   └── engine.ts      # State machine, cooldowns, animación
└── db/
    ├── schema.ts      # SQLite schema (WAL mode)
    └── queries.ts     # Prepared statements
```

## 🧪 Tests

```powershell
npm test
```

26 tests cubriendo lógica de ruleta y queries de base de datos.

## 🛡️ Seguridad

- BOT_TOKEN en variable de entorno (nunca commiteado)
- SQLite con transacciones atómicas (BEGIN IMMEDIATE)
- Balance validado antes de cada apuesta
- crypto.randomInt() para resultados justos
- Cooldown de 10s entre rondas

## 🏗️ Stack

- **Runtime**: Node.js
- **Lenguaje**: TypeScript
- **Framework**: [Grammy](https://grammy.dev)
- **Base de datos**: better-sqlite3 (WAL mode)
- **Hosting**: PC local (polling mode)

## 📄 Licencia

MIT
