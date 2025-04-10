/*--------------------------------------------------------------------------------
23_MultipleLights.js

- Viewing a 3D unit cylinder and two cubes with perspective projection
- Smooth shading for the cylinder, and flat shading for the cubes
- Control the view of the scene by ArcBall interface (by left mouse button dragging)
- Keyboard controls:
    - 'r' to reset arcball
- Applying Texture mapping to the cylinder and cubes
- Applying Multiple Lights to the scene 
     (one directional light, three point lights, one spot light)
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
let isInitialized = false;

let viewMatrix = mat4.create();
let projMatrix = mat4.create();
let modelMatrix = mat4.create();
let lampModelMatrix = mat4.create();

const cylinder = new Cylinder(gl, 32);
const cube = [new Cube(gl), new Cube(gl), new Cube(gl)];
const cubePos = [
    vec3.fromValues(0.8, 0.5, -2.0), 
    vec3.fromValues(1.3, -0,3, -3.0), 
    vec3.fromValues(-3.0, 2.0, 2.0)
];
const cubeScale = [
    vec3.fromValues(0.7, 0.7, 0.7),
    vec3.fromValues(1.4, 0.4, 0.7),
    vec3.fromValues(0.5, 2.2, 1.2)
];

const axes = new Axes(gl, 2.0); // create an Axes object with the length of axis 1.5

const diffuseMap = loadTexture(gl, true, '../images/textures/woodWall3.png');
const cameraPos = vec3.fromValues(0, 0, -3);

const lampPoint = [new Cube(gl), new Cube(gl), new Cube(gl)]; // cube lamp for 3 point lights
const lampSpot = new Cube(gl); // cube lamp for spotLight    
const lightDirDirection = vec3.fromValues(-0.1, 0.0, 0.2);
const lightPosPoint = [
    vec3.fromValues(0.7, 1.2, 0.5), 
    vec3.fromValues(1.3, -1,3, -1.0), 
    vec3.fromValues(-0.1, 3.0, -0.2)
];
const lightPosSpot = vec3.fromValues(-1.0, 0.0, 1.5)
const lightSize = vec3.fromValues(0.1, 0.1, 0.1);
const lightColorPoint = vec3.fromValues(1.0, 1.0, 1.0);
const lightColorSpot = vec3.fromValues(1.0, 1.0, 0.0);
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
    gl.clearColor(0.1, 0.2, 0.3, 1.0);
    
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
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.enable(gl.DEPTH_TEST);

    viewMatrix = arcball.getViewMatrix();

    // drawing the cylinder
    shader.use(); 
    mat4.identity(modelMatrix);
    mat4.scale(modelMatrix, modelMatrix, vec3.fromValues(1.5, 1.5, 1.5));
    shader.setMat4('u_model', modelMatrix);
    shader.setMat4('u_view', viewMatrix);
    shader.setVec3('u_viewPos', cameraPos);
    cylinder.draw(shader);

    // drawing the cubes
    for (let i = 0; i < 3; i++) {
        mat4.identity(modelMatrix);
        mat4.translate(modelMatrix, modelMatrix, cubePos[i]);
        mat4.scale(modelMatrix, modelMatrix, cubeScale[i]);
        shader.setMat4('u_model', modelMatrix);
        cube[i].draw(shader);
    }

    // drawing the lamps
    lampShader.use();
    lampShader.setMat4('u_view', viewMatrix);
    for (let i = 0; i < 3; i++) {
        mat4.identity(lampModelMatrix);
        mat4.translate(lampModelMatrix, lampModelMatrix, lightPosPoint[i]);
        mat4.scale(lampModelMatrix, lampModelMatrix, lightSize);
        lampShader.setMat4('u_model', lampModelMatrix);
        lampShader.setVec3('u_color', lightColorPoint);
        lampPoint[i].draw(lampShader);
    }
    mat4.identity(lampModelMatrix);
    mat4.translate(lampModelMatrix, lampModelMatrix, lightPosSpot);
    mat4.scale(lampModelMatrix, lampModelMatrix, lightSize);
    lampShader.setMat4('u_model', lampModelMatrix);
    lampShader.setVec3('u_color', lightColorSpot);
    lampSpot.draw(lampShader);

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

        // Pass the uniform variables to the shader
        shader.use();
        shader.setMat4("u_projection", projMatrix);
        shader.setVec3("u_viewPos", cameraPos);

        // Material properties
        shader.setInt("material.diffuse", 0);  // diffuse map
        shader.setVec3("material.specular", vec3.fromValues(0.8, 0.8, 0.8));
        shader.setFloat("material.shininess", shininess);
        // bind the texture to the shader
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, diffuseMap);

        // directional light
        shader.setVec3("dirLight.direction", lightDirDirection);
        shader.setVec3("dirLight.ambient", 0.05, 0.05, 0.05);
        shader.setVec3("dirLight.diffuse", 0.3, 0.3, 0.3);
        shader.setVec3("dirLight.specular", 0.5, 0.5, 0.5);

        // point light 0
        shader.setVec3("pointLights[0].position", lightPosPoint[0]);
        shader.setVec3("pointLights[0].ambient", 0.05, 0.05, 0.05);
        shader.setVec3("pointLights[0].diffuse", 0.8, 0.8, 0.8);
        shader.setVec3("pointLights[0].specular", 1.0, 1.0, 1.0);
        shader.setFloat("pointLights[0].constant", 1.0);
        shader.setFloat("pointLights[0].linear", 0.09);
        shader.setFloat("pointLights[0].quadratic", 0.032);

        // point light 1
        shader.setVec3("pointLights[1].position", lightPosPoint[1]);
        shader.setVec3("pointLights[1].ambient", 0.05, 0.05, 0.05);
        shader.setVec3("pointLights[1].diffuse", 0.8, 0.8, 0.8);
        shader.setVec3("pointLights[1].specular", 1.0, 1.0, 1.0);
        shader.setFloat("pointLights[1].constant", 1.0);
        shader.setFloat("pointLights[1].linear", 0.09);
        shader.setFloat("pointLights[1].quadratic", 0.032);

        // point light 2
        shader.setVec3("pointLights[2].position", lightPosPoint[2]);
        shader.setVec3("pointLights[2].ambient", 0.05, 0.05, 0.05);
        shader.setVec3("pointLights[2].diffuse", 0.8, 0.8, 0.8);
        shader.setVec3("pointLights[2].specular", 1.0, 1.0, 1.0);
        shader.setFloat("pointLights[2].constant", 1.0);
        shader.setFloat("pointLights[2].linear", 0.09);
        shader.setFloat("pointLights[2].quadratic", 0.032);

        // Light properties
        shader.setVec3("spotLight.position", lightPosSpot);
        let fromSpotLightToOrigin = vec3.create();
        vec3.sub(fromSpotLightToOrigin, vec3.fromValues(0, 0, 0), lightPosSpot);
        shader.setVec3("spotLight.direction", fromSpotLightToOrigin);
        shader.setVec3("spotLight.ambient", vec3.fromValues(0.1, 0.1, 0.1));
        shader.setVec3("spotLight.diffuse", vec3.fromValues(0.6, 0.6, 0.6));
        shader.setVec3("spotLight.specular", vec3.fromValues(0.8, 0.8, 0.8));
        shader.setFloat("spotLight.constant", 1.0);
        shader.setFloat("spotLight.linear", 0.09);
        shader.setFloat("spotLight.quadratic", 0.032);
        shader.setFloat("spotLight.cutOff", glMatrix.toRadian(15.5));
        shader.setFloat("spotLight.outerCutOff", glMatrix.toRadian(20.5));

        // Lamp properties
        lampShader.use();
        lampShader.setMat4("u_projection", projMatrix);


        cylinder.copyVertexNormalsToNormals();
        cylinder.updateNormals();

        textOverlay = setupText(canvas, "LIGHTING WITH MULTIPLE LIGHTS");
        textOverlay2 = setupText(canvas, "press 'r' to reset arcball", 2);

        setupKeyboardEvents();

        // call the render function the first time for animation
        requestAnimationFrame(render);

        return true;

    } catch (error) {
        console.error('Failed to initialize program:', error);
        alert('Failed to initialize program');
        return false;
    }
}

