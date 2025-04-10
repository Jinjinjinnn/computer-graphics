/*-------------------------------------------------------------------------
03_HelloTriangleIndexed
    1) Draws a triangle using indexed vertices.
    2) Resize viewport while maintaining aspect ratio.
    3) By the keyboard input 'k', toggle the fill and stroke rendering mode
    for the triangle
---------------------------------------------------------------------------*/
// Get the canvas and WebGL 2 context
const canvas = document.getElementById('glCanvas');
const gl = canvas.getContext('webgl2');

if (!gl) {
    console.error('WebGL 2 is not supported by your browser.');
}

// Set initial canvas size
const CANVAS_WIDTH = 700;
const CANVAS_HEIGHT = 700;
canvas.width = CANVAS_WIDTH;
canvas.height = CANVAS_HEIGHT;

// Resize viewport while maintaining aspect ratio
window.addEventListener('resize', () => {

    // Calculate new canvas dimensions while maintaining aspect ratio
    const aspectRatio = CANVAS_WIDTH / CANVAS_HEIGHT;
    let newWidth = window.innerWidth;
    let newHeight = window.innerHeight;

    if (newWidth / newHeight > aspectRatio) {
        newWidth = newHeight * aspectRatio;
    } else {
        newHeight = newWidth / aspectRatio;
    }

    canvas.width = newWidth;
    canvas.height = newHeight;
    gl.viewport(0, 0, canvas.width, canvas.height);
    render();
});

// Initialize WebGL settings
gl.viewport(0, 0, canvas.width, canvas.height);

// Set clear color to black
gl.clearColor(0.1, 0.2, 0.3, 1.0);

// Vertex shader source code
const vertexShaderSource = `#version 300 es
in vec4 aPosition;
void main() {
    gl_Position = aPosition;
}`;

// Fragment shader source code for orange color
const fragmentShaderSourceOrange = `#version 300 es
precision mediump float;
out vec4 fragColor;
void main() {
    fragColor = vec4(1.0, 0.5, 0.0, 1.0); // Orange color
}`;

// Fragment shader source code for grey color
const fragmentShaderSourceGrey = `#version 300 es
precision mediump float;
out vec4 fragColor;
void main() {
    fragColor = vec4(0.7, 0.7, 0.7, 1.0); // Grey color
}`;

// Function to compile shader
function compileShader(gl, source, type) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error('Error compiling shader:', gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
    }
    return shader;
}

// Function to create shader program
function createProgram(gl, vertexShaderSource, fragmentShaderSource) {
    const vertexShader = compileShader(gl, vertexShaderSource, gl.VERTEX_SHADER);
    const fragmentShader = compileShader(gl, fragmentShaderSource, gl.FRAGMENT_SHADER);
    const program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        console.error('Error linking program:', gl.getProgramInfoLog(program));
        gl.deleteProgram(program);
        return null;
    }
    return program;
}

// Create shader programs
const program1 = createProgram(gl, vertexShaderSource, fragmentShaderSourceOrange);
const program2 = createProgram(gl, vertexShaderSource, fragmentShaderSourceGrey);

// Check if shader programs were created successfully
if (!program1 || !program2) {
    console.error('Failed to create shader programs.');
}

// Rectangle vertices
const vertices = new Float32Array([
    -0.5, -0.5, 0.0,  // Bottom left
     0.5, -0.5, 0.0,  // Bottom right
     0.5,  0.5, 0.0,  // Top right
    -0.5,  0.5, 0.0   // Top left
]);

// Indices for FILL mode (triangles)
const fillIndices = new Uint16Array([
    0, 1, 2,  // First triangle
    2, 3, 0   // Second triangle
]);

// Indices for LINE mode (edges, including common edge)
const lineIndices = new Uint16Array([
    0, 1,  // Bottom edge of first triangle
    1, 2,  // Right edge of first triangle
    2, 3,  // Top edge of second triangle
    3, 0,  // Left edge of second triangle
    0, 2   // Common edge
]);

// Create Vertex Array Object
const vao = gl.createVertexArray();
gl.bindVertexArray(vao);

// Create vertex buffer
const vertexBuffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

// Link vertex data
gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 0, 0);
gl.enableVertexAttribArray(0);

// Create element buffer for FILL
const fillIndexBuffer = gl.createBuffer();
gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, fillIndexBuffer);
gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, fillIndices, gl.STATIC_DRAW);

// Create element buffer for LINE
const lineIndexBuffer = gl.createBuffer();
gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, lineIndexBuffer);
gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, lineIndices, gl.STATIC_DRAW);

// Set initial rendering mode to FILL
let isFillMode = true;

// Render loop
function render() {
    gl.clear(gl.COLOR_BUFFER_BIT);

    if (isFillMode) { 
        // Fill the two triangles using shader program1 (orange)
        gl.useProgram(program1);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, fillIndexBuffer);
        gl.drawElements(gl.TRIANGLES, fillIndices.length, gl.UNSIGNED_SHORT, 0);
    } else { 
        // Draw the edges of the two triangles using shader program2 (grey)
        gl.useProgram(program2); 
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, lineIndexBuffer);
        gl.drawElements(gl.LINES, lineIndices.length, gl.UNSIGNED_SHORT, 0);
    }

}

// Event listener for key press
document.addEventListener('keydown', (event) => {
    console.log(`Key pressed: ${event.key}`);
    if (event.key.toLowerCase() === 'f') {
        // Toggle rendering mode
        isFillMode = !isFillMode;
        // Log (print out to console in developer tool) rendering mode
        console.log(`Rendering mode: ${isFillMode ? 'FILL' : 'LINE'}`);
        render();
    }
});

// Start rendering
render();