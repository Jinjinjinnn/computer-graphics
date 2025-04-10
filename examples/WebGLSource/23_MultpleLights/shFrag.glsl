#version 300 es

precision highp float;

out vec4 FragColor;

struct Material {
    sampler2D diffuse; // diffuse map
    vec3 specular;     // specular color
    float shininess;   // specular shininess
};

struct DirLight {
    vec3 direction;
    vec3 ambient;
    vec3 diffuse;
    vec3 specular;
};

struct PointLight {
    vec3 position;

    vec3 ambient;
    vec3 diffuse;
    vec3 specular;

    float constant;
    float linear;
    float quadratic;
};

struct SpotLight {
    vec3 position;

    vec3 ambient; // ambient 적용 strength
    vec3 diffuse; // diffuse 적용 strength
    vec3 specular; // specular 적용 strength

    vec3 direction;
    float cutOff;
    float outerCutOff;

    float constant;
    float linear;
    float quadratic;
};

#define NR_POINT_LIGHTS 3

in vec3 fragPos;  
in vec3 normal;  
in vec2 texCoord;

uniform vec3 u_viewPos;
uniform DirLight dirLight;
uniform PointLight pointLights[NR_POINT_LIGHTS];
uniform SpotLight spotLight;
uniform Material material;

// function prototypes
vec3 calcDirLight(DirLight light, vec3 normal, vec3 viewDir);
vec3 calcPointLight(PointLight light, vec3 normal, vec3 fragPos, vec3 viewDir);
vec3 calcSpotLight(SpotLight light, vec3 normal, vec3 fragPos, vec3 viewDir);

void main() {
    // properties
    vec3 norm = normalize(normal);
    vec3 viewDir = normalize(u_viewPos - fragPos);

    // phase 1: Directional lighting
    vec3 result = calcDirLight(dirLight, norm, viewDir);

    // phase 2: Point lights
    for(int i = 0; i < NR_POINT_LIGHTS; i++)
        result += calcPointLight(pointLights[i], norm, fragPos, viewDir);

    // phase 3: Spot light
    result += calcSpotLight(spotLight, norm, fragPos, viewDir);

    FragColor = vec4(result, 1.0);
}

vec3 calcDirLight(DirLight light, vec3 normal, vec3 viewDir) {
    vec3 lightDir = normalize(light.direction);

    // diffuse
    float diff = max(dot(normal, lightDir), 0.0);

    // specular
    vec3 reflectDir = reflect(lightDir, normal);
    float spec = pow(max(dot(viewDir, reflectDir), 0.0), material.shininess);

    // combine results
    vec3 rgb = texture(material.diffuse, texCoord).rgb;
    vec3 ambient = light.ambient * rgb;
    vec3 diffuse = light.diffuse * diff * rgb;
    vec3 specular = light.specular * spec * rgb; 
    return (ambient + diffuse + specular);
}

vec3 calcPointLight(PointLight light, vec3 normal, vec3 fragPos, vec3 viewDir) {
    vec3 lightDir = normalize(light.position - fragPos);

    // diffuse shading
    float diff = max(dot(normal, lightDir), 0.0);

    // specular shading
    vec3 reflectDir = reflect(lightDir, normal);
    float spec = pow(max(dot(viewDir, reflectDir), 0.0), material.shininess);

    // attenuation
    float distance = length(light.position - fragPos);
    float attenuation = 1.0 / (light.constant + light.linear * distance + 
                        light.quadratic * distance * distance);

    // combine results
    vec3 rgb = texture(material.diffuse, texCoord).rgb;
    vec3 ambient = light.ambient * rgb;
    vec3 diffuse = light.diffuse * diff * rgb;
    vec3 specular = light.specular * spec * rgb;
    ambient *= attenuation;
    diffuse *= attenuation;
    specular *= attenuation;

    return (ambient + diffuse + specular);
}

vec3 calcSpotLight(SpotLight light, vec3 normal, vec3 fragPos, vec3 viewDir) {
    vec3 lightDir = normalize(light.position - fragPos);

    // diffuse shading
    float diff = max(dot(normal, lightDir), 0.0);

    // specular shading
    vec3 reflectDir = reflect(lightDir, normal);
    float spec = pow(max(dot(viewDir, reflectDir), 0.0), material.shininess);

    // attenuation
    float distance = length(light.position - fragPos);
    float attenuation = 1.0 / (light.constant + light.linear * distance + 
                        light.quadratic * distance * distance);

    // spotlight (soft edges)
    float intensity;
    float theta = dot(lightDir, normalize(-light.direction));
    float cosCutoff = cos(light.cutOff);
    float cosOuterCutoff = cos(light.outerCutOff);
    if (theta > cosOuterCutoff) {
        float epsilon = (cosCutoff - cosOuterCutoff);
        intensity = clamp((theta - cosOuterCutoff) / epsilon, 0.0, 1.0);
    }
    else {
        intensity = 0.0;
    }

    // combine results
    vec3 rgb = texture(material.diffuse, texCoord).rgb;
    vec3 ambient = light.ambient * rgb;
    vec3 diffuse = light.diffuse * diff * rgb;
    vec3 specular = light.specular * spec * rgb;
    ambient *= attenuation * intensity;
    diffuse *= attenuation * intensity;
    specular *= attenuation * intensity;

    return (ambient + diffuse + specular);
} 