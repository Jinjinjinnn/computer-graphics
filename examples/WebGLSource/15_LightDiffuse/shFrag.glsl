#version 300 es

precision highp float;

in vec3 fragPos;        // modelMatrix(M) * localCoords from vertex shader
in vec3 normal;         // (M^(-1))^T * localNormal from vertex shader 
out vec4 FragColor;

struct Material {
    vec3 diffuse;       // surface's diffuse color
};

struct Light {
    vec3 position;      // light position
    vec3 ambient;       // ambient strength
    vec3 diffuse;       // diffuse strength
};

uniform Material material;
uniform Light light;

void main() {
    // ambient
    vec3 rgb = material.diffuse;
    vec3 ambient = light.ambient * rgb;
  	
    // diffuse 
    vec3 norm = normalize(normal);
    vec3 lightDir = normalize(light.position - fragPos);
    float dotNormLight = dot(norm, lightDir);
    float diff = max(dotNormLight, 0.0);
    vec3 diffuse = light.diffuse * diff * rgb;  
        
    vec3 result = ambient + diffuse;
    FragColor = vec4(result, 1.0);
}