// Select the canvas
const canvas = document.getElementById("glCanvas");
const gl = canvas.getContext("webgl");

// WebGL Check
if (!gl) {
    console.error("WebGL is not supported in this browser.");
}

// Set canvas size
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
gl.viewport(0, 0, canvas.width, canvas.height);

// Additional Elements
const textOverlay = document.getElementById('text-overlay');
const randomTextElement = document.getElementById('random-text');

// Colors for text transition
const colors = [
    ["green", "blue"],
    ["blue", "purple"],
    ["purple", "violet"],
    ["yellow", "orange"]
];

// Function to randomize characters
function randomizeText() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let randomText = '';
    for (let i = 0; i < 14; i++) {
        randomText += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return randomText;
}

// Function to change text color
function changeTextColor() {
    const colorPair = colors[Math.floor(Math.random() * colors.length)];
    randomTextElement.style.color = colorPair[0];
    textOverlay.style.backgroundColor = colorPair[1];
}

// Function to start text randomization
function startTextRandomization() {
    textOverlay.style.display = 'block';
    let elapsedTime = 0;
    const interval = setInterval(() => {
        if (elapsedTime >= 3.14) {
            clearInterval(interval);
            randomTextElement.textContent = 'KIMODO ORANGE';
            return;
        }
        randomTextElement.textContent = randomizeText();
        changeTextColor();
        elapsedTime += 0.1;
    }, 100);
}

// Load shader source
async function loadShaderSource(url) {
    const response = await fetch(url);
    if (!response.ok) {
        console.error(`Failed to load shader from ${url}`);
        return null;
    }
    return await response.text();
}

// Initialize shaders
async function initShaders(gl) {
    const vertexShaderSource = await loadShaderSource('vertexShader.glsl');
    const fragmentShaderSource = await loadShaderSource('fragmentShader.glsl');

    if (!vertexShaderSource || !fragmentShaderSource) {
        console.error("Failed to load shader sources.");
        return null;
    }

    const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
    const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);

    if (!vertexShader || !fragmentShader) {
        console.error("Failed to compile shaders.");
        return null;
    }

    const program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        console.error("Shader program linking error:", gl.getProgramInfoLog(program));
        return null;
    }

    return program;
}

// Shader Compilation
function createShader(gl, type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error("Shader error:", gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
    }
    return shader;
}

// Geometry Setup
const positionBuffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
const positions = new Float32Array([
    -1, -1,  
    1, -1,   
    -1,  1,  
    1,  1    
]);
gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);

// Initialize shaders
initShaders(gl).then(program => {
    if (program) {
        gl.useProgram(program);

        // Bind attributes
        const positionAttribute = gl.getAttribLocation(program, "position");
        gl.enableVertexAttribArray(positionAttribute);
        gl.vertexAttribPointer(positionAttribute, 2, gl.FLOAT, false, 0, 0);

        // Enhanced Uniforms
        const timeUniform = gl.getUniformLocation(program, "time");
        const resolutionUniform = gl.getUniformLocation(program, "resolution");
        const frequencyUniform = gl.getUniformLocation(program, "frequency");
        const chromaticIntensityUniform = gl.getUniformLocation(program, "chromaticIntensity");
        const formFluidityUniform = gl.getUniformLocation(program, "formFluidity");
        const pitchUniform = gl.getUniformLocation(program, "pitch");

        // Expanded GUI Settings with Dichotomous Fluidity Concept
        const settings = {
            frequency: 1.0,          // Visual frequency
            noiseVolume: 0.5,        // Audio volume
            noiseType: "white",      // Noise type
            chromaticIntensity: 0.5, // Chromatic color intensity
            formFluidity: 0.5,       // Form-complexity interaction
            complexityMode: "organic", // Dichotomous complexity mode
            pitch: 880,              // Chromatic pitch
            pitchShift: 1.0,         // Pitch shift factor
            modulator: 0.5           // Modulation depth
        };

        const gui = new dat.GUI();
        gui.add(settings, "frequency", 0.1, 10.0).name("Visual Frequency");
        gui.add(settings, "noiseVolume", 0.0, 1.0).name("Noise Volume").onChange(updateAudio);
        gui.add(settings, "noiseType", ["white", "pink", "brown"]).name("Noise Type").onChange(updateAudio);
        gui.add(settings, "chromaticIntensity", 0.0, 1.0).name("Chromatic Intensity");
        gui.add(settings, "formFluidity", 0.0, 1.0).name("Form Fluidity");
        gui.add(settings, "complexityMode", ["organic", "mechanical", "quantum", "fractal"])
            .name("Complexity Mode")
            .onChange(updateComplexityMode);
        gui.add(settings, "pitch", 440, 1760).name("Chromatic Pitch").onChange(updatePitch);
        gui.add(settings, "pitchShift", 0.5, 2.0).name("Pitch Shift");
        gui.add(settings, "modulator", 0.0, 1.0).name("Modulator");

        // Complexity Mode Interaction
        function updateComplexityMode(mode) {
            switch(mode) {
                case "organic":
                    settings.formFluidity = 0.7;
                    settings.chromaticIntensity = 0.6;
                    break;
                case "mechanical":
                    settings.formFluidity = 0.3;
                    settings.chromaticIntensity = 0.4;
                    break;
                case "quantum":
                    settings.formFluidity = 1.0;
                    settings.chromaticIntensity = 0.8;
                    break;
                case "fractal":
                    settings.formFluidity = 0.5;
                    settings.chromaticIntensity = 0.5;
                    break;
            }
        }

        // Audio Setup
        let audioContext;
        let isAudioStarted = false;

        function setupAudio() {
            if (!isAudioStarted) {
                audioContext = new (window.AudioContext || window.webkitAudioContext)();
                isAudioStarted = true;

                console.log("Audio context started");
                startTextRandomization(); // Start text randomization on first touch
            }
        }

        // Update Audio Parameters
        function updateAudio() {}

        function updatePitch(pitch) {}

        // User interaction required to start audio
        document.addEventListener("click", setupAudio);

        // Render loop with enhanced parameter passing
        function render(time) {
            gl.clear(gl.COLOR_BUFFER_BIT);

            gl.useProgram(program);
            gl.uniform1f(timeUniform, time * 0.001);
            gl.uniform2f(resolutionUniform, canvas.width, canvas.height);
            gl.uniform1f(frequencyUniform, settings.frequency);
            gl.uniform1f(chromaticIntensityUniform, settings.chromaticIntensity);
            gl.uniform1f(formFluidityUniform, settings.formFluidity);
            gl.uniform1f(pitchUniform, settings.pitch);

            gl.enable(gl.BLEND);
            gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

            gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

            requestAnimationFrame(render);
        }

        // Start rendering
        requestAnimationFrame(render);

        // Dynamic Information Overlay
        function setupInfoOverlay() {
            const infoOverlay = document.getElementById('info-overlay');
            const interactionHint = document.getElementById('interaction-hint');

            // Show info overlay on first interaction
            document.addEventListener('mousedown', () => {
                infoOverlay.classList.add('visible');
                setTimeout(() => {
                    infoOverlay.classList.remove('visible');
                }, 3000);
            }, { once: true });

            // Hover interactions
            canvas.addEventListener('mousemove', (event) => {
                const mouseX = event.clientX / window.innerWidth;
                const mouseY = event.clientY / window.innerHeight;

                // Modify shader parameters based on mouse position
                settings.formFluidity = mouseX;
                settings.chromaticIntensity = mouseY;
            });

            // Hide/show interaction hint
            canvas.addEventListener('mouseenter', () => {
                interactionHint.style.opacity = '0';
            });

            canvas.addEventListener('mouseleave', () => {
                interactionHint.style.opacity = '0.7';
            });
        }

        // Call this after the existing initialization code
        setupInfoOverlay();

        // Optional: Add keyboard interactions
        document.addEventListener('keydown', (event) => {
            switch(event.key) {
                case 'ArrowUp':
                    settings.frequency = Math.min(10.0, settings.frequency + 0.1);
                    break;
                case 'ArrowDown':
                    settings.frequency = Math.max(0.1, settings.frequency - 0.1);
                    break;
                case 'r':
                    // Random complexity mode
                    const modes = ["organic", "mechanical", "quantum", "fractal"];
                    settings.complexityMode = modes[Math.floor(Math.random() * modes.length)];
                    updateComplexityMode(settings.complexityMode);
                    break;
            }
        });

        // Western musical scale frequencies (A4 = 440 Hz)
        const westernScaleFrequencies = [
            261.63, // C4
            293.66, // D4
            329.63, // E4
            349.23, // F4
            392.00, // G4
            440.00, // A4
            493.88  // B4
        ];

        // Function to play a note with pitch shifting
        function playNoteWithPitchShift(noteIndex) {
            const baseFrequency = westernScaleFrequencies[noteIndex % westernScaleFrequencies.length];
            const shiftedFrequency = baseFrequency * settings.pitchShift;
            const modulatedFrequency = shiftedFrequency * (1 + Math.sin(audioContext.currentTime * settings.modulator) * 0.1);

            const osc = audioContext.createOscillator();
            osc.frequency.setValueAtTime(modulatedFrequency, audioContext.currentTime);

            const gainNodeOsc = audioContext.createGain();
            gainNodeOsc.gain.setValueAtTime(1, audioContext.currentTime);

            osc.connect(gainNodeOsc).connect(audioContext.destination);

            osc.start();
            osc.stop(audioContext.currentTime + 1);
        }

        // Add event listeners for note buttons
        document.getElementById('note1').addEventListener('click', () => playNoteWithPitchShift(0));
        document.getElementById('note2').addEventListener('click', () => playNoteWithPitchShift(1));
        document.getElementById('note3').addEventListener('click', () => playNoteWithPitchShift(2));
        document.getElementById('note4').addEventListener('click', () => playNoteWithPitchShift(3));
        document.getElementById('note5').addEventListener('click', () => playNoteWithPitchShift(4));
        document.getElementById('note6').addEventListener('click', () => playNoteWithPitchShift(5));
        document.getElementById('note7').addEventListener('click', () => playNoteWithPitchShift(6));

        // Function to play drum sound with pitch shifting
        function playDrumSound(buffer) {
            const source = audioContext.createBufferSource();
            source.buffer = buffer;
            source.playbackRate.value = settings.pitchShift;
            source.connect(audioContext.destination);
            source.start();
        }

        // Load and play drum samples
        const drumBuffers = {};

        async function loadDrumSamples() {
            const drumUrls = {
                bass: 'path/to/8bit-bass-drum.wav',
                snare: 'path/to/8bit-snare-drum.wav',
                ride: 'path/to/8bit-ride-cymbal.wav'
            };
            for (const [key, url] of Object.entries(drumUrls)) {
                const response = await fetch(url);
                const arrayBuffer = await response.arrayBuffer();
                drumBuffers[key] = await audioContext.decodeAudioData(arrayBuffer);
            }
        }

        document.getElementById('bass-pad').addEventListener('click', () => playDrumSound(drumBuffers.bass));
        document.getElementById('snare-pad').addEventListener('click', () => playDrumSound(drumBuffers.snare));
        document.getElementById('ride-pad').addEventListener('click', () => playDrumSound(drumBuffers.ride));

        loadDrumSamples();
    }
});