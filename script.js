// Enhanced Fractal Noise Generator with Chromatic Complexity

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

document.addEventListener('DOMContentLoaded', function () {
    // Ensure the audio element is correctly initialized
    const audioElement = document.querySelector('audio');
    audioElement.addEventListener('play', function () {
        console.log('Audio is playing');
    });

    // Example form initialization
    const formElement = document.querySelector('.settings-element form');
    if (formElement) {
        formElement.addEventListener('submit', function (event) {
            event.preventDefault();
            console.log('Form submitted');
        });
    }
});

// Load shader source
async function loadShaderSource(url) {
    const response = await fetch(url);
    return await response.text();
}

// Initialize shaders
async function initShaders(gl) {
    const vertexShaderSource = await loadShaderSource('vertexShader.glsl');
    const fragmentShaderSource = await loadShaderSource('fragmentShader.glsl');

    const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
    const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);

    const program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        console.error("Shader program linking error:", gl.getProgramInfoLog(program));
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
    }
});