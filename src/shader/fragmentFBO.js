const fragmentShader = `
uniform sampler2D uTexture;
uniform vec4 uResolution;

varying vec2 vUv;
varying vec3 vPosition;
varying vec3 vColor;
float PI = 3.1415926;


void main() {
    vec4 color = texture2D(uTexture, vUv) ;

    // Output to screen
    gl_FragColor = color * 0.2;
	
}

`

export default fragmentShader
