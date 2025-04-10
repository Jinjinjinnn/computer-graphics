/*-----------------------------------------------------------------------------
class squarePyramid

1) Vertex positions
    A square pyramid has 5 faces: 4 triangular faces and 1 square base.
    The total number of vertices is 16 (4 triangular faces * 3 verts + 1 square base * 4 verts)
    So, vertices need 48 floats (16 * 3 (x, y, z)) in the vertices array

2) Vertex indices
    Vertex indices of the square pyramid is as follows:
          v0
        /  \ \ 
      v4---\-v3
     /      \ / 
    v1------v2

    The order of faces and their vertex indices is as follows:
        front (0,1,2), right (0,2,3), back (0,3,4), left (0,4,1), 
        bottom (1,2,3,4)
    Note that each triangular face has one triangle, and the square base has two triangles,
    so the total number of triangles is 6 (4 triangular faces + 1 square base * 2 triangles)
    And, we need to maintain the order of vertices for each triangle as 
    counterclockwise (when we see the face from the outside of the pyramid):
        front [(0,1,2)]
        right [(0,2,3)]
        back [(0,3,4)]
        left [(0,4,1)]
        bottom [(1,2,3), (3,4,1)]

3) Vertex normals
    Each vertex in the same face has the same normal vector (flat shading)
    The vertex normal vector is the same as the face normal vector
    front face: (0,0.707,0.707), right face: (0.707,0.707,0), 
    back face: (0,0.707,-0.707), left face: (-0.707,0.707,0), 
    bottom face: (0,-1,0)

4) Vertex colors
    Each vertex in the same face has the same color (flat shading)
    The color is the same as the face color
    front face: red (1,0,0,1), right face: yellow (1,1,0,1), 
    back face: magenta (1,0,1,1), left face: cyan (0,1,1,1), 
    bottom face: blue (0,0,1,1)

5) Vertex texture coordinates
    Each vertex in the same face has the same texture coordinates (flat shading)
    The texture coordinates are the same as the face texture coordinates
    front face: v0(1,1), v1(0,1), v2(0,0), v3(1,0)
    right face: v0(0,1), v3(0,0), v4(1,0), v5(1,1)
    top face: v0(1,0), v5(0,0), v6(0,1), v1(1,1)
    left face: v1(1,0), v6(0,0), v7(0,1), v2(1,1)
    bottom face: v7(0,0), v4(0,1), v3(1,1), v2(1,0)
    back face: v4(0,0), v7(0,1), v6(1,1), v5(1,0)

5) Parameters:
    1] gl: WebGLRenderingContext
    2] options:
        -  color: array of 4 floats (default: [0.8, 0.8, 0.8, 1.0 ])
           in this case, all vertices have the same given color
           ex) const pyramid = new squarePyramid(gl, {color: [1.0, 0.0, 0.0, 1.0]}); (all red)

6) Vertex shader: the location (0: position attrib (vec3), 1: normal attrib (vec3),
                            2: color attrib (vec4))
7) Fragment shader: should catch the vertex color from the vertex shader
-----------------------------------------------------------------------------*/

export class squarePyramid {
    constructor(gl, options = {}) {
        this.gl = gl;
        
        // Creating VAO and buffers
        this.vao = gl.createVertexArray();
        this.vbo = gl.createBuffer();
        this.ebo = gl.createBuffer();

        // Initializing data
        this.vertices = new Float32Array([
            // front face  (v0,v1,v2)
            0.0, 1.0, 0.0,   -0.5, 0.0, 0.5,   0.5, 0.0,  0.5,
            // right face  (v0,v2,v3)
            0.0, 1.0, 0.0,   0.5, 0.0, 0.5,   0.5, 0.0, -0.5,
            // back face   (v0,v3,v4)
            0.0, 1.0, 0.0,   0.5, 0.0, -0.5,   -0.5, 0.0, -0.5,
            // left face   (v0,v1,v4)
            0.0, 1.0, 0.0,   -0.5, 0.0, -0.5,   -0.5, 0.0, 0.5,
            // bottom face (v1,v2,v3,v4)
            -0.5, 0.0, 0.5,   0.5, 0.0, 0.5,   0.5, 0.0, -0.5,  -0.5, 0.0, -0.5
        ]);

        this.normals = new Float32Array([
            // front face normal (0, 0.707, 0.707)
            0.0,  0.707,  0.707,
            0.0,  0.707,  0.707,
            0.0,  0.707,  0.707,
            // right face normal (0.707, 0.707, 0)
            0.707,  0.707,  0.0,
            0.707,  0.707,  0.0,
            0.707,  0.707,  0.0,
            // back face normal (0, 0.707, -0.707)
            0.0,  0.707, -0.707,
            0.0,  0.707, -0.707,
            0.0,  0.707, -0.707,
            // left face normal (-0.707, 0.707, 0)
           -0.707,  0.707,  0.0,
           -0.707,  0.707,  0.0,
           -0.707,  0.707,  0.0,
            // bottom face normal (0, -1, 0)
            0.0, -1.0, 0.0,
            0.0, -1.0, 0.0,
            0.0, -1.0, 0.0,
            0.0, -1.0, 0.0,
            0.0, -1.0, 0.0,
            0.0, -1.0, 0.0
        ]);

        // if color is provided, set all vertices' color to the given color
        if (options.color) {
            for (let i = 0; i < 16 * 4; i += 4) {
                this.colors[i] = options.color[0];
                this.colors[i+1] = options.color[1];
                this.colors[i+2] = options.color[2];
                this.colors[i+3] = options.color[3];
            }
        }
        else {
            this.colors = new Float32Array([
            // front face  (v0,v1,v2)
            1.0, 0.0, 0.0, 1.0,  1.0, 0.0, 0.0, 1.0,  1.0, 0.0, 0.0, 1.0,
            // right face  (v0,v2,v3)
            1.0, 1.0, 0.0, 1.0,  1.0, 1.0, 0.0, 1.0,  1.0, 1.0, 0.0, 1.0,
            // back face   (v0,v3,v4)
            1.0, 0.0, 1.0, 1.0,  1.0, 0.0, 1.0, 1.0,  1.0, 0.0, 1.0, 1.0,
            // left face   (v0,v1,v4)
            0.0, 1.0, 1.0, 1.0,  0.0, 1.0, 1.0, 1.0,  0.0, 1.0, 1.0, 1.0,
            // bottom face (v1,v2,v3,v4)
            1.0, 0.0, 1.0, 1.0,  1.0, 0.0, 1.0, 1.0,  1.0, 0.0, 1.0, 1.0,
            ]);
        }

        this.indices = new Uint16Array([
            0, 1, 2,    // front
            3, 4, 5,    // right
            6, 7, 8,    // back
            9,10,11,    // left
            12,13,14,   // bottom1
            15,16,17    // bottom2
        ]);

        this.initBuffers();
    }

    initBuffers() {
        const gl = this.gl;
        const vSize = this.vertices.byteLength;
        const nSize = this.normals.byteLength;
        const cSize = this.colors.byteLength;
        const totalSize = vSize + nSize + cSize;

        gl.bindVertexArray(this.vao);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo);
        gl.bufferData(gl.ARRAY_BUFFER, totalSize, gl.STATIC_DRAW);
        gl.bufferSubData(gl.ARRAY_BUFFER, 0, this.vertices);
        gl.bufferSubData(gl.ARRAY_BUFFER, vSize, this.normals);
        gl.bufferSubData(gl.ARRAY_BUFFER, vSize + nSize, this.colors);

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.ebo);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, this.indices, gl.STATIC_DRAW);

        gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 0, 0);               // position
        gl.vertexAttribPointer(1, 3, gl.FLOAT, false, 0, vSize);            // normal
        gl.vertexAttribPointer(2, 4, gl.FLOAT, false, 0, vSize + nSize);    // color

        gl.enableVertexAttribArray(0);
        gl.enableVertexAttribArray(1);
        gl.enableVertexAttribArray(2);

        gl.bindBuffer(gl.ARRAY_BUFFER, null);
        gl.bindVertexArray(null);
    }

    updateNormals() {
        const gl = this.gl;
        const vSize = this.vertices.byteLength;

        gl.bindVertexArray(this.vao);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo);
        
        // only normals data update
        gl.bufferSubData(gl.ARRAY_BUFFER, vSize, this.normals);
        
        gl.bindBuffer(gl.ARRAY_BUFFER, null);
        gl.bindVertexArray(null);
    }

    draw(shader) {

        const gl = this.gl;
        shader.use();
        gl.bindVertexArray(this.vao);
        gl.drawElements(gl.TRIANGLES, 18, gl.UNSIGNED_SHORT, 0);
        gl.bindVertexArray(null);
    }

    delete() {
        const gl = this.gl;
        gl.deleteBuffer(this.vbo);
        gl.deleteBuffer(this.ebo);
        gl.deleteVertexArray(this.vao);
    }
} 