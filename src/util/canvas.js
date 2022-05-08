const { getPlayerRanking } = require("./api")

export function createPlayerLeagueBadge() {
    const [{ data: playerRank }, arenaImage] = await Promise.all([
        getPlayerRanking(player.tag),
        loadImage(`./src/static/images/arenas/${getArenaEmoji(player.trophies)}.png`),
	])

    const canvas = createCanvas(arenaImage.width, arenaImage.height)
    const context = canvas.getContext("2d")

    context.drawImage(arenaImage, 0, 0, canvas.width, canvas.height)

    //add global rank
    if (playerRank >= 1) {
        const fontSize = () => {
            if (playerRank < 10) return 130
            if (playerRank < 1000) return 115
            return 90
        }

        context.font = `${fontSize()}px Supercell-Magic`

        const textWidth = context.measureText(playerRank).width
        const [tX, tY] = [(arenaImage.width - textWidth) / 2, arenaImage.height / 2 + 15]
        const [oX, oY] = [tX + 4, tY + 6]

        context.fillStyle = "black"
        context.fillText(playerRank, oX, oY)

        context.fillStyle = "white"
        context.fillText(playerRank, tX, tY)
    }
}
