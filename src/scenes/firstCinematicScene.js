let video
let finished = false
let subtitleTrack = null

let canvasRef = null // ← on stocke ici le canvas
let showChoices = false
let dreamAttempts = 0
let choiceButtons = []
let fadeAlpha = 0
let isFading = false
let fadeCallback = null
let lastHoveredButton = null
let buttonFadeAlpha = 1
let buttonFadingOut = false
let buttonFadingIn = false

const hoverSound = new Audio('assets/hover.wav')
const clickSound = new Audio('assets/click.wav')

const delay = (ms) => new Promise(res => setTimeout(res, ms))

export const firstCinematicScene = {
  async init(canvas) {
    canvasRef = canvas
    finished = false
    showChoices = false
    dreamAttempts = 0
    fadeAlpha = 0
    isFading = false
    fadeCallback = null
    choiceButtons = []

    video = document.createElement('video')
    video.src = 'assets/FirstCinematic.mp4'
    video.autoplay = true
    video.loop = false
    video.muted = false
    video.playsInline = true
    video.style.display = 'none'

    const track = document.createElement('track')
    track.kind = 'subtitles'
    track.label = 'English'
    track.srclang = 'en'
    track.src = 'assets/FirstCinematic_English_Sub.vtt'
    track.default = true
    video.appendChild(track)

    video.addEventListener('loadedmetadata', () => {
      subtitleTrack = video.textTracks[0]
      if (subtitleTrack) {
        subtitleTrack.mode = 'hidden'
        console.log('✅ Subtitle track loaded')
      }
    })

    video.onended = async () => {
      finished = true
      console.log('🎬 Video ended')
      showChoices = true
    }

    video.play().then(() => {
      console.log('✅ Video is playing')
    }).catch(err => {
      console.warn('❌ Failed to play cinematic video:', err)
    })
  },

  update() {
    // Nothing for now
  },

  render(ctx, canvas) {
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    if (!finished && video && video.readyState >= 2) {
      const vidRatio = video.videoWidth / video.videoHeight
      const canvasRatio = canvas.width / canvas.height

      let drawWidth, drawHeight, offsetX, offsetY
      if (canvasRatio > vidRatio) {
        drawWidth = canvas.width
        drawHeight = canvas.width / vidRatio
        offsetX = 0
        offsetY = (canvas.height - drawHeight) / 2
      } else {
        drawHeight = canvas.height
        drawWidth = canvas.height * vidRatio
        offsetY = 0
        offsetX = (canvas.width - drawWidth) / 2
      }

      ctx.drawImage(video, offsetX, offsetY, drawWidth, drawHeight)

      // Sous-titres
      if (subtitleTrack) {
        const activeCues = subtitleTrack.activeCues
        if (activeCues.length > 0) {
          let text = activeCues[0].text
          let fillColor = 'white'
          if (text.includes("color='#000000'")) {
            fillColor = 'black'
            text = text.replace(/<[^>]*>/g, '')
          }

          ctx.font = '52px Arial'
          ctx.fillStyle = fillColor
          ctx.textAlign = 'center'
          ctx.textBaseline = 'bottom'
          ctx.fillText(text, canvas.width / 2, canvas.height - 40)
        }
      }
    }

    // Affiche écran blanc + boutons
    if (showChoices) {
      ctx.fillStyle = 'white'
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      ctx.font = '32px Arial'
      ctx.textAlign = 'center'

    if (choiceButtons.length === 0) {
      setupButtons(canvas)
    }

      choiceButtons.forEach(btn => {
        const btnY = btn.baseY - 3 * Math.sin(performance.now() / 500)
        const isHovered = btn === lastHoveredButton
        const scale = isHovered ? 1.05 : 1
        const w = btn.width * scale
        const h = btn.height * scale

        ctx.globalAlpha = buttonFadeAlpha
        ctx.fillStyle = 'black'
        ctx.fillRect(btn.x - w / 2, btnY - h / 2, w, h)
        ctx.globalAlpha = 1
        ctx.fillStyle = 'white'
        ctx.fillText(btn.label, btn.x, btnY + 10)
      })
    }

    // Fondu noir
    if (isFading) {
      fadeAlpha += 0.02
      ctx.fillStyle = `rgba(0, 0, 0, ${fadeAlpha})`
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      if (fadeAlpha >= 1 && fadeCallback) {
        fadeCallback()
        fadeCallback = null
      }
    }
  },

  handleMouseMove(x, y) {
    if (!showChoices) return
    let hovered = null

    for (const btn of choiceButtons) {
      if (
        x >= btn.x - btn.width / 2 &&
        x <= btn.x + btn.width / 2 &&
        y >= btn.baseY - btn.height / 2 &&
        y <= btn.baseY + btn.height / 2
      ) {
        hovered = btn
        break
      }
    }

    if (hovered !== lastHoveredButton) {
      if (hovered) hoverSound.play()
      lastHoveredButton = hovered
      document.body.style.cursor = hovered ? 'pointer' : 'default'
    }
  },

  async handleClick(x, y) {
    if (!showChoices || buttonFadingOut) return

    for (const btn of choiceButtons) {
      if (
        x >= btn.x - btn.width / 2 &&
        x <= btn.x + btn.width / 2 &&
        y >= btn.baseY - btn.height / 2 &&
        y <= btn.baseY + btn.height / 2
      ) {
        clickSound.play()

        await fadeOutButtons()

        if (btn.label === 'Wake up') {
          fadeToBlack(() => {
            console.log('🚪 Réveil ! Scène suivante...')
            // window.currentScene = nextScene
            // nextScene.init()
          })
        } else {
          dreamAttempts++
          await handleDream()
        }
      }
    }
  }
}

// ----------------
// Fonctions internes
// ----------------

function setupButtons(canvas) {
  if (!canvas) {
    console.log("📏 setupButtons canvasRef =", canvasRef)
    return
  }

  const cx = canvas.width / 2
  const spacing = 80
  const btnHeight = 60
  const totalHeight = btnHeight * 2 + spacing
  const startY = canvas.height / 2 - totalHeight / 2

  choiceButtons = [
    {
      label: 'Wake Up',
      x: cx,
      baseY: startY + btnHeight / 2,
      width: 260,
      height: btnHeight
    },
    {
      label: 'keep dreaming',
      x: cx,
      baseY: startY + btnHeight * 1.5 + spacing,
      width: 360,
      height: btnHeight
    }
  ]
}

async function handleDream() {
  let sound
  if (dreamAttempts === 1) sound = 'assets/StillDreaming.mp3'
  else if (dreamAttempts === 2) sound = 'assets/IllWait.mp3'
  else if (dreamAttempts === 3) sound = 'assets/Enough.mp3'

  // Commence par cacher les boutons
  await fadeOutButtons()

  await delay(3000)

  if (sound) {
    const audio = new Audio(sound)
    audio.play()

    // Attendre la fin du son
    await new Promise(resolve => {
      audio.onended = resolve
    })
  }

  if (dreamAttempts >= 3) {
    await delay(500)
    fadeToBlack(() => {
      console.log('💢 Forcé au réveil...')
      // window.currentScene = nextScene
      // nextScene.init()
    })
  } else {
    await fadeInButtons()
  }
}

function fadeOutButtons() {
  return new Promise(resolve => {
    buttonFadingOut = true
    buttonFadingIn = false
    const interval = setInterval(() => {
      buttonFadeAlpha -= 0.05
      if (buttonFadeAlpha <= 0) {
        buttonFadeAlpha = 0
        clearInterval(interval)
        buttonFadingOut = false
        resolve()
      }
    }, 16)
  })
}


function fadeToBlack(callback) {
  isFading = true
  fadeAlpha = 0
  fadeCallback = callback
}

function fadeInButtons() {
  buttonFadingIn = true
  const interval = setInterval(() => {
    buttonFadeAlpha += 0.05
    if (buttonFadeAlpha >= 1) {
      buttonFadeAlpha = 1
      clearInterval(interval)
      buttonFadingIn = false
    }
  }, 16)
}