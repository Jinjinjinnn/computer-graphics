/*--------------------------------------------------------------------------------
22_SpotLight.js

- Viewing a 3D unit cylinder at origin with perspective projection
- Rotating the cylinder by ArcBall interface (by left mouse button dragging)
- Keyboard controls:
    - 'r' to reset arcball
    - 's' to switch to smooth shading
    - 'f' to switch to flat shading
- Applying Texture mapping for computing diffuse reflection 
- Applying SpotLight
----------------------------------------------------------------------------------*/
import { resizeAspectRatio, setupText, updateText, Axes } from '../util/util.js';
import { Shader, readShaderFile } from '../util/shader.js';
import { Cube } from '../util/cube.js';
import { Arcball } from '../util/arcball.js';
import { Cylinder } from '../util/cylinder.js';
import { loadTexture } from '../util/texture.js';

const canvas = document.getElementById('glCanvas');
const gl = canvas.getContext('webgl2');
let shader;
let lampShader;
let textOverlay; 
let textOverlay2;
let textOverlay3;
let textOverlay4;
let textOverlay5;
let textOverlay6;
let isInitialized = false;

let viewMatrix = mat4.create();
let projMatrix = mat4.create();
let modelMatrix = mat4.create();
let lampModelMatrix = mat4.create();
let arcBallMode = 'CAMERA';     // 'CAMERA' or 'MODEL'
let shadingMode = 'SMOOTH';       // 'FLAT' or 'SMOOTH'
const cylinder = new Cylinder(gl, 32);
const lamp = new Cube(gl);
const axes = new Axes(gl, 2.0); // create an Axes object with the length of axis 1.5
const texture = loadTexture(gl, true, '../images/textures/sunrise.jpg');

const cameraPos = vec3.fromValues(0, 0, -3);
const lightSize = vec3.fromValues(0.1, 0.1, 0.1);
const lightPos = vec3.fromValues(1.5, 0.0, 1.0);
const shininess = 16.0;


// Arcball object: initial distance 5.0, rotation sensitivity 2.0, zoom sensitivity 0.0005
// default of rotation sensitivity = 1.5, default of zoom sensitivity = 0.001
const arcball = new Arcball(canvas, 5.0, { rotation: 2.0, zoom: 0.0005 });

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

function setupKeyboardEvents() {
    document.addEventListener('keydown', (event) => {
        if (event.key == 'r') {
            arcball.reset();
            arcBallMode = 'CAMERA';
        }
        else if (event.key == 's') {
            cylinder.copyVertexNormalsToNormals();
            cylinder.updateNormals();
            shadingMode = 'SMOOTH';
            updateText(textOverlay2, "shading mode: " + shadingMode);
            render();
        }
        else if (event.key == 'f') {
            cylinder.copyFaceNormalsToNormals();
            cylinder.updateNormals();
            shadingMode = 'FLAT';
            updateText(textOverlay2, "shading mode: " + shadingMode);
            render();
        }
    });
}

function initWebGL() {
    if (!gl) {
        console.error('WebGL 2 is not supported by your browser.');
        return false;
    }

    canvas.width = 700;
    canvas.height = 700;
    resizeAspectRatio(gl, canvas);
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0.7, 0.8, 0.9, 1.0);
    
    return true;
}

async function initShader() {
    const vertexShaderSource = await readShaderFile('shVert.glsl');
    const fragmentShaderSource = await readShaderFile('shFrag.glsl');
    return new Shader(gl, vertexShaderSource, fragmentShaderSource);
}

async function initLampShader() {
    const vertexShaderSource = await readShaderFile('shLampVert.glsl');
    const fragmentShaderSource = await readShaderFile('shLampFrag.glsl');
    return new Shader(gl, vertexShaderSource, fragmentShaderSource);
}

function render() {
    // clear canvas
    gl.clearColor(0.1, 0.1, 0.1, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.enable(gl.DEPTH_TEST);

    if (arcBallMode == 'CAMERA') {
        viewMatrix = arcball.getViewMatrix();
    }
    else { // arcBallMode == 'MODEL'
        modelMatrix = arcball.getModelRotMatrix();
        viewMatrix = arcball.getViewCamDistanceMatrix();
    }

    // drawing the cylinder
    shader.use();  // using the cylinder's shader
    shader.setMat4('u_model', modelMatrix);
    shader.setMat4('u_view', viewMatrix);
    shader.setVec3('u_viewPos', cameraPos);
    cylinder.draw(shader);

    // drawing the lamp
    lampShader.use();
    lampShader.setMat4('u_view', viewMatrix);
    lamp.draw(lampShader);

    // drawing the axes (using the axes's shader: see util.js)
    axes.draw(viewMatrix, projMatrix);

    // call the render function the next time for animation
    requestAnimationFrame(render);
}

async function main() {
    try {
        if (!initWebGL()) {
            throw new Error('WebGL initialization failed');
        }
        
        // View transformation matrix (camera at cameraPos, invariant in the program)
        mat4.translate(viewMatrix, viewMatrix, cameraPos);

        // Projection transformation matrix (invariant in the program)
        mat4.perspective(
            projMatrix,
            glMatrix.toRadian(60),  // field of view (fov, degree)
            canvas.width / canvas.height, // aspect ratio
            0.1, // near
            100.0 // far
        );

        // creating shaders
        shader = await initShader();
        lampShader = await initLampShader();

        shader.use();
        shader.setMat4("u_projection", projMatrix);
        mat4.scale(modelMatrix, modelMatrix, vec3.fromValues(2.0, 2.0, 2.0));

        // Light properties
        shader.setVec3("light.position", lightPos);  // (1.5, 0.0, 1.0)
        let fromLightPosToOrigin = vec3.create();
        vec3.sub(fromLightPosToOrigin, vec3.fromValues(0, 0, 0), lightPos);
        shader.setVec3("light.direction", fromLightPosToOrigin); // direction of the spotlight
        shader.setFloat("light.cutOff", glMatrix.toRadian(25.5)); // cutoff angle
        shader.setFloat("light.outerCutOff", glMatrix.toRadian(30.5)); // outer cutoff angle
        shader.setVec3("light.ambient", vec3.fromValues(0.1, 0.1, 0.1));
        shader.setVec3("light.diffuse", vec3.fromValues(0.7, 0.7, 0.7));
        shader.setVec3("light.specular", vec3.fromValues(1.0, 1.0, 1.0));
        shader.setFloat("light.constant", 1.0);
        shader.setFloat("light.linear", 0.09);
        shader.setFloat("light.quadratic", 0.032);

        // Material properties
        shader.setInt("material.diffuse", 0);
        shader.setVec3("material.specular", vec3.fromValues(0.8, 0.8, 0.8));
        shader.setFloat("material.shininess", shininess);
        shader.setVec3("u_viewPos", cameraPos);

        // Lamp properties
        lampShader.use();
        lampShader.setMat4("u_projection", projMatrix);
        const lampModelMatrix = mat4.create();
        mat4.translate(lampModelMatrix, lampModelMatrix, lightPos);
        mat4.scale(lampModelMatrix, lampModelMatrix, lightSize);
        lampShader.setMat4('u_model', lampModelMatrix);

        cylinder.copyVertexNormalsToNormals();
        cylinder.updateNormals();

        textOverlay = setupText(canvas, "SPOTLIGHT");
        textOverlay2 = setupText(canvas, "shading mode: " + shadingMode, 2);
        textOverlay3 = setupText(canvas, "press 'r' to reset arcball", 3);
        textOverlay4 = setupText(canvas, "press 's' to switch to smooth shading", 4);
        textOverlay5 = setupText(canvas, "press 'f' to switch to flat shading", 5);
        setupKeyboardEvents();

        // bind the texture to the shader
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, texture);

        // call the render function the first time for animation
        requestAnimationFrame(render);

        return true;

    } catch (error) {
        console.error('Failed to initialize program:', error);
        alert('Failed to initialize program');
        return false;
    }
}

