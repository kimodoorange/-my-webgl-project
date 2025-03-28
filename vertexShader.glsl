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
