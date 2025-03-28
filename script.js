// Select the canvas// Select the canvas
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
            pitch: 880               // Chromatic pitch
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
        let gainNode;
        let noiseNode;
        let oscNode;
        let isAudioStarted = false;

        function setupAudio() {
            if (!isAudioStarted) {
                audioContext = new (window.AudioContext || window.webkitAudioContext)();
                gainNode = audioContext.createGain();
                gainNode.gain.value = settings.noiseVolume;

                const bufferSize = 4096;
                noiseNode = audioContext.createScriptProcessor(bufferSize, 1, 1);
                noiseNode.onaudioprocess = generateChromaNoise;

                oscNode = audioContext.createOscillator();
                oscNode.frequency.setValueAtTime(settings.pitch, audioContext.currentTime);
                oscNode.connect(gainNode);

                noiseNode.connect(gainNode);
                gainNode.connect(audioContext.destination);
                oscNode.start();

                isAudioStarted = true;

                console.log("Chromatic Audio Noise Started");
                startTextRandomization(); // Start text randomization on first touch
            }
        }

        // Enhanced Noise Generation with Chromatic Audio
        function generateChromaNoise(event) {
            let output = event.outputBuffer.getChannelData(0);
            const complexityFactor = getComplexityMultiplier();

            for (let i = 0; i < output.length; i++) {
                let baseNoise = 0;

                // Noise generation with complexity modulation
                switch(settings.noiseType) {
                    case "white":
                        baseNoise = Math.random() * 2 - 1;
                        break;
                    case "pink":
                        let white = Math.random() * 2 - 1;
                        baseNoise = (white * complexityFactor) * 0.5;
                        break;
                    case "brown":
                        let brownNoise = Math.random() * 2 - 1;
                        baseNoise = brownNoise * (1 + settings.formFluidity);
                        break;
                }

                // Apply chromatic intensity and complexity
                output[i] = baseNoise * (1 + settings.chromaticIntensity);
            }
        }

        // Complexity Multiplier for Dynamic Audio Generation
        function getComplexityMultiplier() {
            switch(settings.complexityMode) {
                case "organic": return 1.5;
                case "mechanical": return 1.0;
                case "quantum": return 2.0;
                case "fractal": return 1.75;
                default: return 1.0;
            }
        }

        // Update Audio Parameters
        function updateAudio() {
            if (gainNode) {
                gainNode.gain.value = settings.noiseVolume;
            }
        }

        function updatePitch(pitch) {
            if (oscNode) {
                oscNode.frequency.setValueAtTime(pitch, audioContext.currentTime);
            }
        }

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

        // Load and play 8-bit drum samples
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

        function playDrumSample(drum) {
            const bufferSource = audioContext.createBufferSource();
            bufferSource.buffer = drumBuffers[drum];
            bufferSource.playbackRate.value = 1 + Math.random() * 0.1 - 0.05; // Slight pitch variation
            bufferSource.connect(audioContext.destination);
            bufferSource.start();
        }

        document.getElementById('bass-pad').addEventListener('click', () => playDrumSample('bass'));
        document.getElementById('snare-pad').addEventListener('click', () => playDrumSample('snare'));
        document.getElementById('ride-pad').addEventListener('click', () => playDrumSample('ride'));

        loadDrumSamples();

        // MIDI input handling
        if (navigator.requestMIDIAccess) {
            navigator.requestMIDIAccess().then(onMIDISuccess, onMIDIFailure);
        } else {
            console.warn("WebMIDI is not supported in this browser.");
        }

        function onMIDISuccess(midiAccess) {
            midiAccess.inputs.forEach(input => {
                input.onmidimessage = getMIDIMessage;
            });
        }

        function onMIDIFailure() {
            console.warn("Could not access MIDI devices.");
        }

        function getMIDIMessage(midiMessage) {
            const [command, note, velocity] = midiMessage.data;
            if (command === 144 && velocity > 0) {
                // Note On
                playNoteWithModulation(note);
            } else if (command === 128 || (command === 144 && velocity === 0)) {
                // Note Off
                stopNote();
            }
        }

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

        function playNoteWithModulation(note) {
            const baseFrequency = westernScaleFrequencies[note % westernScaleFrequencies.length];
            oscNode.frequency.setValueAtTime(baseFrequency, audioContext.currentTime);
            console.log('Playing note with frequency:', baseFrequency);
        }

        function stopNote() {
            // Logic to stop the note
        }

        // Accelerate shape decay automatically
        function accelerateShapeDecay() {
            const decayRate = 0.01; // Adjust this value to control the acceleration rate
            let currentDecay = settings.formFluidity;
            setInterval(() => {
                currentDecay = Math.max(0, currentDecay - decayRate);
                settings.formFluidity = currentDecay;
                updateShapeDecay(currentDecay);
            }, 100);
        }

        function updateShapeDecay(decay) {
            // Logic to update the shape decay in WebGL shader
            console.log('Updating shape decay to', decay);
        }

        // Start accelerating shape decay
        accelerateShapeDecay();

        // Implement cartoon fire effect for touch screen input
        function createFireEffect(x, y) {
            // Logic to create a cartoon fire effect at (x, y) coordinates
            console.log('Creating fire effect at', x, y);
        }

        canvas.addEventListener('touchstart', (event) => {
            const touch = event.touches[0];
            createFireEffect(touch.clientX, touch.clientY);
        });

        canvas.addEventListener('touchmove', (event) => {
            const touch = event.touches[0];
            createFireEffect(touch.clientX, touch.clientY);
        });

        canvas.addEventListener('touchend', (event) => {
            const touch = event.changedTouches[0];
            createFireEffect(touch.clientX, touch.clientY);
        });
    }
});
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
            pitch: 880               // Chromatic pitch
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
        let gainNode;
        let noiseNode;
        let oscNode;
        let isAudioStarted = false;

        function setupAudio() {
            if (!isAudioStarted) {
                audioContext = new (window.AudioContext || window.webkitAudioContext)();
                gainNode = audioContext.createGain();
                gainNode.gain.value = settings.noiseVolume;

                const bufferSize = 4096;
                noiseNode = audioContext.createScriptProcessor(bufferSize, 1, 1);
                noiseNode.onaudioprocess = generateChromaNoise;

                oscNode = audioContext.createOscillator();
                oscNode.frequency.setValueAtTime(settings.pitch, audioContext.currentTime);
                oscNode.connect(gainNode);

                noiseNode.connect(gainNode);
                gainNode.connect(audioContext.destination);
                oscNode.start();

                isAudioStarted = true;

                console.log("Chromatic Audio Noise Started");
            }
        }

        // Enhanced Noise Generation with Chromatic Audio
        function generateChromaNoise(event) {
            let output = event.outputBuffer.getChannelData(0);
            const complexityFactor = getComplexityMultiplier();

            for (let i = 0; i < output.length; i++) {
                let baseNoise = 0;

                // Noise generation with complexity modulation
                switch(settings.noiseType) {
                    case "white":
                        baseNoise = Math.random() * 2 - 1;
                        break;
                    case "pink":
                        let white = Math.random() * 2 - 1;
                        baseNoise = (white * complexityFactor) * 0.5;
                        break;
                    case "brown":
                        let brownNoise = Math.random() * 2 - 1;
                        baseNoise = brownNoise * (1 + settings.formFluidity);
                        break;
                }

                // Apply chromatic intensity and complexity
                output[i] = baseNoise * (1 + settings.chromaticIntensity);
            }
        }

        // Complexity Multiplier for Dynamic Audio Generation
        function getComplexityMultiplier() {
            switch(settings.complexityMode) {
                case "organic": return 1.5;
                case "mechanical": return 1.0;
                case "quantum": return 2.0;
                case "fractal": return 1.75;
                default: return 1.0;
            }
        }

        // Update Audio Parameters
        function updateAudio() {
            if (gainNode) {
                gainNode.gain.value = settings.noiseVolume;
            }
        }

        function updatePitch(pitch) {
            if (oscNode) {
                oscNode.frequency.setValueAtTime(pitch, audioContext.currentTime);
            }
        }

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

        // Load and play 8-bit drum samples
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

        function playDrumSample(drum) {
            const bufferSource = audioContext.createBufferSource();
            bufferSource.buffer = drumBuffers[drum];
            bufferSource.playbackRate.value = 1 + Math.random() * 0.1 - 0.05; // Slight pitch variation
            bufferSource.connect(audioContext.destination);
            bufferSource.start();
        }

        document.getElementById('bass-pad').addEventListener('click', () => playDrumSample('bass'));
        document.getElementById('snare-pad').addEventListener('click', () => playDrumSample('snare'));
        document.getElementById('ride-pad').addEventListener('click', () => playDrumSample('ride'));

        loadDrumSamples();

        // MIDI input handling
        if (navigator.requestMIDIAccess) {
            navigator.requestMIDIAccess().then(onMIDISuccess, onMIDIFailure);
        } else {
            console.warn("WebMIDI is not supported in this browser.");
        }

        function onMIDISuccess(midiAccess) {
            midiAccess.inputs.forEach(input => {
                input.onmidimessage = getMIDIMessage;
            });
        }

        function onMIDIFailure() {
            console.warn("Could not access MIDI devices.");
        }

        function getMIDIMessage(midiMessage) {
            const [command, note, velocity] = midiMessage.data;
            if (command === 144 && velocity > 0) {
                // Note On
                playNoteWithModulation(note);
            } else if (command === 128 || (command === 144 && velocity === 0)) {
                // Note Off
                stopNote();
            }
        }

        function getMicrotonalPitch(note, cents) {
            return note * Math.pow(2, cents / 1200);
        }

        function playNoteWithModulation(note) {
            const baseFrequency = 440 * Math.pow(2, (note - 69) / 12);
            const modulatedFrequency = getMicrotonalPitch(baseFrequency, Math.random() * 50 - 25);
            // Use modulatedFrequency to influence WebGL shader or audio output
            console.log('Playing note with frequency:', modulatedFrequency);
        }

        function stopNote() {
            // Logic to stop the note
        }

        // Accelerate shape decay automatically
        function accelerateShapeDecay() {
            const decayRate = 0.01; // Adjust this value to control the acceleration rate
            let currentDecay = settings.formFluidity;
            setInterval(() => {
                currentDecay = Math.max(0, currentDecay - decayRate);
                settings.formFluidity = currentDecay;
                updateShapeDecay(currentDecay);
            }, 100);
        }

        function updateShapeDecay(decay) {
            // Logic to update the shape decay in WebGL shader
            console.log('Updating shape decay to', decay);
        }

        // Start accelerating shape decay
        accelerateShapeDecay();

        // Implement cartoon fire effect for touch screen input
        function createFireEffect(x, y) {
            // Logic to create a cartoon fire effect at (x, y) coordinates
            console.log('Creating fire effect at', x, y);
        }

        canvas.addEventListener('touchstart', (event) => {
            const touch = event.touches[0];
            createFireEffect(touch.clientX, touch.clientY);
        });

        canvas.addEventListener('touchmove', (event) => {
            const touch = event.touches[0];
            createFireEffect(touch.clientX, touch.clientY);
        });

        canvas.addEventListener('touchend', (event) => {
            const touch = event.changedTouches[0];
            createFireEffect(touch.clientX, touch.clientY);
        });
    }
});