/*-------------------------------------------------------------------------
Homework04.js
---------------------------------------------------------------------------*/
import { resizeAspectRatio, setupText, updateText, Axes } from '../util/util.js';
import { Shader, readShaderFile } from '../util/shader.js';

// Global variables
const canvas = document.getElementById('glCanvas');
const gl = canvas.getContext('webgl2');
let isInitialized = false;
let shader;
let vao;
let modelMatrix;
let startTime = Date.now();
let axes = new Axes(gl, 1.0);

// DOMContentLoaded event
document.addEventListener('DOMContentLoaded', () => {
    if (isInitialized) {
        console.log("Already initialized");
        return;
    }

    main().then(success => {
        if (!success) {
            console.log('프로그램을 종료합니다.');
            return;
        }
        isInitialized = true;
    }).catch(error => {
        console.error('프로그램 실행 중 오류 발생:', error);
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

function setupBuffers() {

    const vertices = [
        -0.5, -0.5, 0.0, 
         0.5, -0.5, 0.0,
         0.5,  0.5, 0.0,
        -0.5,  0.5, 0.0
    ];

    vao = gl.createVertexArray();
    gl.bindVertexArray(vao);
    let vbo = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
    shader.setAttribPointer('a_position', 3, gl.FLOAT, false, 0, 0);
    gl.bindVertexArray(null);
}

function render() {
    let currentTime = Date.now(); 
    const elapsedTime = (currentTime - startTime) / 1000; 

    gl.clear(gl.COLOR_BUFFER_BIT);

    // axes 그리기
    axes.draw(mat4.create(), mat4.create());

    shader.use();

    // Sun
    modelMatrix = mat4.create();
    mat4.scale(modelMatrix, modelMatrix, [0.2, 0.2, 1.0]);
    mat4.rotate(modelMatrix, modelMatrix, elapsedTime * (Math.PI / 4), [0, 0, 1]);
    shader.setMat4("u_model", modelMatrix);
    shader.setVec4("u_color", [1.0, 0.0, 0.0, 1.0]);
    gl.bindVertexArray(vao);
    gl.drawArrays(gl.TRIANGLE_FAN, 0, 4);

    // Earth
    modelMatrix = mat4.create();
    mat4.rotate(modelMatrix, modelMatrix, elapsedTime * (Math.PI / 6), [0, 0, 1]);
    mat4.translate(modelMatrix, modelMatrix, [0.7, 0, 0]);
    mat4.scale(modelMatrix, modelMatrix, [0.1, 0.1, 1.0]);
    mat4.rotate(modelMatrix, modelMatrix, elapsedTime * Math.PI, [0, 0, 1]);
    shader.setMat4("u_model", modelMatrix);
    shader.setVec4("u_color", [0.0, 1.0, 1.0, 1.0]);
    gl.bindVertexArray(vao);
    gl.drawArrays(gl.TRIANGLE_FAN, 0, 4);

    // Moon
    modelMatrix = mat4.create();
    mat4.rotate(modelMatrix, modelMatrix, elapsedTime * (Math.PI / 6), [0, 0, 1]);
    mat4.translate(modelMatrix, modelMatrix, [0.7, 0, 0]);
    mat4.rotate(modelMatrix, modelMatrix, elapsedTime * (2.0 * Math.PI), [0, 0, 1]);
    mat4.translate(modelMatrix, modelMatrix, [0.2, 0, 0]);
    mat4.scale(modelMatrix, modelMatrix, [0.05, 0.05, 1.0]);
    mat4.rotate(modelMatrix, modelMatrix, elapsedTime * Math.PI, [0, 0, 1]);
    shader.setMat4("u_model", modelMatrix);
    shader.setVec4("u_color", [1.0, 1.0, 0.0, 1.0]);
    gl.bindVertexArray(vao);
    gl.drawArrays(gl.TRIANGLE_FAN, 0, 4);

    requestAnimationFrame(render);
}

async function main() {
    try {
        if (!initWebGL()) {
            throw new Error('WebGL 초기화 실패');
            return false; 
        }

        await initShader();
        setupBuffers();

        requestAnimationFrame(render);

        return true;
        
    } catch (error) {
        console.error('Failed to initialize program:', error);
        alert('프로그램 초기화에 실패했습니다.');
        return false;
    }
}
