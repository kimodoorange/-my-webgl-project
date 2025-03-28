attribute vec4 position;

uniform float time;
uniform float formFluidity;

varying vec2 vUv;
varying float vTime;

void main() {
    vUv = position.xy * 0.5 + 0.5;
    vTime = time;

    float angle = time * 0.3;
    float twist = sin(time * 0.5 + position.x * 3.0) * formFluidity * 0.2;

    mat2 rotation = mat2(cos(angle + twist), -sin(angle + twist),
                         sin(angle + twist),  cos(angle + twist));

    vec2 transformed = rotation * position.xy;

    gl_Position = vec4(transformed, 0.0, 1.0);
}