// Global constants
const canvas = document.getElementById('glCanvas'); // Get the canvas element
const gl = canvas.getContext('webgl2');

if (!gl) {
    console.error('WebGL 2 is not supported by your browser.');
}

// Set canvas size: 현재 window 전체를 canvas로 사용
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// Initialize WebGL settings: viewport and clear color
gl.viewport(0,0,canvas.width,canvas.height);
gl.clearColor(0.1,0.2,0.3,1.0);

// Start rendering
render();

// Resize viewport when window size changes
window.addEventListener('resize', () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    gl.viewport(0,0,canvas.width,canvas.height);
    render(); // 'resize'된 canvas에 다시 draw
}); // 'resize': event, window.addEventListener: event handler

// Render function
function render() {
    gl.clear(gl.COLOR_BUFFER_BIT);
    // Draw something here
}

