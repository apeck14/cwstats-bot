# /player Command

## Intent

Display a player's Clash Royale profile including stats, clan, and war performance.

## Usage

```
/player <tag>
```

| Option | Required | Description          |
| ------ | -------- | -------------------- |
| `tag`  | Yes      | Player tag (#ABC123) |

## Invariants

1. **Tag Required**: Unlike clan commands, player tag is always required
2. **Limited Data Option**: Can fetch limited data for faster response
3. **Clan Display**: Shows current clan with badge if player is in one

## Response Format

Embed containing:

- Player name and tag
- Trophies and personal best
- Current clan (if any)
- War stats summary
- Link to full profile on website

## Extension Points

- Add battle log preview
- Add deck display
