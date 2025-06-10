import { titleScene } from './scenes/titleScene.js'
import { quoteScene } from './scenes/quoteScene.js'

const canvas = document.getElementById('gameCanvas')
const ctx = canvas.getContext('2d')

function resizeCanvas() {
  canvas.width = window.innerWidth
  canvas.height = window.innerHeight
}
window.addEventListener('resize', resizeCanvas)
resizeCanvas()

// Scène active
window.currentScene = titleScene
currentScene.init(canvas)

canvas.addEventListener('mousemove', (e) => {
  const rect = canvas.getBoundingClientRect()
  currentScene.handleMouseMove?.(e.clientX - rect.left, e.clientY - rect.top)
})
canvas.addEventListener('mousedown', () => currentScene.handleMouseDown?.())
canvas.addEventListener('mouseup', () => currentScene.handleMouseUp?.())
canvas.addEventListener('click', (e) => {
  const rect = canvas.getBoundingClientRect()
  currentScene.handleClick?.(e.clientX - rect.left, e.clientY - rect.top)
})

let lastTime = performance.now()
function gameLoop(now = performance.now()) {
  const delta = now - lastTime
  lastTime = now

  currentScene.update?.(delta)
  currentScene.render?.(ctx, canvas)

  requestAnimationFrame(gameLoop)
}

gameLoop()