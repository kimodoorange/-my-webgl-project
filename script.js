const canvas = document.getElementById("glCanvas");
const gl = canvas.getContext("webgl");
if (!gl) console.error("WebGL is not supported in this browser.");

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
gl.viewport(0, 0, canvas.width, canvas.height);

const textOverlay = document.getElementById('text-overlay');
const randomTextElement = document.getElementById('random-text');

const colors = [["green", "blue"], ["blue", "purple"], ["purple", "violet"], ["yellow", "orange"]];

const randomizeText = () => Array.from({ length: 25 }, (_, i) => i % 2 === 0 ? 'K I M O D O  O R A N G E'.charAt(i) : ' ').join('');

const changeTextColor = () => {
    const [color1, color2] = colors[Math.floor(Math.random() * colors.length)];
    randomTextElement.style.color = color1;
    textOverlay.style.backgroundColor = color2;
};

const startTextRandomization = () => {
    textOverlay.style.display = 'block';
    let elapsedTime = 0;
    const interval = setInterval(() => {
        randomTextElement.textContent = randomizeText();
        changeTextColor();
        elapsedTime += 0.1;
        if (elapsedTime >= 3.14) {
            clearInterval(interval);
            randomTextElement.textContent = ' K I M O D O  O R A N G E';
            setInterval(changeTextColor, 500); // Continuous color changes
            setupAudio(); // Start audio immediately after the title is displayed
        }
    }, 100);
};

const loadShaderSource = async url => {
    const response = await fetch(url);
    if (!response.ok) {
        console.error(`Failed to load shader from ${url}`);
        return null;
    }
    return await response.text();
};

const createShader = (gl, type, source) => {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error("Shader error:", gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
    }
    return shader;
};

const initShaders = async gl => {
    const vertexShaderSource = await loadShaderSource('vertexShader.glsl');
    const fragmentShaderSource = await loadShaderSource('fragmentShader.glsl');
    if (!vertexShaderSource || !fragmentShaderSource) return null;

    const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
    const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);
    if (!vertexShader || !fragmentShader) return null;

    const program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        console.error("Shader program linking error:", gl.getProgramInfoLog(program));
        return null;
    }
    return program;
};

const positionBuffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-0.85, -0.85, 0.85, -0.85, -0.85, 0.85, 0.85, 0.85]), gl.STATIC_DRAW); // Scaled down by 15%

initShaders(gl).then(program => {
    if (program) {
        gl.useProgram(program);
        const positionAttribute = gl.getAttribLocation(program, "position");
        gl.enableVertexAttribArray(positionAttribute);
        gl.vertexAttribPointer(positionAttribute, 2, gl.FLOAT, false, 0, 0);

        const uniforms = ["time", "resolution", "frequency", "chromaticIntensity", "formFluidity", "pitch"].reduce((acc, name) => {
            acc[name] = gl.getUniformLocation(program, name);
            return acc;
        }, {});

        const settings = {
            frequency: 1.0,
            chromaticIntensity: 0.5,
            formFluidity: 0.5,
            pitch: 880,
            modulator: 0.5
        };

        const gui = new dat.GUI({ autoPlace: false });
        document.getElementById('controls').appendChild(gui.domElement);
        Object.entries(settings).forEach(([key, value]) => {
            if (typeof value === "number") {
                gui.add(settings, key, 0.0, 1.0).name(key.charAt(0).toUpperCase() + key.slice(1)).onChange(updateAudioVisual);
            }
        });

        const shapeDecaySpeed = 0.01; // Increased speed

        let audioContext, gainNode, compressor, constantOscillator;
        let isAudioStarted = false;

        function setupAudio() {
            if (!isAudioStarted) {
                audioContext = new (window.AudioContext || window.webkitAudioContext)();
                gainNode = audioContext.createGain();
                compressor = audioContext.createDynamicsCompressor();
                gainNode.connect(compressor).connect(audioContext.destination);
                
                // Create a constant oscillator for the background tone
                constantOscillator = audioContext.createOscillator();
                constantOscillator.frequency.setValueAtTime(settings.pitch, audioContext.currentTime);
                constantOscillator.connect(gainNode);
                constantOscillator.start();

                isAudioStarted = true;
                console.log("Audio context started");
            }
        }

        function updateAudioVisual() {
            if (audioContext) {
                gainNode.gain.setValueAtTime(settings.formFluidity, audioContext.currentTime);
                compressor.threshold.setValueAtTime(settings.frequency * -60, audioContext.currentTime);
                compressor.knee.setValueAtTime(settings.chromaticIntensity * 40, audioContext.currentTime);
                compressor.ratio.setValueAtTime(settings.pitch / 880 * 20, audioContext.currentTime);
                compressor.attack.setValueAtTime(settings.modulator * 0.1, audioContext.currentTime);
                compressor.release.setValueAtTime((1-settings.modulator) * 0.5, audioContext.currentTime);
                
                // Update the constant oscillator frequency
                constantOscillator.frequency.setValueAtTime(settings.pitch, audioContext.currentTime);
            }
        }

        function render(time) {
            gl.clear(gl.COLOR_BUFFER_BIT);
            gl.useProgram(program);
            gl.uniform1f(uniforms.time, time * 0.001 * shapeDecaySpeed);
            gl.uniform2f(uniforms.resolution, canvas.width, canvas.height);
            gl.uniform1f(uniforms.frequency, settings.frequency);
            gl.uniform1f(uniforms.chromaticIntensity, settings.chromaticIntensity);
            gl.uniform1f(uniforms.formFluidity, settings.formFluidity);
            gl.uniform1f(uniforms.pitch, settings.pitch);
            gl.enable(gl.BLEND);
            gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
            gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
            requestAnimationFrame(render);
        }

        requestAnimationFrame(render);

        function setupInfoOverlay() {
            const interactionHint = document.getElementById('interaction-hint');
            if (interactionHint) {
                interactionHint.remove();
            }
        }

        setupInfoOverlay();

        document.addEventListener('keydown', event => {
            switch (event.key) {
                case 'ArrowUp':
                    settings.frequency = Math.min(10.0, settings.frequency + 0.1);
                    break;
                case 'ArrowDown':
                    settings.frequency = Math.max(0.1, settings.frequency - 0.1);
                    break;
                case 'r':
                    const modes = ["organic", "mechanical", "quantum", "fractal"];
                    settings.complexityMode = modes[Math.floor(Math.random() * modes.length)];
                    break;
            }
        });

        function playSound(url) {
            const audio = new Audio(url);
            audio.play();
        }

        const drumSounds = {
            bass: 'audio/bass-drum.mp3',
            snare: 'audio/snare-drum.mp3',
            ride: 'audio/ride-cymbal.mp3'
        };

        document.getElementById('bass-pad').addEventListener('click', () => playSound(drumSounds.bass));
        document.getElementById('snare-pad').addEventListener('click', () => playSound(drumSounds.snare));
        document.getElementById('ride-pad').addEventListener('click', () => playSound(drumSounds.ride));

        function playNote(frequency) {
            if (audioContext && constantOscillator) {
                constantOscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
            }
        }

        document.getElementById('note1').addEventListener('click', () => playNote(261.63)); // C4
        document.getElementById('note2').addEventListener('click', () => playNote(293.66)); // D4
        document.getElementById('note3').addEventListener('click', () => playNote(329.63)); // E4
        document.getElementById('note4').addEventListener('click', () => playNote(349.23)); // F4
        document.getElementById('note5').addEventListener('click', () => playNote(392.00)); // G4
        document.getElementById('note6').addEventListener('click', () => playNote(440.00)); // A4
        document.getElementById('note7').addEventListener('click', () => playNote(493.88)); // B4

        document.getElementById('fullscreen-button').addEventListener('click', () => {
            if (!document.fullscreenElement) {
                document.documentElement.requestFullscreen();
            } else {
                if (document.exitFullscreen) {
                    document.exitFullscreen();
                }
            }
        });

        // Start the text randomization and audio setup immediately
        startTextRandomization();
        setupAudio();
    }
});

// Make the control menu draggable and resizable
interact('#controls')
  .draggable({
    listeners: {
      move(event) {
        const target = event.target
        const x = (parseFloat(target.getAttribute('data-x')) || 0) + event.dx
        const y = (parseFloat(target.getAttribute('data-y')) || 0) + event.dy

        target.style.transform = `translate(${x}px, ${y}px)`
        target.setAttribute('data-x', x)
        target.setAttribute('data-y', y)
      }
    }
  })
  .resizable({
    edges: { left: true, right: true, bottom: true, top: true }
  })
  .on('resizemove', event => {
    const { target, rect, deltaRect } = event
    const x = (parseFloat(target.getAttribute('data-x')) || 0) + deltaRect.left
    const y = (parseFloat(target.getAttribute('data-y')) || 0) + deltaRect.top

    target.style.width = `${rect.width}px`
    target.style.height = `${rect.height}px`
    target.style.transform = `translate(${x}px, ${y}px)`

    target.setAttribute('data-x', x)
    target.setAttribute('data-y', y)
  })
