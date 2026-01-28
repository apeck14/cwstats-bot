# /race Command

## Intent

Display current river race standings with projections for all clans in the group.

## Usage

```
/race [tag]
```

| Option | Required | Description                                           |
| ------ | -------- | ----------------------------------------------------- |
| `tag`  | No       | Clan tag or abbreviation. Falls back to default clan. |

## Invariants

1. **Tag Resolution**: Checks abbreviations → default clan → literal tag
2. **State Check**: Shows "matchmaking" message if race hasn't started
3. **Projection Data**: Displays projected finish positions based on current pace
4. **All Clans**: Shows all 5 clans in the river race group

## Response Format

Embed containing:

- Clan names with badge emojis
- Current fame/points
- Decks used
- Projected placement
- Time remaining indicators

## Extension Points

- Add detailed per-clan breakdown subcommand
- Add historical comparison
