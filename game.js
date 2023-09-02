"use strict"
// --- CANVAS --- //

const DEV = false
const canvas = document.getElementById('canvas')
const canvasContainer = document.getElementById('canvas-container')
const ctx = canvas.getContext('2d')

const domScore = document.querySelector('#score')
const splashScreen = document.querySelector('#splash-screen')

const imgRoad = document.querySelector('#road')
const imgEngine = document.querySelector('#engine')
const imgScore = document.querySelector('#imgScore')
const imgBird1 = document.querySelector('#bird-1')
const imgBird2 = document.querySelector('#bird-2')

// --- UTILS --- //

const getRandomInt = (min, max) => {
  min = Math.ceil(min)
  max = Math.floor(max)
  return Math.floor(Math.random() * (max - min)) + min //The maximum is exclusive and the minimum is inclusive
}

const collision = (circle1, circle2) => {
  let dx = circle1.x - circle2.x
  let dy = circle1.y - circle2.y
  let distance = Math.sqrt(dx * dx + dy * dy)
  return distance < circle1.r + circle2.r
}

const drawCircle = (ctx, x, y, radius, fillColor = '#000', strokeColor = '#000', lineWidth = 1) => {
  ctx.beginPath()
  ctx.arc(x, y, radius, 0, 2 * Math.PI, false)
  ctx.fillStyle = fillColor
  ctx.fill()
  ctx.lineWidth = lineWidth
  ctx.strokeStyle = strokeColor
  ctx.stroke()
}

const particles = [];

function createExplosion(x, y) {
  const numParticles = 20;
  for (let i = 0; i < numParticles; i++) {
    particles.push({
      x: x,
      y: y + 80,
      size: Math.random() * 4 + 1 * (BOX_SIZE_X / 8),
      speedY: Math.random() * -8 - 2,  // Increased speed in the Y direction for faster movement
      speedX: Math.random() * 8 - 3,   // Spreading across X-axis, both left and right
      color: 'yellow',
      lifetime: 100
  });
  }
}

const draw = (target) => {
  // drawCircle(ctx, target.x, target.y, target.r, target.c)
  const angle = Math.atan2(target.vy, target.vx)
  ctx.save()
  ctx.translate(target.x, target.y)
  ctx.rotate(angle)

  if (target.c === 'red') {
    ctx.drawImage(imgBird1, -imgBird1.width / 2, -imgBird1.height / 2) // Draw the imgBird1. Subtract half of the image's width and height to center it.
    // ctx.drawImage(imgBird1, target.x - target.r, target.y - target.r)
  }

  if (target.c === 'green') {
    ctx.drawImage(imgBird2, -imgBird2.width / 2, -imgBird2.height / 2) // Draw the imgBird1. Subtract half of the image's width and height to center it.
    // ctx.drawImage(imgBird1, target.x - target.r, target.y - target.r)
  }

  ctx.restore()
}

const secondsToFrames = (timeInSeconds) => {
  const totalTimeInMilliseconds = timeInSeconds * 1000
  const frameDurationInMilliseconds = 16.67  // approx. 60 FPS
  const totalFrames = totalTimeInMilliseconds / frameDurationInMilliseconds

  return totalFrames
}

const calculateVelocity = (pointA, pointB, timeInSeconds) => {
  const totalFrames = secondsToFrames(timeInSeconds)
  
  let vxPerFrame = (pointB.x - pointA.x) / totalFrames
  let vyPerFrame = (pointB.y - pointA.y) / totalFrames

  return {vx: vxPerFrame, vy: vyPerFrame}
}

const resizeCanvas = () => {
  let targetHeight = window.innerHeight // Calculate height based on the window height
  let targetWidth = (targetHeight * 9) / 19.5 // Calculate width based on 9/19.5 aspect ratio

  // If calculated width exceeds window width
  if (targetWidth > window.innerWidth) {
    targetWidth = window.innerWidth
    targetHeight = (targetWidth * 19.5) / 9
  }

  // Set style dimensions, not the canvas rendering dimensions
  canvas.style.width = targetWidth + 'px'
  canvas.style.height = targetHeight + 'px'
  canvasContainer.style.width = targetWidth + 'px'
  canvasContainer.style.height = targetHeight + 'px'
}

resizeCanvas()
window.addEventListener('resize', resizeCanvas)


// --- GAME --- //

const SCREEN_W = canvas.w
const BOX_SIZE_X = 130 // 9 subsections
const BOX_SIZE_Y = 158 // 16 subsections

let type, score, timeUntilNextSpawn, origin, collider, engine, birdTemplate
let birds = []
let gameActive = false

origin = Object.seal({
  x: BOX_SIZE_X * 4.5,
  y: BOX_SIZE_Y * 16,
  r: BOX_SIZE_X / 2,
  c: 'yellow'
})

collider = Object.seal({
  x: BOX_SIZE_X * 4.5,
  y: BOX_SIZE_Y * 11.5,
  r: BOX_SIZE_X * 2,
  c: 'red'
})

engine = Object.seal({
  x: BOX_SIZE_X * 4.5,
  y: BOX_SIZE_Y * 15,
  r: BOX_SIZE_X * 7,
  c: '#000'
})

const initGame = () => {
  gameActive = true
  type = 0
  score = 0
  timeUntilNextSpawn = 0
  
  birdTemplate = Object.seal({
    x: -100,
    y: -100,
    r: BOX_SIZE_X * 0.5,
    c: 'red',
    vx: 0,
    vy: 0,
    dead: true
  })
  
  const createBird = () => Object.seal(Object.assign({}, birdTemplate))
  birds = Array.from({ length: 10 }, createBird)

  timeUntilNextSpawn = secondsToFrames(0)
  updateScore(0)
}

const updateScore = (amt) => {
  score += amt
  domScore.innerHTML = score
}

const initBird = (secondsToImpact) => {
  if (secondsToImpact === undefined) throw Error('no seconds to impact in initBird')
  const bird = birds.find(b => b.dead)

  const num = getRandomInt(0, 10)

  if (bird) {
    bird.c = num >= 5 ? 'green' : 'red'
    bird.x = getRandomInt(0, canvas.width)
    bird.y = 0
    bird.dead = false
    const vel = calculateVelocity(bird, origin, secondsToImpact)
    bird.vx = vel.vx
    bird.vy = vel.vy
  }
}

const updateBird = (target) => {
  if (!gameActive) return

  target.x += target.vx
  target.y += target.vy

  const haveCollided = collision(collider, target)
  const sameColor = collider.c === target.c

  if (haveCollided) {
    if (sameColor) {
      updateScore(10)
      target.vx = target.x <= (canvas.width / 2) ? -20 : 20
      target.vy = -5
    } 
    if (!sameColor && !target.dead) {
      createExplosion(target.x, target.y);
      gameActive = false
      birds.forEach(bird => {
        bird.x = -100
        bird.y = -100
      })
      setTimeout(() => {
        splashScreen.classList.toggle('hidden')
      }, 1000)
    } 
    target.dead = true
  }
}

// Challenge System
const updateSpawnSystem = () => {
  // position
  // amount
  // speed
  // system
  // - lvl1 - steady 4/4 pace, with a low chance of 1/3 notes

  

  if (!gameActive) return

  let secondsToImpact = 2.5
  if (score > 50 && score <= 200) secondsToImpact = 2
  if (score > 200 && score <= 300) secondsToImpact = 1.75
  const spawnSecondProbability = getRandomInt(0, 10)

  const levels = [
    {
      secondsBetweenSpawns: 2,
      probabilityForNext: 5,
      nextSpawnDivisor: 2
    }
  ]

  levels[0].spawnSecondOffset = (levels[0].secondsBetweenSpawns / levels[0].nextSpawnDivisor) * 1000

  timeUntilNextSpawn -= 1
  if (timeUntilNextSpawn < 0) {
    initBird(secondsToImpact)
    
    if (spawnSecondProbability >= levels[0].probabilityForNext) {
      setTimeout(() => {
        initBird(secondsToImpact)
      }, levels[0].spawnSecondOffset) // frequency
    }

    timeUntilNextSpawn = secondsToFrames(levels[0].secondsBetweenSpawns)
  }
}

const drawExplosion = () => {
  for (let i = 0; i < particles.length; i++) {
    const p = particles[i];

    p.y += p.speedY;
    p.x += p.speedX; 
    p.lifetime--;

    ctx.fillStyle = p.color;
    ctx.fillRect(p.x, p.y, p.size, p.size);

    // Remove particles that are no longer visible or have lived past their lifetime
    if (p.lifetime <= 0) {
        particles.splice(i, 1);
        i--;
    }
  }
}

let imgRoadData = {
  y: 0
}

const game = () => {
  imgRoadData.y += 10
  if (imgRoadData.y > 2532) {
    imgRoadData.y = 0
  }
  ctx.drawImage(imgRoad, 0, imgRoadData.y, canvas.width, canvas.height)
  ctx.drawImage(imgRoad, 0, imgRoadData.y - 2532, canvas.width, canvas.height)

  updateSpawnSystem()
  // draw(engine)
  
  birds.forEach((bird, i) => {
    updateBird(bird)
    draw(bird)
  })
  
  ctx.drawImage(imgEngine, 0, 0, canvas.width, canvas.height)
  ctx.drawImage(imgScore, 0, 0, canvas.width, canvas.height)

  drawExplosion()
  

  // draw(collider)
  // draw(origin)
}

let lastTimestamp = 0 // To track the timestamp of the last frame
const domFps = document.querySelector('#fps')

const tick = (timestamp) => {
  const deltaTime = timestamp - lastTimestamp // Calculate time elapsed since the last frame
  lastTimestamp = timestamp

  // if (deltaTime > 30) {
  //   domFps.innerHTML += ('/' + Math.floor(deltaTime))
  // }
  
  if (deltaTime >= 16) {
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    game()
  }

  window.requestAnimationFrame(tick)
}

// Init Game
window.requestAnimationFrame(tick)


// --- CONTROLS --- //

const gameControls = document.querySelectorAll('.game-controls')
gameControls.forEach((control, i) => {
  function handleControlActivation(e) {
    gameControls.forEach(ctrl => ctrl.classList.remove('active'));

    // Add 'active' class to the clicked control based on its index
    if (i === 0) {
      collider.c = 'red';
      control.classList.add('active');
    } 
    if (i === 1) {
      collider.c = 'green';
      control.classList.add('active');
    }
    // If you uncomment the following lines, make sure to adjust them similarly
    // if (i === 2) collider.c = 'blue'
    // if (i === 3) collider.c = 'yellow'
  }

  control.addEventListener('touchstart', handleControlActivation);
  control.addEventListener('mousedown', handleControlActivation);
});


let lastTap = 0

document.addEventListener('touchend', function (e) {
  let currentTime = new Date().getTime()
  let tapLength = currentTime - lastTap
  if (tapLength < 500 && tapLength > 0) {
      e.preventDefault()
  } else {
      // Not a double tap
  }
  lastTap = currentTime
})

document.addEventListener('touchmove', function (event) {
  if (event.scale !== 1) {
      event.preventDefault()
  }
}, { passive: false })

const startButton = document.querySelector('#start-button')
startButton.addEventListener('click', () => {
  splashScreen.classList.toggle('hidden')
  setTimeout(() => {
    initGame()
  }, 1000)
})


