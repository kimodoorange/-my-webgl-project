const canvas = document.getElementById("glCanvas");
const gl = canvas.getContext("webgl");
if (!gl) console.error("WebGL is not supported in this browser.");

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
gl.viewport(0, 0, canvas.width, canvas.height);

const textOverlay = document.getElementById('text-overlay');
const randomTextElement = document.getElementById('random-text');

const colors = [["green", "blue"], ["blue", "purple"], ["purple", "violet"], ["yellow", "orange"]];

const randomizeText = () => Array.from({ length: 14 }, () => 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'.charAt(Math.floor(Math.random() * 62))).join('');

const changeTextColor = () => {
    const [color1, color2] = colors[Math.floor(Math.random() * colors.length)];
    randomTextElement.style.color = color1;
    textOverlay.style.backgroundColor = color2;
};

const startTextRandomization = () => {
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
gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);

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
            noiseVolume: 0.5,
            noiseType: "white",
            chromaticIntensity: 0.5,
            formFluidity: 0.5,
            complexityMode: "organic",
            pitch: 880,
            modulator: 0.5
        };

        const gui = new dat.GUI({ autoPlace: false });
        document.getElementById('controls').appendChild(gui.domElement);
        Object.entries(settings).forEach(([key, value]) => {
            if (typeof value === "number") {
                gui.add(settings, key, 0.0, 1.0).name(key.charAt(0).toUpperCase() + key.slice(1)).onChange(updateAudio);
            } else {
                gui.add(settings, key, ["white", "pink", "brown"]).name(key.charAt(0).toUpperCase() + key.slice(1)).onChange(updateAudio);
            }
        });

        let isMinimized = false;
        document.getElementById('minimize-button').addEventListener('click', () => {
            isMinimized = !isMinimized;
            gui.domElement.style.display = isMinimized ? 'none' : 'block';
        });

        const controls = document.getElementById('controls');
        const header = document.getElementById('control-header');
        header.addEventListener('mousedown', e => {
            let offsetX = e.clientX - controls.offsetLeft;
            let offsetY = e.clientY - controls.offsetTop;
            const drag = e => {
                controls.style.left = `${e.clientX - offsetX}px`;
                controls.style.top = `${e.clientY - offsetY}px`;
            };
            document.addEventListener('mousemove', drag);
            document.addEventListener('mouseup', () => document.removeEventListener('mousemove', drag), { once: true });
        });

        const shapeDecaySpeed = 0.002;

        function updateComplexityMode(mode) {
            switch (mode) {
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

        let audioContext;
        let isAudioStarted = false;

        function setupAudio() {
            if (!isAudioStarted) {
                audioContext = new (window.AudioContext || window.webkitAudioContext)();
                isAudioStarted = true;
                console.log("Audio context started");
                startTextRandomization();
            }
        }

        function updateAudio() { }

        document.addEventListener("click", setupAudio);

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
            const infoOverlay = document.getElementById('info-overlay');
            const interactionHint = document.getElementById('interaction-hint');

            document.addEventListener('mousedown', () => {
                infoOverlay.classList.add('visible');
                setTimeout(() => infoOverlay.classList.remove('visible'), 3000);
            }, { once: true });

            canvas.addEventListener('mousemove', event => {
                const mouseX = event.clientX / window.innerWidth;
                const mouseY = event.clientY / window.innerHeight;
                settings.formFluidity = mouseX;
                settings.chromaticIntensity = mouseY;
            });

            canvas.addEventListener('mouseenter', () => interactionHint.style.opacity = '0');
            canvas.addEventListener('mouseleave', () => interactionHint.style.opacity = '0.7');
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
                    updateComplexityMode(settings.complexityMode);
                    break;
            }
        });

        function playSound(url) {
            const audio = new Audio(url);
            audio.play();
        }

        const drumSounds = {
            bass: 'path/to/bass-drum.mp3',
            snare: 'path/to/snare-drum.mp3',
            ride: 'path/to/ride-cymbal.mp3'
        };

        document.getElementById('bass-pad').addEventListener('click', () => playSound(drumSounds.bass));
        document.getElementById('snare-pad').addEventListener('click', () => playSound(drumSounds.snare));
        document.getElementById('ride-pad').addEventListener('click', () => playSound(drumSounds.ride));

        function playNote(frequency) {
            const osc = audioContext.createOscillator();
            osc.frequency.setValueAtTime(frequency, audioContext.currentTime);
            const gainNodeOsc = audioContext.createGain();
            gainNodeOsc.gain.setValueAtTime(1, audioContext.currentTime);
            osc.connect(gainNodeOsc).connect(audioContext.destination);
            osc.start();
            osc.stop(audioContext.currentTime + 1);
        }

        document.getElementById('note1').addEventListener('click', () => playNote(261.63)); // C4
        document.getElementById('note2').addEventListener('click', () => playNote(293.66)); // D4
        document.getElementById('note3').addEventListener('click', () => playNote(329.63)); // E4
        document.getElementById('note4').addEventListener('click', () => playNote(349.23)); // F4
        document.getElementById('note5').addEventListener('click', () => playNote(392.00)); // G4
        document.getElementById('note6').addEventListener('click', () => playNote(440.00)); // A4
        document.getElementById('note7').addEventListener('click', () => playNote(493.88)); // B4
    }
});