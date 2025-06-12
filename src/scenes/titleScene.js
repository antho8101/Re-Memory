import { firstCinematicScene } from './firstCinematicScene.js'

let isFadingOut = false
let fadeOpacity = 1
let fadeStarted = false
let playButton = {}
let mouse = { x: 0, y: 0, down: false }
let glitchTime = 0
let wasHovering = false
let fadeComplete = false

const hoverSound = new Audio('assets/hover.wav')
const clickSound = new Audio('assets/click.wav')

const glowLayers = []
for (let i = 1; i <= 11; i++) {
  const img = new Image()
  img.src = `assets/glow-${i}.png`
  glowLayers.push(img)
}

const bg = new Image()
bg.src = 'assets/title-bg.png'
let bgLoaded = false
bg.onload = () => (bgLoaded = true)

const music = new Audio('assets/title-music.mp3')
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

export const titleScene = {
  init() {
    fadeOpacity = 1
    fadeStarted = false
    isFadingOut = false
    fadeComplete = false

    const welcomeModal = document.getElementById('welcomeModal')
    const startButton = document.getElementById('startButton')
    welcomeModal.style.display = 'flex'

    startButton.onclick = () => {
      music.play().catch(err => console.warn('Music play failed:', err))
      welcomeModal.style.display = 'none'
      fadeStarted = true
    }

    mouse._clickedOnce = false
  },

  handleMouseMove(x, y) {
    mouse.x = x
    mouse.y = y
  },

  handleMouseDown() {
    mouse.down = true
    glitchTime = 5
  },

  handleMouseUp() {
    const btn = playButton
    const isInside = mouse.x > btn.x && mouse.x < btn.x + btn.w && mouse.y > btn.y && mouse.y < btn.y + btn.h

    if (isInside && !mouse._clickedOnce) {
  mouse._clickedOnce = true
  clickSound.play()

  // ⬇️ Lancement du fade-out musique
  const fadeInterval = setInterval(() => {
    music.volume = Math.max(0, music.volume - 0.01)
    if (music.volume <= 0) {
      music.pause()
      clearInterval(fadeInterval)
    }
  }, 50)

  setTimeout(() => {
    isFadingOut = true
  }, 500)
}
  },

  update() {
    if (fadeStarted && fadeOpacity < 1 && !isFadingOut) {
      fadeOpacity += 0.01
      if (fadeOpacity > 1) fadeOpacity = 1
    }

    if (isFadingOut && fadeOpacity > 0) {
      fadeOpacity -= 0.01
      if (fadeOpacity <= 0 && !fadeComplete) {
        fadeComplete = true
        firstCinematicScene.init()
        window.currentScene = firstCinematicScene
      }
    }
  },

  render(ctx, canvas) {
    if (!fadeStarted) return

    ctx.clearRect(0, 0, canvas.width, canvas.height)

    let drawWidth = 0, drawHeight = 0, offsetX = 0, offsetY = 0

    ctx.globalAlpha = fadeOpacity

    if (bgLoaded) {
      const imgRatio = bg.width / bg.height
      const canvasRatio = canvas.width / canvas.height

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

        glowLayers.forEach((img, i) => {
      if (!img.complete) return
      const cfg = glowConfigs[i]
      const x = offsetX + cfg.x * drawWidth
      const y = offsetY + cfg.y * drawHeight
      const desiredWidth = cfg.w * drawWidth
      const ratio = img.height / img.width
      const desiredHeight = desiredWidth * ratio

      let alpha = 1
      if (cfg.type === 'neon') {
        alpha = Math.random() < 0.9 ? 1 : 0.2 + Math.random() * 0.3
      } else if (cfg.type === 'apartment') {
        const time = Date.now() / 1000 + i
        alpha = 0.7 + 0.3 * Math.sin(time)
      }

      ctx.globalAlpha = alpha * fadeOpacity // ← ⬅️ Important ici
      ctx.drawImage(img, x, y, desiredWidth, desiredHeight)
    })

    ctx.globalAlpha = fadeOpacity // ← ⬅️ Repositionne ici avant le texte et bouton  

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
    ctx.fillText(prefix, Math.round(startX + prefixWidth / 2), Math.round(centerY))

    ctx.fillStyle = 'red'
    ctx.fillText(':', Math.round(startX + ctx.measureText('Re').width + ctx.measureText(':').width / 2), Math.round(centerY))

    ctx.fillStyle = 'white'
    ctx.fillText(suffix, Math.round(startX + prefixWidth + ctx.measureText(suffix).width / 2), Math.round(centerY))

    ctx.font = '20px Arial'
    ctx.fillText('It was never just a dream', Math.round(canvas.width / 2), Math.round(centerY + 40))


    // Bouton START
    const btnX = (canvas.width - btnWidth) / 2
    const btnY = centerY + 80
    const isHover = mouse.x > btnX && mouse.x < btnX + btnWidth && mouse.y > btnY && mouse.y < btnY + btnHeight
    const isPressed = isHover && mouse.down

    if (isHover && !wasHovering) hoverSound.play()
    wasHovering = isHover

    ctx.save()
    ctx.translate(btnX + btnWidth / 2, btnY + btnHeight / 2)
    ctx.scale(isPressed ? 1.05 : 1, isPressed ? 1.05 : 1)

    ctx.fillStyle = isPressed ? '#111177' : isHover ? '#3333cc' : '#222288'
    ctx.strokeStyle = '#00ffff'
    ctx.lineWidth = 2
    ctx.fillRect(-btnWidth / 2, -btnHeight / 2, btnWidth, btnHeight)
    ctx.strokeRect(-btnWidth / 2, -btnHeight / 2, btnWidth, btnHeight)

    ctx.font = '38px VT323, monospace'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle' // ← assure un centrage parfait

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
    ctx.globalAlpha = 1

    playButton = { x: btnX, y: btnY, w: btnWidth, h: btnHeight }
  }
}

const glowConfigs = [
  { x: 0.086, y: 0.505, w: 0.032, type: 'neon' },
  { x: 0.846, y: 0.72, w: 0.06, type: 'apartment' },
  { x: 0.894, y: 0.48, w: 0.04, type: 'apartment' },
  { x: 0.953, y: 0.28, w: 0.05, type: 'apartment' },
  { x: 0.096, y: 0.73, w: 0.075, type: 'apartment' },
  { x: 0.136, y: 0.88, w: 0.045, type: 'neon' },
  { x: 0.02, y: 0.6, w: 0.05, type: 'apartment' },
  { x: 0.155, y: 0.18, w: 0.03, type: 'neon' },
  { x: 0.55, y: 0.09, w: 0.042, type: 'neon' },
  { x: 0.677, y: 0.435, w: 0.03, type: 'neon' },
  { x: 0.00, y: 0.088, w: 0.04, type: 'apartment' }
]

document.addEventListener('click', (e) => {
  const volumeControl = document.getElementById('volumeControl')
  if (!volumeControl.contains(e.target)) volumeSlider.style.display = 'none'
})