# /abbreviations Command

## Intent

Manage short aliases for clan tags to simplify other commands.

## Usage

```
/abbreviations <action> [abbr] [tag]
```

| Option   | Required       | Description                |
| -------- | -------------- | -------------------------- |
| `action` | Yes            | `list`, `add`, or `remove` |
| `abbr`   | For add/remove | The short abbreviation     |
| `tag`    | For add        | The clan tag to map to     |

## Invariants

1. **Guild-Scoped**: Abbreviations are per-server
2. **Case Insensitive**: Lookups ignore case
3. **Unique Abbreviations**: Cannot have duplicate abbreviations
4. **Permission Required**: May require manage server permission

## Examples

```
/abbreviations add CW #ABC123
/abbreviations remove CW
/abbreviations list
```

After adding, users can use:

```
/race CW
```

Instead of:

```
/race #ABC123
```

## Extension Points

- Add bulk import/export
- Add abbreviation suggestions
