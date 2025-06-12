let video
let finished = false

export const firstCinematicScene = {
  init() {
    finished = false

    video = document.createElement('video')
    video.src = 'assets/FirstCinematic.mp4'
    video.autoplay = true
    video.loop = false
    video.muted = false
    video.playsInline = true
    video.style.display = 'none'

    video.onended = () => {
      finished = true
      // 👉 tu peux ici déclencher la scène suivante si besoin
    }

    video.play().then(() => {
      console.log('✅ Video is playing')
    }).catch(err => {
      console.warn('❌ Failed to play cinematic video:', err)
    })
  },

  update() {
    // Rien à faire ici pour l’instant
  },

  render(ctx, canvas) {
    if (!video || video.readyState < 2) {
      console.log('⏳ Video not ready:', video?.readyState)
      return
    }

    console.log('🎬 Rendering frame at', video.currentTime, 'readyState:', video.readyState)

    ctx.clearRect(0, 0, canvas.width, canvas.height)

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
  },

  isFinished() {
    return finished
  }
}