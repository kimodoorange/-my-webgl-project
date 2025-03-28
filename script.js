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

// Advanced Shader Sources with Chromatic Complexity
const vertexShaderSource = `
    attribute vec4 position;
    uniform float time;
    uniform float formFluidity;
    
    varying vec2 vUv;
    varying float vTime;
    
    void main() {
        vUv = position.xy * 0.5 + 0.5;
        vTime = time;
        
        // Dynamic vertex displacement based on form fluidity
        vec4 displacedPosition = position;
        float distortion = sin(time * formFluidity) * 0.2;
        displacedPosition.xy += distortion * position.yx;
        
        gl_Position = displacedPosition;
    }
`;

const fragmentShaderSource = `
    precision highp float;
    
    uniform float time;
    uniform vec2 resolution;
    uniform float frequency;
    uniform float chromaticIntensity;
    uniform float formFluidity;
    
    varying vec2 vUv;
    
    // Fractal noise generation
    float random(vec2 st) {
        return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
    }
    
    // Improved noise function with chromatic complexity
    float noise(vec2 st) {
        vec2 i = floor(st);
        vec2 f = fract(st);
        
        // Four corners in 2D of a tile
        float a = random(i);
        float b = random(i + vec2(1.0, 0.0));
        float c = random(i + vec2(0.0, 1.0));
        float d = random(i + vec2(1.0, 1.0));
        
        // Smooth Interpolation using Hermite cubic
        vec2 u = f * f * (3.0 - 2.0 * f);
        
        // Mix 4 corners percentages
        return mix(a, b, u.x) +
                (c - a)* u.y * (1.0 - u.x) +
                (d - b) * u.x * u.y;
    }
    
    // Fractal Brownian Motion for complex texture
    float fbm(vec2 x) {
        float v = 0.0;
        float a = 0.5;
        vec2 shift = vec2(100.0);
        
        // Rotate to add more complexity
        mat2 rot = mat2(cos(0.5), sin(0.5), -sin(0.5), cos(0.5));
        
        for (int i = 0; i < 5; i++) {
            v += a * noise(x);
            x = rot * x * 2.0 + shift;
            a *= 0.5;
        }
        return v;
    }
    
    void main() {
        vec2 st = gl_FragCoord.xy / resolution.xy;
        
        // Chromatic distortion with form fluidity
        float timeVariation = time * 0.1;
        float noiseScale = 5.0 + sin(timeVariation) * formFluidity;
        
        // Layered noise generation
        float n = fbm(st * noiseScale);
        
        // Chromatic color generation
        float r = fbm(st * noiseScale + vec2(timeVariation, 0.0));
        float g = fbm(st * noiseScale + vec2(0.0, timeVariation));
        float b = fbm(st * noiseScale + vec2(-timeVariation, timeVariation));
        
        // Intensity modulation
        vec3 color = vec3(
            r * (1.0 + chromaticIntensity),
            g * (1.0 + chromaticIntensity * 0.7),
            b * (1.0 + chromaticIntensity * 0.5)
        );
        
        // Final color with noise and chromatic complexity
        gl_FragColor = vec4(color, 1.0);
    }
`;

// Shader Compilation (previous compilation code remains the same)
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

// Create shaders
const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);

if (!vertexShader || !fragmentShader) {
    console.error("Shader compilation failed.");
}

// Create program
const program = gl.createProgram();
gl.attachShader(program, vertexShader);
gl.attachShader(program, fragmentShader);
gl.linkProgram(program);

if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.error("Shader program linking error:", gl.getProgramInfoLog(program));
}

// Geometry Setup (previous setup remains the same)
const positionBuffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
const positions = new Float32Array([
    -1, -1,  
    1, -1,   
    -1,  1,  
    1,  1    
]);
gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);

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

// Expanded GUI Settings with Dichotomous Fluidity Concept
const settings = {
    frequency: 1.0,          // Visual frequency
    noiseVolume: 0.5,        // Audio volume
    noiseType: "white",      // Noise type
    chromaticIntensity: 0.5, // Chromatic color intensity
    formFluidity: 0.5,       // Form-complexity interaction
    complexityMode: "organic" // Dichotomous complexity mode
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

// Audio Setup (previous audio setup remains largely the same)
let audioContext;
let gainNode;
let noiseNode;
let isAudioStarted = false;

function setupAudio() {
    if (!isAudioStarted) {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        gainNode = audioContext.createGain();
        gainNode.gain.value = settings.noiseVolume;

        const bufferSize = 4096;
        noiseNode = audioContext.createScriptProcessor(bufferSize, 1, 1);
        noiseNode.onaudioprocess = generateChromaNoise;
        
        noiseNode.connect(gainNode);
        gainNode.connect(audioContext.destination);
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

    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

    requestAnimationFrame(render);
}

// Start rendering
requestAnimationFrame(render);