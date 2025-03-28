const canvas = document.getElementById('glCanvas');
const gl = canvas.getContext('webgl');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
gl.viewport(0, 0, canvas.width, canvas.height);

// Load Shaders
async function loadShader(url) {
    const res = await fetch(url);
    return res.text();
}

function createShader(gl, type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error("Shader error:", gl.getShaderInfoLog(shader));
        return null;
    }
    return shader;
}

async function init() {
    const vertexSource = await loadShader('vertexShader.glsl');
    const fragmentSource = await loadShader('fragmentShader.glsl');

    const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexSource);
    const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentSource);

    const program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);

    gl.useProgram(program);

    // Geometry
    const posBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, posBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
        -1, -1, 1, -1, -1, 1, 1, 1
    ]), gl.STATIC_DRAW);

    const positionLoc = gl.getAttribLocation(program, 'position');
    gl.enableVertexAttribArray(positionLoc);
    gl.vertexAttribPointer(positionLoc, 2, gl.FLOAT, false, 0, 0);

    const uniforms = {
        time: gl.getUniformLocation(program, 'time'),
        resolution: gl.getUniformLocation(program, 'resolution'),
        frequency: gl.getUniformLocation(program, 'frequency'),
        chromaticIntensity: gl.getUniformLocation(program, 'chromaticIntensity'),
        formFluidity: gl.getUniformLocation(program, 'formFluidity'),
        pitch: gl.getUniformLocation(program, 'pitch')
    };

    // Settings
    const settings = {
        frequency: 1.0,
        chromaticIntensity: 0.5,
        formFluidity: 0.5,
        tempoVariance: 0.5,
        pitch: 880,
        formShape: 'circle'
    };

    // Audio
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const droneOsc = audioCtx.createOscillator();
    const droneGain = audioCtx.createGain();
    droneOsc.type = 'sine';
    droneOsc.frequency.value = settings.pitch;
    droneOsc.connect(droneGain).connect(audioCtx.destination);
    droneOsc.start();

    const polyOsc = audioCtx.createOscillator();
    const polyGain = audioCtx.createGain();
    polyOsc.type = 'triangle';
    polyOsc.frequency.value = settings.pitch * 0.75;
    polyOsc.connect(polyGain).connect(audioCtx.destination);
    polyOsc.start();

    droneGain.gain.value = 0.3;
    polyGain.gain.value = 0.2;

    // Randomized Tempo Fluctuation
    let tempoOffset = 0;
    function updateTempo() {
        tempoOffset = Math.random() * settings.tempoVariance * 5;
        setTimeout(updateTempo, 200 + Math.random() * 300);
    }
    updateTempo();

    // Animation
    function render(t) {
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.useProgram(program);

        const time = (t * 0.001) + tempoOffset;

        gl.uniform1f(uniforms.time, time);
        gl.uniform2f(uniforms.resolution, canvas.width, canvas.height);
        gl.uniform1f(uniforms.frequency, settings.frequency);
        gl.uniform1f(uniforms.chromaticIntensity, settings.chromaticIntensity);
        gl.uniform1f(uniforms.formFluidity, settings.formFluidity);
        gl.uniform1f(uniforms.pitch, settings.pitch);

        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

        requestAnimationFrame(render);
    }

    requestAnimationFrame(render);

    // UI Binding
    document.getElementById('complexitySlider').oninput = e => settings.frequency = parseFloat(e.target.value);
    document.getElementById('fluiditySlider').oninput = e => settings.formFluidity = parseFloat(e.target.value);
    document.getElementById('chromaticitySlider').oninput = e => settings.chromaticIntensity = parseFloat(e.target.value);
    document.getElementById('tempoSlider').oninput = e => settings.tempoVariance = parseFloat(e.target.value);
    document.getElementById('pitchSlider').oninput = e => {
        settings.pitch = parseFloat(e.target.value);
        droneOsc.frequency.setValueAtTime(settings.pitch, audioCtx.currentTime);
        polyOsc.frequency.setValueAtTime(settings.pitch * 0.75, audioCtx.currentTime);
    };

    document.getElementById('formShape').onchange = e => {
        settings.formShape = e.target.value;
        // Future: send shape type to shader as int or float for conditional logic
    };

    document.getElementById('fullscreen-button').onclick = () => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen();
        } else {
            document.exitFullscreen();
        }
    };

    // Random note buttons
    const notes = [261.63, 293.66, 329.63, 349.23, 392.00, 440.00, 493.88];
    notes.forEach((freq, idx) => {
        const btn = document.getElementById(`note${idx + 1}`);
        btn.onclick = () => {
            polyOsc.frequency.setValueAtTime(freq, audioCtx.currentTime);
        };
    });

    document.getElementById('randomize-button').onclick = () => {
        settings.frequency = Math.random();
        settings.formFluidity = Math.random();
        settings.chromaticIntensity = Math.random();
        settings.tempoVariance = Math.random();
        settings.pitch = 220 + Math.random() * 1540;
        droneOsc.frequency.setValueAtTime(settings.pitch, audioCtx.currentTime);
        polyOsc.frequency.setValueAtTime(settings.pitch * 0.75, audioCtx.currentTime);

        // Update sliders visually
        document.getElementById('complexitySlider').value = settings.frequency;
        document.getElementById('fluiditySlider').value = settings.formFluidity;
        document.getElementById('chromaticitySlider').value = settings.chromaticIntensity;
        document.getElementById('tempoSlider').value = settings.tempoVariance;
        document.getElementById('pitchSlider').value = settings.pitch;
    };
}

init();