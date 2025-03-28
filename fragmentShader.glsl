precision highp float;

uniform float time;
uniform vec2 resolution;
uniform float frequency;
uniform float chromaticIntensity;
uniform float formFluidity;
uniform float pitch;

varying vec2 vUv;

// Basic 2D noise
float random(vec2 st) {
    return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
}

// Interpolated noise
float noise(vec2 st) {
    vec2 i = floor(st);
    vec2 f = fract(st);
    vec2 u = f * f * (3.0 - 2.0 * f);
    
    float a = random(i);
    float b = random(i + vec2(1.0, 0.0));
    float c = random(i + vec2(0.0, 1.0));
    float d = random(i + vec2(1.0, 1.0));
    
    return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}

// Fractal Brownian Motion
float fbm(vec2 st) {
    float value = 0.0;
    float amplitude = 0.5;
    vec2 shift = vec2(100.0);
    mat2 rot = mat2(cos(0.5), sin(0.5), -sin(0.5), cos(0.5));

    for (int i = 0; i < 6; i++) {
        value += amplitude * noise(st);
        st = rot * st * 2.0 + shift;
        amplitude *= 0.5;
    }
    return value;
}

void main() {
    vec2 st = gl_FragCoord.xy / resolution.xy;
    st -= 0.5;
    st *= resolution / min(resolution.x, resolution.y);

    float scale = 3.0 + sin(time * 0.1) * formFluidity * 5.0;
    float base = fbm(st * scale + time * 0.05);

    float r = fbm(st * scale + vec2(time * 0.1, 0.0)) * (1.0 + chromaticIntensity);
    float g = fbm(st * scale + vec2(0.0, time * 0.1)) * (1.0 + chromaticIntensity * 0.7);
    float b = fbm(st * scale - vec2(time * 0.05)) * (1.0 + chromaticIntensity * 0.5);

    vec3 color = vec3(r, g, b) * base * frequency;

    gl_FragColor = vec4(color, 1.0);
}