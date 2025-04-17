/*-----------------------------------------------------------------------------------
14_TextureCoordinates.js

- Viewing a 2D unit rectangle at origin with perspective projection
- Applying image texture (../images/textures/balloon1.jpg) to the rectangle
- Press the space bar to change the texture coordinates states of the rectangle
- The state is changed circularly: 0, 1, 2, 3, 0, 1, 2, 3, ...
-----------------------------------------------------------------------------------*/
import { resizeAspectRatio, setupText, updateText } from '../util/util.js';
import { Shader, readShaderFile } from '../util/shader.js';
import { Rectangle } from '../util/rectangle.js';  // see ../util/rectangle.js
import { loadTexture } from '../util/texture.js';

const canvas = document.getElementById('glCanvas');
const gl = canvas.getContext('webgl2');
let shader;
let textOverlay; 
let isInitialized = false;
let viewMatrix = mat4.create();
let projMatrix = mat4.create();
let modelMatrix = mat4.create();
let state = 0;  // whenever press the space bar, state is changed circularly: 0, 1, 2, 3, 0, 1, 2, 3, ...
const texture = loadTexture(gl, true, '../images/textures/balloon1.jpg'); // see ../util/texture.js
const rectangle = new Rectangle(gl, { texture: texture });


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

// 키보드 이벤트 리스너 추가
document.addEventListener('keydown', (e) => {
    if (e.key === ' ') {  // 스페이스바
        const m = 4;
        state = (state + 1) % m;
        
        switch (state) {
            case 0:  // 기본 텍스처 매핑

            //  (0,1) v1------v0 (1,1)
            //        |        |
            //        |        |
            //        |        |
            //  (0,0) v2------v3 (1,0)

                rectangle.texCoords[0] = 1.0; rectangle.texCoords[1] = 1.0;
                rectangle.texCoords[2] = 0.0; rectangle.texCoords[3] = 1.0;
                rectangle.texCoords[4] = 0.0; rectangle.texCoords[5] = 0.0;
                rectangle.texCoords[6] = 1.0; rectangle.texCoords[7] = 0.0;
                break;

            case 1:  // 1/4 크기 x = [0, 0.5], y = [0, 0.5]: x, y는 모두 1/2로 줄어듦

            //  (0, 0.5) v1------v0 (0.5, 0.5)
            //           |        |
            //           |        |
            //           |        |
            //  (0, 0)   v2------v3 (0.5, 0)

                rectangle.texCoords[0] = 0.5; rectangle.texCoords[1] = 0.5;
                rectangle.texCoords[2] = 0.0; rectangle.texCoords[3] = 0.5;
                rectangle.texCoords[4] = 0.0; rectangle.texCoords[5] = 0.0;
                rectangle.texCoords[6] = 0.5; rectangle.texCoords[7] = 0.0;
                break;

            case 2:  // 늘어난 텍스처 x=[-1,2], y=[0,1]: y는 정상, x는 3배로 늘어남

            //   (-1,1) v1------v0 (2,1)
            //          |        |
            //          |        |
            //          |        |
            //   (-1,0) v2------v3 (2,0)

                rectangle.texCoords[0] = 2.0; rectangle.texCoords[1] = 1.0;
                rectangle.texCoords[2] = -1.0; rectangle.texCoords[3] = 1.0;
                rectangle.texCoords[4] = -1.0; rectangle.texCoords[5] = 0.0;
                rectangle.texCoords[6] = 2.0; rectangle.texCoords[7] = 0.0;
                break;

            case 3:  // 더 늘어난 텍스처: x=[-1,2], y=[-1,2]: x,y 모두 3배로 늘어남

            //   (-1,2) v1------v0 (2,2)
            //          |        |
            //          |        |
            //          |        |
            //  (-1,-1) v2------v3 (2,-1)

                rectangle.texCoords[0] = 2.0; rectangle.texCoords[1] = 2.0;
                rectangle.texCoords[2] = -1.0; rectangle.texCoords[3] = 2.0;
                rectangle.texCoords[4] = -1.0; rectangle.texCoords[5] = -1.0;
                rectangle.texCoords[6] = 2.0; rectangle.texCoords[7] = -1.0;
                break;
        }
        updateText(textOverlay, "Press space bar. state = " + state);
        rectangle.initBuffers();
        render();
    }
});

function render() {

    // clear canvas
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.enable(gl.DEPTH_TEST);

    // drawing the rectangle
    shader.use();
    shader.setMat4('u_model', modelMatrix);
    shader.setMat4('u_view', viewMatrix);
    shader.setMat4('u_projection', projMatrix);
    rectangle.draw();

    // call the render function the next time for animation
    requestAnimationFrame(render);
}

async function main() {
    try {
        if (!initWebGL()) {
            throw new Error('WebGL 초기화 실패');
        }
        
        await initShader();

        // View transformation matrix (invariant in the program)
        mat4.translate(viewMatrix, viewMatrix, vec3.fromValues(-0.5, -0.5, -2));

        // Projection transformation matrix (invariant in the program)
        mat4.perspective(
            projMatrix,
            glMatrix.toRadian(60),  // field of view (fov, degree)
            canvas.width / canvas.height, // aspect ratio
            0.1, // near
            1000.0 // far
        );

        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, texture);
        shader.setInt('u_texture', 0);
        
        textOverlay = setupText(canvas, "Press space bar. state = " + state, 1);

        // call the render function the first time for animation
        requestAnimationFrame(render);

        return true;

    } catch (error) {
        console.error('Failed to initialize program:', error);
        alert('Failed to initialize program');
        return false;
    }
}

