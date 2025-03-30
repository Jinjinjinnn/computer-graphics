// Global constants
const canvas = document.getElementById('glCanvas');
const gl = canvas.getContext('webgl2');

if (!gl) {
    console.error('WebGL 2.0 not supported by your browser.');
}

gl.enable(gl.SCISSOR_TEST);

// Set canvas size
const defaultSize = 500;
const size = defaultSize/window.innerWidth;

canvas.width = defaultSize; 
canvas.height = defaultSize;

drawScene();

// Resize viewport when window size changes
window.addEventListener('resize', () => {
    canvas.width = window.innerWidth*size;
    canvas.height = window.innerWidth*size;

    drawScene();
});

function render() {
    gl.clear(gl.COLOR_BUFFER_BIT);
}

function setViewport(portion) {
    const half = canvas.width / 2;
    switch (portion) {
        case 'tl':
            gl.viewport(0, half, half, half);
            gl.scissor(0, half, half, half);
            gl.clearColor(1.0,0.0,0.0,1.0);
            break;

        case 'tr':
            gl.viewport(half, half, half, half);
            gl.scissor(half, half, half, half);
            gl.clearColor(0.0,1.0,0.0,1.0);
            break;

        case 'bl':
            gl.viewport(0, 0, half, half);
            gl.scissor(0, 0, half, half);
            gl.clearColor(0.0,0.0,1.0,1.0);
            break;

        case 'br':
            gl.viewport(half, 0, half, half);
            gl.scissor(half, 0, half, half);
            gl.clearColor(1.0,1.0,0.0,1.0);
            break;
    }
}

function drawScene() {
    // Top-left
    setViewport("tl");
    render();
    setViewport("tr");
    render();
    setViewport("bl");
    render();
    setViewport("br");
    render();
}
