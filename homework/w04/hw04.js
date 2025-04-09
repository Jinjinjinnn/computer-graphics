import { resizeAspectRatio, Axes } from '../util/util.js';
import { Shader, readShaderFile } from '../util/shader.js';

const canvas = document.getElementById('glCanvas');
const gl = canvas.getContext('webgl2');

let rotationAngleS = 0;;
let rotationAngleE = 0;;
let rotationAngleM = 0;;

let orbitAngleE = 0;
let orbitAngleM = 0;

let shader = null;
let vao = null

let lastTime = 0;

let isInitialized = false;
let axes = new Axes(gl, 0.8);

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
        requestAnimationFrame(animate);
    }).catch(error => {
        console.error('프로그램 실행 중 오류 발생:', error);
    });
});

// Initialize WebGL
function initWebGL() {
    if (!gl) {
        console.error('WebGL 2 is not supported by your browser.');
        return false;
    }

    // Set canvas dimensions
    canvas.width = 700;
    canvas.height = 700;
    
    // add resize handler
    resizeAspectRatio(gl, canvas);

    // set viewport (the first time)
    gl.viewport(0, 0, canvas.width, canvas.height);

    // set the background color
    gl.clearColor(0.2, 0.3, 0.4, 1.0);
    
    return true;
}

function setupCubeBuffers(shader) {
    const cubeVertices = new Float32Array([
        -0.5, 0.5, 0.0,
        -0.5, -0.5, 0.0,
        0.5, -0.5, 0.0,
        0.5, 0.5, 0.0
    ]);
    
    const indices = new Uint16Array([
        0, 1, 2,
        0, 2, 3
    ]);
    
    vao = gl.createVertexArray();
    gl.bindVertexArray(vao);

    // position VBO
    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, cubeVertices, gl.STATIC_DRAW);
    shader.setAttribPointer("a_position", 3, gl.FLOAT, false, 0, 0);

    // EBO
    const indexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);

    gl.bindVertexArray(null);
}

// Define Animation
function animate(currentTime) {
    currentTime *= 0.001; // 밀리초 -> 초
    const deltaTime = currentTime - lastTime;
    lastTime = currentTime;

    // 각 천체별 회전/공전 속도 (라디안/초) - 예시 값
    const SUN_ROTATION_SPEED = Math.PI / 4; // 45 deg/sec
    const EARTH_SELF_ROTATION_SPEED = Math.PI; // 180 deg/sec (지구 자전)
    const EARTH_ORBIT_SPEED = Math.PI / 6; // 30 deg/sec (지구 공전)
    const MOON_SELF_ROTATION_SPEED = Math.PI / 3; // 60 deg/sec (달 자전)
    const MOON_ORBIT_SPEED = Math.PI; // 180 deg/sec (달 공전)

    // 각도 업데이트 (속도 * 시간)
    rotationAngleS += SUN_ROTATION_SPEED * deltaTime;
    rotationAngleE += EARTH_SELF_ROTATION_SPEED * deltaTime; // 지구 자전 각도
    rotationAngleM += MOON_SELF_ROTATION_SPEED * deltaTime; // 달 자전 각도

    orbitAngleE += EARTH_ORBIT_SPEED * deltaTime;      // 지구 공전 각도
    orbitAngleM += MOON_ORBIT_SPEED * deltaTime;      // 달 공전 각도 (지구 기준)
    
    render();
    requestAnimationFrame(animate);
}



// Transform Matrices
function getTransformMatricesSun() {
    const R = mat4.create();
    const S = mat4.create();

    mat4.rotate(R, R, rotationAngleS, [0,0,1]);
    mat4.scale(S, S, [0.2, 0.2, 1.0]);

    return {R, S}
}

function getTransformMatricesEarth() {
    const T = mat4.create();
    const R = mat4.create();
    const O = mat4.create();
    const S = mat4.create();

    mat4.translate(T, T, [0.7, 0, 0]);
    mat4.rotate(R, R, rotationAngleE, [0,0,1]);
    mat4.rotate(O, O, orbitAngleE, [0,0,1]);
    mat4.scale(S, S, [0.1, 0.1, 1.0]);

    return {T, R, O, S}
}

function getTransformMatricesMoon() {
    const T = mat4.create();
    const R = mat4.create();
    const O = mat4.create();
    const S = mat4.create();

    mat4.translate(T, T, [0.2, 0, 0]);
    mat4.rotate(R, R, rotationAngleM, [0,0,1]);
    mat4.rotate(O, O, orbitAngleM, [0,0,1]);
    mat4.scale(S, S, [0.05, 0.05, 1.0]);

    return {T, R, O, S}
}


function render() {
    gl.clear(gl.COLOR_BUFFER_BIT);
    shader.use();
    
    // 축 그리기
    // axes.draw(mat4.create(), mat4.create());

    // --- Sun 그리기 ---
    const sunMatrices = getTransformMatricesSun(); // { R, S } 가져오기
    const finalTransformS = mat4.create();
    mat4.multiply(finalTransformS, sunMatrices.R, sunMatrices.S); // final = R * S
    shader.setMat4('u_model', finalTransformS);
    shader.setVec4('u_color', [1.0, 0.0, 0.0, 1.0]);
    gl.bindVertexArray(vao);
    gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);
    
    // --- Earth 그리기 ---
    const earthMatrices = getTransformMatricesEarth(); // { T, R, O, S } 가져오기
    const finalTransformE = mat4.create();
    let M_earth_temp1 = mat4.create();

    mat4.multiply(M_earth_temp1, earthMatrices.R, M_earth_temp1);
    mat4.multiply(M_earth_temp1, earthMatrices.T, M_earth_temp1);
    mat4.multiply(M_earth_temp1, earthMatrices.O, M_earth_temp1);
    mat4.multiply(finalTransformE, M_earth_temp1, earthMatrices.S);
    shader.setMat4('u_model', finalTransformE);
    shader.setVec4('u_color', [0.0, 1.0, 1.0, 1.0]);
    gl.bindVertexArray(vao);
    gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);
    
    // --- Moon 그리기 ---
    const moonMatrices = getTransformMatricesMoon();
    let M_moon_temp1 = mat4.create();

    mat4.multiply(M_moon_temp1, moonMatrices.S, M_moon_temp1);
    mat4.multiply(M_moon_temp1, moonMatrices.R, M_moon_temp1);
    mat4.multiply(M_moon_temp1, moonMatrices.T, M_moon_temp1);
    mat4.multiply(M_moon_temp1, moonMatrices.O, M_moon_temp1);
    
    const finalTransformM = mat4.create();
    mat4.multiply(finalTransformM, M_moon_temp1, finalTransformE);
    shader.setMat4('u_model', finalTransformM);
    shader.setVec4('u_color', [1.0, 1.0, 0.0, 1.0]);
    gl.bindVertexArray(vao);
    gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);
    
    gl.bindVertexArray(null);
    
}

// Loading the shader source files
async function initShader() {
    const vertexShaderSource = await readShaderFile('shVert.glsl');
    const fragmentShaderSource = await readShaderFile('shFrag.glsl');

    return new Shader(gl, vertexShaderSource, fragmentShaderSource);
}

async function main() {
    try {
        if (!initWebGL()) {
            throw new Error('WebGL 초기화 실패');
        }
        
        shader = await initShader();
        setupCubeBuffers(shader);
        
        return true;
    } catch (error) {
        console.error('Failed to initialize program:', error);
        alert('프로그램 초기화에 실패했습니다.');

        return false;
    }
}