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
            (c - a) * u.y * (1.0 - u.x) +
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