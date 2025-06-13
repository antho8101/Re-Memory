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
    canvasRef = canvas || document.querySelector('canvas')
    console.log('🎨 Canvas assigné dans init:', canvasRef)  
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

      setupButtons(canvas)
      await delay(100)
      fadeInButtons()
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

      if (choiceButtons.length === 0 && canvas && !buttonFadingIn && !buttonFadingOut) {
        console.log("🧪 Auto-setup buttons triggered", canvas)
        setupButtons(canvas)
      }

      choiceButtons.forEach(btn => {
        const float = 3 * Math.sin(performance.now() / 500)
        const btnY = btn.baseY - (btn.offsetY ?? 0) - float
        const isHovered = btn === lastHoveredButton
        const scale = isHovered ? 1.05 : 1
        const w = btn.width * scale
        const h = btn.height * scale

        ctx.globalAlpha = (btn.opacity ?? 1) * buttonFadeAlpha

        ctx.fillStyle = 'black'
        ctx.fillRect(btn.x - w / 2, btnY - h / 2, w, h)

        ctx.fillStyle = 'white'
        ctx.font = `${32 * scale}px Arial`
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText(btn.label, btn.x, btnY)

        ctx.globalAlpha = 1

        console.log(`🧪 btn: ${btn.label}, opacity: ${btn.opacity}, offsetY: ${btn.offsetY}`)
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

      if (btn.label.toLowerCase() === 'wake up') {
        fadeToBlack(() => {
          console.log('🚪 Réveil ! Scène suivante...')
          // window.currentScene = nextScene
          // nextScene.init()
        })
      } else {
        dreamAttempts++
        await handleDream(canvasRef)
      }

      return // ✅ ICI : pour arrêter la boucle et éviter de jouer le son en dehors des boutons
    }
  }

  // Aucun bouton cliqué → rien ne se passe (plus de son parasite)
}
}

// ----------------
// Fonctions internes
// ----------------

function setupButtons(c) {
  const canvas = c || canvasRef
  if (!canvas) {
    console.warn("❌ Aucun canvas trouvé pour setupButtons")
    return
  }

  const cx = canvas.width / 2
  const spacing = 80
  const btnHeight = 60
  const totalHeight = btnHeight * 2 + spacing
  const startY = canvas.height / 2 - totalHeight / 2

  buttonFadeAlpha = 0 // ← reset du fondu
  choiceButtons = [
    {
      label: 'Wake Up',
      x: cx,
      baseY: startY + btnHeight / 2,
      width: 260,
      height: btnHeight,
      offsetY: 40,     // ← animation verticale
      opacity: 0       // ← animation alpha
    },
    {
      label: 'keep dreaming',
      x: cx,
      baseY: startY + btnHeight * 1.5 + spacing,
      width: 360,
      height: btnHeight,
      offsetY: 40,
      opacity: 0
    }
  ]

  console.log("🆕 Buttons créés :", choiceButtons)
}

async function handleDream(canvas) {
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
    choiceButtons = []
    setupButtons(canvasRef)
    buttonFadeAlpha = 0 // 🔥 Important pour le fondu
    showChoices = true  // 🔥 Pour les rendre visibles à nouveau
    await delay(100)
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
  return new Promise(resolve => {
    buttonFadingIn = true

    const interval = setInterval(() => {
      let stillAnimating = false

      choiceButtons.forEach(btn => {
        if (btn.offsetY > 0) {
          btn.offsetY -= 1.2
          if (btn.offsetY < 0) btn.offsetY = 0
          stillAnimating = true
        }

        if (btn.opacity < 1) {
          btn.opacity += 0.04
          if (btn.opacity > 1) btn.opacity = 1
          stillAnimating = true
        }
      })

      if (!stillAnimating) {
        clearInterval(interval)
        buttonFadingIn = false
        buttonFadeAlpha = 1
        resolve()
      }
    }, 16)
  })
}
