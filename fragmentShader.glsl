precision highp float;

uniform float time;
uniform vec2 resolution;
uniform float frequency;
uniform float chromaticIntensity;
uniform float formFluidity;
uniform float pitch;

varying vec2 vUv;

// Noise generator
float random(vec2 st) {
    return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453);
}
float noise(vec2 st) {
    vec2 i = floor(st);
    vec2 f = fract(st);
    vec2 u = f*f*(3.0-2.0*f);
    return mix(mix(random(i), random(i+vec2(1.0,0.0)), u.x),
               mix(random(i+vec2(0.0,1.0)), random(i+vec2(1.0,1.0)), u.x), u.y);
}
float fbm(vec2 st) {
    float value = 0.0;
    float amp = 0.5;
    for (int i = 0; i < 6; i++) {
        value += amp * noise(st);
        st *= 2.0;
        amp *= 0.5;
    }
    return value;
}

void main() {
    vec2 st = gl_FragCoord.xy / resolution.xy;
    st = (st - 0.5) * resolution / min(resolution.x, resolution.y);
    float scale = 3.0 + sin(time * 0.15) * formFluidity * 6.0;

    float base = fbm(st * scale + time * 0.1);
    float r = fbm(st * scale + vec2(time * 0.2, 0.0)) * (1.0 + chromaticIntensity);
    float g = fbm(st * scale + vec2(0.0, time * 0.2)) * (1.0 + chromaticIntensity * 0.7);
    float b = fbm(st * scale - vec2(time * 0.1)) * (1.0 + chromaticIntensity * 0.5);

    gl_FragColor = vec4(r, g, b, 1.0) * base * frequency;
}
