/*----------------------------------------------------------------------------
04_ShaderUniform.js
1) Change the color of the triangle by using a uniform variable
2) Use resizeAspectRatio function in ../util/util.js
3) Use createProgram function in ../util/shader.js
-----------------------------------------------------------------------------*/
import { resizeAspectRatio } from '../util/util.js';
import { createProgram } from '../util/shader.js';

// Get the canvas and WebGL 2 context
const canvas = document.getElementById('glCanvas');
const gl = canvas.getContext('webgl2');

if (!gl) {
    console.error('WebGL 2 is not supported by your browser.');
}

// Set canvas dimensions
canvas.width = 600;
canvas.height = 600;

// Add resize handler (keeping the aspect ratio: see ../util/util.js)
resizeAspectRatio(gl, canvas);

// Initialize WebGL settings
gl.viewport(0, 0, canvas.width, canvas.height);
gl.clearColor(0.1, 0.2, 0.3, 1.0);

// Vertex shader source: vertex data passed from the WebGL program
const vertexShaderSource = `#version 300 es
layout(location = 0) in vec3 aPos;
void main() {
    gl_Position = vec4(aPos, 1.0);
}`;

// Fragment shader source: uniform variable passed from the WebGL program
const fragmentShaderSource = `#version 300 es
precision mediump float;
out vec4 FragColor;
uniform vec4 uColor;
void main() {
    FragColor = uColor;
}`;

// Create shader programs (createProgram function in ../util/shader.js)
const program = createProgram(gl, vertexShaderSource, fragmentShaderSource);

// Coordinates of the triangle vertices
const vertices = new Float32Array([
    -0.5, -0.5, 0.0,  // Bottom left
     0.5, -0.5, 0.0,  // Bottom right
     0.0,  0.5, 0.0   // Top center
]);

// Create Vertex Array Object (VAO)
const vao = gl.createVertexArray();
gl.bindVertexArray(vao);

// Create buffer (VBO) and bind data
const vertexBuffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

// Link vertex data to shader program variables
// 0: location, 3: size, gl.FLOAT: type, false: normalize, 0: stride, 0: offset
gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 0, 0);  
gl.enableVertexAttribArray(0); // 0: location

// Use shader program
gl.useProgram(program);

// Get the location of the uniform variable in the shader program
const uColorLocation = gl.getUniformLocation(program, 'uColor');

// Render loop
function render(time) {
    gl.clear(gl.COLOR_BUFFER_BIT);

    // Calculate the color based on time
    const t = (Math.sin(time / 1000) + 1) / 2; // Normalize to [0, 1]
    const color = [
        1.0 * (1 - t) + 0.0 * t,  // Red component (interpolates from orange to cyan)
        0.5 * (1 - t) + 1.0 * t,  // Green component (interpolates from orange to cyan)
        1.0 * t,                  // Blue component (interpolates from orange to cyan)
        1.0                       // Alpha component
    ];

    // pass the color to the uniform variable (4D vector) in the shader program
    gl.uniform4fv(uColorLocation, color);

    // Bind VAO and draw
    gl.bindVertexArray(vao);
    gl.useProgram(program);
    gl.drawArrays(gl.TRIANGLES, 0, 3); // 0: first, 3: number of elements

    // Request next frame: for animation
    requestAnimationFrame(render); 
}

// Start rendering
requestAnimationFrame(render);

// Start rendering manually with time = 0
//render(0);

// Or Start rendering with the current time
//render(performance.now());

// Or Start rendering with custom time
//render(2000); // 2 seconds into the animation



