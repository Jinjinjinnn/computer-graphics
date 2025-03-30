
import { resizeAspectRatio, setupText, updateText, Axes } from '../util/util.js';
import { Shader, readShaderFile } from '../util/shader.js';

// Global variables
const canvas = document.getElementById('glCanvas');
const gl = canvas.getContext('webgl2');
let isInitialized = false;  // main이 실행되는 순간 true로 change
let shader;
let vao;
let positionBuffer; // 2D position을 위한 VBO (Vertex Buffer Object)

// Circle
let isDrawingC = false;
let centerPoint = null;
let radiusPoint = null;
let circlePoints = [];

// Line
let isDrawing = false; // mouse button을 누르고 있는 동안 true로 change
let startPoint = null;  // mouse button을 누른 위치
let tempEndPoint = null; // mouse를 움직이는 동안의 위치
let linePoints = null; // 그려진 선분들을 저장하는 array

// Intersection
let circleInfo = null;
let intersections = [];

// Info on screen
let textOverlay; // Circle 정보 표시
let textOverlay2; // line segment 정보 표시
let textOverlay3;
let axes = new Axes(gl, 0.85); // x, y axes 그려주는 object (see util.js)

// DOMContentLoaded event
// 1) 모든 HTML 문서가 완전히 load되고 parsing된 후 발생
// 2) 모든 resource (images, css, js 등) 가 완전히 load된 후 발생
// 3) 모든 DOM 요소가 생성된 후 발생
// DOM: Document Object Model로 HTML의 tree 구조로 표현되는 object model 
// 모든 code를 이 listener 안에 넣는 것은 mouse click event를 원활하게 처리하기 위해서임
// mouse input을 사용할 때 이와 같이 main을 call 한다. 

document.addEventListener('DOMContentLoaded', () => {
    if (isInitialized) { // true인 경우는 main이 이미 실행되었다는 뜻이므로 다시 실행하지 않음
        console.log("Already initialized");
        return;
    }

    main().then(success => { // call main function
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

function setupBuffers() {
    vao = gl.createVertexArray();
    gl.bindVertexArray(vao);

    positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

    shader.setAttribPointer('a_position', 2, gl.FLOAT, false, 0, 0); // x, y 2D 좌표

    gl.bindVertexArray(null);
}

// 좌표 변환 함수: 캔버스 좌표를 WebGL 좌표로 변환
// 캔버스 좌표: 캔버스 좌측 상단이 (0, 0), 우측 하단이 (canvas.width, canvas.height)
// WebGL 좌표 (NDC): 캔버스 좌측 하단이 (-1, -1), 우측 상단이 (1, 1)
function convertToWebGLCoordinates(x, y) {
    return [
        (x / canvas.width) * 2 - 1,  // x/canvas.width 는 0 ~ 1 사이의 값, 이것을 * 2 - 1 하면 -1 ~ 1 사이의 값
        -((y / canvas.height) * 2 - 1) // y canvas 좌표는 상하를 뒤집어 주어야 하므로 -1을 곱함
    ];
}

/* 
    browser window
    +----------------------------------------+
    | toolbar, address bar, etc.             |
    +----------------------------------------+
    | browser viewport (컨텐츠 표시 영역)       | 
    | +------------------------------------+ |
    | |                                    | |
    | |    canvas                          | |
    | |    +----------------+              | |
    | |    |                |              | |
    | |    |      *         |              | |
    | |    |                |              | |
    | |    +----------------+              | |
    | |                                    | |
    | +------------------------------------+ |
    +----------------------------------------+

    *: mouse click position

    event.clientX = browser viewport 왼쪽 경계에서 마우스 클릭 위치까지의 거리
    event.clientY = browser viewport 상단 경계에서 마우스 클릭 위치까지의 거리
    rect.left = browser viewport 왼쪽 경계에서 canvas 왼쪽 경계까지의 거리
    rect.top = browser viewport 상단 경계에서 canvas 상단 경계까지의 거리

    x = event.clientX - rect.left  // canvas 내에서의 클릭 x 좌표
    y = event.clientY - rect.top   // canvas 내에서의 클릭 y 좌표
*/

function calculateCirclePoints(center, radius) {
    const points = [];
    const numPoints = 100;
    for (let i = 0; i <= numPoints; i++) {
        const angle = (i/numPoints) * 2 * Math.PI;
        const x = center[0] + radius * Math.cos(angle);
        const y = center[1] + radius * Math.sin(angle);
        points.push(x,y);
    }

    return points;
}

function isPointOnLineSegment(x1, y1, x2, y2, px, py) {
    // 점이 선분 위에 있는지 확인
    const d1 = Math.sqrt(Math.pow(px - x1, 2) + Math.pow(py - y1, 2));
    const d2 = Math.sqrt(Math.pow(px - x2, 2) + Math.pow(py - y2, 2));
    const lineLength = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
    
    // 부동소수점 오차를 고려한 비교
    const epsilon = 0.0001;
    return Math.abs(d1 + d2 - lineLength) < epsilon;
}

function calculateIntersectionPoints(circleInfo, linePoints) {
    const centerX = circleInfo[0];
    const centerY = circleInfo[1];
    const radius = circleInfo[2];

    const x1 = linePoints[0];
    const y1 = linePoints[1];
    const x2 = linePoints[2];
    const y2 = linePoints[3];

    // 선분 방정식
    const m = (y2-y1) / (x2-x1);
    const b = y1 - m * x1;

    // 원 - 선 방정식 연립: At^2 + Bt + C = 0
    const A = 1 + m*m;
    const B = 2 * (m * b - m * centerY - centerX);
    const C = centerX * centerX + (b - centerY) * (b - centerY) - radius * radius;

    // 판별식
    const disc = B*B - 4 * A * C;

    if (disc < 0)
        return null;

    // Intersection Points
    const intX1 = (-B + Math.sqrt(disc)) / (2 * A);
    const intX2 = (-B - Math.sqrt(disc)) / (2 * A);
    const intY1 = m * intX1 + b;
    const intY2 = m * intX2 + b;

    // 선분 위의 점인지 판별
    const intePoints = [];
    if (isPointOnLineSegment(x1, y1, x2, y2, intX1, intY1)) {
        intePoints.push(intX1, intY1);
    }
    if (isPointOnLineSegment(x1, y1, x2, y2, intX2, intY2)) {
        intePoints.push(intX2, intY2);
    }
    return intePoints;
}

function setupMouseEvents() {
    function handleMouseDown(event) {
        event.preventDefault(); // 이미 존재할 수 있는 기본 동작을 방지
        event.stopPropagation(); // event가 상위 요소 (div, body, html 등)으로 전파되지 않도록 방지

        const rect = canvas.getBoundingClientRect(); // canvas를 나타내는 rect 객체를 반환
        const x = event.clientX - rect.left;  // canvas 내 x 좌표
        const y = event.clientY - rect.top;   // canvas 내 y 좌표
        let [glX, glY] = convertToWebGLCoordinates(x, y);
        
        if (!isDrawingC && circlePoints.length === 0) { 
            centerPoint = [glX, glY];
            isDrawingC = true;
        }

        else if (!isDrawing && circlePoints.length > 0) {
            // 원은 있고 선분은 아직 없을 때
            startPoint = [glX, glY];
            isDrawing = true;
        }
    }

    function handleMouseMove(event) {
        if (isDrawingC && centerPoint) {
            const rect = canvas.getBoundingClientRect();
            const x = event.clientX - rect.left;
            const y = event.clientY - rect.top;
            
            let [glX, glY] = convertToWebGLCoordinates(x, y);
            radiusPoint = [glX, glY];
    
            // Radius
            const radius = Math.sqrt(
                Math.pow(radiusPoint[0] - centerPoint[0], 2) +
                Math.pow(radiusPoint[1] - centerPoint[1], 2)
            );
    
            // Circle
            circlePoints = calculateCirclePoints(centerPoint, radius);
            render();
        }
        // 선분 그리기
        else if (isDrawing && startPoint) {
            const rect = canvas.getBoundingClientRect();
            const x = event.clientX - rect.left;
            const y = event.clientY - rect.top;
            
            let [glX, glY] = convertToWebGLCoordinates(x, y);
            tempEndPoint = [glX, glY];
            render();
        }
    }

    function handleMouseUp() {
        if (isDrawingC && radiusPoint) {
            const radius = Math.sqrt(
                Math.pow(radiusPoint[0] - centerPoint[0], 2) +
                Math.pow(radiusPoint[1] - centerPoint[1], 2)
            );
            circleInfo = [...centerPoint, radius]
            isDrawingC = false;
            updateText(textOverlay, "Circle: center (" + centerPoint[0].toFixed(2) + ", " + 
                centerPoint[1].toFixed(2) + ") radius = " + radius.toFixed(2));
            render();
        }
        else if (isDrawing && tempEndPoint) {
            linePoints = [...startPoint, ...tempEndPoint];
            intersections = calculateIntersectionPoints(circleInfo, linePoints);
            isDrawing = false;
            updateText(textOverlay2, "Line: (" + startPoint[0].toFixed(2) + ", " + 
                startPoint[1].toFixed(2) + ") ~ (" + tempEndPoint[0].toFixed(2) + 
                ", " + tempEndPoint[1].toFixed(2) + ")");

            if (intersections.length === 4) {
                updateText(textOverlay3, "Intersection Points: " + intersections.length/2 + " Point 1: (" + 
                    intersections[0].toFixed(2) + ", " + intersections[1].toFixed(2) + ") Point 2: (" + 
                    intersections[2].toFixed(2) + ", " + intersections[3].toFixed(2) + ")");
            } 
            else if (intersections.length === 2) {
                updateText(textOverlay3, "Intersection Points: " + intersections.length/2 + " Point 1: (" + 
                    intersections[0].toFixed(2) + ", " + intersections[1].toFixed(2) + ")");
            } 
            else if (intersections.length < 2) {
                updateText(textOverlay3, "No intersection");
            }

            render();
        }
    }

    canvas.addEventListener("mousedown", handleMouseDown);
    canvas.addEventListener("mousemove", handleMouseMove);
    canvas.addEventListener("mouseup", handleMouseUp);
}

function render() {
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    shader.use();

    // 원 그리기
    if (circlePoints.length > 0) {
        shader.setVec4("u_color", [0.6, 0.0, 0.4, 1.0]);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(circlePoints), gl.STATIC_DRAW);
        gl.bindVertexArray(vao);
        gl.drawArrays(gl.LINE_STRIP, 0, circlePoints.length/2);
    }
    
    // 저장된 선분 그리기
    if (linePoints) {
        shader.setVec4("u_color", [0.0, 0.5, 0.5, 1.0]);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(linePoints), gl.STATIC_DRAW);
        gl.bindVertexArray(vao);
        gl.drawArrays(gl.LINES, 0, 2);
    }

    // 교차점 그리기
    if (intersections) {
        shader.setVec4("u_color", [1.0, 1.0, 0.0, 1.0]);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(intersections), gl.STATIC_DRAW);
        gl.bindVertexArray(vao);
        gl. drawArrays(gl.POINTS, 0, intersections.length/2);
    }

    // 임시 원 그리기
    if (isDrawingC && circlePoints.length > 0) {
        shader.setVec4("u_color", [0.5, 0.5, 0.5, 1.0]); // 임시 선분의 color는 회색
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(circlePoints), gl.STATIC_DRAW);
        gl.bindVertexArray(vao);
        gl.drawArrays(gl.LINE_STRIP, 0, circlePoints.length/2);
    }
    // 임시 선 그리기
    if (isDrawing && startPoint && tempEndPoint) {
        shader.setVec4("u_color", [0.5, 0.5, 0.5, 1.0]); // 임시 선분의 color는 회색
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([...startPoint, ...tempEndPoint]), 
                      gl.STATIC_DRAW);
        gl.bindVertexArray(vao);
        gl.drawArrays(gl.LINES, 0, 2);
    }

    // axes 그리기
    axes.draw(mat4.create(), mat4.create()); // 두 개의 identity matrix를 parameter로 전달
}

async function initShader() {
    const vertexShaderSource = await readShaderFile('shVert.glsl');
    const fragmentShaderSource = await readShaderFile('shFrag.glsl');
    shader = new Shader(gl, vertexShaderSource, fragmentShaderSource);
}

async function main() {
    try {
        if (!initWebGL()) {
            throw new Error('WebGL 초기화 실패');
            return false; 
        }

        // 셰이더 초기화
        await initShader();
        
        // 나머지 초기화
        setupBuffers();
        shader.use();

        // 텍스트 초기화
        textOverlay = setupText(canvas, "", 1);
        textOverlay2 = setupText(canvas, "", 2);
        textOverlay3 = setupText(canvas, "", 3);
        
        // 마우스 이벤트 설정
        setupMouseEvents();
        
        // 초기 렌더링
        render();

        return true;
        
    } catch (error) {
        console.error('Failed to initialize program:', error);
        alert('프로그램 초기화에 실패했습니다.');
        return false;
    }
}