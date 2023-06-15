const formatStr = (clanName) => {
  return clanName
    .replaceAll("*", "∗")
    .replaceAll("_", "\\_")
    .replaceAll("™️", "™")
}

const formatTag = (tag) => {
  if (typeof tag !== "string") return

  return `#${tag
    .toUpperCase()
    .replace(/[^0-9a-z]/gi, "")
    .replaceAll(/O/g, "0")
    .replaceAll(/o/g, "0")}`
}

const formatRole = (role) => {
  if (role === "coLeader") return "Co-Leader"

  return `${role[0].toUpperCase()}${role.slice(1)}`
}

module.exports = {
  formatStr,
  formatTag,
  formatRole,
}
