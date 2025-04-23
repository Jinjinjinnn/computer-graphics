/*-----------------------------------------------------------------------------
class SquarePyramid

1) Vertex positions
    A square pyramid has 5 vertices, 1 at the top and 4 at the base
    The pyramid has 5 faces - 4 triangular faces and 1 square base
    Total of 16 vertices needed (4 triangular faces * 3 vertices + 1 square face * 4 vertices)

2) Vertex indices
    Vertex indices of the square pyramid:
          v0
          /\
         /  \
        /    \
       /      \
      v1------v2
     /|       /|
    v4-------v3

    The order of faces and their vertex indices is as follows:
    front face (v0,v1,v2), right face (v0,v2,v3), 
    back face (v0,v3,v4), left face (v0,v4,v1),
    bottom face (v1,v4,v3,v2)

3) Vertex normals
    Each vertex in the same face has the same normal vector (flat shading)
    The vertex normal vector is the same as the face normal vector

4) Vertex colors
    Each vertex in the same face has the same color (flat shading)
    front face: red (1,0,0,1), right face: yellow (1,1,0,1), 
    back face: magenta (1,0,1,1), left face: cyan (0,1,1,1), 
    bottom face: blue (0,0,1,1)

5) Vertex texture coordinates
    Each vertex in the same face has the same texture coordinates (flat shading)
-----------------------------------------------------------------------------*/

export class SquarePyramid {
    constructor(gl, options = {}) {
        this.gl = gl;
        
        // Creating VAO and buffers
        this.vao = gl.createVertexArray();
        this.vbo = gl.createBuffer();
        this.ebo = gl.createBuffer();

        // Base dimensions - can be adjusted from options
        const baseWidth = options.baseWidth || 1.0;
        const baseDepth = options.baseDepth || 1.0;
        const height = options.height || 1.0;
        
        // Calculate half dimensions for convenience
        const halfWidth = baseWidth / 2;
        const halfDepth = baseDepth / 2;
        
        // Initializing vertex data - 16 vertices (3 coordinates each)
        this.vertices = new Float32Array([
            // Front face (v0,v1,v2) - Triangle
            0, height, 0,  -halfWidth, 0, halfDepth,  halfWidth, 0, halfDepth,
            
            // Right face (v0,v2,v3) - Triangle
            0, height, 0,  halfWidth, 0, halfDepth,  halfWidth, 0, -halfDepth,
            
            // Back face (v0,v3,v4) - Triangle
            0, height, 0,  halfWidth, 0, -halfDepth,  -halfWidth, 0, -halfDepth,
            
            // Left face (v0,v4,v1) - Triangle
            0, height, 0,  -halfWidth, 0, -halfDepth,  -halfWidth, 0, halfDepth,
            
            // Bottom face (v1,v4,v3,v2) - Square
            -halfWidth, 0, halfDepth,  -halfWidth, 0, -halfDepth,  
            halfWidth, 0, -halfDepth,  halfWidth, 0, halfDepth
        ]);

        // Calculate normals for each face
        // For each triangular face, compute cross product of two edges
        
        // Front face normal
        const frontNormal = this.calculateNormal(
            [0, height, 0], 
            [-halfWidth, 0, halfDepth], 
            [halfWidth, 0, halfDepth]
        );
        
        // Right face normal
        const rightNormal = this.calculateNormal(
            [0, height, 0], 
            [halfWidth, 0, halfDepth], 
            [halfWidth, 0, -halfDepth]
        );
        
        // Back face normal
        const backNormal = this.calculateNormal(
            [0, height, 0], 
            [halfWidth, 0, -halfDepth], 
            [-halfWidth, 0, -halfDepth]
        );
        
        // Left face normal
        const leftNormal = this.calculateNormal(
            [0, height, 0], 
            [-halfWidth, 0, -halfDepth], 
            [-halfWidth, 0, halfDepth]
        );
        
        // Bottom face normal (pointing downward)
        const bottomNormal = [0, -1, 0];

        // Normals for all vertices - repeat the normal for each vertex in a face
        this.normals = new Float32Array([
            // Front face - 3 vertices
            ...frontNormal, ...frontNormal, ...frontNormal,
            
            // Right face - 3 vertices
            ...rightNormal, ...rightNormal, ...rightNormal,
            
            // Back face - 3 vertices
            ...backNormal, ...backNormal, ...backNormal,
            
            // Left face - 3 vertices
            ...leftNormal, ...leftNormal, ...leftNormal,
            
            // Bottom face - 4 vertices
            ...bottomNormal, ...bottomNormal, ...bottomNormal, ...bottomNormal
        ]);

        // Colors for each face
        if (options.color) {
            this.colors = new Float32Array(16 * 4); // 16 vertices * 4 color components (RGBA)
            for (let i = 0; i < 16; i++) {
                this.colors[i*4] = options.color[0];
                this.colors[i*4+1] = options.color[1];
                this.colors[i*4+2] = options.color[2];
                this.colors[i*4+3] = options.color[3];
            }
        } else {
            this.colors = new Float32Array([
                // Front face (red) - 3 vertices
                1, 0, 0, 1,  1, 0, 0, 1,  1, 0, 0, 1,
                
                // Right face (yellow) - 3 vertices
                1, 1, 0, 1,  1, 1, 0, 1,  1, 1, 0, 1,
                
                // Back face (magenta) - 3 vertices
                1, 0, 1, 1,  1, 0, 1, 1,  1, 0, 1, 1,
                
                // Left face (cyan) - 3 vertices
                0, 1, 1, 1,  0, 1, 1, 1,  0, 1, 1, 1,
                
                // Bottom face (blue) - 4 vertices
                0, 0, 1, 1,  0, 0, 1, 1,  0, 0, 1, 1,  0, 0, 1, 1
            ]);
        }

        // Texture coordinates
        this.texCoords = new Float32Array([
            // Front face - 3 vertices
            0.5, 1.0,  0, 0,  1, 0,
            
            // Right face - 3 vertices
            0.5, 1.0,  0, 0,  1, 0,
            
            // Back face - 3 vertices
            0.5, 1.0,  0, 0,  1, 0,
            
            // Left face - 3 vertices
            0.5, 1.0,  0, 0,  1, 0,
            
            // Bottom face - 4 vertices
            0, 0,  0, 1,  1, 1,  1, 0
        ]);

        // Indices for drawing - 18 indices (3 per triangle * 6 triangles)
        // The triangular faces are already defined as triangles,
        // but the square base needs to be drawn as 2 triangles
        this.indices = new Uint16Array([
            // Front face
            0, 1, 2,
            
            // Right face
            3, 4, 5,
            
            // Back face
            6, 7, 8,
            
            // Left face
            9, 10, 11,
            
            // Bottom face (as 2 triangles)
            12, 13, 14,
            12, 14, 15
        ]);

        this.initBuffers();
    }

    // Calculate normal vector for a triangle (cross product of two edges)
    calculateNormal(v0, v1, v2) {
        // Vector from v0 to v1
        const edge1 = [
            v1[0] - v0[0],
            v1[1] - v0[1],
            v1[2] - v0[2]
        ];
        
        // Vector from v0 to v2
        const edge2 = [
            v2[0] - v0[0],
            v2[1] - v0[1],
            v2[2] - v0[2]
        ];
        
        // Cross product edge1 × edge2
        const normal = [
            edge1[1] * edge2[2] - edge1[2] * edge2[1],
            edge1[2] * edge2[0] - edge1[0] * edge2[2],
            edge1[0] * edge2[1] - edge1[1] * edge2[0]
        ];
        
        // Normalize the vector
        const length = Math.sqrt(
            normal[0] * normal[0] + 
            normal[1] * normal[1] + 
            normal[2] * normal[2]
        );
        
        if (length > 0) {
            normal[0] /= length;
            normal[1] /= length;
            normal[2] /= length;
        }
        
        return normal;
    }

    initBuffers() {
        const gl = this.gl;

        // Calculate buffer sizes
        const vSize = this.vertices.byteLength;
        const nSize = this.normals.byteLength;
        const cSize = this.colors.byteLength;
        const tSize = this.texCoords.byteLength;
        const totalSize = vSize + nSize + cSize + tSize;

        gl.bindVertexArray(this.vao);

        // Copy data to VBO
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo);
        gl.bufferData(gl.ARRAY_BUFFER, totalSize, gl.STATIC_DRAW);
        gl.bufferSubData(gl.ARRAY_BUFFER, 0, this.vertices);
        gl.bufferSubData(gl.ARRAY_BUFFER, vSize, this.normals);
        gl.bufferSubData(gl.ARRAY_BUFFER, vSize + nSize, this.colors);
        gl.bufferSubData(gl.ARRAY_BUFFER, vSize + nSize + cSize, this.texCoords);

        // Copy index data to EBO
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.ebo);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, this.indices, gl.STATIC_DRAW);

        // Set up vertex attributes
        gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 0, 0);  // position
        gl.vertexAttribPointer(1, 3, gl.FLOAT, false, 0, vSize);  // normal
        gl.vertexAttribPointer(2, 4, gl.FLOAT, false, 0, vSize + nSize);  // color
        gl.vertexAttribPointer(3, 2, gl.FLOAT, false, 0, vSize + nSize + cSize);  // texCoord

        // Enable vertex attribute arrays
        gl.enableVertexAttribArray(0);
        gl.enableVertexAttribArray(1);
        gl.enableVertexAttribArray(2);
        gl.enableVertexAttribArray(3);

        // Unbind buffers
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