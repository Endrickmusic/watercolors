const fragmentShader = `
uniform sampler2D uTexture;
uniform sampler2D uPrev;
uniform vec4 uResolution;

varying vec2 vUv;
varying vec3 vPosition;
varying vec3 vColor;
float PI = 3.1415926;


void main() {
    vec4 color = texture2D(uTexture, vUv);
    vec4 prev = texture2D(uPrev, vUv);

    // color = vec4(1.0, 0.0, 0.0, 1.0);

    // Output to screen
    gl_FragColor = color + prev * 0.9;
    // gl_FragColor = color;
    // gl_FragColor = color;
}

`

export default fragmentShader
