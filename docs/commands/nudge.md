# /nudge Command

## Intent

Mention all linked Discord users who have remaining war attacks, reminding them to participate.

## Usage

```
/nudge [tag]
```

| Option | Required | Description                                           |
| ------ | -------- | ----------------------------------------------------- |
| `tag`  | No       | Clan tag or abbreviation. Falls back to default clan. |

## Invariants

1. **Linked Players Only**: Only mentions users with linked Clash Royale accounts
2. **War Day Check**: Only works during active war days (not training)
3. **Remaining Attacks**: Only includes players with decks remaining
4. **Leader Filter**: Optionally excludes Leaders/Co-Leaders based on guild settings
5. **Custom Message**: Uses guild's custom nudge message if configured

## Requirements

- Bot needs permission to mention users
- Users must have linked their accounts via `/link`
- Guild must have player links configured on the website

## Response Format

Message containing:

- List of @mentions for players with remaining attacks
- Number of decks remaining per player
- Optional custom message from guild settings

## Extension Points

- Add threshold option (only nudge if X+ decks remaining)
- Add role-based filtering
