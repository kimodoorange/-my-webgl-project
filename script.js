const canvas = document.getElementById('glCanvas');
const gl = canvas.getContext('webgl');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
gl.viewport(0, 0, canvas.width, canvas.height);

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

  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  const drone = audioCtx.createOscillator();
  const poly = audioCtx.createOscillator();
  const droneGain = audioCtx.createGain();
  const polyGain = audioCtx.createGain();
  const panNode = audioCtx.createStereoPanner();

  drone.type = 'sine';
  poly.type = 'triangle';
  drone.connect(droneGain).connect(audioCtx.destination);
  poly.connect(polyGain).connect(panNode).connect(audioCtx.destination);

  function updateAudio() {
    drone.frequency.setValueAtTime(s.pitch, audioCtx.currentTime);
    poly.frequency.setValueAtTime(s.pitch * 0.75, audioCtx.currentTime);
  }

  droneGain.gain.value = 0.25;
  polyGain.gain.value = 0.2;
  panNode.pan.value = 0;
  drone.start();
  poly.start();
  updateAudio();

  let tempoOffset = 0;
  function randomTempo() {
    tempoOffset = Math.random() * s.tempoVariance * 10;
    setTimeout(randomTempo, 500 + Math.random() * 1000);
  }
  randomTempo();

  function render(t) {
    const time = t * 0.001 + tempoOffset;
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.uniform1f(u.time, time);
    gl.uniform2f(u.resolution, canvas.width, canvas.height);
    gl.uniform1f(u.frequency, s.frequency);
    gl.uniform1f(u.chromaticIntensity, s.chromaticIntensity);
    gl.uniform1f(u.formFluidity, s.formFluidity);
    gl.uniform1f(u.pitch, s.pitch);
    panNode.pan.value = Math.sin(time * 0.15) * 0.75;
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    requestAnimationFrame(render);
  }
  requestAnimationFrame(render);

  document.getElementById('complexitySlider').oninput = e => s.frequency = parseFloat(e.target.value);
  document.getElementById('fluiditySlider').oninput = e => s.formFluidity = parseFloat(e.target.value);
  document.getElementById('chromaticitySlider').oninput = e => s.chromaticIntensity = parseFloat(e.target.value);
  document.getElementById('tempoSlider').oninput = e => s.tempoVariance = parseFloat(e.target.value);
  document.getElementById('pitchSlider').oninput = e => {
    s.pitch = parseFloat(e.target.value);
    updateAudio();
  };
  document.getElementById('fullscreen-button').onclick = () => {
    document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen();
  };
  document.getElementById('randomize-button').onclick = () => {
    ['frequency','formFluidity','chromaticIntensity','tempoVariance'].forEach(k => {
      s[k] = Math.random();
      document.getElementById(k + 'Slider').value = s[k];
    });
    s.pitch = 220 + Math.random() * 1540;
    document.getElementById('pitchSlider').value = s.pitch;
    updateAudio();
  };

  // Title character randomizer
  const textEl = document.getElementById('random-text');
  const baseText = 'K I M O D O   O R A N G E';
  function randomizeTextOnce() {
    let chars = baseText.split('');
    for (let i = 0; i < chars.length; i++) {
      if (Math.random() < 0.15 && chars[i] !== ' ') {
        chars[i] = String.fromCharCode(65 + Math.floor(Math.random() * 26));
      }
    }
    textEl.textContent = chars.join('');
  }
  setInterval(() => {
    randomizeTextOnce();
    setTimeout(() => textEl.textContent = baseText, 400);
  }, 2400);

  // Tone click effects
  textEl.addEventListener('click', () => {
    const tone = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    tone.frequency.value = 440 + Math.random() * 440;
    tone.type = 'sawtooth';
    tone.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
    tone.start();
    tone.stop(audioCtx.currentTime + 0.2);
  });
}

// Drum sounds
const drumSounds = {
  bass: 'audio/bass-drum.wav',
  snare: 'audio/snare-drum.wav',
  'hi-hat': 'audio/hi-hat.wav'
};
function playDrumSound(type) {
  if (drumSounds[type]) {
    const audio = new Audio(drumSounds[type]);
    audio.play();
  }
}
document.addEventListener('keydown', (e) => {
  if (e.key === 'z') playDrumSound('bass');
  if (e.key === 'x') playDrumSound('snare');
  if (e.key === 'c') playDrumSound('hi-hat');
});

init();