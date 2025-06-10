let fadeOpacity = 0
let authorOpacity = 0
let finished = false
let timeElapsed = 0

export const quoteScene = {
  init() {
    fadeOpacity = 0
    authorOpacity = 0
    finished = false
    timeElapsed = 0
  },

  update(deltaTime) {
    timeElapsed += deltaTime

    if (timeElapsed < 2000) {
      // Fade in de la citation
      fadeOpacity = Math.min(1, timeElapsed / 2000)
    }

    if (timeElapsed >= 3000 && timeElapsed < 4000) {
      // Fade in progressif du nom de l’auteur
      authorOpacity = (timeElapsed - 3000) / 1000
    } else if (timeElapsed >= 4000 && timeElapsed < 7000) {
      authorOpacity = 1
    }

    if (timeElapsed >= 7000 && timeElapsed < 9000) {
      // Fade out progressif des deux
      const t = (timeElapsed - 7000) / 2000
      fadeOpacity = Math.max(0, 1 - t)
      authorOpacity = Math.max(0, 1 - t)
    }

    if (timeElapsed >= 9000) {
      finished = true
    }
  },

  render(ctx, canvas) {
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    ctx.fillStyle = 'black'
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // Citation
    ctx.globalAlpha = fadeOpacity
    ctx.fillStyle = 'white'
    ctx.font = '32px Georgia'
    ctx.textAlign = 'center'
    ctx.fillText('"We are such stuff as dreams are made on."', Math.round(canvas.width / 2), Math.round(canvas.height / 2))

    // Auteur
    ctx.globalAlpha = authorOpacity
    ctx.font = '20px Georgia'
    ctx.fillText('William Shakespeare, The Tempest', Math.round(canvas.width / 2), Math.round(canvas.height / 2 + 40))

    ctx.globalAlpha = 1
  },

  isFinished() {
    return finished
  }
}