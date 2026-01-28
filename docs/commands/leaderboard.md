# /leaderboard Command

## Intent

Display war trophy leaderboards for clans.

## Usage

```
/leaderboard [region]
```

| Option   | Required | Description                        |
| -------- | -------- | ---------------------------------- |
| `region` | No       | Filter by region (global, country) |

## Invariants

1. **Default Global**: Shows global leaderboard if no region specified
2. **Result Limit**: Limited number of results for embed size
3. **Rank Display**: Shows position, clan name, and trophy count

## Response Format

Embed containing:

- Ranked list of clans
- Badge emojis
- Trophy counts
- Link to full leaderboard on website

## Extension Points

- Add pagination
- Add daily leaderboard option
