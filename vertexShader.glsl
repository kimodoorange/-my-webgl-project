attribute vec4 position;

uniform float time;
uniform float formFluidity;

varying vec2 vUv;
varying float vTime;

void main() {
    vUv = position.xy * 0.5 + 0.5;
    vTime = time;

    float angle = time * 0.6;
    float twist = sin(time + position.y * 3.0) * formFluidity * 0.6;

    mat2 rotation = mat2(
        cos(angle + twist), -sin(angle + twist),
        sin(angle + twist),  cos(angle + twist)
    );

    vec2 rotated = rotation * position.xy;
    gl_Position = vec4(rotated, 0.0, 1.0);
}
