attribute vec4 position;

uniform float time;
uniform float formFluidity;

varying vec2 vUv;
varying float vTime;

void main() {
    vUv = position.xy * 0.5 + 0.5;
    vTime = time;

    // Convert to polar coordinates
    float r = length(position.xy);
    float theta = atan(position.y, position.x);

    // Spiral transformation
    float spiral = time * 0.4 + r * 4.0;
    theta += sin(spiral) * 0.2 * formFluidity;

    vec2 spiralPos = vec2(cos(theta), sin(theta)) * r;

    gl_Position = vec4(spiralPos, 0.0, 1.0);
}