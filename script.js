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

// Shader Sources
const vertexShaderSource = `
    attribute vec4 position;
    void main() {
        gl_Position = position;
    }
`;

const fragmentShaderSource = `
    precision mediump float;
    uniform float time;
    uniform vec2 resolution;
    uniform float frequency;
    
    void main() {
        vec2 uv = gl_FragCoord.xy / resolution;
        float color = 0.5 + 0.5 * sin(time * frequency + uv.x * 10.0);
        gl_FragColor = vec4(vec3(color), 1.0);
    }
`;

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

// Bind attributes
const positionAttribute = gl.getAttribLocation(program, "position");
gl.enableVertexAttribArray(positionAttribute);
gl.vertexAttribPointer(positionAttribute, 2, gl.FLOAT, false, 0, 0);

// Uniforms
const timeUniform = gl.getUniformLocation(program, "time");
const resolutionUniform = gl.getUniformLocation(program, "resolution");
const frequencyUniform = gl.getUniformLocation(program, "frequency");

// GUI Settings
const settings = {
    frequency: 1.0,  // Visual frequency
    noiseVolume: 0.5, // Audio volume
    noiseType: "white", // Noise type
};

const gui = new dat.GUI();
gui.add(settings, "frequency", 0.1, 10.0).name("Visual Frequency");
gui.add(settings, "noiseVolume", 0.0, 1.0).name("Noise Volume").onChange(updateAudio);
gui.add(settings, "noiseType", ["white", "pink", "brown"]).name("Noise Type").onChange(updateAudio);

// ---- AUDIO SETUP ---- //
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
        noiseNode.onaudioprocess = generateNoise;
        
        noiseNode.connect(gainNode);
        gainNode.connect(audioContext.destination);
        isAudioStarted = true;

        console.log("Audio started");
    }
}

// Generate Noise Based on Type
function generateNoise(event) {
    let output = event.outputBuffer.getChannelData(0);
    for (let i = 0; i < output.length; i++) {
        if (settings.noiseType === "white") {
            output[i] = Math.random() * 2 - 1; 
        } else if (settings.noiseType === "pink") {
            let b0 = 0, b1 = 0, b2 = 0;
            let white = Math.random() * 2 - 1;
            b0 = 0.99886 * b0 + white * 0.0555179;
            b1 = 0.99332 * b1 + white * 0.0750759;
            b2 = 0.96900 * b2 + white * 0.1538520;
            output[i] = (b0 + b1 + b2) * 0.11; 
        } else if (settings.noiseType === "brown") {
            let lastOut = 0;
            let white = Math.random() * 2 - 1;
            output[i] = (lastOut + (0.02 * white)) / 1.02;
            lastOut = output[i];
            output[i] *= 3.5; 
        }
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

// Render loop
function render(time) {
    gl.clear(gl.COLOR_BUFFER_BIT);
    
    gl.useProgram(program);
    gl.uniform1f(timeUniform, time * 0.001);
    gl.uniform2f(resolutionUniform, canvas.width, canvas.height);
    gl.uniform1f(frequencyUniform, settings.frequency);

    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

    requestAnimationFrame(render);
}

// Start rendering
requestAnimationFrame(render);