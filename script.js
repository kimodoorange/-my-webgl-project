let canvas = document.getElementById('glCanvas');
let gl = canvas.getContext('webgl');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// Rainbow Star
let star = {
  x: Math.random() * canvas.width,
  y: Math.random() * canvas.height,
  vx: (Math.random() - 0.5) * 8,
  vy: (Math.random() - 0.5) * 8,
  size: 40,
  captured: false
};

function drawStar(ctx, x, y, size, color) {
  ctx.save();
  ctx.translate(x, y);
  ctx.beginPath();
  for (let i = 0; i < 5; i++) {
    ctx.lineTo(Math.cos((18 + i * 72) * Math.PI / 180) * size,
               -Math.sin((18 + i * 72) * Math.PI / 180) * size);
    ctx.lineTo(Math.cos((54 + i * 72) * Math.PI / 180) * size / 2,
               -Math.sin((54 + i * 72) * Math.PI / 180) * size / 2);
  }
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
  ctx.restore();
}

function animateStar() {
  let ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (!star.captured) {
    star.x += star.vx;
    star.y += star.vy;
    if (star.x < 0 || star.x > canvas.width) star.vx *= -1;
    if (star.y < 0 || star.y > canvas.height) star.vy *= -1;

    let hue = (Date.now() / 20) % 360;
    let color = `hsl(${hue}, 100%, 60%)`;
    drawStar(ctx, star.x, star.y, star.size, color);
  }

  requestAnimationFrame(animateStar);
}

canvas.addEventListener('touchstart', (e) => {
  let touch = e.touches[0];
  let dx = touch.clientX - star.x;
  let dy = touch.clientY - star.y;
  if (Math.sqrt(dx * dx + dy * dy) < star.size * 1.2) {
    star.captured = true;
    console.log('Star captured!');
  }
});

window.addEventListener('resize', () => {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
});

animateStar();

// WebGL Shader & Audio Engine
async function loadShader(url) {
  const res = await fetch(url);
  return res.text();
}
function createShader(gl, type, source) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  return shader;
}

let audioCtx = new (window.AudioContext || window.webkitAudioContext)();
let drone = audioCtx.createOscillator();
let poly = audioCtx.createOscillator();
let droneGain = audioCtx.createGain();
let polyGain = audioCtx.createGain();
let panNode = audioCtx.createStereoPanner();

function startAudio(pitch = 880) {
  drone.type = 'sine';
  poly.type = 'triangle';
  drone.frequency.value = pitch;
  poly.frequency.value = pitch * 0.75;
  drone.connect(droneGain).connect(audioCtx.destination);
  poly.connect(polyGain).connect(panNode).connect(audioCtx.destination);
  droneGain.gain.value = 0.25;
  polyGain.gain.value = 0.2;
  drone.start();
  poly.start();
}
startAudio();

// Tap detection for stopping audio
let tapCount = 0;
let tapTimer = null;
canvas.addEventListener('touchstart', () => {
  tapCount++;
  if (tapTimer) clearTimeout(tapTimer);
  tapTimer = setTimeout(() => { tapCount = 0; }, 400);
  if (tapCount >= 3) {
    drone.stop();
    poly.stop();
    console.log("Audio stopped.");
  }
});

async function init() {
  const vs = createShader(gl, gl.VERTEX_SHADER, await loadShader('vertexShader.glsl'));
  const fs = createShader(gl, gl.FRAGMENT_SHADER, await loadShader('fragmentShader.glsl'));
  const program = gl.createProgram();
  gl.attachShader(program, vs);
  gl.attachShader(program, fs);
  gl.linkProgram(program);
  gl.useProgram(program);

  const pos = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, pos);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 1,-1, -1,1, 1,1]), gl.STATIC_DRAW);
  const pLoc = gl.getAttribLocation(program, 'position');
  gl.enableVertexAttribArray(pLoc);
  gl.vertexAttribPointer(pLoc, 2, gl.FLOAT, false, 0, 0);

  const u = {
    time: gl.getUniformLocation(program, 'time'),
    resolution: gl.getUniformLocation(program, 'resolution'),
    frequency: gl.getUniformLocation(program, 'frequency'),
    chromaticIntensity: gl.getUniformLocation(program, 'chromaticIntensity'),
    formFluidity: gl.getUniformLocation(program, 'formFluidity'),
    pitch: gl.getUniformLocation(program, 'pitch')
  };

  const s = {
    frequency: 1.0,
    chromaticIntensity: 0.5,
    formFluidity: 0.5,
    tempoVariance: 0.5,
    pitch: 880
  };

  let tempoOffset = 0;
  function randomTempo() {
    tempoOffset = Math.random() * s.tempoVariance * 10;
    setTimeout(randomTempo, 500 + Math.random() * 1500);
  }
  randomTempo();

  function updateAudioParams() {
    drone.frequency.setValueAtTime(s.pitch, audioCtx.currentTime);
    poly.frequency.setValueAtTime(s.pitch * 0.75, audioCtx.currentTime);
    panNode.pan.value = Math.sin(performance.now() * 0.001 * 0.1) * 0.75;
  }

  function render(t) {
    const time = t * 0.001 + tempoOffset;
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.uniform1f(u.time, time);
    gl.uniform2f(u.resolution, canvas.width, canvas.height);
    gl.uniform1f(u.frequency, s.frequency);
    gl.uniform1f(u.chromaticIntensity, s.chromaticIntensity);
    gl.uniform1f(u.formFluidity, s.formFluidity);
    gl.uniform1f(u.pitch, s.pitch);
    updateAudioParams();
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    requestAnimationFrame(render);
  }
  requestAnimationFrame(render);
  
    // UI Sliders
  document.getElementById('complexitySlider').oninput = e => s.frequency = parseFloat(e.target.value);
  document.getElementById('fluiditySlider').oninput = e => s.formFluidity = parseFloat(e.target.value);
  document.getElementById('chromaticitySlider').oninput = e => s.chromaticIntensity = parseFloat(e.target.value);
  document.getElementById('tempoSlider').oninput = e => s.tempoVariance = parseFloat(e.target.value);
  document.getElementById('pitchSlider').oninput = e => {
    s.pitch = parseFloat(e.target.value);
    updateAudioParams();
  };

  // Randomizer
  document.getElementById('randomize-button').onclick = () => {
    ['frequency','formFluidity','chromaticIntensity','tempoVariance'].forEach(k => {
      s[k] = Math.random();
      document.getElementById(k + 'Slider').value = s[k];
    });
    s.pitch = 220 + Math.random() * 1540;
    document.getElementById('pitchSlider').value = s.pitch;
    updateAudioParams();
  };

  // Title Animation
  const textEl = document.getElementById('random-text');
  const baseText = 'K I M O D O   O R A N G E';
  function randomizeTextOnce() {
    let chars = baseText.split('');
    for (let i = 0; i < chars.length; i++) {
      if (Math.random() < 0.2 && chars[i] !== ' ') {
        chars[i] = String.fromCharCode(65 + Math.floor(Math.random() * 26));
      }
    }
    textEl.textContent = chars.join('');
  }
  setInterval(() => {
    randomizeTextOnce();
    setTimeout(() => {
      textEl.textContent = baseText;
    }, 400);
  }, 2600);

  textEl.addEventListener('click', () => {
    const tone = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    tone.type = 'square';
    tone.frequency.value = 330 + Math.random() * 330;
    tone.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
    tone.start();
    tone.stop(audioCtx.currentTime + 0.15);
  });
}

// Drum Sounds
const drumSounds = {
  bass: 'audio/bass-drum.wav',
  snare: 'audio/snare-drum.wav',
  'hi-hat': 'audio/hi-hat.wav',
  bass2: 'audio/bass-drum2.wav'
};

function playDrumSound(type) {
  const audio = new Audio(drumSounds[type]);
  audio.play();
}

document.getElementById('bass2').addEventListener('click', () => playDrumSound('bass2'));

init();
