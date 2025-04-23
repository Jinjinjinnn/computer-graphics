/*-------------------------------------------------------------------------
Homework03.js
---------------------------------------------------------------------------*/
import { resizeAspectRatio, setupText, updateText, Axes } from '../util/util.js';
import { Shader, readShaderFile } from '../util/shader.js';

// Global variables
const canvas = document.getElementById('glCanvas');
const gl = canvas.getContext('webgl2');
let isInitialized = false;  // main이 실행되는 순간 true로 change
let shader;
let vao;
let positionBuffer; // 2D position을 위한 VBO (Vertex Buffer Object)
let textOverlay; // 1st line segment 정보 표시
let textOverlay2; // 2nd line segment 정보 표시
let textOverlay3; // 3rd line segment 정보 표시
let axes = new Axes(gl, 0.85); // x, y axes 그려주는 object (see util.js)

let isDrawingCircle = false; // 원을 그리고 있는지 여부
let circleCenter = null; // 원의 중심
let circleRadius = 0; // 원의 반지름
let circle = null; // 그려진 원의 정보

let isDrawingLine = false; // 선분을 그리고 있는지 여부
let startPoint = null; // 선분의 시작점
let tempEndPoint = null; // 선분의 임시 끝점
let line = null; // 그려진 선분의 정보

let intersectionPoints = []; // intersection points 저장

// DOMContentLoaded event

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

function setupMouseEvents() {
    function handleMouseDown(event) {
        event.preventDefault();
        event.stopPropagation();

        const rect = canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;

        if (!isDrawingCircle && !circle) {
            // 원을 그리기 시작
            let [glX, glY] = convertToWebGLCoordinates(x, y);
            circleCenter = [glX, glY];
            isDrawingCircle = true;
        } else if (!isDrawingLine && !line) {
            // 선분을 그리기 시작
            let [glX, glY] = convertToWebGLCoordinates(x, y);
            startPoint = [glX, glY];
            isDrawingLine = true;
        }
    }

    function handleMouseMove(event) {
        const rect = canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        let [glX, glY] = convertToWebGLCoordinates(x, y);

        if (isDrawingCircle) {
            circleRadius = Math.sqrt(Math.pow(glX - circleCenter[0], 2) + Math.pow(glY - circleCenter[1], 2));
            render();
        } else if (isDrawingLine) {
            tempEndPoint = [glX, glY];
            render();
        }
    }

    function handleMouseUp() {
        if (isDrawingCircle) {
            circle = { center: circleCenter, radius: circleRadius };
            isDrawingCircle = false;
            circleCenter = null;
            circleRadius = 0;
            updateText(textOverlay, "Circle: center (" + circle.center[0].toFixed(2) + ", " + circle.center[1].toFixed(2) +
                ") radius = " + circle.radius.toFixed(2));
            render();
        } else if (isDrawingLine && tempEndPoint) {
            line = { start: startPoint, end: tempEndPoint };
            isDrawingLine = false;
            startPoint = null;
            tempEndPoint = null;
            const lineMessage = "Line segment: (" + line.start[0].toFixed(2) + ", " + line.start[1].toFixed(2) +
                ") ~ (" + line.end[0].toFixed(2) + ", " + line.end[1].toFixed(2) + ")";
            updateText(textOverlay2, lineMessage);

            // 교차점 계산
            intersectionPoints = calculateIntersection(circle, line);
            if (intersectionPoints.length > 0) {
                let intersectionMessage = "Intersection Points: " + intersectionPoints.length;
                intersectionPoints.forEach((point, index) => {
                    intersectionMessage += "\nPoint " + (index + 1) + ": (" + point[0].toFixed(2) + ", " + point[1].toFixed(2) + ")";
                });
                updateText(textOverlay3, intersectionMessage);
            }
            else updateText(textOverlay3, "No intersection");

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
    if (circle) {
        drawCircle(circle.center, circle.radius, [1.0, 0.0, 1.0, 1.0]); // 완성된 원은 Magenta
    } else if (isDrawingCircle && circleCenter) {
        drawCircle(circleCenter, circleRadius, [0.5, 0.5, 0.5, 1.0]); // 임시 원은 회색
    }

    // 선분 그리기
    if (line) {
        shader.setVec4("u_color", [0.7, 0.7, 1.0, 1.0]); // 완성된 선분은 옅은 blue
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([...line.start, ...line.end]), gl.STATIC_DRAW);
        gl.bindVertexArray(vao);
        gl.drawArrays(gl.LINES, 0, 2);
    } else if (isDrawingLine && startPoint && tempEndPoint) {
        shader.setVec4("u_color", [0.5, 0.5, 0.5, 1.0]); // 임시 선분은 회색
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([...startPoint, ...tempEndPoint]), gl.STATIC_DRAW);
        gl.bindVertexArray(vao);
        gl.drawArrays(gl.LINES, 0, 2);
    }

    // intersection points 그리기
    if (intersectionPoints.length > 0) {
        shader.setVec4("u_color", [1.0, 1.0, 0.0, 1.0]); // 노란색
        intersectionPoints.forEach(point => {
            drawPoint(point);
        });
    }

    // axes 그리기
    axes.draw(mat4.create(), mat4.create());
}

function drawCircle(center, radius, color) {
    const numSegments = 100;
    const angleStep = (2 * Math.PI) / numSegments;
    const circleVertices = [];

    for (let i = 0; i <= numSegments; i++) {
        const angle = i * angleStep;
        const x = center[0] + radius * Math.cos(angle);
        const y = center[1] + radius * Math.sin(angle);
        circleVertices.push(x, y);
    }

    shader.setVec4("u_color", color);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(circleVertices), gl.STATIC_DRAW);
    gl.bindVertexArray(vao);
    gl.drawArrays(gl.LINE_LOOP, 0, numSegments + 1);
}

function drawPoint(point) {
    const pointSize = 5.0; // 점의 크기
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(point), gl.STATIC_DRAW);
    gl.bindVertexArray(vao);
    gl.drawArrays(gl.POINTS, 0, 1);
}

function calculateIntersection(circle, line) {
    const [cx, cy] = circle.center;
    const r = circle.radius;
    const [x1, y1] = line.start;
    const [x2, y2] = line.end;

    const dx = x2 - x1;
    const dy = y2 - y1;
    const A = dx * dx + dy * dy;
    const B = 2 * (dx * (x1 - cx) + dy * (y1 - cy));
    const C = (x1 - cx) * (x1 - cx) + (y1 - cy) * (y1 - cy) - r * r;

    const det = B * B - 4 * A * C;  // 판별식
    if (A <= 0.0000001 || det < 0) {
        return []; // 교차점이 없음
    } else if (det === 0) {
        // One intersection
        const t = -B / (2 * A);
        const ix = x1 + t * dx;
        const iy = y1 + t * dy;
        return [[ix, iy]];
    } else {
        // Two intersections
        const t1 = (-B + Math.sqrt(det)) / (2 * A);
        const t2 = (-B - Math.sqrt(det)) / (2 * A);
        const intersections = [];
        if (t1 >= 0 && t1 <= 1) {
            intersections.push([x1 + t1 * dx, y1 + t1 * dy]);
        }
        if (t2 >= 0 && t2 <= 1) {
            intersections.push([x1 + t2 * dx, y1 + t2 * dy]);
        }
        return intersections;
    }
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
