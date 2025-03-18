const canvas = document.getElementById('glCanvas');
const gl = canvas.getContext('webgl2');

if (!gl) {
    console.error('WebGL 2 is not supported by your browser.');
}

