# /link Command

## Intent

Associate a Discord user's account with their Clash Royale player tag for personalized features.

## Usage

```
/link <tag>
```

| Option | Required | Description          |
| ------ | -------- | -------------------- |
| `tag`  | Yes      | Player tag (#ABC123) |

## Invariants

1. **Tag Validation**: Tag is formatted and validated before linking
2. **Idempotent**: Linking same tag twice shows "already linked" warning
3. **Player Index**: Also adds player to search index for website
4. **User-Scoped**: Links are per-user, visible across all guilds

## Response Format

- Success: "✅ Account linked to **PlayerName**!"
- Already linked: Warning message
- Invalid tag: Error message

## Data Flow

1. Format tag (add #, uppercase)
2. Add to player search index
3. Link to user's account
4. Return confirmation with player name

## Extension Points

- Add verification via Supercell API token
- Add multi-account support
