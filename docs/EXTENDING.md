# Extending CWStats Bot

## Adding a New Command

### 1. Create the Command File

Create a new file in `/src/commands/`:

```javascript
// src/commands/my-command.js
export default {
  data: {
    name: 'my-command',
    description: 'What the command does',
    options: [
      // Add command options here
    ]
  },
  async run(i, client) {
    // Command logic here
  }
}
```

That's it. Commands are auto-discovered on startup.

### 2. Add Options

Common option types:

| Type    | Code | Example              |
| ------- | ---- | -------------------- |
| String  | `3`  | Clan tag, player tag |
| Integer | `4`  | Limit, count         |
| Boolean | `5`  | Toggle flags         |
| User    | `6`  | Discord user mention |

```javascript
options: [
  {
    name: 'tag',
    description: 'Clan tag (#ABC123)',
    type: 3,
    required: false
  }
]
```

### 3. Add Localization

For multi-language support, add `_localizations` objects:

```javascript
data: {
  name: 'race',
  name_localizations: {
    de: 'rennen',
    'es-ES': 'carrera',
    fr: 'course'
  },
  description: 'View race stats',
  description_localizations: {
    de: 'Rennen-Statistiken anzeigen',
    'es-ES': 'Ver estadísticas de carrera',
    fr: 'Afficher les stats de course'
  }
}
```

### 4. Handle Responses

Use the helper functions from `util/functions.js`:

```javascript
import { errorMsg, successMsg, warningMsg, safeEdit } from '../util/functions.js'

// For errors
return errorMsg(i, '**Something went wrong.**')

// For warnings
return warningMsg(i, '**No data found.**')

// For success
return successMsg(i, '**Action completed!**')

// For custom embeds
return safeEdit(i, { embeds: [myEmbed] })
```

## Adding a Context Command

Context commands appear in right-click menus. Create in `/src/context-commands/`:

```javascript
export default {
  data: {
    name: 'My Context Action',
    type: 2 // 2 = User context, 3 = Message context
  },
  async run(i, client) {
    const targetUser = i.targetUser
    // Handle the action
  }
}
```

## Adding a New Event

Create in `/src/events/`:

```javascript
export default {
  name: 'eventName', // Discord.js event name
  run(client, ...args) {
    // Handle the event
  }
}
```

## Adding API Endpoints

Add to `/src/util/services.js`:

```javascript
export const myApiCall = (param) => api.get(`/my-endpoint/${param}`).then(handleAPISuccess).catch(handleAPIFailure)
```

## Command Properties

| Property   | Type     | Purpose                    |
| ---------- | -------- | -------------------------- |
| `data`     | object   | Discord command definition |
| `run`      | function | Command handler            |
| `cooldown` | boolean  | Enable per-guild cooldowns |

## Validation

The `validate.js` module checks:

- Bot permissions in channel
- User permissions (if required)
- Guild cooldowns

Add custom validation in the validate function if needed.

## Checklist for New Commands

- [ ] File exports `{ data, run }`
- [ ] Has `description` for slash command menu
- [ ] Options have `description` for help text
- [ ] Uses `safeEdit()` for responses (not `i.editReply`)
- [ ] Handles errors with `errorMsg()`
- [ ] Resolves abbreviations if accepting clan tags
- [ ] Falls back to default clan if tag is optional
- [ ] Added localizations for supported languages
