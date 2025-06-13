let video
let finished = false
let subtitleTrack = null
let activeAudioCue = null
let currentAudioCueText = ''

let canvasRef = null
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

console.clear()

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
    activeAudioCue = null
    currentAudioCueText = ''

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
      setupButtons(canvasRef)
      await delay(100)
      fadeInButtons()
    }

    video.play().then(() => {
      console.log('✅ Video is playing')
    }).catch(err => {
      console.warn('❌ Failed to play cinematic video:', err)
    })
  },

  update() {},

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

      if (subtitleTrack) {
        const activeCues = subtitleTrack.activeCues
        if (activeCues && activeCues.length > 0) {
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

    if (showChoices) {
      ctx.fillStyle = 'white'
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      ctx.font = '32px Arial'
      ctx.textAlign = 'center'

      if (choiceButtons.length === 0 && canvas && !buttonFadingIn && !buttonFadingOut) {
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
      })

      if (currentAudioCueText) {
        ctx.font = '40px Arial'
        ctx.fillStyle = 'black'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'bottom'
        ctx.fillText(currentAudioCueText, canvas.width / 2, canvas.height - 40)
      }
    }

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
          })
        } else {
          dreamAttempts++
          await handleDream(canvasRef)
        }

        return
      }
    }
  }
}

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

  buttonFadeAlpha = 0
  choiceButtons = [
    {
      label: 'Wake Up',
      x: cx,
      baseY: startY + btnHeight / 2,
      width: 260,
      height: btnHeight,
      offsetY: 40,
      opacity: 0
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
  let sound, text
  if (dreamAttempts === 1) {
    sound = 'assets/StillDreaming.mp3'
    text = 'Still dreaming, huh?'
  } else if (dreamAttempts === 2) {
    sound = 'assets/IllWait.mp3'
    text = 'I’ll wait. I always do'
  } else if (dreamAttempts === 3) {
    sound = 'assets/Enough.mp3'
    text = 'Okay… enough. You’re waking up now!'
  }

  await fadeOutButtons()
  await delay(1000)

  if (sound && text) {
    console.log('▶️ Playing audio:', sound)
    currentAudioCueText = ''
    await playAudioWithHardcodedText(sound, text)
  }

  if (dreamAttempts >= 3) {
    await delay(500)
    fadeToBlack(() => {
      console.log('💢 Forcé au réveil...')
    })
  } else {
    choiceButtons = []
    setupButtons(canvasRef)
    buttonFadeAlpha = 0
    showChoices = true
    await delay(100)
    await fadeInButtons()
  }
}

async function playAudioWithHardcodedText(audioPath, subtitleText) {
  return new Promise(resolve => {
    const audio = new Audio(audioPath)
    audio.play()

    currentAudioCueText = subtitleText

    audio.onended = () => {
      currentAudioCueText = ''
      resolve()
    }
  })
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