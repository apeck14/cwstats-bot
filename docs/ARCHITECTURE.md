# Architecture

## System Intent

CWStats Bot is a **Discord slash command bot** that:

1. Provides real-time Clash Royale Clan Wars data in Discord
2. Links Discord users to their Clash Royale accounts
3. Manages per-server settings (default clan, abbreviations, nudges)
4. Syncs emoji assets for clan badges and game icons

## Core Invariants

These rules must always hold true. Violating them will cause bugs or poor user experience.

### 1. All API Calls Through Services

> External API calls must go through `utils/services.js`.

Never call cwstats-api directly from commands. The services layer provides:

- Consistent error handling
- Request timeouts
- Response formatting

### 2. Deferred Responses

> All commands must defer their reply before async operations.

Discord requires a response within 3 seconds. Commands should:

1. Call `i.deferReply()` immediately
2. Do async work
3. Call `safeEdit()` with the result

### 3. Graceful Error Handling

> Commands must never throw unhandled exceptions.

Use the helper functions:

- `errorMsg(i, message)` - Red error embed
- `warningMsg(i, message)` - Orange warning embed
- `successMsg(i, message)` - Green success embed

### 4. Guild Caching

> Guild data is cached for 5 minutes to reduce API load.

Use `getGuildCached()` for repeated guild lookups within a session.

### 5. Watchdog Timeout

> Commands have a watchdog that fires after REQUEST_TIMEOUT_MS + 2 seconds.

If a command takes too long, the watchdog:

- Marks the interaction as timed out
- Sends a timeout message to the user
- Prevents further edits

### 6. Abbreviation Resolution

> Tag inputs must check for abbreviations before API calls.

Flow for tag resolution:

1. Check if input matches a guild abbreviation
2. If yes, use the mapped tag
3. If no and length < 3, show abbreviation error
4. Otherwise, use input as literal tag

### 7. Default Clan Fallback

> Commands that accept optional tags should fall back to guild's default clan.

If no tag provided and no default clan set, show a warning linking to the website.

## Data Flow

```
Discord Interaction
     ↓
interactionCreate.js (event handler)
     ↓
validate.js (permissions, cooldowns)
     ↓
commands/*.js (command handler)
     ↓
services.js (API calls)
     ↓
cwstats-api (external service)
     ↓
Response sent via safeEdit()
```

## Event Handlers

| Event                       | Purpose                          |
| --------------------------- | -------------------------------- |
| `clientReady`               | Log startup, sync commands       |
| `interactionCreate`         | Route commands and context menus |
| `guildCreate`               | Create guild record in database  |
| `guildDelete`               | Cleanup when bot is removed      |
| `emojiCreate/Update/Delete` | Sync emoji cache                 |

## Emoji Management

The bot maintains a `cwEmojis` collection for clan badges and game icons:

- Emojis are loaded from guilds owned by specified owner IDs
- Stored in memory as formatted emoji strings (`<:name:id>`)
- Used in embed responses for visual richness

## Error Handling

| Error Type      | Handling                 |
| --------------- | ------------------------ |
| API 404         | Show "not found" message |
| API 429         | Show rate limit message  |
| API 503         | Show maintenance message |
| API timeout     | Show timeout message     |
| Validation fail | Show ephemeral error     |

## Localization

Commands support multiple languages via Discord's localization system:

- Command names and descriptions have `_localizations` variants
- Supported: German, Spanish, French, Italian, Dutch, Portuguese, Turkish
