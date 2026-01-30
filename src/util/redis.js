/* eslint-disable no-console */
import Redis from 'ioredis'

const REDIS_URL = process.env.REDIS_URL

let redis = null

export function getRedis() {
  if (!redis) {
    redis = new Redis(REDIS_URL, {
      lazyConnect: true,
      maxRetriesPerRequest: 3
    })
    redis.on('error', (err) => {
      console.error('Redis connection error:', err)
    })
  }
  return redis
}

/**
 * Normalize a name for search indexing
 * - Lowercase for case-insensitivity
 * - Strip ASCII punctuation but KEEP spaces (for word tokenization)
 * - Keep unicode like emojis, special chars
 * "(ReKt) Mider8" → "rekt mider8" (two searchable words)
 */
function normalizeName(name) {
  return name
    .toLowerCase()
    .replace(/[\x00-\x1F\x21-\x2F\x3A-\x40\x5B-\x60\x7B-\x7F]/g, '') // Strip ASCII punctuation but keep space (0x20)
    .replace(/\s+/g, ' ') // Collapse multiple spaces
    .trim()
}

/**
 * Escape special characters for RediSearch TEXT field queries
 */
function escapeTextQuery(str) {
  return str.replace(/[-@!{}()[\]"~*\\:]/g, '\\$&')
}

/**
 * Search players by name using RediSearch
 * Uses TEXT field (nameNorm) with word tokenization for flexible matching
 * "(ReKt) Mider8" → stored as "rekt mider8" → matches "rekt", "mider", etc.
 * @param {string} query - Search query
 * @param {number} limit - Max results (Discord autocomplete max is 25)
 * @returns {Promise<Array<{name: string, tag: string, clanName: string}>>}
 */
export async function searchPlayers(query, limit = 25) {
  const redis = getRedis()
  const normalizedQuery = normalizeName(query.trim())

  if (normalizedQuery.length < 2) {
    return []
  }

  try {
    // TEXT field prefix search - each word in nameNorm is separately searchable
    const escapedQuery = escapeTextQuery(normalizedQuery)
    const rawResults = await redis.call(
      'FT.SEARCH',
      'players:idx',
      `@nameNorm:${escapedQuery}*`,
      'LIMIT',
      '0',
      String(Math.min(limit, 25)),
      'RETURN',
      '3',
      'name',
      'tag',
      'clanName'
    )

    // Parse results: [total, key1, [field, value, ...], key2, ...]
    const results = []
    for (let i = 1; i < rawResults.length && results.length < limit; i += 2) {
      const fields = rawResults[i + 1]
      if (!fields) continue

      const player = {}
      for (let j = 0; j < fields.length; j += 2) {
        player[fields[j]] = fields[j + 1]
      }

      if (player.name && player.tag) {
        results.push({
          clanName: player.clanName || '',
          name: player.name,
          tag: player.tag
        })
      }
    }

    return results
  } catch (err) {
    console.error('Redis search error:', err)
    return []
  }
}
