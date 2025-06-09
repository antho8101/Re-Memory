import { titleScene } from './scenes/titleScene.js'

const canvas = document.getElementById('gameCanvas')
const ctx = canvas.getContext('2d')

function resizeCanvas() {
  canvas.width = window.innerWidth
  canvas.height = window.innerHeight
}
window.addEventListener('resize', resizeCanvas)
resizeCanvas()

// 🎬 Initialisation
titleScene.init()

canvas.addEventListener('mousemove', (e) => {
  const rect = canvas.getBoundingClientRect()
  titleScene.handleMouseMove(e.clientX - rect.left, e.clientY - rect.top)
})
canvas.addEventListener('mousedown', () => titleScene.handleMouseDown())
canvas.addEventListener('mouseup', () => titleScene.handleMouseUp())
canvas.addEventListener('click', (e) => {
  const rect = canvas.getBoundingClientRect()
  titleScene.handleClick(e.clientX - rect.left, e.clientY - rect.top)
})

function gameLoop() {
  titleScene.update()
  titleScene.render(ctx, canvas)
  requestAnimationFrame(gameLoop)
}

gameLoop()