# CWStats Bot

Discord bot for Clash Royale Clan Wars analytics. Provides slash commands for viewing race stats, player info, and clan management directly in Discord.

## Quick Reference

| Command          | Purpose                                       |
| ---------------- | --------------------------------------------- |
| `/race`          | View current river race stats and projections |
| `/player`        | View player profile and stats                 |
| `/scores`        | View player war scores history                |
| `/members`       | List clan members with war participation      |
| `/attacks`       | View today's attacks for a clan               |
| `/leaderboard`   | View war leaderboards                         |
| `/nudge`         | Ping linked players with attacks remaining    |
| `/link`          | Link Clash Royale account to Discord          |
| `/clans`         | View linked clans for the server              |
| `/spy`           | View opponent clan stats                      |
| `/donate`        | View donation stats                           |
| `/help`          | Show all available commands                   |
| `/abbreviations` | Manage clan tag abbreviations                 |
| `/apply`         | Apply to join a clan                          |

### Context Commands

| Command         | Purpose                        |
| --------------- | ------------------------------ |
| `Get Player`    | Look up player by Discord user |
| `Link Player`   | Link a player tag to a user    |
| `Unlink Player` | Remove player link from user   |

## Architecture Overview

```
index.js                    # Entry point, client initialization
├── config.js               # Environment variables
└── src/
    ├── commands/           # Slash command handlers
    ├── context-commands/   # Right-click context menu commands
    ├── events/             # Discord.js event handlers
    ├── static/             # Constants (colors, badges, etc.)
    └── util/
        ├── initialize.js   # Client and command setup
        ├── services.js     # API client for cwstats-api
        ├── functions.js    # Helper functions
        ├── formatting.js   # String formatting utilities
        ├── validate.js     # Permission/input validation
        └── logging.js      # Command logging
```

## Documentation Structure

- [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md) - System design and invariants
- [docs/EXTENDING.md](./docs/EXTENDING.md) - How to add new commands
- [docs/commands/](./docs/commands/) - Individual command documentation

---

_This documentation is designed for both human developers and AI agents. Each section uses consistent structure for automated parsing._
