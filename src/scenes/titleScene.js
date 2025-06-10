// titleScene.js

const hoverSound = new Audio('./hover.wav')
const clickSound = new Audio('./click.wav')

const glowLayers = []
for (let i = 1; i <= 11; i++) {
  const img = new Image()
  img.src = `public/assets/glow-${i}.png`
  glowLayers.push(img)
}

const bg = new Image()
bg.src = 'public/assets/title-bg.png'

const music = new Audio('public/assets/title-music.mp3')
music.loop = true
music.volume = 0.5
const volumeSlider = document.getElementById('volumeSlider')
const volumeIcon = document.getElementById('volumeIcon')

volumeSlider.addEventListener('input', () => {
  music.volume = volumeSlider.value
})

volumeIcon.addEventListener('click', (e) => {
  e.stopPropagation()
  volumeSlider.style.display = volumeSlider.style.display === 'none' ? 'block' : 'none'
})

let bgLoaded = false
let fadeOpacity = 0
let fadeStarted = false
let playButton = {}
let mouse = { x: 0, y: 0, down: false }
let wasHovering = false
let glitchTime = 0

bg.onload = () => {
  bgLoaded = true
}

export const titleScene = {
  init() {
    fadeOpacity = 0
    fadeStarted = false
    const welcomeModal = document.getElementById('welcomeModal')
    const startButton = document.getElementById('startButton')
    welcomeModal.style.display = 'flex'

    startButton.onclick = () => {
      music.play().catch(err => console.warn('Music play failed:', err))
      welcomeModal.style.display = 'none'
      fadeStarted = true
    }
  },

  update() {
    if (fadeStarted && fadeOpacity < 1) {
      fadeOpacity += 0.01
      if (fadeOpacity > 1) fadeOpacity = 1
    }
  },

  render(ctx, canvas) {
    if (!fadeStarted) return

    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Dessin du fond
    if (bgLoaded) {
        const imgRatio = bg.width / bg.height
        const canvasRatio = canvas.width / canvas.height
        let drawWidth, drawHeight, offsetX, offsetY

        if (canvasRatio > imgRatio) {
        drawWidth = canvas.width
        drawHeight = canvas.width / imgRatio
        offsetX = 0
        offsetY = (canvas.height - drawHeight) / 2
        } else {
        drawHeight = canvas.height
        drawWidth = canvas.height * imgRatio
        offsetX = (canvas.width - drawWidth) / 2
        offsetY = 0
        }

        ctx.drawImage(bg, offsetX, offsetY, drawWidth, drawHeight)
    } else {
        ctx.fillStyle = '#111'
        ctx.fillRect(0, 0, canvas.width, canvas.height)
    }

    // Appliquer l'opacité globale
    ctx.globalAlpha = fadeOpacity

    // Glows
    glowLayers.forEach((img, i) => {
        if (!img.complete) return
        const cfg = glowConfigs[i]
        const x = canvas.width * cfg.x
        const y = canvas.height * cfg.y
        const desiredWidth = canvas.width * cfg.w
        const ratio = img.height / img.width
        const desiredHeight = desiredWidth * ratio
        ctx.globalAlpha = (cfg.alpha || 0.4) * fadeOpacity
        ctx.drawImage(img, x, y, desiredWidth, desiredHeight)
    })

    // Revenir à opacité globale pour le texte et les boutons
    ctx.globalAlpha = fadeOpacity

    // Titre
    const btnWidth = 220
    const btnHeight = 60
    const totalHeight = 64 + 20 + 40 + 40
    const centerY = (canvas.height - totalHeight) / 2

    ctx.font = '64px Orbitron, Arial'
    ctx.textAlign = 'center'
    const title = 'Re:Memory'
    const titleParts = title.split(':')
    const prefix = titleParts[0] + ':'
    const suffix = titleParts[1]
    const prefixWidth = ctx.measureText(prefix).width
    const totalWidth = ctx.measureText(title).width
    const startX = canvas.width / 2 - totalWidth / 2

    ctx.fillStyle = 'white'
    ctx.fillText(prefix, startX + prefixWidth / 2, centerY)

    ctx.fillStyle = 'red'
    ctx.fillText(':', startX + ctx.measureText('Re').width + ctx.measureText(':').width / 2, centerY)

    ctx.fillStyle = 'white'
    ctx.fillText(suffix, startX + prefixWidth + ctx.measureText(suffix).width / 2, centerY)

    ctx.font = '20px Arial'
    ctx.fillText('It was never just a dream', canvas.width / 2, centerY + 40)

    // Bouton START
    const btnX = (canvas.width - btnWidth) / 2
    const btnY = centerY + 80
    const isHover = mouse.x > btnX && mouse.x < btnX + btnWidth && mouse.y > btnY && mouse.y < btnY + btnHeight
    const isPressed = isHover && mouse.down

    let glitchX = 0, glitchY = 0
    if (glitchTime > 0) {
        glitchX = Math.random() * 4 - 2
        glitchY = Math.random() * 4 - 2
        glitchTime--
    }

    ctx.save()
    ctx.translate(btnX + btnWidth / 2, btnY + btnHeight / 2)
    const scale = isPressed ? 1.05 : 1
    ctx.scale(scale, scale)

    ctx.fillStyle = isPressed ? '#111177' : isHover ? '#3333cc' : '#222288'
    ctx.strokeStyle = '#00ffff'
    ctx.lineWidth = 2
    ctx.fillRect(-btnWidth / 2, -btnHeight / 2, btnWidth, btnHeight)
    ctx.strokeRect(-btnWidth / 2, -btnHeight / 2, btnWidth, btnHeight)

    ctx.font = '38px VT323, monospace'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'

    if (isPressed) {
        ctx.fillStyle = '#ff00ff'
        ctx.fillText('START', Math.random() * 2 - 1, Math.random() * 2 - 1)
        ctx.fillStyle = '#00ffff'
        ctx.fillText('START', Math.random() * 2 - 1, Math.random() * 2 - 1)
    } else {
        ctx.fillStyle = '#00ffff'
        ctx.fillText('START', 0, 0)
    }

    ctx.restore()

    playButton = { x: btnX, y: btnY, w: btnWidth, h: btnHeight }

    // Reset l'opacité pour les prochains dessins (s'il y en a)
    ctx.globalAlpha = 1
    },

  handleMouseMove(x, y) {
    mouse.x = x
    mouse.y = y

    const b = playButton
    const isHover = x > b.x && x < b.x + b.w && y > b.y && y < b.y + b.h
    document.body.style.cursor = isHover ? 'pointer' : 'default'

    if (isHover && !wasHovering) {
      hoverSound.currentTime = 0
      hoverSound.play().catch(() => {})
    }

    wasHovering = isHover
  },

  handleMouseDown() {
    mouse.down = true
  },

  handleMouseUp() {
    mouse.down = false
  },

  handleClick(x, y) {
    const b = playButton
    if (x > b.x && x < b.x + b.w && y > b.y && y < b.y + b.h) {
      clickSound.currentTime = 0
      clickSound.play().catch(() => {})
      glitchTime = 10
      // ➕ plus tard ici : changer de scène
    }
  }
}

document.addEventListener('click', (e) => {
  const volumeControl = document.getElementById('volumeControl')
  const isClickInside = volumeControl.contains(e.target)

  if (!isClickInside) {
    volumeSlider.style.display = 'none'
  }
})

const glowConfigs = [
  { x: 0.086, y: 0.51, w: 0.032 },
  { x: 0.5, y: 0.05, w: 0.03 },
  { x: 0.75, y: 0.15, w: 0.02 },
  { x: 0.15, y: 0.6, w: 0.02 },
  { x: 0.6, y: 0.4, w: 0.03 },
  { x: 0.3, y: 0.7, w: 0.02 },
  { x: 0.8, y: 0.65, w: 0.02 },
  { x: 0.45, y: 0.85, w: 0.03 },
  { x: 0.05, y: 0.85, w: 0.02 },
  { x: 0.85, y: 0.05, w: 0.02 },
  { x: 0.35, y: 0.3, w: 0.02 }
]