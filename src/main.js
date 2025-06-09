import './main.css'
import bgUrl from './assets/title-bg.png'

const canvas = document.getElementById('gameCanvas')
const ctx = canvas.getContext('2d')

let bgLoaded = false
let playButton = {}
let mouse = { x: 0, y: 0, down: false }

// Chargement de l’image de fond
const bg = new Image()
bg.src = bgUrl
bg.onload = () => {
  bgLoaded = true
}

// Plein écran responsive
function resizeCanvas() {
  canvas.width = window.innerWidth
  canvas.height = window.innerHeight
}
window.addEventListener('resize', resizeCanvas)
resizeCanvas()

// Events souris
canvas.addEventListener('mousemove', (e) => {
  const rect = canvas.getBoundingClientRect()
  mouse.x = e.clientX - rect.left
  mouse.y = e.clientY - rect.top
})
canvas.addEventListener('mousedown', () => { mouse.down = true })
canvas.addEventListener('mouseup', () => { mouse.down = false })

canvas.addEventListener('click', (e) => {
  const b = playButton
  if (mouse.x > b.x && mouse.x < b.x + b.w && mouse.y > b.y && mouse.y < b.y + b.h) {
    alert('Le jeu commence !')
  }
})

// Boucle de rendu
function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height)

  // Background
  if (bgLoaded) {
    ctx.drawImage(bg, 0, 0, canvas.width, canvas.height)
  } else {
    ctx.fillStyle = '#111'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
  }

  // Centrage vertical calculé
  const btnWidth = 220
  const btnHeight = 60

  const totalHeight = 64 + 20 + 40 + 40 // Titre + sous-titre + marge + bouton
  const centerY = (canvas.height - totalHeight) / 2

  // Titre
  ctx.fillStyle = 'white'
  ctx.font = '64px Orbitron, Arial'
  ctx.textAlign = 'center'
  const title = 'Re:Memory'
  const titleParts = title.split(':')
  const prefix = titleParts[0] + ':'
  const suffix = titleParts[1]

  ctx.textAlign = 'center'

  // Mesure de texte pour centrer chaque partie précisément
  ctx.font = '64px Orbitron, Arial'
  const prefixWidth = ctx.measureText(prefix).width
  const totalWidth = ctx.measureText(title).width
  const startX = canvas.width / 2 - totalWidth / 2

  // Texte avant ":" (blanc)
  ctx.fillStyle = 'white'
  ctx.fillText(prefix, startX + prefixWidth / 2, centerY)

  // ":" en rouge
  const colonWidth = ctx.measureText(':').width
  ctx.fillStyle = 'red'
  ctx.fillText(':', startX + ctx.measureText('Re').width + colonWidth / 2, centerY)

  // Texte après ":" (blanc)
  ctx.fillStyle = 'white'
  ctx.fillText(suffix, startX + prefixWidth + ctx.measureText(suffix).width / 2, centerY)

  // Sous-titre
  ctx.font = '20px Arial'
  ctx.fillText('It was never just a dream', canvas.width / 2, centerY + 40)

  // Bouton
  const btnX = (canvas.width - btnWidth) / 2
  const btnY = centerY + 80

  const isHover = mouse.x > btnX && mouse.x < btnX + btnWidth && mouse.y > btnY && mouse.y < btnY + btnHeight
  const isPressed = isHover && mouse.down

  ctx.fillStyle = isPressed ? '#111177' : isHover ? '#3333cc' : '#222288'
  ctx.strokeStyle = '#00ffff'
  ctx.lineWidth = 2
  ctx.fillRect(btnX, btnY, btnWidth, btnHeight)
  ctx.strokeRect(btnX, btnY, btnWidth, btnHeight)

  ctx.fillStyle = '#00ffff'
  ctx.font = '38px VT323, monospace'
  ctx.fillText('PLAY', canvas.width / 2, btnY + 40)

  playButton = { x: btnX, y: btnY, w: btnWidth, h: btnHeight }

  requestAnimationFrame(draw)
}

draw()
