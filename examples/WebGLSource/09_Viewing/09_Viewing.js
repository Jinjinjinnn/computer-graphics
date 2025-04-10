/*-------------------------------------------------------------------------
09_Viewing

- Viewing a 3D unit cube at origin with perspective projection
- Rotating the cube by modeling transformation
    1) Rotate the cube by the angle of zrotSpeed per second about z-axis
    2) Rotate the cube by the angle of xrotSpeed per second about x-axis
- View transformation: simply translate the cube to (0, 0, -4)
  We never change the position and looking direction of the camera
  The effect of the cube's translation:
    camera is looking at the cube at the distance of +4 units in z-axis
- Note that the default camera is at the origin and looking at the infinite in the -z axis  

---------------------------------------------------------------------------*/

import { resizeAspectRatio, Axes } from '../util/util.js';
import { Shader, readShaderFile } from '../util/shader.js';
import { Cube } from '../util/cube.js';

const canvas = document.getElementById('glCanvas');
const gl = canvas.getContext('webgl2');
let shader;
let startTime;

let isInitialized = false;

let viewMatrix = mat4.create();
let projMatrix = mat4.create();
let zRotSpeed = 60.0;  // z-axis rotation speed (degree/sec)
let xRotSpeed = 45.0;  // x-axis rotation speed (degree/sec)
const cube = new Cube(gl);
const axes = new Axes(gl, 1.8); // create an Axes object (length = 1.8)

document.addEventListener('DOMContentLoaded', () => {
    if (isInitialized) {
        console.log("Already initialized");
        return;
    }

    main().then(success => {
        if (!success) {
            console.log('program terminated');
            return;
        }
        isInitialized = true;
    }).catch(error => {
        console.error('program terminated with error:', error);
    });
});

function initWebGL() {
    if (!gl) {
        console.error('WebGL 2 is not supported by your browser.');
        return false;
    }

    canvas.width = 700;
    canvas.height = 700;
    resizeAspectRatio(gl, canvas);
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0.1, 0.2, 0.3, 1.0);
    
    return true;
}

async function initShader() {
    const vertexShaderSource = await readShaderFile('shVert.glsl');
    const fragmentShaderSource = await readShaderFile('shFrag.glsl');
    shader = new Shader(gl, vertexShaderSource, fragmentShaderSource);
}

function render() {
    // compute the elapsed time from the start time
    const currentTime = Date.now();
    const elapsedTime = (currentTime - startTime) / 1000.0; // convert to second

    // clear canvas
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // enable depth test for 3D rendering (for hidden surface removal)
    gl.enable(gl.DEPTH_TEST);

    // model transformation
    const modelMatrix = mat4.create();
    // rotation about x-axis
    mat4.rotateX(modelMatrix, modelMatrix, glMatrix.toRadian(xRotSpeed * elapsedTime));
    // rotation about z-axis
    mat4.rotateZ(modelMatrix, modelMatrix, glMatrix.toRadian(zRotSpeed * elapsedTime));

    // drawing the cube
    shader.use();  // using the cube's shader
    shader.setMat4('u_model', modelMatrix);
    shader.setMat4('u_view', viewMatrix);
    shader.setMat4('u_projection', projMatrix);
    cube.draw(shader);

    // drawing the axes (using the axes's shader: see util.js)
    axes.draw(viewMatrix, projMatrix);

    // call the render function the next time for animation
    requestAnimationFrame(render);
}

async function main() {
    try {
        if (!initWebGL()) {
            throw new Error('WebGL 초기화 실패');
        }
        
        await initShader();

        // View transformation matrix (move the cube to (0, 0, -4))
        // default camera is at the origin and looking at the infinite in the -z axis
        // invariant in the program
        mat4.translate(viewMatrix, viewMatrix, vec3.fromValues(0, 0, -4));

        // Projection transformation matrix (invariant in the program)
        mat4.perspective(
            projMatrix,
            glMatrix.toRadian(60),  // field of view (fov, degree)
            canvas.width / canvas.height, // aspect ratio
            0.1, // near
            1000.0 // far
        );

        // starting time (global variable) for animation
        startTime = Date.now();

        // call the render function the first time for animation
        requestAnimationFrame(render);

        return true;

    } catch (error) {
        console.error('Failed to initialize program:', error);
        alert('Failed to initialize program');
        return false;
    }
}
