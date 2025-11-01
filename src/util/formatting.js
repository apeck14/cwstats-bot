export const formatStr = (clanName) => clanName.replaceAll('*', '∗').replaceAll('_', '\\_').replaceAll('™️', '™')

export const formatTag = (tag, withHash = true) => {
  if (typeof tag !== 'string') return

  return `${withHash ? '#' : ''}${tag
    .toUpperCase()
    .replace(/[^0-9a-z]/gi, '')
    .replace(/O/g, '0')}`
}

export const formatRole = (role) => {
  if (role === 'coLeader') return 'Co-Leader'

  return `${role[0].toUpperCase()}${role.slice(1)}`
}

export const formatPlace = (place) => {
  if (place === 1) return '1st'
  if (place === 2) return '2nd'
  if (place === 3) return '3rd'
  if (place === 4) return '4th'
  if (place === 5) return '5th'
  return 'N/A'
}

// Returns a human-readable difference like "Xm Ys" between two Date objects
export const getTimeDifference = (date1, date2) => {
  const diff = Math.abs(date2 - date1)
  const minutes = Math.floor(diff / (1000 * 60))
  const seconds = Math.floor((diff % (1000 * 60)) / 1000)
  return `${minutes}m ${seconds}s`
}
